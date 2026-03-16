import React, { useState, useEffect, useRef } from 'react';
import { LiftLayoutData, Product, CabinClass } from '../types';
import { X, Calculator, Check, AlertTriangle, Settings, Box, Zap, Construction, Truck, Package, Hammer, ArrowLeft, ArrowRight, ListCheck, Search, Plus, Filter, Layers, Save, Trash2, GripVertical, Gauge, ScanLine, RotateCcw, FileText, Download, Copy, FolderOpen, Info } from 'lucide-react';

interface MaterialCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout: LiftLayoutData;
  onInsert: (data: MaterialWizardData) => void;
  products: Product[];
  customCategories: string[];
  onAddCategory?: (name: string) => void;
  cabinClasses?: CabinClass[];
  initialState?: MaterialWizardData; // New Prop for persistence
}

export interface MaterialWizardData {
    items: {
        category: string;
        description: string;
        quantity: number;
        unit: string;
        productId?: string;
        price?: number;
        isAuto?: boolean;
        autoType?: string; 
    }[];
    includeTransport: boolean;
    includePackaging: boolean;
    includeAssembly: boolean;
    transportPrice?: number; // NEW
    packagingPrice?: number; // NEW
    categoryOrder: string[];
}

interface MaterialTemplate {
    id: string;
    name: string;
    data: MaterialWizardData;
}

