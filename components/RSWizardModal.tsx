import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Activity, Save, Bookmark } from 'lucide-react';
import { QuoteItem, Product } from '../types';

interface RSWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (items: {categoryName: string, item: QuoteItem}[]) => void;
    csParams: any;
    products: Product[];
}

// --- HELPER: Generate ID ---
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try { return crypto.randomUUID(); } catch (e) {}
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

interface WizardTemplate {
    id: string;
    name: string;
    options: Record<string, boolean>;
    selectedProducts: Record<string, string>;
}

export const RSWizardModal: React.FC<RSWizardModalProps> = ({ isOpen, onClose, onApply, csParams, products }) => {
    const [step, setStep] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({
        includeInverter: true,
        includeDisplays: true,
        includeCables: true,
        includeInspection: true,
        includeSensors: true,
    });
    
    // Maps category key to product ID
    const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});
    
    // Templates
    const [templates, setTemplates] = useState<WizardTemplate[]>([]);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('smartquote_rs_templates');
        if (stored) {
            try { setTemplates(JSON.parse(stored)); } catch (e) { console.error(e); }
        }
    }, []);

    if (!isOpen) return null;

    const toggleOption = (key: string) => {
        setSelectedOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleProductSelect = (key: string, productId: string) => {
        setSelectedProducts(prev => ({ ...prev, [key]: productId }));
    };

    const saveTemplate = () => {
        if (!newTemplateName) return;
        const newTemplate: WizardTemplate = {
            id: generateId(),
            name: newTemplateName,
            options: selectedOptions,
            selectedProducts
        };
        const updated = [...templates, newTemplate];
        setTemplates(updated);
        localStorage.setItem('smartquote_rs_templates', JSON.stringify(updated));
        setShowSaveTemplate(false);
        setNewTemplateName('');
    };

    const loadTemplate = (t: WizardTemplate) => {
        setSelectedOptions(t.options);
        setSelectedProducts(t.selectedProducts);
    };

    const deleteTemplate = (id: string) => {
        if (!window.confirm('Vymazať šablónu?')) return;
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        localStorage.setItem('smartquote_rs_templates', JSON.stringify(updated));
    };

    const getProductDetails = (key: string, defaultPrice: number, defaultName: string) => {
        const prodId = selectedProducts[key];
        if (prodId) {
            const p = products.find(x => x.id === prodId);
            if (p) return { name: p.name, price: p.price, unit: p.unit };
        }
        return { name: defaultName, price: defaultPrice, unit: 'ks' };
    };

    const handleFinish = () => {
        const generatedItems: {categoryName: string, item: QuoteItem}[] = [];

        // 1. Rozvádzač
        const base = getProductDetails('base', 1500, `Rozvádzač ${csParams.systemName} (${csParams.driveType}, ${csParams.powerKw}kW)`);
        generatedItems.push({
            categoryName: 'Rozvádzač',
            item: {
                id: generateId(), description: base.name, unit: base.unit, quantity: 1,
                unitPrice: base.price, purchasePrice: base.price * 0.8, vatRate: 23
            }
        });

        // 2. Menič
        if (selectedOptions.includeInverter) {
            const inv = getProductDetails('inverter', 850, `Frekvenčný menič ${csParams.powerKw}kW (${csParams.currentA}A)`);
            generatedItems.push({
                categoryName: 'Menič a filter',
                item: {
                    id: generateId(), description: inv.name, unit: inv.unit, quantity: 1,
                    unitPrice: inv.price, purchasePrice: inv.price * 0.8, vatRate: 23
                }
            });
        }

        // 3. Displeje
        if (selectedOptions.includeDisplays) {
            const lop = getProductDetails('lop', 120, `Privolávač do stanice (Tlačidlo + Displej)`);
            generatedItems.push({
                categoryName: 'Displeje a privolávače',
                item: {
                    id: generateId(), description: lop.name, unit: lop.unit, quantity: csParams.stops,
                    unitPrice: lop.price, purchasePrice: lop.price * 0.8, vatRate: 23
                }
            });
            const cop = getProductDetails('cop', 450, `Kabínový panel (COP) - ${csParams.stops} staníc`);
            generatedItems.push({
                categoryName: 'Displeje a privolávače',
                item: {
                    id: generateId(), description: cop.name, unit: cop.unit, quantity: 1,
                    unitPrice: cop.price, purchasePrice: cop.price * 0.8, vatRate: 23
                }
            });
        }

        // 4. Kabeláž
        if (selectedOptions.includeCables) {
            const cableLength = (csParams.travel / 1000) + 10;
            const flat = getProductDetails('flatCable', 8.5, `Vlečný kábel plochý (Zdvih ${csParams.travel}mm)`);
            generatedItems.push({
                categoryName: 'Kabeláž',
                item: {
                    id: generateId(), description: flat.name, unit: 'm', quantity: Math.ceil(cableLength),
                    unitPrice: flat.price, purchasePrice: flat.price * 0.8, vatRate: 23
                }
            });
            const shaft = getProductDetails('shaftCable', 250, `Šachtová kabeláž (zväzok)`);
            generatedItems.push({
                categoryName: 'Kabeláž',
                item: {
                    id: generateId(), description: shaft.name, unit: 'kpl', quantity: 1,
                    unitPrice: shaft.price, purchasePrice: shaft.price * 0.8, vatRate: 23
                }
            });
        }

        // 5. Inšpekcia
        if (selectedOptions.includeInspection) {
            const insp = getProductDetails('inspection', 180, `Revízna jazda na kabínu (Inšpekčná krabica)`);
            generatedItems.push({
                categoryName: 'Inšpekcia a revízia',
                item: {
                    id: generateId(), description: insp.name, unit: insp.unit, quantity: 1,
                    unitPrice: insp.price, purchasePrice: insp.price * 0.8, vatRate: 23
                }
            });
        }

        // 6. Snímače
        if (selectedOptions.includeSensors) {
            const sens = getProductDetails('sensors', 320, `Pozicionovanie: ${csParams.positioning} (Snímače + magnety/páska)`);
            generatedItems.push({
                categoryName: 'Snímače a spínače',
                item: {
                    id: generateId(), description: sens.name, unit: sens.unit, quantity: 1,
                    unitPrice: sens.price, purchasePrice: sens.price * 0.8, vatRate: 23
                }
            });
        }

        onApply(generatedItems);
        onClose();
    };

    const renderProductSelect = (key: string, category: string, label: string) => {
        const catProducts = products.filter(p => p.category === category);
        return (
            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{label}</label>
                <select 
                    value={selectedProducts[key] || ''} 
                    onChange={e => handleProductSelect(key, e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                >
                    <option value="">-- Všeobecný odhad (bez konkrétneho produktu) --</option>
                    {catProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.price} €)</option>
                    ))}
                </select>
                {catProducts.length === 0 && (
                    <div className="text-xs text-orange-500 mt-1">V katalógu nemáte žiadne produkty pre kategóriu "{category}".</div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-orange-50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <Activity className="text-orange-600" />
                        <h2 className="text-xl font-bold text-gray-800">Sprievodca RS (Krok {step}/2)</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-orange-200 rounded-full text-gray-500">
                        <X size={20}/>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* TEMPLATES SECTION */}
                    {step === 1 && (
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2"><Bookmark size={16}/> Uložené Šablóny</h3>
                                <button onClick={() => setShowSaveTemplate(!showSaveTemplate)} className="text-sm text-orange-600 font-bold hover:underline">
                                    + Uložiť aktuálne ako šablónu
                                </button>
                            </div>
                            
                            {showSaveTemplate && (
                                <div className="flex gap-2 mb-4">
                                    <input type="text" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Názov šablóny (napr. Yaskawa 630kg)" className="flex-1 border p-2 rounded text-sm"/>
                                    <button onClick={saveTemplate} className="bg-orange-600 text-white px-4 rounded text-sm font-bold">Uložiť</button>
                                </div>
                            )}

                            {templates.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {templates.map(t => (
                                        <div key={t.id} className="flex items-center bg-white border rounded shadow-sm overflow-hidden">
                                            <button onClick={() => loadTemplate(t)} className="px-3 py-1.5 text-sm hover:bg-orange-50 font-medium">
                                                {t.name}
                                            </button>
                                            <button onClick={() => deleteTemplate(t.id)} className="px-2 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 border-l">
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic">Zatiaľ nemáte uložené žiadne šablóny.</div>
                            )}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-800 text-sm">
                                Vyberte, ktoré moduly chcete naceniť. V ďalšom kroku im priradíte konkrétne produkty z katalógu.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50 cursor-not-allowed opacity-80">
                                    <input type="checkbox" checked={true} disabled className="w-5 h-5 mt-0.5 text-orange-600" />
                                    <div>
                                        <div className="font-bold">Základný Rozvádzač (Povinné)</div>
                                        <div className="text-xs text-gray-500 mt-1">Hlavná doska, stýkače, istenie</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-orange-50 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selectedOptions.includeInverter} onChange={() => toggleOption('includeInverter')} className="w-5 h-5 mt-0.5 text-orange-600" />
                                    <div>
                                        <div className="font-bold">Frekvenčný menič a filter</div>
                                        <div className="text-xs text-gray-500 mt-1">Menič prispôsobený na {csParams.powerKw}kW</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-orange-50 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selectedOptions.includeDisplays} onChange={() => toggleOption('includeDisplays')} className="w-5 h-5 mt-0.5 text-orange-600" />
                                    <div>
                                        <div className="font-bold">Displeje a privolávače</div>
                                        <div className="text-xs text-gray-500 mt-1">Tlačidlá do {csParams.stops} staníc a COP</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-orange-50 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selectedOptions.includeCables} onChange={() => toggleOption('includeCables')} className="w-5 h-5 mt-0.5 text-orange-600" />
                                    <div>
                                        <div className="font-bold">Kabeláž</div>
                                        <div className="text-xs text-gray-500 mt-1">Vlečné káble ({csParams.travel}mm) a šachtový zväzok</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-orange-50 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selectedOptions.includeInspection} onChange={() => toggleOption('includeInspection')} className="w-5 h-5 mt-0.5 text-orange-600" />
                                    <div>
                                        <div className="font-bold">Inšpekcia (Revízna jazda)</div>
                                        <div className="text-xs text-gray-500 mt-1">Krabica na strechu kabíny</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-orange-50 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selectedOptions.includeSensors} onChange={() => toggleOption('includeSensors')} className="w-5 h-5 mt-0.5 text-orange-600" />
                                    <div>
                                        <div className="font-bold">Pozicionovanie</div>
                                        <div className="text-xs text-gray-500 mt-1">Snímače, magnety, pásky ({csParams.positioning})</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-orange-800 text-sm mb-4">
                                Priraďte konkrétne produkty z vášho katalógu. Ak nevyberiete nič, použije sa všeobecný odhad ceny.
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Základný Rozvádzač</h4>
                                    {renderProductSelect('base', 'Rozvádzač', 'Vyberte typ rozvádzača')}
                                </div>

                                {selectedOptions.includeInverter && (
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Frekvenčný Menič</h4>
                                        {renderProductSelect('inverter', 'Menič a filter', 'Vyberte menič')}
                                    </div>
                                )}

                                {selectedOptions.includeDisplays && (
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Displeje a Privolávače</h4>
                                        {renderProductSelect('lop', 'Displeje a privolávače', 'Privolávač do stanice (LOP)')}
                                        {renderProductSelect('cop', 'Displeje a privolávače', 'Kabínový panel (COP)')}
                                    </div>
                                )}

                                {selectedOptions.includeCables && (
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Kabeláž</h4>
                                        {renderProductSelect('flatCable', 'Kabeláž', 'Vlečný kábel (plochý)')}
                                        {renderProductSelect('shaftCable', 'Kabeláž', 'Šachtový zväzok')}
                                    </div>
                                )}

                                {selectedOptions.includeInspection && (
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Inšpekcia</h4>
                                        {renderProductSelect('inspection', 'Inšpekcia a revízia', 'Inšpekčná krabica')}
                                    </div>
                                )}

                                {selectedOptions.includeSensors && (
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Pozicionovanie</h4>
                                        {renderProductSelect('sensors', 'Snímače a spínače', 'Snímače a magnety')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-between">
                    {step === 1 ? (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded">Zrušiť</button>
                            <button onClick={() => setStep(2)} className="px-6 py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-900 shadow flex items-center gap-2">
                                Ďalej: Výber z katalógu <ArrowRight size={18}/>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded flex items-center gap-2">
                                <ArrowLeft size={18}/> Späť
                            </button>
                            <button onClick={handleFinish} className="px-6 py-2 bg-orange-600 text-white font-bold rounded hover:bg-orange-700 shadow flex items-center gap-2">
                                <Check size={18}/> Vložiť do ponuky
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
