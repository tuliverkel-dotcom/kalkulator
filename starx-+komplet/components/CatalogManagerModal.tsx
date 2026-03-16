
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, CabinClass, ProductComponent } from '../types';
import { 
  X, Search, Plus, Trash2, Save, Upload, Settings, Layers, Edit, Check, 
  ArrowRightCircle, CornerDownRight, CheckSquare, Square, Filter, ChevronDown, ChevronRight, AlertTriangle, Box, Download, Package, ListPlus, Calculator, RotateCcw, Factory, Truck, Tag, FileText, ArrowDown, Copy
} from 'lucide-react';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      try {
        return crypto.randomUUID();
      } catch (e) { }
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Helper to generate consistent pastel colors from string
const getSubcatColor = (str: string) => {
    if (!str) return 'bg-gray-100 text-gray-600 border-gray-200';
    const colors = [
        'bg-blue-100 text-blue-700 border-blue-200',
        'bg-green-100 text-green-700 border-green-200',
        'bg-purple-100 text-purple-700 border-purple-200',
        'bg-orange-100 text-orange-700 border-orange-200',
        'bg-teal-100 text-teal-700 border-teal-200',
        'bg-indigo-100 text-indigo-700 border-indigo-200',
        'bg-pink-100 text-pink-700 border-pink-200',
        'bg-yellow-100 text-yellow-700 border-yellow-200',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

interface CatalogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  customCategories: string[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onImportCatalog: (file: File) => void;
  cabinClasses: CabinClass[];
  onAddCabinClass: (cc: CabinClass) => void;
  onUpdateCabinClass: (cc: CabinClass) => void;
  onDeleteCabinClass: (id: string) => void;
}

export const CatalogManagerModal: React.FC<CatalogManagerModalProps> = ({
  isOpen, onClose, products = [], onAddProduct, onUpdateProduct, onDeleteProduct,
  customCategories = [], onAddCategory, onDeleteCategory, onImportCatalog,
  cabinClasses = [], onAddCabinClass, onUpdateCabinClass, onDeleteCabinClass
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'classes'>('products');
  const [activeCategory, setActiveCategory] = useState<string>(''); 
  const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string>('ALL'); // 'ALL', 'NONE', or specific name
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk Actions State
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  
  // PRODUCT EDITOR STATE
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorProduct, setEditorProduct] = useState<Partial<Product>>({});
  
  // Component Selection State inside Editor
  const [componentSearch, setComponentSearch] = useState('');
  const [componentCategoryFilter, setComponentCategoryFilter] = useState<string>('ALL'); // New filter inside editor
  
  // New Category State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Class Management State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [newClassLinkedSet, setNewClassLinkedSet] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize active category
  useEffect(() => {
      if (customCategories.length > 0 && !activeCategory) {
          setActiveCategory(customCategories[0]);
      }
  }, [customCategories, activeCategory]);

  // Reset Subcategory filter when Category changes
  useEffect(() => {
      setActiveSubcategoryFilter('ALL');
      setSelectedProductIds(new Set());
  }, [activeCategory]);

  // Reset component filters when editor opens
  useEffect(() => {
      if (isEditorOpen) {
          setComponentSearch('');
          setComponentCategoryFilter('ALL');
      }
  }, [isEditorOpen]);

  // 1. Base Filter (Category + Search)
  const productsInCurrentCategory = useMemo(() => {
      return products.filter(p => {
          const matchCat = activeCategory ? p.category === activeCategory : true;
          const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
          return matchCat && matchSearch;
      });
  }, [products, activeCategory, searchTerm]);

  // 2. Identify Subcategories in current view
  const currentSubcategories = useMemo(() => {
      const subs = new Set<string>();
      productsInCurrentCategory.forEach(p => {
          if (p.subcategory) subs.add(p.subcategory);
      });
      return Array.from(subs).sort();
  }, [productsInCurrentCategory]);

  // 3. Final Display Filter (Subcategory Pill)
  const displayedProducts = useMemo(() => {
      if (activeSubcategoryFilter === 'ALL') return productsInCurrentCategory;
      if (activeSubcategoryFilter === 'NONE') return productsInCurrentCategory.filter(p => !p.subcategory);
      return productsInCurrentCategory.filter(p => p.subcategory === activeSubcategoryFilter);
  }, [productsInCurrentCategory, activeSubcategoryFilter]);


  // --- COMPONENT SELECTION LOGIC (Inside Editor) ---
  const availableComponentsGrouped = useMemo(() => {
      if (editorProduct.type !== 'composite') return { grouped: {}, sortedKeys: [] };

      // 1. Filter products based on search and category filter
      const filtered = products.filter(p => {
          if (p.id === editorProduct.id) return false; // Prevent self-reference
          const matchSearch = p.name.toLowerCase().includes(componentSearch.toLowerCase());
          const matchCat = componentCategoryFilter === 'ALL' || p.category === componentCategoryFilter;
          return matchSearch && matchCat;
      });

      // 2. Group by Subcategory
      const grouped: Record<string, Product[]> = {};
      
      filtered.forEach(p => {
          const sub = p.subcategory || 'Bez podkategórie';
          if (!grouped[sub]) grouped[sub] = [];
          grouped[sub].push(p);
      });

      // Sort categories: "Bez podkategórie" last, others alphabetical
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
          if (a === 'Bez podkategórie') return 1;
          if (b === 'Bez podkategórie') return -1;
          return a.localeCompare(b);
      });

      return { grouped, sortedKeys };
  }, [products, editorProduct.id, componentSearch, componentCategoryFilter, editorProduct.type]);


  // --- Handlers ---

  const handleExportCatalog = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `katalog_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleBulkSelection = (id: string) => {
      const newSet = new Set(selectedProductIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedProductIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedProductIds.size === displayedProducts.length && displayedProducts.length > 0) {
          setSelectedProductIds(new Set());
      } else {
          setSelectedProductIds(new Set(displayedProducts.map(p => p.id)));
      }
  };

  const handlePillClick = (subcat: string | 'ALL' | 'NONE') => {
      if (selectedProductIds.size > 0) {
          if (subcat === 'ALL') return; // Cannot move to ALL
          
          const targetSubcatName = subcat === 'NONE' ? undefined : subcat;
          const idsToMove = Array.from(selectedProductIds);

          if (window.confirm(`Presunúť ${idsToMove.length} označených produktov do podkategórie "${subcat === 'NONE' ? 'Bez podkategórie' : subcat}"?`)) {
              idsToMove.forEach(id => {
                  const product = products.find(p => p.id === id);
                  if (product) {
                      onUpdateProduct({
                          ...product,
                          // IMPORTANT: Keep existing category, just update subcategory
                          subcategory: targetSubcatName
                      });
                  }
              });
              // Clear selection after move
              setSelectedProductIds(new Set());
          }
          return;
      }
      setActiveSubcategoryFilter(subcat);
  };

  const handleDeleteSelected = () => {
      if (window.confirm(`Naozaj vymazať ${selectedProductIds.size} produktov?`)) {
          selectedProductIds.forEach(id => onDeleteProduct(id));
          setSelectedProductIds(new Set());
      }
  };

  // --- EDITOR HANDLERS (Create/Edit) ---

  const openEditor = (product?: Product) => {
      if (product) {
          setEditorProduct({ ...product }); // Edit Mode
      } else {
          setEditorProduct({ // Create Mode
              id: generateId(),
              category: activeCategory,
              subcategory: activeSubcategoryFilter !== 'ALL' && activeSubcategoryFilter !== 'NONE' ? activeSubcategoryFilter : undefined,
              type: 'simple',
              unit: 'ks',
              price: 0,
              priceType: 'fixed',
              displayMode: 'itemized',
              subProducts: []
          });
      }
      setIsEditorOpen(true);
  };

  // DUPLICATE PRODUCT LOGIC
  const handleDuplicateProduct = (product: Product) => {
      const newProduct: Partial<Product> = {
          ...product,
          id: generateId(),
          name: `${product.name} (Kópia)`
      };
      setEditorProduct(newProduct);
      setIsEditorOpen(true);
  };

  const saveEditor = () => {
      if (!editorProduct.name) {
          alert("Zadajte názov produktu.");
          return;
      }
      
      const finalProduct = {
          ...editorProduct,
          price: Number(editorProduct.price) || 0
      } as Product;

      if (products.find(p => p.id === finalProduct.id)) {
          onUpdateProduct(finalProduct);
      } else {
          onAddProduct(finalProduct);
      }
      setIsEditorOpen(false);
  };

  const addComponentToSet = (component: Product) => {
      const currentSubs = editorProduct.subProducts || [];
      const exists = currentSubs.find(s => s.productId === component.id);
      if (exists) {
          // Move to top if updated? Or just update qty? Let's just update qty for existing.
          const updated = currentSubs.map(s => s.productId === component.id ? { ...s, quantity: s.quantity + 1 } : s);
          setEditorProduct({ ...editorProduct, subProducts: updated });
      } else {
          // PREPEND new item so it appears at the TOP
          setEditorProduct({ ...editorProduct, subProducts: [{ productId: component.id, quantity: 1 }, ...currentSubs] });
      }
      // Keep search open for multiple adds
  };

  const removeComponentFromSet = (productId: string) => {
      const currentSubs = editorProduct.subProducts || [];
      setEditorProduct({ ...editorProduct, subProducts: currentSubs.filter(s => s.productId !== productId) });
  };

  const updateComponentQty = (productId: string, qty: number) => {
      const currentSubs = editorProduct.subProducts || [];
      setEditorProduct({ ...editorProduct, subProducts: currentSubs.map(s => s.productId === productId ? { ...s, quantity: qty } : s) });
  };

  const calculateSetPrice = () => {
      if (!editorProduct.subProducts) return 0;
      return editorProduct.subProducts.reduce((sum, sub) => {
          const p = products.find(prod => prod.id === sub.productId);
          return sum + ((p?.price || 0) * sub.quantity);
      }, 0);
  };

  const generateDescriptionFromComponents = () => {
      if (!editorProduct.subProducts || editorProduct.subProducts.length === 0) {
          alert("Najskôr pridajte komponenty do setu.");
          return;
      }
      
      const componentNames = editorProduct.subProducts
          .map(sub => {
              const p = products.find(prod => prod.id === sub.productId);
              return p ? p.name : '';
          })
          .filter(Boolean)
          .join(' + ');
      
      if (componentNames) {
          const currentName = editorProduct.name || '';
          // Smart replacement: if already has (...) at end, replace it. If not, append.
          const newName = currentName.includes('(') 
              ? currentName.replace(/\(.*\)/, `(${componentNames})`) 
              : `${currentName} (${componentNames})`;
          
          setEditorProduct(prev => ({...prev, name: newName}));
      }
  };

  useEffect(() => {
      if (editorProduct.type === 'composite' && editorProduct.priceType === 'calculated') {
          const total = calculateSetPrice();
          if (total !== editorProduct.price) {
              setEditorProduct(prev => ({ ...prev, price: total }));
          }
      }
  }, [editorProduct.subProducts, editorProduct.priceType, editorProduct.type]);


  const handleAddCategorySubmit = () => {
      if (newCategoryName && !customCategories.includes(newCategoryName)) {
          onAddCategory(newCategoryName);
          setNewCategoryName('');
      }
  };

  // --- CABIN CLASS HANDLERS ---
  const handleEditClass = (cc: CabinClass) => {
      setEditingClassId(cc.id);
      setNewClassName(cc.name);
      setNewClassDesc(cc.description);
      setNewClassLinkedSet(cc.linkedProductId || '');
  };

  const handleCancelClassEdit = () => {
      setEditingClassId(null);
      setNewClassName('');
      setNewClassDesc('');
      setNewClassLinkedSet('');
  };

  const handleClassSubmit = () => {
      if (!newClassName) return;

      if (editingClassId) {
          // Update existing
          onUpdateCabinClass({
              id: editingClassId,
              name: newClassName,
              description: newClassDesc,
              linkedProductId: newClassLinkedSet || undefined
          });
      } else {
          // Create new
          onAddCabinClass({
              id: generateId(),
              name: newClassName,
              description: newClassDesc,
              linkedProductId: newClassLinkedSet || undefined
          });
      }
      handleCancelClassEdit();
  };

  const handleAddSubcategory = () => {
      const name = prompt("Názov novej podkategórie:");
      if (name) {
          // Just setting filter doesn't create it, but shows user intention
          alert(`Pre vytvorenie podkategórie "${name}" stačí pri úprave produktu napísať tento názov do poľa Podkategória.`);
      }
  };

  if (!isOpen) return null;

  // --- EDITOR OVERLAY ---
  if (isEditorOpen) {
      const isSet = editorProduct.type === 'composite';
      return (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
              {/* WIDER MODAL FOR EDITOR */}
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
                      <h2 className="text-xl font-bold text-gray-800">
                          {products.find(p => p.id === editorProduct.id) ? 'Upraviť Produkt' : 'Nový Produkt'}
                      </h2>
                      <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                          {/* Left Column: Basic Info */}
                          <div className="space-y-6 overflow-y-auto pr-2">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Názov produktu</label>
                                  <div className="flex gap-2">
                                      <input 
                                          className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 font-bold text-lg" 
                                          value={editorProduct.name || ''} 
                                          onChange={e => setEditorProduct({...editorProduct, name: e.target.value})}
                                          autoFocus
                                      />
                                      {isSet && (
                                          <button 
                                            onClick={generateDescriptionFromComponents}
                                            className="px-3 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded hover:bg-yellow-200 text-xs font-bold whitespace-nowrap flex items-center gap-1"
                                            title="Vložiť zoznam komponentov do názvu (napr. do zátvorky)"
                                          >
                                              <FileText size={14}/> Doplniť zloženie
                                          </button>
                                      )}
                                  </div>
                              </div>

                              {/* NEW: Manufacturer & Supplier Inputs */}
                              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Factory size={12}/> Výrobca</label>
                                      <input 
                                          className="w-full p-2 border rounded text-sm bg-white" 
                                          placeholder="napr. Fermator"
                                          value={editorProduct.manufacturer || ''} 
                                          onChange={e => setEditorProduct({...editorProduct, manufacturer: e.target.value})}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Truck size={12}/> Dodávateľ</label>
                                      <input 
                                          className="w-full p-2 border rounded text-sm bg-white" 
                                          placeholder="napr. Sklad / Výťahy s.r.o."
                                          value={editorProduct.supplier || ''} 
                                          onChange={e => setEditorProduct({...editorProduct, supplier: e.target.value})}
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Kategória</label>
                                      <select 
                                          className="w-full p-2 border rounded text-sm bg-gray-50"
                                          value={editorProduct.category || activeCategory} 
                                          onChange={e => setEditorProduct({...editorProduct, category: e.target.value})}
                                      >
                                          {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Podkategória</label>
                                      <input 
                                          className="w-full p-2 border rounded text-sm" 
                                          list="subcat-options"
                                          value={editorProduct.subcategory || ''} 
                                          onChange={e => setEditorProduct({...editorProduct, subcategory: e.target.value})}
                                          placeholder="napr. Trakčné stroje"
                                      />
                                      <datalist id="subcat-options">
                                          {currentSubcategories.map(s => <option key={s} value={s}/>)}
                                      </datalist>
                                  </div>
                              </div>

                              {/* TYPE SWITCHER */}
                              <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-bold mt-4">
                                  <button 
                                      className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-2 ${!isSet ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                                      onClick={() => setEditorProduct({...editorProduct, type: 'simple'})}
                                  >
                                      <Box size={16}/> Jednoduchý Diel
                                  </button>
                                  <button 
                                      className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-2 ${isSet ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                      onClick={() => setEditorProduct({...editorProduct, type: 'composite', priceType: 'calculated'})}
                                  >
                                      <Layers size={16}/> Zložený SET
                                  </button>
                              </div>

                              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Cena (€)</label>
                                      <input 
                                          type="number"
                                          className={`w-full p-2 border rounded font-mono text-right font-bold text-lg ${isSet && editorProduct.priceType === 'calculated' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                          value={editorProduct.price || 0} 
                                          onChange={e => setEditorProduct({...editorProduct, price: parseFloat(e.target.value) || 0})}
                                          readOnly={isSet && editorProduct.priceType === 'calculated'}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Jednotka</label>
                                      <select 
                                          className="w-full p-2 border rounded text-sm bg-white"
                                          value={editorProduct.unit || 'ks'} 
                                          onChange={e => setEditorProduct({...editorProduct, unit: e.target.value})}
                                      >
                                          <option value="ks">ks</option>
                                          <option value="set">set</option>
                                          <option value="kpl">kpl</option>
                                          <option value="m">m</option>
                                          <option value="hod">hod</option>
                                      </select>
                                  </div>
                                  
                                  {isSet && (
                                      <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                                          <div className="flex flex-col gap-2">
                                              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                                  <input 
                                                      type="radio" name="priceType" 
                                                      checked={editorProduct.priceType === 'calculated'} 
                                                      onChange={() => setEditorProduct({...editorProduct, priceType: 'calculated'})}
                                                  />
                                                  Automatický súčet cien komponentov
                                              </label>
                                              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                                  <input 
                                                      type="radio" name="priceType" 
                                                      checked={editorProduct.priceType === 'fixed'} 
                                                      onChange={() => setEditorProduct({...editorProduct, priceType: 'fixed'})}
                                                  />
                                                  Manuálna fixná cena za SET
                                              </label>
                                          </div>
                                          
                                          <div className="mt-4 pt-2 border-t border-gray-200">
                                              <label className="block text-xs font-bold text-gray-500 mb-1">Zobrazenie v ponuke</label>
                                              <select 
                                                  className="w-full p-1 text-xs border rounded"
                                                  value={editorProduct.displayMode || 'itemized'}
                                                  onChange={e => setEditorProduct({...editorProduct, displayMode: e.target.value as any})}
                                              >
                                                  <option value="itemized">Rozpísať položky (Detailne)</option>
                                                  <option value="single_line">Iba jeden riadok (Ako komplet)</option>
                                              </select>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* Right Column: Set Components - REORDERED: SELECTED FIRST */}
                          <div className="border-l pl-6 border-gray-200 flex flex-col h-full overflow-hidden">
                              {isSet ? (
                                  <>
                                      <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 shrink-0">
                                          <Package size={18}/> Komponenty SETu
                                      </h3>

                                      {/* 1. Selected Components List - MOVED TO TOP */}
                                      <div className="h-48 shrink-0 bg-yellow-50 rounded border border-yellow-200 overflow-y-auto p-2 space-y-1 mb-4 shadow-inner">
                                          <div className="flex justify-between items-center mb-1">
                                              <div className="text-[10px] font-bold text-yellow-700 uppercase">Obsah SETu</div>
                                              <div className="text-[10px] font-bold text-blue-600 bg-white px-2 rounded border">{calculateSetPrice().toFixed(2)} €</div>
                                          </div>
                                          
                                          {(!editorProduct.subProducts || editorProduct.subProducts.length === 0) && (
                                              <div className="text-center text-gray-400 text-xs py-4 italic">Zatiaľ žiadne komponenty.<br/>Pridajte ich zo zoznamu nižšie.</div>
                                          )}
                                          
                                          {editorProduct.subProducts?.map(sub => {
                                              const prod = products.find(p => p.id === sub.productId);
                                              return (
                                                  <div key={sub.productId} className="bg-white p-2 rounded border flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-2">
                                                      <div className="flex-1 min-w-0 mr-2">
                                                          <div className="text-xs font-bold truncate" title={prod?.name}>{prod?.name || 'Neznámy'}</div>
                                                          <div className="text-[10px] text-gray-500">{prod?.price} € / {prod?.unit}</div>
                                                      </div>
                                                      <div className="flex items-center gap-1">
                                                          <input 
                                                              type="number" 
                                                              className="w-12 p-1 text-center border rounded text-xs font-bold" 
                                                              value={sub.quantity}
                                                              onChange={e => updateComponentQty(sub.productId, parseFloat(e.target.value) || 0)}
                                                          />
                                                          <button onClick={() => removeComponentFromSet(sub.productId)} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                      
                                      <div className="flex justify-center mb-2">
                                          <ArrowDown size={16} className="text-gray-300"/>
                                      </div>

                                      {/* 2. Enhanced Filter Section */}
                                      <div className="mb-2 shrink-0 space-y-2 bg-gray-50 p-2 rounded border border-gray-200">
                                          <div className="flex gap-2">
                                              <select 
                                                  className="w-1/3 p-2 border rounded text-xs font-bold text-gray-700 outline-none"
                                                  value={componentCategoryFilter}
                                                  onChange={e => setComponentCategoryFilter(e.target.value)}
                                              >
                                                  <option value="ALL">Všetky kategórie</option>
                                                  {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                              </select>
                                              <div className="relative flex-1">
                                                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                                                  <input 
                                                      className="w-full pl-8 p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-purple-500" 
                                                      placeholder="Hľadať komponent..."
                                                      value={componentSearch}
                                                      onChange={e => setComponentSearch(e.target.value)}
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                      
                                      {/* 3. Available Components List (Browsable) */}
                                      <div className="flex-1 overflow-y-auto mb-4 border rounded bg-white relative">
                                          <div className="sticky top-0 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase px-2 py-1 border-b z-10">
                                              Dostupné produkty
                                          </div>
                                          
                                          {availableComponentsGrouped.sortedKeys.length === 0 ? (
                                              <div className="p-4 text-center text-gray-400 text-xs italic">Žiadne produkty nenašli.</div>
                                          ) : (
                                              availableComponentsGrouped.sortedKeys.map(subKey => (
                                                  <div key={subKey}>
                                                      {/* Subcategory Header */}
                                                      <div className={`px-2 py-1 text-[10px] font-bold border-b border-t sticky top-6 z-0 flex items-center gap-1 ${getSubcatColor(subKey)}`}>
                                                          <Tag size={10}/> {subKey}
                                                      </div>
                                                      {/* Items in Subcategory */}
                                                      {availableComponentsGrouped.grouped[subKey].map(p => (
                                                          <div 
                                                              key={p.id} 
                                                              className="p-2 hover:bg-purple-50 cursor-pointer flex justify-between text-xs border-b last:border-0 items-center"
                                                              onClick={() => addComponentToSet(p)}
                                                          >
                                                              <div className="truncate font-medium">{p.name}</div>
                                                              <div className="flex items-center gap-2">
                                                                  <span className="text-gray-500 whitespace-nowrap">{p.price.toFixed(2)} €</span>
                                                                  <Plus size={14} className="text-purple-600"/>
                                                              </div>
                                                          </div>
                                                      ))}
                                                  </div>
                                              ))
                                          )}
                                      </div>
                                  </>
                              ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
                                      <Box size={48} className="mb-4 opacity-20"/>
                                      <p className="text-sm">Jednoduchý produkt nemá žiadne pod-komponenty.</p>
                                      <p className="text-xs mt-2">Prepnutím na "Zložený SET" môžete vyskladať produkt z iných dielov (napr. Kabína = Rám + Steny + Podlaha).</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
                      <button onClick={() => setIsEditorOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-bold">Zrušiť</button>
                      <button onClick={saveEditor} className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded font-bold flex items-center gap-2">
                          <Save size={18}/> Uložiť Produkt
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // Render Product Row
  const renderProductRow = (product: Product) => (
    <tr key={product.id} className={`hover:bg-blue-50 transition border-b border-gray-100 ${selectedProductIds.has(product.id) ? 'bg-blue-50' : ''}`}>
        <td className="p-3 w-10 text-center">
            <button onClick={() => handleBulkSelection(product.id)} className={`text-gray-400 hover:text-purple-600 ${selectedProductIds.has(product.id) ? 'text-purple-600' : ''}`}>
                {selectedProductIds.has(product.id) ? <CheckSquare size={16}/> : <Square size={16}/>}
            </button>
        </td>
        <td className="p-3">
            <div className="font-bold text-gray-800 flex items-center gap-2">
                {product.type === 'composite' && (
                    <span title="SET / Zložený produkt">
                        <Layers size={14} className="text-purple-500" />
                    </span>
                )}
                {product.name}
            </div>
            {/* Added Manufacturer/Supplier Info */}
            {(product.manufacturer || product.supplier) && (
                <div className="text-[10px] text-gray-400 flex gap-2 mt-0.5">
                    {product.manufacturer && <span><Factory size={10} className="inline mr-0.5"/> {product.manufacturer}</span>}
                    {product.supplier && <span><Truck size={10} className="inline mr-0.5"/> {product.supplier}</span>}
                </div>
            )}
        </td>
        <td className="p-3">
            <span className={`text-xs px-2 py-1 rounded-full border ${product.subcategory ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                {product.subcategory || '-'}
            </span>
        </td>
        <td className="p-3 text-right font-mono">
            {product.price.toFixed(2)}
        </td>
        <td className="p-3 text-right">
            <span className="text-gray-500 text-xs">{product.unit}</span>
        </td>
        <td className="p-3 text-center">
            <div className="flex justify-center gap-1">
                <button onClick={() => handleDuplicateProduct(product)} className="p-1 text-orange-500 hover:bg-orange-50 rounded" title="Vytvoriť kópiu (Duplikovať)">
                    <Copy size={16}/>
                </button>
                <button onClick={() => openEditor(product)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Upraviť">
                    <Edit size={16}/>
                </button>
                <button onClick={() => onDeleteProduct(product.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Vymazať">
                    <Trash2 size={16}/>
                </button>
            </div>
        </td>
    </tr>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-2">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[98vw] h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Settings className="text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">Správca Katalógu</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('products')} 
                className={`flex-1 py-3 font-bold text-sm border-b-2 transition ${activeTab==='products' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                Produkty
            </button>
            <button 
                onClick={() => setActiveTab('categories')} 
                className={`flex-1 py-3 font-bold text-sm border-b-2 transition ${activeTab==='categories' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                Kategórie
            </button>
            <button 
                onClick={() => setActiveTab('classes')} 
                className={`flex-1 py-3 font-bold text-sm border-b-2 transition ${activeTab==='classes' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                Triedy Kabín
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* --- PRODUCTS TAB --- */}
            {activeTab === 'products' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b bg-white flex flex-col gap-4">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-bold text-gray-500">Kategória:</span>
                                <select 
                                    value={activeCategory} 
                                    onChange={e => setActiveCategory(e.target.value)} 
                                    className="border rounded-lg px-3 py-2 text-sm font-bold bg-gray-50 min-w-[200px]"
                                >
                                    {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="relative flex-1 max-w-sm ml-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Hľadať produkt..." 
                                        value={searchTerm} 
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => openEditor()} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-purple-700 transition">
                                    <Plus size={18}/> Pridať Produkt
                                </button>
                                <div className="h-8 w-px bg-gray-300 mx-2"></div>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={e => e.target.files?.[0] && onImportCatalog(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Importovať JSON katalóg">
                                    <Upload size={20}/>
                                </button>
                                <button onClick={handleExportCatalog} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Exportovať katalóg (Stiahnuť JSON)">
                                    <Download size={20}/>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            <span className="text-xs font-bold text-gray-400 uppercase shrink-0 mr-2 flex items-center gap-1">
                                <Filter size={12}/> Podkategórie:
                            </span>
                            <button onClick={() => handlePillClick('ALL')} className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition flex items-center gap-2 ${activeSubcategoryFilter === 'ALL' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>Všetko</button>
                            <button onClick={() => handlePillClick('NONE')} className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition flex items-center gap-2 ${activeSubcategoryFilter === 'NONE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>{selectedProductIds.size > 0 && <CornerDownRight size={14}/>} Bez podkategórie</button>
                            {currentSubcategories.map(sub => (
                                <button key={sub} onClick={() => handlePillClick(sub)} className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition flex items-center gap-2 ${activeSubcategoryFilter === sub ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>{selectedProductIds.size > 0 && <CornerDownRight size={14}/>} {sub}</button>
                            ))}
                            <button onClick={handleAddSubcategory} className="px-2 py-1 rounded-full text-xs text-gray-400 hover:bg-gray-100 border border-dashed border-gray-300 ml-auto whitespace-nowrap">+ Nová</button>
                        </div>

                        {selectedProductIds.size > 0 && (
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 flex justify-between items-center text-xs animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 font-bold text-blue-800">
                                    <CheckSquare size={14}/> {selectedProductIds.size} vybraných
                                    <span className="font-normal text-gray-600 ml-2">← Kliknite na tlačidlo podkategórie vyššie pre okamžitý presun.</span>
                                </div>
                                <button onClick={handleDeleteSelected} className="text-red-600 hover:underline font-bold flex items-center gap-1"><Trash2 size={12}/> Vymazať označené</button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        <table className="w-full text-sm bg-white border rounded-lg shadow-sm overflow-hidden">
                            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-10 text-center"><button onClick={toggleSelectAll} className="text-gray-500 hover:text-black">{selectedProductIds.size > 0 ? <CheckSquare size={16}/> : <Square size={16}/>}</button></th>
                                    <th className="p-3 text-left">Názov Produktu</th>
                                    <th className="p-3 text-left w-32">Podkategória</th>
                                    <th className="p-3 text-right w-24">Cena (€)</th>
                                    <th className="p-3 text-right w-20">MJ</th>
                                    <th className="p-3 text-center w-24">Akcie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayedProducts.map(renderProductRow)}
                                {displayedProducts.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">Žiadne produkty v tomto zobrazení.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- CATEGORIES TAB --- */}
            {activeTab === 'categories' && (
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex gap-2">
                            <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" placeholder="Názov novej kategórie..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                            <button onClick={handleAddCategorySubmit} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-purple-700"><Plus size={18}/> Pridať</button>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-3 bg-gray-100 text-xs font-bold text-gray-500 uppercase border-b">Existujúce Kategórie</div>
                            <div className="divide-y divide-gray-100">
                                {customCategories.map(cat => (
                                    <div key={cat} className="p-4 flex justify-between items-center hover:bg-gray-50 group">
                                        <div className="flex items-center gap-3"><Layers className="text-gray-400" size={20}/><span className="font-bold text-gray-800">{cat}</span><span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{products.filter(p => p.category === cat).length} produktov</span></div>
                                        <button onClick={() => onDeleteCategory(cat)} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={18}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CLASSES TAB --- */}
            {activeTab === 'classes' && (
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 flex gap-2">
                            <AlertTriangle size={18} className="shrink-0"/>
                            <div>Tu môžete definovať <strong>Triedy Kabín</strong>. Ku každej triede môžete priradiť <strong>SET Produkt</strong> z katalógu.</div>
                        </div>

                        {/* Add/Edit Class Form */}
                        <div className={`bg-white p-6 rounded-xl border shadow-sm transition-all ${editingClassId ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
                            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                                {editingClassId ? <><Edit className="text-yellow-500" size={20}/> Upraviť Triedu</> : 'Nová Trieda'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input className="border rounded px-3 py-2" placeholder="Názov (napr. EXCLUSIVE)" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                                <input className="border rounded px-3 py-2" placeholder="Popis (napr. Sklo / Kameň)" value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} />
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Prepojený SET Produkt (Voliteľné)</label>
                                    <select className="w-full border rounded px-3 py-2 text-sm bg-white" value={newClassLinkedSet} onChange={e => setNewClassLinkedSet(e.target.value)}>
                                        <option value="">-- Žiadne prepojenie --</option>
                                        {products.filter(p => p.type === 'composite').map(p => (
                                            <option key={p.id} value={p.id}>📦 {p.name} ({p.price}€)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {editingClassId && (
                                    <button onClick={handleCancelClassEdit} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-bold">
                                        Zrušiť
                                    </button>
                                )}
                                <button onClick={handleClassSubmit} className={`flex-1 py-2 rounded-lg font-bold text-white transition ${editingClassId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {editingClassId ? 'Aktualizovať Triedu' : 'Uložiť Triedu'}
                                </button>
                            </div>
                        </div>

                        {/* Classes List */}
                        <div className="space-y-2">
                            {cabinClasses.map(cc => {
                                const linkedProduct = products.find(p => p.id === cc.linkedProductId);
                                const isEditing = editingClassId === cc.id;
                                return (
                                    <div key={cc.id} className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center group transition ${isEditing ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                                        <div>
                                            <div className="font-bold text-lg text-gray-800">{cc.name}</div>
                                            <div className="text-gray-500 text-sm">{cc.description}</div>
                                            {linkedProduct && (
                                                <div className="mt-2 text-xs bg-green-50 text-green-700 px-2 py-1 rounded inline-flex items-center gap-1 border border-green-100">
                                                    <Box size={12}/> Link: <strong>{linkedProduct.name}</strong>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditClass(cc)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Upraviť">
                                                <Edit size={20}/>
                                            </button>
                                            <button onClick={() => onDeleteCabinClass(cc.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition" title="Vymazať">
                                                <Trash2 size={20}/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