export const MaterialCalculatorModal: React.FC<MaterialCalculatorModalProps> = ({
  isOpen,
  onClose,
  layout,
  onInsert,
  products,
  customCategories,
  onAddCategory,
  cabinClasses,
  initialState
}) => {
  const [tabs, setTabs] = useState<{id: string, label: string, color: string}[]>([]);
  const [activeTab, setActiveTab] = useState('Dvere');
  const [bomItems, setBomItems] = useState<MaterialWizardData['items']>([]);
  
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  
  const [isCategorySettingsOpen, setIsCategorySettingsOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [includeTransport, setIncludeTransport] = useState(false);
  const [includePackaging, setIncludePackaging] = useState(false);
  const [includeAssembly, setIncludeAssembly] = useState(false);
  
  // Custom Prices for Transport/Packaging
  const [transportPrice, setTransportPrice] = useState(200);
  const [packagingPrice, setPackagingPrice] = useState(50);
  
  const [savedTemplates, setSavedTemplates] = useState<MaterialTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');

  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
  
  // --- INITIALIZATION ---

  useEffect(() => {
      const storedTemplates = localStorage.getItem('smartquote_material_templates');
      if (storedTemplates) {
          try {
              setSavedTemplates(JSON.parse(storedTemplates));
          } catch (e) { console.error("Error loading templates", e); }
      }
  }, []);

  // STRICT SESSION ISOLATION LOGIC & SMART MERGE
  useEffect(() => {
      if (isOpen) {
          // 1. Calculate what the BOM *should* be based on current Layout
          const freshBOM = calculateFullBOM(layout);

          // Default Categories Setup
          if (activeCategories.size === 0 && (!initialState || !initialState.categoryOrder)) {
             const defaults = new Set(customCategories.filter(c => !['Montáž', 'Doprava', 'Balné'].includes(c)));
             setActiveCategories(defaults);
          }

          if (initialState) {
              // PRIORITY 1: SMART MERGE
              // We take the saved state, BUT we update "Auto" items if the Layout implies a change (e.g. CTP -> Belt)
              
              const mergedItems = freshBOM.map(freshItem => {
                  // Find if we have this auto-item saved
                  const savedItem = initialState.items.find(i => i.autoType === freshItem.autoType && i.isAuto);
                  
                  if (savedItem) {
                      // Check for Critical Changes: Product Type OR Quantity Change (e.g. Higher travel)
                      const productChanged = freshItem.description !== savedItem.description || freshItem.productId !== savedItem.productId;
                      const quantityChanged = freshItem.quantity !== savedItem.quantity;

                      if (productChanged || quantityChanged) {
                          // CHANGE DETECTED: Layout dictates a different product/quantity than saved.
                          // Use the FRESH item to reflect current layout.
                          return freshItem;
                      }
                      // NO CHANGE: Keep saved item (preserves any other manual edits)
                      return savedItem;
                  }
                  // If not found in saved (maybe new feature in layout), add fresh
                  return freshItem;
              });

              // Add any CUSTOM (non-auto) items the user added manually (e.g. extra sockets, lights)
              // Make sure we don't duplicate items that might have been "auto" in old version but are now custom
              // Actually, simply appending items where isAuto=false is safe.
              const customItems = initialState.items.filter(i => !i.isAuto);
              
              setBomItems([...mergedItems, ...customItems]);

              // Restore toggles
              setIncludeTransport(initialState.includeTransport);
              setIncludePackaging(initialState.includePackaging);
              setIncludeAssembly(initialState.includeAssembly);
              if (initialState.transportPrice) setTransportPrice(initialState.transportPrice);
              if (initialState.packagingPrice) setPackagingPrice(initialState.packagingPrice);
              if (initialState.categoryOrder && initialState.categoryOrder.length > 0) {
                  setActiveCategories(new Set(initialState.categoryOrder));
              }
          } else {
              // PRIORITY 2: FRESH CALCULATION (New Quote or Empty Wizard)
              setBomItems(freshBOM);
              // Reset toggles for fresh start
              setIncludeTransport(false);
              setIncludePackaging(false);
              setIncludeAssembly(false);
          }
      }
  }, [isOpen, initialState, layout]); // Added layout to dependencies to allow live updates

  // Sync Tabs
  useEffect(() => {
    const generatedTabs = customCategories
        .filter(cat => {
            if (cat === 'Oceľová konštrukcia' && !layout.hasExternalShaft) return false;
            if (['Montáž', 'Doprava', 'Balné'].includes(cat)) return false;
            return activeCategories.has(cat);
        })
        .map(cat => ({
            id: cat,
            label: cat,
            color: 'blue'
        }));

    setTabs(generatedTabs);
    
    if (generatedTabs.length > 0) {
        if (!generatedTabs.find(t => t.id === activeTab)) {
            setActiveTab(generatedTabs[0].id);
        }
    } else if (generatedTabs.length === 0) {
        setTabs([{id: 'Info', label: 'Info', color: 'gray'}]);
        setActiveTab('Info');
    }
  }, [customCategories, activeCategories, layout.hasExternalShaft, activeTab]);

  // --- CALCULATIONS ---

  const calculateQuantitiesOnly = (l: LiftLayoutData): Record<string, number> => {
      const travel = l.travelHeight || 0;
      const hq = l.headroomHeight || 0;
      const pit = l.pitDepth || 0;
      const totalHeight = travel + hq + pit;
      const railLength = l.guideRailLength || 5000;
      const stops = l.numberOfStops || 2;
      
      const entrances = l.numberOfEntrances || stops;

      // 1. RAILS
      const railLinesCar = 2;
      const railLinesCwt = 2;
      const barsPerLine = Math.ceil(totalHeight / railLength);
      
      const railsCarTotal = barsPerLine * railLinesCar;
      const railsCwtTotal = barsPerLine * railLinesCwt;

      // 2. FISHPLATES
      const fishplatesPerLine = Math.max(0, barsPerLine - 1);
      const fishplatesTotalCar = fishplatesPerLine * railLinesCar;
      const fishplatesTotalCwt = fishplatesPerLine * railLinesCwt;
      const fishplatesTotal = fishplatesTotalCar + fishplatesTotalCwt;

      // 3. BRACKETS (Konzoly)
      const firstBracketPos = 500;
      const span = 2500;
      const effectiveHeight = Math.max(0, totalHeight - firstBracketPos);
      const bracketsPerLine = 1 + Math.ceil(effectiveHeight / span) + 1;
      
      let bracketsMainTotal = 0;
      let bracketsCwtTotal = 0;

      if (l.bracketType === 'combined') {
          bracketsMainTotal = bracketsPerLine; 
          bracketsCwtTotal = 0; 
      } else {
          bracketsMainTotal = bracketsPerLine * 2;
          bracketsCwtTotal = bracketsPerLine * 2;
      }

      // 4. CLIPS (Príchytky)
      const fasteningPoints = bracketsPerLine;
      const clipsCar = fasteningPoints * 2 * 2; 
      const clipsCwt = fasteningPoints * 2 * 2; 
      const clipsTotal = clipsCar + clipsCwt;

      // 5. ROPES & CABLES (Requested Formulas)
      // Main Ropes: (Travel + HQ + 2m) * Roping * Count
      const ropingFactor = l.suspensionType === '2:1' ? 2 : (l.suspensionType === '4:1' ? 4 : 1);
      
      // USE NEW FIELD FROM LAYOUT OR FALLBACK
      const ropeCount = l.numberOfRopes || (l.numberOfPersons <= 8 ? 4 : 6); 
      
      // Use Meters for result
      const ropeMainMeters = ((travel + hq + 2000) / 1000) * ropingFactor * ropeCount;

      // OR Rope (Governor): (Total Height * 2) + Safety
      const ropeOrMeters = ((totalHeight * 2) / 1000) + 5; // +5m safety

      // Traveling Cable (Previs): 
      // User Logic: From MRL Head (0) -> Controller (3m) + Horizontal (1m) + Down to Cabin (Travel) + Loop/Cabin (4m)
      // Total = Travel + 8m
      const cableTravelMeters = (travel / 1000) + 8;

      return {
          'rails_car': railsCarTotal,
          'rails_cwt': railsCwtTotal,
          'fishplates': fishplatesTotal,
          'fishplates_car': fishplatesTotalCar,
          'fishplates_cwt': fishplatesTotalCwt,
          
          'brackets_main': bracketsMainTotal,
          'brackets_cwt': bracketsCwtTotal,
          
          'clips': clipsTotal,
          'clips_car': clipsCar,
          'clips_cwt': clipsCwt,

          'doors_shaft': entrances, 
          'doors_car': l.isThroughCar ? 2 : 1,
          
          'machine': 1,
          
          'rope_main': Number(ropeMainMeters.toFixed(1)),
          'rope_or': Number(ropeOrMeters.toFixed(1)),
          'cable_travel': Number(cableTravelMeters.toFixed(1))
      };
  };

  const findSmartItem = (keywords: string[], dimension?: number | string, category?: string) => {
      const lowerKeys = keywords.map(k => k.toLowerCase());
      if (dimension) {
          const dimStr = String(dimension);
          const exactMatch = products.find(p => {
              const nameLow = p.name.toLowerCase();
              const hasAllKeys = lowerKeys.every(k => nameLow.includes(k));
              const hasDim = nameLow.includes(dimStr);
              const matchCat = category ? p.category === category : true;
              return hasAllKeys && hasDim && matchCat;
          });
          if (exactMatch) return exactMatch;
      }
      return products.find(p => {
          const matchName = lowerKeys.every(k => p.name.toLowerCase().includes(k));
          const matchCat = category ? p.category === category : true;
          return matchName && matchCat;
      });
  };

  const calculateFullBOM = (l: LiftLayoutData) => {
    const items: MaterialWizardData['items'] = [];
    const qtys = calculateQuantitiesOnly(l);
    
    // --- CATEGORY MAPPING ---
    const catMap = {
        guides: 'Vodítka a kotvenie',
        doors: 'Dvere',
        cabin: 'Kabína a rám',
        drive: 'Pohon',
        governor: 'Obmedzovač', // Check if user renamed this, usually it's "Obmedzovač"
        electro: 'Elektro',
        shaftInt: 'Ostatné šachta', 
        construction: 'Oceľová konštrukcia'
    };

    const addItem = (desc: string, qty: number, unit: string, cat: string, autoType: string, keys: string[], dim?: any) => {
        if (qty <= 0) return;
        const product = findSmartItem(keys, dim, cat);
        items.push({
            category: cat,
            description: product ? product.name : desc,
            quantity: Number(qty.toFixed(2)),
            unit: unit,
            productId: product?.id,
            price: product?.price || 0,
            isAuto: true,
            autoType: autoType 
        });
    };

    // 1. GUIDES
    addItem(`Vodidlá Kabína ${l.guideTypeCar} (${l.guideRailLength}mm)`, qtys['rails_car'], 'ks', catMap.guides, 'rails_car', [l.guideTypeCar || 'T90'], l.guideRailLength);
    addItem(`Vodidlá Protiváha ${l.guideTypeCwt} (${l.guideRailLength}mm)`, qtys['rails_cwt'], 'ks', catMap.guides, 'rails_cwt', [l.guideTypeCwt || 'T50'], l.guideRailLength);
    
    addItem(`Spojka vodidla ${l.guideTypeCar}`, qtys['fishplates_car'], 'ks', catMap.guides, 'fishplates_car', ['spojka', l.guideTypeCar || 'T90']);
    addItem(`Spojka vodidla ${l.guideTypeCwt}`, qtys['fishplates_cwt'], 'ks', catMap.guides, 'fishplates_cwt', ['spojka', l.guideTypeCwt || 'T50']);

    // BRACKETS LOGIC
    if (l.bracketType === 'combined') {
        addItem(`Konzola Kombinovaná (U-Typ)`, qtys['brackets_main'], 'ks', catMap.guides, 'brackets_main', ['konzola', 'kombinovaná']);
        addItem(`Konzola Kabínová (Z-Typ)`, qtys['brackets_main'], 'ks', catMap.guides, 'brackets_main', ['konzola', 'z', 'kabín']);
    } else {
        addItem(`Konzola Hlavná (á 2.5m)`, qtys['brackets_main'], 'ks', catMap.guides, 'brackets_main', ['konzola', 'hlavná']);
        addItem(`Konzola Protiváhy (á 2.5m)`, qtys['brackets_cwt'], 'ks', catMap.guides, 'brackets_cwt', ['konzola']); 
    }

    addItem(`Príchytka vodidla ${l.guideTypeCar}`, qtys['clips_car'], 'ks', catMap.guides, 'clips_car', ['príchytka', l.guideTypeCar || 'T90']);
    addItem(`Príchytka vodidla ${l.guideTypeCwt}`, qtys['clips_cwt'], 'ks', catMap.guides, 'clips_cwt', ['príchytka', l.guideTypeCwt || 'T50']);
    
    // 2. DOORS
    const sDoorType = l.doorOperation === 'manual' ? 'Krídlové' : 'Automatické';
    addItem(`Šachtové dvere ${sDoorType} ${l.doorWidth}`, qtys['doors_shaft'], 'ks', catMap.doors, 'doors_shaft', ['dvere', sDoorType === 'Krídlové' ? 'krídlové' : 'automatické'], l.doorWidth);
    const cDoorType = l.doorType === 'bus' ? 'BUS' : 'Automatické';
    addItem(`Kabínové dvere ${cDoorType} ${l.doorWidth}`, qtys['doors_car'], 'ks', catMap.doors, 'doors_car', ['dvere', cDoorType === 'BUS' ? 'bus' : 'automatické'], l.doorWidth);

    // 3. CABIN
    let linkedSet = null;
    if (cabinClasses && l.cabinClass) {
        const cls = cabinClasses.find(c => c.name === l.cabinClass);
        if (cls?.linkedProductId) linkedSet = products.find(p => p.id === cls.linkedProductId);
    }
    if (linkedSet) {
        items.push({
            category: catMap.cabin, description: linkedSet.name, quantity: 1, unit: 'ks',
            productId: linkedSet.id, price: linkedSet.price, isAuto: true, autoType: 'cabin_set'
        });
    } else {
        addItem(`Kabína ${l.cabinClass} (${Math.round(l.cabinWidth)}x${Math.round(l.cabinDepth)}mm)`, 1, 'ks', catMap.cabin, 'cabin_set', ['kabína']);
    }
    addItem(`Rám kabíny (${l.frameType})`, 1, 'ks', catMap.cabin, 'car_frame', ['rám', l.frameType === 'backpack' ? 'batoh' : 'rám']);

    // 4. DRIVE & ROPES
    addItem('Trakčný stroj', 1, 'ks', catMap.drive, 'machine', [l.tractionMedium || 'lan', 'stroj']);
    
    const mediaName = l.tractionMedium === 'belts' ? 'Nosné pásy' : (l.tractionMedium === 'ctp' ? 'CTP laná' : 'Oceľové laná');
    // Using rope_main from updated calculation which respects numberOfRopes
    addItem(`${mediaName} (Hlavné) [${l.numberOfRopes}x]`, qtys['rope_main'], 'm', catMap.drive, 'rope_main', [l.tractionMedium || 'lan']);

    // 5. GOVERNOR
    addItem('Obmedzovač rýchlosti', 1, 'ks', catMap.governor, 'osg_set', ['obmedzovač']);
    addItem('Lano obmedzovača (OR)', qtys['rope_or'], 'm', catMap.governor, 'rope_or', ['lano', 'or']);

    // 6. ELECTRO
    addItem('Vlečný kábel (Previs)', qtys['cable_travel'], 'm', catMap.electro, 'cable_travel', ['kábel', 'vleč']);
    
    return items;
  };

  const moveTab = (index: number, direction: 'left' | 'right') => {
      if (direction === 'left' && index === 0) return;
      if (direction === 'right' && index === tabs.length - 1) return;
      const newTabs = [...tabs];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]];
      setTabs(newTabs);
  };
  
  const toggleCategory = (catId: string) => {
      const newSet = new Set(activeCategories);
      if (newSet.has(catId)) newSet.delete(catId);
      else newSet.add(catId);
      setActiveCategories(newSet);
  };
  
  const handleAddCategory = () => {
      if(newCatName && onAddCategory) {
          onAddCategory(newCatName);
          setNewCatName('');
          toggleCategory(newCatName);
      }
  };

  const updateItem = (idx: number, field: string, value: any) => {
      const newItems = [...bomItems];
      // @ts-ignore
      newItems[idx][field] = value;
      if (field === 'productId') {
          const p = products.find(prod => prod.id === value);
          if (p) {
              newItems[idx].price = p.price;
              newItems[idx].description = p.name;
              newItems[idx].unit = p.unit;
          }
      }
      setBomItems(newItems);
  };
  
  const handleDeleteItem = (index: number) => {
      setBomItems(bomItems.filter((_, i) => i !== index));
  };
  
  const addCustomItem = (isSet: boolean = false) => {
      setBomItems([...bomItems, { 
          category: activeTab, 
          description: isSet ? 'Výber SETU...' : 'Nová požiadavka', 
          quantity: 1, 
          unit: isSet ? 'set' : 'ks', 
          price: 0,
          isAuto: false 
      }]);
  };

  const handleInsert = () => {
      // Final save before insert - this is just local cache
      const currentState = {
          items: bomItems,
          includeTransport,
          includePackaging,
          includeAssembly,
          transportPrice, // Pass custom price
          packagingPrice, // Pass custom price
          categoryOrder: Array.from(activeCategories)
      };
      
      onInsert({
          ...currentState,
          categoryOrder: tabs.map(t => t.id)
      });
      onClose();
  };

  // --- TEMPLATES ---
  const handleSaveTemplate = () => {
      if(!newTemplateName.trim()) return;
      const newTemplate: MaterialTemplate = {
          id: crypto.randomUUID(),
          name: newTemplateName,
          data: {
              items: bomItems,
              includeTransport, includePackaging, includeAssembly,
              transportPrice, packagingPrice,
              categoryOrder: Array.from(activeCategories)
          }
      };
      const updated = [...savedTemplates, newTemplate];
      setSavedTemplates(updated);
      localStorage.setItem('smartquote_material_templates', JSON.stringify(updated));
      setNewTemplateName('');
      alert("Šablóna uložená.");
  };

  const handleLoadTemplate = (template: MaterialTemplate) => {
      if(window.confirm(`Načítať šablónu "${template.name}"?`)) {
          // When loading template, we also try to update quantities if possible
          const freshQuantities = calculateQuantitiesOnly(layout);
          const updatedTemplateItems = template.data.items.map(item => {
               if (item.isAuto && item.autoType && freshQuantities[item.autoType] !== undefined) {
                   return { ...item, quantity: freshQuantities[item.autoType] };
               }
               return item;
          });

          setBomItems(updatedTemplateItems);
          setIncludeTransport(template.data.includeTransport);
          setIncludePackaging(template.data.includePackaging);
          setIncludeAssembly(template.data.includeAssembly);
          if (template.data.transportPrice) setTransportPrice(template.data.transportPrice);
          if (template.data.packagingPrice) setPackagingPrice(template.data.packagingPrice);

          if (template.data.categoryOrder) {
              setActiveCategories(new Set(template.data.categoryOrder));
          }
          setIsTemplateMenuOpen(false);
      }
  };

  const handleDeleteTemplate = (id: string) => {
      if(window.confirm("Vymazať šablónu?")) {
          const updated = savedTemplates.filter(t => t.id !== id);
          setSavedTemplates(updated);
          localStorage.setItem('smartquote_material_templates', JSON.stringify(updated));
      }
  };

  const handleResetToDefaults = () => {
      if(window.confirm("Týmto zahodíte manuálne zmeny a prepočítate zoznam podľa aktuálnych rozmerov výťahu (šírka, zdvih, atď.). Pokračovať?")) {
          const fresh = calculateFullBOM(layout);
          // Keep only active categories
          const filtered = fresh.filter(i => activeCategories.has(i.category));
          setBomItems(filtered);
      }
  };

  // --- SMART RECOMMENDATION GENERATOR ---
  const getSmartRecommendation = () => {
      const qtys = calculateQuantitiesOnly(layout);
      
      switch (activeTab) {
          case 'Dvere':
              const doorType = layout.doorType === 'bus' ? 'BUS / Ručné' : 'Automatické';
              return (
                  <span>
                      <strong>Layout:</strong> {qtys.doors_shaft}x Šachtové ({doorType} {layout.doorWidth}mm) + {qtys.doors_car}x Kabínové.
                      <span className="ml-2 text-gray-500 italic">Povrch: {layout.doorFinish}.</span>
                  </span>
              );
          case 'Vodítka a kotvenie':
              // UPDATED: Show Brackets and Clips counts
              return (
                  <span>
                      <strong>Layout:</strong> Kabína: {qtys.rails_car}ks ({layout.guideTypeCar}), CWT: {qtys.rails_cwt}ks ({layout.guideTypeCwt}).
                      <span className="ml-2 text-gray-500 italic">
                          Dĺžka: {layout.guideRailLength}mm. 
                          Konzoly: {qtys.brackets_main} radov, Príchytky: {qtys.clips}ks.
                      </span>
                  </span>
              );
          case 'Pohon':
              return (
                  <span>
                      <strong>Layout:</strong> {layout.driveType === 'traction' ? 'Trakčný stroj' : 'Hydraulika'} ({layout.ratedLoad}kg, {layout.ratedSpeed}m/s).
                      <span className="ml-2 text-gray-500 italic">Lano: {layout.tractionMedium} ({layout.numberOfRopes || '?'}x, {qtys.rope_main}m).</span>
                  </span>
              );
          case 'Kabína a rám':
              // UPDATED: Calculate Floor and Wall Area
              const floorArea = (layout.cabinWidth * layout.cabinDepth / 1000000).toFixed(2);
              const perimeter = (layout.cabinWidth + layout.cabinDepth) * 2;
              const wallArea = (perimeter * (layout.cabinHeight || 2100) / 1000000).toFixed(2);
              
              return (
                  <span>
                      <strong>Layout:</strong> {Math.round(layout.cabinWidth)}x{Math.round(layout.cabinDepth)}mm, Výška {layout.cabinHeight || 2100}mm.
                      <span className="ml-2 text-gray-500 italic">
                          Podlaha: {floorArea}m², Steny: {wallArea}m². Trieda: {layout.cabinClass}.
                      </span>
                  </span>
              );
          case 'Elektro':
              return (
                  <span>
                      <strong>Layout:</strong> {layout.numberOfStops} Staníc / {qtys.doors_shaft} Nástupíšť.
                      <span className="ml-2 text-gray-500 italic">Rozvádzač: {layout.machineRoomPosition === 'head' ? 'MRL (Šachta)' : 'Strojovňa'}. Vlečný: {qtys.cable_travel}m.</span>
                  </span>
              );
          case 'Obmedzovač':
              return (
                  <span>
                      <strong>Layout:</strong> Lano OR: {qtys.rope_or}m.
                  </span>
              );
          default:
              return <span className="italic text-gray-400">Pre túto sekciu nie sú dostupné špecifické odporúčania.</span>;
      }
  };

  // Drag handlers
  const onDragStartItem = (e: React.DragEvent, index: number) => {
      setDraggedItemIdx(index);
      e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOverItem = (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (draggedItemIdx === null || draggedItemIdx === targetIndex) return;
      const newItems = [...bomItems];
      const [reorderedItem] = newItems.splice(draggedItemIdx, 1);
      newItems.splice(targetIndex, 0, reorderedItem);
      setBomItems(newItems);
      setDraggedItemIdx(targetIndex);
  };

  if (!isOpen) return null;

  const currentCatName = activeTab;
  const currentItems = bomItems.map((item, index) => ({ item, index })).filter(({ item }) => item.category === currentCatName);
  const categoryProducts = products.filter(p => p.category === currentCatName);
  const subcategories = Array.from(new Set(categoryProducts.map(p => p.subcategory || 'Ostatné'))).sort();

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Calculator className="text-orange-500" />
            <div>
                <h2 className="text-xl font-bold text-gray-800">Materiálový Sprievodca</h2>
                <div className="text-xs text-gray-500">Automatický výpočet komponentov</div>
            </div>
          </div>
          
          <div className="flex gap-2 relative">
               <button onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)} className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-sm font-bold transition ${isTemplateMenuOpen ? 'bg-purple-100 text-purple-700 border-purple-300 shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}>
                   <FolderOpen size={16}/> Šablóny
               </button>
               <button onClick={() => setIsCategorySettingsOpen(!isCategorySettingsOpen)} className={`p-2 rounded-full border transition ${isCategorySettingsOpen ? 'bg-blue-100 text-blue-600 border-blue-300' : 'text-gray-500 hover:bg-gray-100'}`} title="Správa Kategórií">
                    <Filter size={20}/>
               </button>
               <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20}/></button>
          </div>
        </div>
        
        {/* TEMPLATE MENU */}
        {isTemplateMenuOpen && (
            <div className="absolute top-16 right-4 z-[150] bg-white border border-purple-200 p-4 shadow-2xl rounded-xl w-[320px] animate-in fade-in slide-in-from-top-2">
                <div className="space-y-4">
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <h4 className="text-xs font-bold text-purple-800 uppercase mb-2 flex items-center gap-2"><Save size={14}/> Uložiť novú šablónu</h4>
                        <div className="flex gap-2">
                            <input className="border rounded px-2 py-1 text-sm flex-1 bg-white" placeholder="Názov..." value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} />
                            <button onClick={handleSaveTemplate} className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-purple-700">Uložiť</button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Uložené</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto border rounded p-1 bg-gray-50 custom-scrollbar">
                            {savedTemplates.length === 0 && <div className="text-gray-400 text-xs italic p-2 text-center">Žiadne šablóny.</div>}
                            {savedTemplates.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded cursor-pointer" onClick={() => handleLoadTemplate(t)}>
                                    <span className="text-sm font-bold text-gray-700 truncate">{t.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }} className="text-red-400 hover:bg-red-100 p-1 rounded"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Category Settings */}
        {isCategorySettingsOpen && (
            <div className="bg-gray-50 border-b p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 shadow-inner max-h-48 overflow-y-auto">
                {customCategories.filter(c => !['Montáž','Doprava','Balné'].includes(c)).map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer bg-white border p-2 rounded shadow-sm hover:bg-blue-50">
                        <input type="checkbox" checked={activeCategories.has(c)} onChange={() => toggleCategory(c)} className="rounded text-blue-600"/>
                        <span className="text-sm font-medium break-all">{c}</span>
                    </label>
                ))}
                <div className="col-span-full flex gap-2 pt-2 border-t mt-2">
                    <input className="border rounded px-2 py-1 text-sm w-48" placeholder="Nová kategória..." value={newCatName} onChange={e=>setNewCatName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddCategory()}/>
                    <button onClick={handleAddCategory} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold">Pridať</button>
                </div>
            </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50 p-1 gap-1">
            {tabs.map((tab, idx) => (
                 <div key={tab.id} className={`flex items-center rounded-t-lg border-t border-l border-r px-2 py-2 transition ${activeTab===tab.id ? 'bg-white border-gray-300' : 'bg-gray-100 border-transparent opacity-70 hover:opacity-100'}`}>
                     {activeTab === tab.id && idx > 0 && <button onClick={() => moveTab(idx, 'left')} className="p-1 hover:bg-gray-200 rounded-full text-gray-400"><ArrowLeft size={12}/></button>}
                     <button onClick={() => setActiveTab(tab.id)} className={`mx-2 text-sm font-bold whitespace-nowrap ${activeTab===tab.id ? `text-${tab.color}-600` : 'text-gray-500'}`}>{tab.label}</button>
                     {activeTab === tab.id && idx < tabs.length - 1 && <button onClick={() => moveTab(idx, 'right')} className="p-1 hover:bg-gray-200 rounded-full text-gray-400"><ArrowRight size={12}/></button>}
                 </div>
            ))}
        </div>

        {/* SMART RECOMMENDATION BANNER */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center gap-3 text-sm text-blue-800 animate-in fade-in">
            <Info size={16} className="text-blue-600 shrink-0"/>
            <div className="font-medium">
                {getSmartRecommendation()}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
            {currentItems.length === 0 && <div className="text-center text-gray-400 italic py-8">Žiadne položky v tejto kategórii.</div>}
            
            {currentItems.length > 0 && (
            <div className="border rounded-xl overflow-hidden shadow-sm mb-4">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 font-bold text-xs uppercase">
                        <tr>
                            <th className="w-8"></th>
                            <th className="p-3 text-left w-1/3">Požiadavka (Výpočet)</th>
                            <th className="p-3 text-left w-1/3">Produkt zo Skladu</th>
                            <th className="p-3 text-right w-24">Mn.</th>
                            <th className="p-3 text-right w-24">Cena</th>
                            <th className="p-3 text-center w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentItems.map(({ item, index: originalIndex }) => {
                            return (
                                <tr 
                                    key={originalIndex} 
                                    draggable
                                    onDragStart={(e) => onDragStartItem(e, originalIndex)}
                                    onDragOver={(e) => onDragOverItem(e, originalIndex)}
                                    className={`transition ${item.isAuto ? 'hover:bg-blue-50' : 'bg-yellow-50 hover:bg-yellow-100'}`}
                                >
                                    <td className="p-2 text-center text-gray-300 cursor-grab hover:text-gray-500"><GripVertical size={16}/></td>
                                    <td className="p-3 relative">
                                        <input value={item.description} onChange={e => updateItem(originalIndex, 'description', e.target.value)} className="w-full bg-transparent font-medium text-gray-800 focus:outline-none"/>
                                        {!item.isAuto && <span className="text-[9px] font-bold text-yellow-600 uppercase absolute top-1 right-2 bg-yellow-100 px-1 rounded">Manual</span>}
                                        {item.isAuto && item.autoType && <span className="text-[9px] font-bold text-blue-600 uppercase absolute top-1 right-2 bg-blue-100 px-1 rounded">Auto: {item.autoType}</span>}
                                    </td>
                                    <td className="p-3">
                                        <div className="relative">
                                            <select value={item.productId || ''} onChange={e => updateItem(originalIndex, 'productId', e.target.value)} className={`w-full p-2 border rounded text-sm font-bold ${item.productId ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                <option value="">-- Vybrať produkt --</option>
                                                {subcategories.map(subcat => {
                                                    const subProds = categoryProducts.filter(p => (p.subcategory || 'Ostatné') === subcat);
                                                    return (
                                                        <optgroup key={subcat} label={subcat}>
                                                            {subProds.sort((a,b) => (a.type === 'composite' ? -1 : 1)).map(p => (
                                                                <option key={p.id} value={p.id}>{p.type === 'composite' ? '📦 ' : ''}{p.name} ({p.price}€)</option>
                                                            ))}
                                                        </optgroup>
                                                    );
                                                })}
                                            </select>
                                            {!item.productId && <div title="Položka nie je spárovaná so skladom" className="absolute right-8 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none"><AlertTriangle size={14} /></div>}
                                        </div>
                                    </td>
                                    <td className="p-3 text-right"><input type="number" value={item.quantity} onChange={e => updateItem(originalIndex, 'quantity', +e.target.value)} className="w-full text-right font-bold text-blue-600 bg-transparent focus:outline-none text-base"/></td>
                                    <td className="p-3 text-right font-mono text-gray-600">{item.price ? item.price.toFixed(2) : '-'} €</td>
                                    <td className="p-3 text-center"><button onClick={() => handleDeleteItem(originalIndex)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            )}
            
            <div className="flex gap-2">
                <button onClick={() => addCustomItem(false)} className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex justify-center items-center gap-2 font-medium"><Plus size={18} /> Pridať vlastnú požiadavku</button>
                <button onClick={() => addCustomItem(true)} className="flex-1 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition flex justify-center items-center gap-2 font-bold bg-purple-50/50"><Layers size={18} /> + Pridať SET</button>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-blue-50 p-3 rounded border border-blue-100">
                 <label className="flex items-center gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition"><input type="checkbox" checked={includeAssembly} onChange={e => setIncludeAssembly(e.target.checked)} className="rounded text-blue-600 w-5 h-5"/><Hammer size={18} className="text-blue-600"/><span className="text-sm font-bold text-blue-800">Montáž technológie</span></label>
                 
                 {/* CUSTOM PRICE FOR TRANSPORT */}
                 <div className="flex items-center gap-2 bg-white rounded p-1 pl-2 border border-blue-100">
                     <label className="flex items-center gap-2 cursor-pointer flex-1"><input type="checkbox" checked={includeTransport} onChange={e => setIncludeTransport(e.target.checked)} className="rounded text-blue-600 w-5 h-5"/><Truck size={18} className="text-blue-600"/><span className="text-sm font-bold text-blue-800">Doprava</span></label>
                     <input type="number" value={transportPrice} onChange={e => setTransportPrice(parseFloat(e.target.value)||0)} className="w-16 text-right border rounded px-1 text-sm font-bold" disabled={!includeTransport}/>
                     <span className="text-xs text-gray-500 mr-1">€</span>
                 </div>

                 {/* CUSTOM PRICE FOR PACKAGING */}
                 <div className="flex items-center gap-2 bg-white rounded p-1 pl-2 border border-blue-100">
                     <label className="flex items-center gap-2 cursor-pointer flex-1"><input type="checkbox" checked={includePackaging} onChange={e => setIncludePackaging(e.target.checked)} className="rounded text-blue-600 w-5 h-5"/><Package size={18} className="text-blue-600"/><span className="text-sm font-bold text-blue-800">Balné</span></label>
                     <input type="number" value={packagingPrice} onChange={e => setPackagingPrice(parseFloat(e.target.value)||0)} className="w-16 text-right border rounded px-1 text-sm font-bold" disabled={!includePackaging}/>
                     <span className="text-xs text-gray-500 mr-1">€</span>
                 </div>
            </div>

            <div className="flex justify-between items-center">
                <button onClick={handleResetToDefaults} className="text-xs text-orange-600 hover:text-orange-800 font-bold flex items-center gap-2 px-3 py-1 bg-orange-50 rounded border border-orange-200" title="Zahodiť manuálne zmeny a prepočítať podľa layoutu"><RotateCcw size={14}/> Prepočítať podľa aktuálneho výťahu</button>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">Zrušiť</button>
                    <button onClick={handleInsert} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 shadow-sm transition"><Check size={18} /> Potvrdiť a Vložiť</button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};