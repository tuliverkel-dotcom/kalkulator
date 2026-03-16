import React, { useState, useEffect } from 'react';
import { Save, Printer, ArrowLeft, Settings, Cpu, Zap, Activity, Upload, Building, Users, PlusCircle, Trash2, Archive, Search, FileText } from 'lucide-react';
import { QuoteData, Product, QuoteCategory, QuoteItem, AppSettings } from '../types';
import { CategoryTable } from './CategoryTable';
import { ProductDatabaseModal } from './ProductDatabaseModal';

// --- HELPER: Generate ID (Local version to avoid dependency on CoreApp) ---
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch (e) {}
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// --- DEFAULT CATEGORIES FOR CONTROL SYSTEM ---
const CS_CATEGORIES = [
    'Rozvádzač',
    'Menič a filter',
    'Displeje a privolávače',
    'Inšpekcia a revízia',
    'Kabeláž',
    'Montáž',
    'Doprava'
];

interface ControlSystemQuoteProps {
    onBack: () => void;
}

export const ControlSystemQuote: React.FC<ControlSystemQuoteProps> = ({ onBack }) => {
    // --- STATE ---
    const [data, setData] = useState<QuoteData>({
        id: generateId(),
        number: 'RS_SK_001_26_BA', // Placeholder
        type: 'quote',
        title: 'Cenová Ponuka - RS',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        clientReference: '',
        supplier: { name: 'MOJA FIRMA S.R.O.', details: 'IČO: 12345678, DPH: SK12345678' },
        client: { name: '', details: '' },
        categories: [],
        terms: '',
        currency: '€',
        globalMargin: 15,
        shaftMargin: 0,
        vatRate: 23,
        hideItemPrices: false,
        showTechSpecs: true
    });

    // Control System Specific Parameters (Not in standard QuoteData layout)
    const [csParams, setCsParams] = useState({
        systemName: 'Výťahový Rozvádzač', // Default name
        driveType: 'Bezprevodový',
        machineManufacturer: '',
        powerKw: 5.5,
        currentA: 14,
        brakePower: '2x110V DC',
        doorType: 'Automatické',
        doorManufacturer: '',
        doorControl: 'Digitálne',
        controllerType: 'Simplex',
        placement: 'MRL (Šachta)',
        cabinDisplay: 'LCD',
        stationDisplay: 'LCD',
        lopCutout: '',
        copCutout: '',
        stops: 5,
        travel: 15000,
        headroom: 3400,
        pit: 1100,
        positioning: 'Absolútne (Lim)',
        keepLops: false,
        keepCop: false,
        // NEW FIELDS
        cabinetType: 'Nerezová skriňa',
        dimensions: '2000x600x400',
        ipRating: 'IP43',
        emergencyOp: 'UPS (Dojazd)',
        standards: 'EN 81-20/50'
    });

    const [products, setProducts] = useState<Product[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [activeCatId, setActiveCatId] = useState<string | null>(null);
    const [settings, setSettings] = useState<AppSettings>({ nextCpSequence: 1, nextObjSequence: 1, nextPlSequence: 1 });
    
    // ARCHIVE STATE
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([]);
    const [archiveSearch, setArchiveSearch] = useState('');

    // --- LOAD DATA ---
    useEffect(() => {
        // Load Products
        const storedProducts = localStorage.getItem('smartquote_products');
        if (storedProducts) {
            try { setProducts(JSON.parse(storedProducts)); } catch (e) { console.error(e); }
        }

        // Load Settings & Generate Number
        const storedSettings = localStorage.getItem('smartquote_settings');
        if (storedSettings) {
            try {
                const parsedSettings = JSON.parse(storedSettings);
                setSettings(parsedSettings);
                
                // Only generate number if not already set (e.g. from props or previous load)
                if (!data.number) {
                    const year = new Date().getFullYear().toString().slice(-2);
                    const seq = parsedSettings.nextCpSequence || 1;
                    const numStr = seq.toString().padStart(3, '0');
                    setData(prev => ({...prev, number: `RS_SK_${numStr}_${year}_BA`}));
                }
            } catch (e) { console.error(e); }
        }

        // Load Archive
        const storedArchive = localStorage.getItem('smartquote_archive');
        if (storedArchive) {
            try { setSavedQuotes(JSON.parse(storedArchive)); } catch (e) { console.error(e); }
        }

        // Initialize Categories
        const initCats: QuoteCategory[] = CS_CATEGORIES.map(name => ({
            id: generateId(),
            type: 'items',
            name: name,
            items: [],
            isExpanded: true,
            section: 'lift'
        }));
        setData(prev => ({...prev, categories: initCats}));
    }, []);

    // --- HANDLERS ---
    const handleSave = () => {
        const now = Date.now();
        const quoteToSave: QuoteData = { 
            ...data, 
            lastUpdated: now, 
            csParams: csParams, // Include csParams
            type: 'quote' // Ensure type is set
        };
        
        // Check for duplicate number
        const existing = savedQuotes.find(q => q.number === data.number && q.id !== data.id);
        if (existing) {
            if (!window.confirm(`Doklad s číslom ${data.number} už existuje. Prepísať?`)) return;
        }

        // Update archive
        const newArchive = savedQuotes.filter(q => q.id !== data.id && q.id !== existing?.id);
        newArchive.push(quoteToSave);
        
        try {
            localStorage.setItem('smartquote_archive', JSON.stringify(newArchive));
            setSavedQuotes(newArchive);
            
            // Update sequence if needed (simple heuristic: if number matches current sequence)
            const year = new Date().getFullYear().toString().slice(-2);
            const seq = settings.nextCpSequence || 1;
            const expectedNum = `RS_SK_${seq.toString().padStart(3, '0')}_${year}_BA`;
            
            if (data.number === expectedNum) {
                const newSettings = { ...settings, nextCpSequence: seq + 1 };
                setSettings(newSettings);
                localStorage.setItem('smartquote_settings', JSON.stringify(newSettings));
            }

            alert("Uložené!");
        } catch (e) {
            console.error("Storage full", e);
            alert("CHYBA: Pamäť prehliadača je plná! Doklad sa nepodarilo uložiť. Skúste vymazať staré doklady z archívu alebo vykonať export dát.");
        }
    };

    const handleLoad = (q: QuoteData) => {
        if (window.confirm("Naozaj chcete načítať tento doklad? Neuložené zmeny budú stratené.")) {
            setData(q);
            if (q.csParams) {
                setCsParams(q.csParams);
            } else {
                // Reset params if not present
                setCsParams({
                    systemName: 'Výťahový Rozvádzač',
                    driveType: 'Bezprevodový',
                    machineManufacturer: '',
                    powerKw: 5.5,
                    currentA: 14,
                    brakePower: '2x110V DC',
                    doorType: 'Automatické',
                    doorManufacturer: '',
                    doorControl: 'Digitálne',
                    controllerType: 'Simplex',
                    placement: 'MRL (Šachta)',
                    cabinDisplay: 'LCD',
                    stationDisplay: 'LCD',
                    lopCutout: '',
                    copCutout: '',
                    stops: 5,
                    travel: 15000,
                    headroom: 3400,
                    pit: 1100,
                    positioning: 'Absolútne (Lim)',
                    keepLops: false,
                    keepCop: false,
                    cabinetType: 'Nerezová skriňa',
                    dimensions: '2000x600x400',
                    ipRating: 'IP43',
                    emergencyOp: 'UPS (Dojazd)',
                    standards: 'EN 81-20/50'
                });
            }
            setIsArchiveOpen(false);
        }
    };

    const handleNewQuote = () => {
        if (window.confirm("Naozaj chcete vytvoriť novú ponuku?")) {
            const year = new Date().getFullYear().toString().slice(-2);
            const seq = settings.nextCpSequence || 1;
            const numStr = seq.toString().padStart(3, '0');
            
            setData({
                id: generateId(),
                number: `RS_SK_${numStr}_${year}_BA`,
                type: 'quote',
                title: 'Cenová Ponuka - Riadiaci Systém',
                date: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                supplier: { name: '', details: '' },
                client: { name: '', details: '' },
                categories: CS_CATEGORIES.map(name => ({
                    id: generateId(),
                    type: 'items',
                    name: name,
                    items: [],
                    isExpanded: true,
                    section: 'lift'
                })),
                terms: '',
                currency: 'EUR',
                globalMargin: 0,
                shaftMargin: 0
            });
            
            // Reset params
            setCsParams({
                systemName: 'Výťahový Rozvádzač',
                driveType: 'Bezprevodový',
                machineManufacturer: '',
                powerKw: 5.5,
                currentA: 14,
                brakePower: '2x110V DC',
                doorType: 'Automatické',
                doorManufacturer: '',
                doorControl: 'Digitálne',
                controllerType: 'Simplex',
                placement: 'MRL (Šachta)',
                cabinDisplay: 'LCD',
                stationDisplay: 'LCD',
                lopCutout: '',
                copCutout: '',
                stops: 5,
                travel: 15000,
                headroom: 3400,
                pit: 1100,
                positioning: 'Absolútne (Lim)',
                keepLops: false,
                keepCop: false,
                cabinetType: 'Nerezová skriňa',
                dimensions: '2000x600x400',
                ipRating: 'IP43',
                emergencyOp: 'UPS (Dojazd)',
                standards: 'EN 81-20/50'
            });
        }
    };

    const handleDeleteQuote = (id: string) => {
        if (window.confirm("Naozaj chcete vymazať tento doklad z archívu?")) {
            const newArchive = savedQuotes.filter(q => q.id !== id);
            try {
                localStorage.setItem('smartquote_archive', JSON.stringify(newArchive));
                setSavedQuotes(newArchive);
            } catch (e) {
                console.error("Failed to delete from archive", e);
                alert("CHYBA: Nepodarilo sa aktualizovať archív.");
            }
        }
    };

    const handleParamChange = (field: string, value: any) => {
        setCsParams(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItem = (catId: string) => {
        setData(prev => ({
            ...prev,
            categories: prev.categories.map(c => c.id === catId ? {
                ...c,
                items: [...c.items, { id: generateId(), description: 'Nová položka', unit: 'ks', quantity: 1, unitPrice: 0, purchasePrice: 0, vatRate: 23 }]
            } : c)
        }));
    };

    const handleOpenCatalog = (catId: string) => {
        setActiveCatId(catId);
        setIsProductModalOpen(true);
    };

    const handleSelectProduct = (p: Product) => {
        if (!activeCatId) return;
        setData(prev => ({
            ...prev,
            categories: prev.categories.map(c => c.id === activeCatId ? {
                ...c,
                items: [...c.items, {
                    id: generateId(),
                    description: p.name,
                    unit: p.unit,
                    quantity: 1,
                    unitPrice: p.price,
                    purchasePrice: 0,
                    vatRate: 23
                }]
            } : c)
        }));
        setIsProductModalOpen(false);
    };

    // --- HELPER: Identify Work Categories ---
    const isWorkCategory = (name: string) => {
        const lower = name.toLowerCase();
        return lower.includes('montáž') || lower.includes('doprava') || lower.includes('inštalácia') || lower.includes('demontáž') || lower.includes('skúšky') || lower.includes('revízia') || lower.includes('projekt') || lower.includes('zaškolenie');
    };

    const calculateTotals = () => {
        let materialCost = 0; let materialSale = 0;
        let workCost = 0; let workSale = 0;

        data.categories.forEach(cat => {
            const isWork = isWorkCategory(cat.name);
            const margin = isWork ? (data.workMargin ?? 0) : data.globalMargin;
            
            cat.items.forEach(item => {
                const totalCost = item.quantity * item.unitPrice;
                const totalSale = totalCost * (1 + margin / 100);

                if (isWork) {
                    workCost += totalCost; workSale += totalSale;
                } else {
                    materialCost += totalCost; materialSale += totalSale;
                }
            });
        });
        return { 
            materialCost, materialSale, materialProfit: materialSale - materialCost,
            workCost, workSale, workProfit: workSale - workCost,
            total: materialSale + workSale 
        };
    };
    
    const totals = calculateTotals();
    const vat = totals.total * 0.23;

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-[210mm] mx-auto">
                
                {/* --- HEADER ACTIONS --- */}
                <div className="mb-8 flex justify-between items-center no-print">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold">
                        <ArrowLeft size={20}/> Späť
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handleNewQuote} className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-sm font-bold flex items-center gap-2 hover:bg-blue-700 text-sm">
                            <PlusCircle size={16}/> Nová
                        </button>
                        <button onClick={() => setIsArchiveOpen(true)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-sm font-bold flex items-center gap-2 hover:bg-gray-300 text-sm">
                            <Archive size={16}/> Archív
                        </button>
                        <button onClick={handleSave} className="px-3 py-2 bg-green-600 text-white rounded-lg shadow-sm font-bold flex items-center gap-2 hover:bg-green-700 text-sm">
                            <Save size={16}/> Uložiť
                        </button>
                        <button onClick={() => window.print()} className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-sm font-bold flex items-center gap-2 hover:bg-purple-700 text-sm">
                            <Printer size={16}/> Tlačiť / PDF
                        </button>
                    </div>
                </div>

                {/* --- ARCHIVE MODAL --- */}
                {isArchiveOpen && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 no-print">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                                <h2 className="text-xl font-bold flex items-center gap-2"><Archive className="text-blue-600"/> Archív Riadiacich Systémov</h2>
                                <button onClick={() => setIsArchiveOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><Trash2 size={20} className="rotate-45"/></button>
                            </div>
                            <div className="p-4 border-b bg-white">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Hľadať podľa čísla dokladu alebo mena klienta..." 
                                        value={archiveSearch} 
                                        onChange={(e) => setArchiveSearch(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {savedQuotes
                                    .filter(q => q.number.includes('RS_') || (q.csParams !== undefined)) // Filter only RS quotes
                                    .filter(q => q.number.toLowerCase().includes(archiveSearch.toLowerCase()) || q.client.name.toLowerCase().includes(archiveSearch.toLowerCase()))
                                    .map(q => (
                                    <div key={q.id} className="p-4 bg-white border border-gray-200 rounded-lg mb-2 flex justify-between items-center shadow-sm hover:border-blue-300 transition-all">
                                        <div>
                                            <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                                {q.number} 
                                                <span className="text-xs px-2 py-0.5 rounded uppercase bg-purple-100 text-purple-800">Riadiaci Systém</span>
                                            </div>
                                            <div className="text-sm text-gray-600 font-medium">{q.client.name || 'Bez klienta'}</div>
                                            <div className="text-xs text-gray-400 mt-1">Zo dňa: {q.date}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleLoad(q)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-sm border border-blue-200">Otvoriť</button>
                                            <button onClick={() => handleDeleteQuote(q.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm border border-red-200" title="Vymazať"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                                {savedQuotes.filter(q => q.number.includes('RS_') || (q.csParams !== undefined)).length === 0 && <div className="text-center text-gray-400 py-8 italic">Žiadne uložené RS doklady.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PARAMETERS PANEL (GREEN) --- */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 shadow-sm no-print">
                    <h2 className="text-green-800 font-bold uppercase flex items-center gap-2 mb-4 border-b border-green-200 pb-2">
                        <Cpu size={20}/> Parametre Riadiaceho Systému
                    </h2>

                    <div className="mb-4">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Názov Systému / Rozvádzača</label>
                        <input 
                            type="text" 
                            value={csParams.systemName} 
                            onChange={e => handleParamChange('systemName', e.target.value)} 
                            className="w-full border border-gray-300 rounded p-2 text-lg font-bold text-green-900 placeholder-green-200" 
                            placeholder="napr. Výťahový Rozvádzač VR-01"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pohon / Stroj</label>
                            <select value={csParams.driveType} onChange={e => handleParamChange('driveType', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                <option>Bezprevodový</option><option>Prevodový</option><option>Hydraulický</option><option>Žiadne</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Výrobca Stroja</label>
                            <input type="text" value={csParams.machineManufacturer} onChange={e => handleParamChange('machineManufacturer', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold" placeholder="napr. Sicor"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Výkon (kW)</label>
                            <input type="number" value={csParams.powerKw} onChange={e => handleParamChange('powerKw', +e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-center"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prúd (A)</label>
                            <input type="number" value={csParams.currentA} onChange={e => handleParamChange('currentA', +e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-center text-blue-600"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Napájanie Brzdy</label>
                            <input type="text" value={csParams.brakePower} onChange={e => handleParamChange('brakePower', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Typ Dverí</label>
                            <select value={csParams.doorType} onChange={e => handleParamChange('doorType', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                <option>Automatické</option><option>Manuálne</option><option>Polouatomatické</option><option>Žiadne</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Výrobca Dverí</label>
                            <input type="text" value={csParams.doorManufacturer} onChange={e => handleParamChange('doorManufacturer', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold" placeholder="napr. Fermator"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Riadenie Dverí</label>
                            <select value={csParams.doorControl} onChange={e => handleParamChange('doorControl', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                <option>Digitálne</option><option>Frekvenčné</option><option>Reléové</option><option>Žiadne</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ovládač</label>
                            <input type="text" value={csParams.controllerType} onChange={e => handleParamChange('controllerType', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold" placeholder="napr. ECO+"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Umiestnenie</label>
                            <select value={csParams.placement} onChange={e => handleParamChange('placement', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                <option>MRL (Šachta)</option><option>Strojovňa</option><option>Žiadne</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Displej Kabína</label>
                            <select value={csParams.cabinDisplay} onChange={e => handleParamChange('cabinDisplay', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                <option>LCD</option><option>7-segment</option><option>Dot-matrix</option><option>TFT</option><option>Žiadne</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Displej Stanice</label>
                                <select value={csParams.stationDisplay} onChange={e => handleParamChange('stationDisplay', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                    <option>LCD</option><option>7-segment</option><option>Dot-matrix</option><option>TFT</option><option>Žiadne</option>
                                </select>
                             </div>
                             <div className="w-20">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">&nbsp;</label>
                                <select className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-gray-50 text-gray-500"><option>Všetky</option></select>
                             </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Výrez LOP (mm)</label>
                            <input type="text" value={csParams.lopCutout} onChange={e => handleParamChange('lopCutout', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold" placeholder="ŠxV"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Výrez COP (mm)</label>
                            <input type="text" value={csParams.copCutout} onChange={e => handleParamChange('copCutout', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold" placeholder="ŠxV"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                         <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Počet Staníc</label>
                            <input type="number" value={csParams.stops} onChange={e => handleParamChange('stops', +e.target.value)} className="w-full border border-gray-300 rounded p-2 text-lg font-bold text-center"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Zdvih (mm)</label>
                            <input type="number" value={csParams.travel} onChange={e => handleParamChange('travel', +e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-center"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hlava</label>
                            <input type="number" value={csParams.headroom} onChange={e => handleParamChange('headroom', +e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-center"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Priehlbeň</label>
                            <input type="number" value={csParams.pit} onChange={e => handleParamChange('pit', +e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-center"/>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pozicionovanie</label>
                             <div className="flex gap-2">
                                <select value={csParams.positioning} onChange={e => handleParamChange('positioning', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                    <option>Absolútne (Lim)</option><option>Magnetické</option><option>Enkóder</option><option>Žiadne</option>
                                </select>
                                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 rounded flex items-center gap-2 text-sm">
                                    <Activity size={16}/> Sprievodca
                                </button>
                             </div>
                        </div>
                    </div>

                    {/* NEW ROW: CABINET & STANDARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 pt-4 border-t border-green-200">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Typ Rozvádzača</label>
                            <select value={csParams.cabinetType} onChange={e => handleParamChange('cabinetType', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                <option>Nerezová skriňa</option><option>Lakovaná skriňa</option><option>Plastová skriňa</option><option>Žiadne</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rozmery (VxŠxH)</label>
                            <input type="text" value={csParams.dimensions} onChange={e => handleParamChange('dimensions', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-center" placeholder="2000x600x400"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Krytie (IP)</label>
                            <input type="text" value={csParams.ipRating} onChange={e => handleParamChange('ipRating', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-center" placeholder="IP43"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Núdzový Dojazd</label>
                            <select value={csParams.emergencyOp} onChange={e => handleParamChange('emergencyOp', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-white">
                                <option>UPS (Dojazd)</option><option>UPS (Brzda)</option><option>Batériové</option><option>3-fázový dojazd</option><option>Žiadne</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Norma</label>
                            <input type="text" value={csParams.standards} onChange={e => handleParamChange('standards', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-center text-blue-600"/>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={csParams.keepLops} onChange={e => handleParamChange('keepLops', e.target.checked)} className="rounded text-green-600 focus:ring-green-500"/>
                            <span className="text-sm font-bold text-gray-700">Ponechať pôvodné privolávače</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={csParams.keepCop} onChange={e => handleParamChange('keepCop', e.target.checked)} className="rounded text-green-600 focus:ring-green-500"/>
                            <span className="text-sm font-bold text-gray-700">Ponechať pôvodné tablo</span>
                        </label>
                    </div>
                </div>

                {/* --- QUOTE PREVIEW (WHITE SHEET) --- */}
                <div className="bg-white shadow-2xl border border-gray-200 min-h-[297mm] p-[15mm] md:p-[20mm] print:shadow-none print:p-0 print:border-none">
                    
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h1 className="text-4xl font-bold text-black mb-4 uppercase">Cenová Ponuka - RS</h1>
                            <div className="text-lg text-gray-500 font-medium">{data.number}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-xs text-gray-400 uppercase font-bold mb-1">{data.number}</div>
                             <div className="bg-white border border-gray-100 rounded p-2 inline-block shadow-sm print:border-none print:shadow-none print:p-0">
                                <div className="flex justify-end gap-3 text-xs mb-1"><span className="text-gray-500 font-bold uppercase pt-0.5">Dátum</span><input type="date" value={data.date} onChange={e => setData({...data, date:e.target.value})} className="text-right bg-transparent font-medium w-24 p-0 border-none"/></div>
                                 <div className="flex justify-end gap-3 text-xs"><span className="text-gray-500 font-bold uppercase pt-0.5">Platnosť</span><input type="date" value={data.validUntil} onChange={e => setData({...data, validUntil:e.target.value})} className="text-right bg-transparent font-medium w-24 p-0 border-none"/></div>
                             </div>
                        </div>
                    </div>

                    {/* PROJECT REF */}
                    <div className="mb-8 bg-blue-50 print:bg-transparent border-l-4 border-blue-600 print:border-black p-3 print:p-0 print:pl-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1 no-print">Referencia / Projekt:</label>
                        <input 
                            value={data.clientReference || ''} 
                            onChange={e => setData({...data, clientReference: e.target.value})}
                            className="text-lg font-bold w-full bg-transparent text-blue-900 print:text-black placeholder-gray-300 print:placeholder-transparent uppercase"
                            placeholder="NÁZOV PROJEKTU / ADRESA STAVBY"
                        />
                    </div>

                    {/* SUPPLIER / CLIENT */}
                    <div className="grid grid-cols-2 gap-8 mb-12">
                        <div>
                             <div className="flex items-center gap-2 mb-2 pb-1"><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dodávateľ</h3></div>
                             <div className="flex items-start gap-4">
                                  <div className="w-[80px] flex justify-center items-center shrink-0">
                                     {data.logoUrl ? (<img src={data.logoUrl} alt="Logo" className="max-w-full max-h-[80px] object-contain" />) : (<label className="cursor-pointer text-gray-400 border border-dashed border-gray-300 p-2 rounded no-print w-full h-16 flex items-center justify-center text-xs"><Upload size={14} /> Logo<input type="file" accept="image/*" onChange={e => {const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onload=ev=>setData({...data, logoUrl:ev.target?.result as string}); r.readAsDataURL(f);}}} className="hidden" /></label>)}
                                  </div>
                                  <div className="flex-1">
                                     <textarea value={data.supplier.name} onChange={e => setData({...data, supplier:{...data.supplier, name:e.target.value}})} className="font-bold text-sm w-full bg-transparent mb-1 text-gray-900 print:text-black p-0 uppercase resize-none h-auto" rows={1} />
                                     <textarea value={data.supplier.details} onChange={e => setData({...data, supplier:{...data.supplier, details:e.target.value}})} className="w-full text-xs text-gray-600 resize-none bg-transparent print:text-black p-0 leading-relaxed" rows={4}/>
                                  </div>
                             </div>
                        </div>
                        <div>
                             <div className="flex items-center gap-2 mb-2 pb-1"><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Klient / Odberateľ</h3></div>
                             <div className="pl-4 border-l-2 border-gray-100 print:border-black">
                                 <textarea value={data.client.name} onChange={e => setData({...data,client:{...data.client, name:e.target.value}})} className="font-bold text-sm w-full bg-transparent mb-1 text-gray-900 print:text-black p-0 uppercase resize-none h-auto" placeholder="KLIENT" rows={1} />
                                 <textarea value={data.client.details} onChange={e => setData({...data, client:{...data.client, details:e.target.value}})} className="w-full text-xs text-gray-600 resize-none bg-transparent print:text-black p-0 leading-relaxed" rows={4} placeholder="Adresa..."/>
                             </div>
                        </div>
                    </div>

                    {/* SPEC TABLE - REDESIGNED */}
                    <div className="mb-8 border-2 border-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-gray-800 text-white p-2 flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2">
                                <div className="bg-green-500 text-white p-1 rounded"><Cpu size={14}/></div>
                                <h3 className="font-bold text-sm uppercase tracking-wide">Technická Špecifikácia Riadiaceho Systému</h3>
                             </div>
                             <div className="font-bold text-sm text-green-400 uppercase tracking-wider">{csParams.systemName}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 text-xs divide-x divide-gray-200">
                            {/* COLUMN 1: DRIVE & CONTROL */}
                            <div className="bg-gray-50/50">
                                <div className="bg-gray-100 p-1.5 font-bold text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 text-center">Pohon a Riadenie</div>
                                <div className="divide-y divide-gray-200">
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Typ Pohonu</span>
                                        <span className="text-right font-bold">{csParams.driveType}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Výkon / Prúd</span>
                                        <span className="text-right font-bold">{csParams.powerKw} kW / {csParams.currentA} A</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Brzda</span>
                                        <span className="text-right font-bold">{csParams.brakePower}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Riadenie</span>
                                        <span className="text-right font-bold">{csParams.controllerType}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Núdzový Dojazd</span>
                                        <span className="text-right font-bold text-blue-600">{csParams.emergencyOp}</span>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 2: SHAFT & CABIN */}
                            <div className="bg-white">
                                <div className="bg-gray-100 p-1.5 font-bold text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 text-center">Šachta a Kabína</div>
                                <div className="divide-y divide-gray-200">
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Počet Staníc</span>
                                        <span className="text-right font-bold">{csParams.stops}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Zdvih</span>
                                        <span className="text-right font-bold">{(csParams.travel/1000).toFixed(2)} m</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Hlava / Priehlbeň</span>
                                        <span className="text-right font-bold">{csParams.headroom} / {csParams.pit} mm</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Pozicionovanie</span>
                                        <span className="text-right font-bold">{csParams.positioning}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Norma</span>
                                        <span className="text-right font-bold text-blue-600">{csParams.standards}</span>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 3: PERIPHERALS & CABINET */}
                            <div className="bg-gray-50/50">
                                <div className="bg-gray-100 p-1.5 font-bold text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 text-center">Periférie a Rozvádzač</div>
                                <div className="divide-y divide-gray-200">
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Dvere</span>
                                        <span className="text-right font-bold">{csParams.doorType}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Displeje</span>
                                        <span className="text-right font-bold text-[10px] leading-tight">K: {csParams.cabinDisplay} / S: {csParams.stationDisplay}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Rozvádzač</span>
                                        <span className="text-right font-bold text-[10px] leading-tight">{csParams.cabinetType}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Rozmery</span>
                                        <span className="text-right font-bold">{csParams.dimensions}</span>
                                    </div>
                                    <div className="grid grid-cols-2 p-2">
                                        <span className="font-bold text-gray-500">Krytie</span>
                                        <span className="text-right font-bold">{csParams.ipRating}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CATEGORIES */}
                    <div className="space-y-4">
                        {data.categories.map(cat => (
                            <CategoryTable 
                                key={cat.id}
                                category={cat}
                                currency={data.currency}
                                globalMargin={data.globalMargin}
                                onUpdateCategory={(id, f, v) => setData(prev => ({...prev, categories: prev.categories.map(c => c.id === id ? {...c, [f]: v} : c)}))}
                                onDeleteCategory={(id) => setData(prev => ({...prev, categories: prev.categories.filter(c => c.id !== id)}))}
                                onAddItem={(id) => handleAddItem(id)}
                                onUpdateItem={(cid, iid, f, v) => setData(prev => ({...prev, categories: prev.categories.map(c => c.id === cid ? {...c, items: c.items.map(i => i.id === iid ? {...i, [f]: v} : i)} : c)}))}
                                onDeleteItem={(cid, iid) => setData(prev => ({...prev, categories: prev.categories.map(c => c.id === cid ? {...c, items: c.items.filter(i => i.id !== iid)} : c)}))}
                                onAiSuggest={() => {}}
                                onOpenCatalog={handleOpenCatalog}
                                isAiLoading={false}
                                draggable={true}
                            />
                        ))}
                    </div>

                    {/* ECONOMICS (NO PRINT) */}
                    <div className="no-print mt-8 mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-xl print:hidden">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Ekonomika projektu</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Material */}
                            <div className="flex flex-col gap-3 p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between border-b border-blue-100 pb-2 mb-1">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Materiál (Komponenty)</span>
                                    <Cpu size={16} className="text-blue-400"/>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Nákup:</span>
                                        <span className="font-mono font-bold text-gray-700">{totals.materialCost.toFixed(2)} €</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-blue-100">
                                        <span className="text-xs font-bold text-gray-400 w-12">Marža</span>
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                value={data.globalMargin} 
                                                onChange={e => setData({...data, globalMargin: +e.target.value})}
                                                className="w-full text-right font-bold text-blue-600 bg-transparent outline-none pr-4"
                                            />
                                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">%</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                                        <span className="text-xs font-bold text-blue-800">Zisk:</span>
                                        <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-sm">+{totals.materialProfit.toFixed(2)} €</span>
                                    </div>
                                </div>
                            </div>

                            {/* Work */}
                            <div className="flex flex-col gap-3 p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between border-b border-green-100 pb-2 mb-1">
                                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Práca / Služby</span>
                                    <Users size={16} className="text-green-400"/>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Nákup:</span>
                                        <span className="font-mono font-bold text-gray-700">{totals.workCost.toFixed(2)} €</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-green-100">
                                        <span className="text-xs font-bold text-gray-400 w-12">Marža</span>
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                value={data.workMargin ?? 0} 
                                                onChange={e => setData({...data, workMargin: +e.target.value})}
                                                className="w-full text-right font-bold text-green-600 bg-transparent outline-none pr-4"
                                            />
                                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">%</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-green-100">
                                        <span className="text-xs font-bold text-green-800">Zisk:</span>
                                        <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-sm">+{totals.workProfit.toFixed(2)} €</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* VAT SETTINGS */}
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-1.5 rounded text-purple-600">
                                    <Zap size={16} />
                                </div>
                                <label className="text-sm font-bold text-gray-700 uppercase">Sadzba DPH</label>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-24">
                                    <input 
                                        type="number" 
                                        value={data.vatRate ?? 23} 
                                        onChange={e => setData({...data, vatRate: +e.target.value})}
                                        className="w-full text-center font-bold text-gray-800 bg-white border border-gray-300 rounded-lg py-1.5 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">%</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold">Hodnota DPH</div>
                                    <div className="text-sm text-purple-600 font-bold font-mono">
                                        {vat.toLocaleString('sk-SK', {minimumFractionDigits: 2})} €
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TOTALS */}
                    <div className="mt-12 pt-4 border-t-2 border-gray-800 flex justify-end">
                        <div className="w-64">
                             <div className="flex justify-between text-2xl font-bold text-gray-900 mb-1">
                                <span>Cena Celkom:</span>
                                <span>{totals.total.toLocaleString('sk-SK', {minimumFractionDigits: 2})} €</span>
                            </div>
                            <div className="text-right text-xs text-gray-500 mb-2">bez DPH</div>
                            <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
                                <span>DPH (23%):</span>
                                <span>{vat.toLocaleString('sk-SK', {minimumFractionDigits: 2})} €</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-black mt-2 bg-gray-100 p-2 rounded">
                                <span>Spolu s DPH:</span>
                                <span>{(totals.total + vat).toLocaleString('sk-SK', {minimumFractionDigits: 2})} €</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* MODALS */}
            <ProductDatabaseModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                products={products} // PASSING ALL PRODUCTS (Master Database)
                onSelectProduct={handleSelectProduct}
                onAddProduct={() => {}} // Read-only in this view for now
                onDeleteProduct={() => {}} 
            />
        </div>
    );
};
