import React, { useState, useEffect } from 'react';
import { Product, ProductAttributeOption, LiftLayoutData, ProductAttribute } from '../types';
import { X, Plus, Search, Trash2, Save, Package, Settings, ChevronRight, ArrowLeft, Check, Sparkles, AlertCircle, Edit, Factory, Truck } from 'lucide-react';

interface ProductDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  layout?: LiftLayoutData; // Passed layout for smart selection
}

const CATEGORIES = ['Pohon', 'Kabína a rám', 'Dvere', 'Vodítka a kotvenie', 'Obmedzovač', 'Elektro', 'Montáž', 'Ostatné šachta', 'Ostatné'];

export const ProductDatabaseModal: React.FC<ProductDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  products,
  onAddProduct,
  onDeleteProduct,
  layout
}) => {
  const [activeCategory, setActiveCategory] = useState('Pohon');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Configuration State for Selection
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductAttributeOption>>({});

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('ks');
  const [newPrice, setNewPrice] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newAttributes, setNewAttributes] = useState<ProductAttribute[]>([]);
  
  // Temporary State for Adding Attribute in Form
  const [attrName, setAttrName] = useState('');
  const [attrOptions, setAttrOptions] = useState<ProductAttributeOption[]>([]);
  const [optLabel, setOptLabel] = useState('');
  const [optPrice, setOptPrice] = useState('');
  const [optValue, setOptValue] = useState('');

  // Reset config when modal opens/closes
  useEffect(() => {
      if(!isOpen) {
          setConfiguringProduct(null);
          setSelectedOptions({});
          resetAddForm();
      }
  }, [isOpen]);

  const resetAddForm = () => {
      setIsAdding(false);
      setNewName('');
      setNewUnit('ks');
      setNewPrice('');
      setNewManufacturer('');
      setNewSupplier('');
      setNewAttributes([]);
      setAttrName('');
      setAttrOptions([]);
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => 
    p.category === activeCategory && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveNew = () => {
    if (!newName || !newPrice) return;
    onAddProduct({
      id: crypto.randomUUID(),
      category: activeCategory,
      name: newName,
      unit: newUnit,
      price: parseFloat(newPrice) || 0,
      manufacturer: newManufacturer,
      supplier: newSupplier,
      attributes: newAttributes.length > 0 ? newAttributes : undefined
    });
    resetAddForm();
  };

  // -- Attribute Management in Add Form --
  const addOptionToAttr = () => {
      if (!optLabel) return;
      const newOpt: ProductAttributeOption = {
          label: optLabel,
          priceDelta: parseFloat(optPrice) || 0,
          value: optValue || optLabel
      };
      setAttrOptions([...attrOptions, newOpt]);
      setOptLabel('');
      setOptPrice('');
      setOptValue('');
  };

  const saveAttribute = () => {
      if (!attrName || attrOptions.length === 0) return;
      const newAttr: ProductAttribute = {
          name: attrName,
          options: attrOptions
      };
      setNewAttributes([...newAttributes, newAttr]);
      setAttrName('');
      setAttrOptions([]);
  };

  const deleteAttribute = (idx: number) => {
      setNewAttributes(newAttributes.filter((_, i) => i !== idx));
  };

  const deleteOption = (idx: number) => {
      setAttrOptions(attrOptions.filter((_, i) => i !== idx));
  };

  // -- Smart Selection Logic --

  const handleInitSelect = (product: Product) => {
      if (product.attributes && product.attributes.length > 0) {
          // Initialize defaults and Check Layout Matches
          const defaults: Record<string, ProductAttributeOption> = {};
          
          product.attributes.forEach(attr => {
              // 1. Try to find a match in layout data
              let matchedOption: ProductAttributeOption | undefined;
              
              if (layout) {
                  // MAPPING LOGIC: Attribute Name -> Layout Field
                  if (attr.name.includes("Šírka")) {
                      // Look for door width if category is doors
                      const widthVal = layout.doorWidth;
                      matchedOption = attr.options.find(o => String(o.value) === String(widthVal));
                  } 
                  else if (attr.name.includes("Povrch")) {
                      const finishVal = layout.doorFinish;
                      matchedOption = attr.options.find(o => String(o.value) === String(finishVal));
                  }
                  else if (attr.name.includes("Odolnosť")) {
                      const fireVal = layout.doorFireRating;
                      const searchVal = fireVal === 'None' ? 'None' : fireVal;
                      matchedOption = attr.options.find(o => String(o.value) === String(searchVal));
                  }
                  // ADDED: Logic for Machines/Rails if needed in future
                  else if (attr.name.includes("Výkon") || attr.name.includes("Nosnosť")) {
                       const loadVal = layout.ratedLoad;
                       matchedOption = attr.options.find(o => String(o.value) === String(loadVal));
                  }
              }

              // 2. If match found, use it. Else use first option.
              if (matchedOption) {
                  defaults[attr.name] = matchedOption;
              } else if (attr.options.length > 0) {
                  defaults[attr.name] = attr.options[0];
              }
          });

          setSelectedOptions(defaults);
          setConfiguringProduct(product);
      } else {
          // No attributes, select immediately
          onSelectProduct(product);
      }
  };

  const handleConfirmConfig = () => {
      if (!configuringProduct) return;
      
      let finalPrice = configuringProduct.price;
      
      // Calculate totals
      Object.entries(selectedOptions).forEach(([attrName, option]) => {
          finalPrice += (option as ProductAttributeOption).priceDelta;
      });

      // Construct name with options
      const optionsString = Object.values(selectedOptions).map((o: ProductAttributeOption) => o.label).join(', ');
      const finalName = optionsString ? `${configuringProduct.name} (${optionsString})` : configuringProduct.name;

      const finalProduct: Product = {
          ...configuringProduct,
          name: finalName,
          price: finalPrice
      };

      onSelectProduct(finalProduct);
      setConfiguringProduct(null);
  };

  const calculateCurrentPrice = () => {
      if (!configuringProduct) return 0;
      let price = configuringProduct.price;
      Object.values(selectedOptions).forEach((opt: ProductAttributeOption) => price += opt.priceDelta);
      return price;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Package className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
                {configuringProduct ? 'Konfigurácia Produktu' : 'Katalóg Produktov (Master Data)'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20}/>
          </button>
        </div>

        {/* --- VIEW 1: CONFIGURATOR --- */}
        {configuringProduct ? (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col">
                
                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-blue-900 mb-1">{configuringProduct.name}</h3>
                            <div className="text-sm text-gray-500">Základná cena: {configuringProduct.price.toFixed(2)} €</div>
                        </div>
                        {layout && <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200 flex items-center gap-1">
                            <Sparkles size={12}/> Auto-výber podľa konfigurácie
                        </div>}
                    </div>
                    
                    <div className="space-y-4">
                        {configuringProduct.attributes?.map(attr => (
                            <div key={attr.name}>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{attr.name}</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedOptions[attr.name]?.label || ''}
                                    onChange={(e) => {
                                        const selected = attr.options.find(o => o.label === e.target.value);
                                        if (selected) {
                                            setSelectedOptions(prev => ({...prev, [attr.name]: selected}));
                                        }
                                    }}
                                >
                                    {attr.options.map(opt => (
                                        <option key={opt.label} value={opt.label}>
                                            {opt.label} {opt.priceDelta > 0 ? `(+${opt.priceDelta} €)` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center sticky bottom-0 shadow-lg">
                    <div>
                        <div className="text-xs text-gray-500 uppercase font-bold">Výsledná Cena</div>
                        <div className="text-2xl font-bold text-blue-600">{calculateCurrentPrice().toFixed(2)} €</div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setConfiguringProduct(null)} 
                            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                            <ArrowLeft size={18}/> Späť
                        </button>
                        <button 
                            onClick={handleConfirmConfig} 
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow flex items-center gap-2"
                        >
                            <Check size={18}/> Potvrdiť a Vložiť
                        </button>
                    </div>
                </div>

            </div>
        ) : (
        /* --- VIEW 2: PRODUCT LIST (Standard) --- */
        <>
        <div className="p-4 border-b space-y-4">
          {!isAdding && (
          <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Hľadať produkt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          
          {isAdding ? (
            <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-md animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold text-blue-800 mb-6 text-lg border-b pb-2">Nový Master Produkt: {activeCategory}</h3>
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Názov Produktu</label>
                    <input 
                    className="w-full p-2 border rounded text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Napr. Trakčný stroj Gearless"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Jednotka</label>
                    <select 
                    className="w-full p-2 border rounded text-sm bg-white"
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    >
                    <option value="ks">ks</option>
                    <option value="m">m</option>
                    <option value="kpl">kpl</option>
                    <option value="hod">hod</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Základná Cena</label>
                    <input 
                    type="number" 
                    className="w-full p-2 border rounded text-sm font-bold text-right" 
                    placeholder="0.00"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    />
                </div>
              </div>

              {/* NEW: Manufacturer & Supplier in Quick Add */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-3 rounded border border-gray-200">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Factory size={12}/> Výrobca</label>
                      <input 
                          className="w-full p-2 border rounded text-sm bg-white"
                          placeholder="napr. Fermator"
                          value={newManufacturer}
                          onChange={e => setNewManufacturer(e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Truck size={12}/> Dodávateľ</label>
                      <input 
                          className="w-full p-2 border rounded text-sm bg-white"
                          placeholder="napr. Sklad / Výťahy s.r.o."
                          value={newSupplier}
                          onChange={e => setNewSupplier(e.target.value)}
                      />
                  </div>
              </div>

              {/* Attributes Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Settings size={16}/> Konfiguračné Atribúty (Voliteľné)</h4>
                      <div className="text-xs text-gray-500">Pridajte možnosti ako Výkon, Rozmer, Farba...</div>
                  </div>
                  
                  {/* List of Added Attributes */}
                  <div className="space-y-4 mb-4">
                      {newAttributes.map((attr, idx) => (
                          <div key={idx} className="bg-white border rounded p-3 relative">
                              <button onClick={() => deleteAttribute(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                              <div className="font-bold text-sm mb-2">{attr.name}</div>
                              <div className="flex flex-wrap gap-2">
                                  {attr.options.map((opt, oIdx) => (
                                      <span key={oIdx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                          {opt.label} {opt.priceDelta > 0 ? `(+${opt.priceDelta}€)` : ''}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Add New Attribute Form */}
                  <div className="bg-white border border-dashed border-gray-300 rounded p-3">
                      <div className="mb-2">
                          <input 
                            className="w-full p-2 border rounded text-sm mb-2" 
                            placeholder="Názov atribútu (napr. Výkon)" 
                            value={attrName} 
                            onChange={e => setAttrName(e.target.value)}
                          />
                      </div>
                      
                      {/* Add Options for this Attribute */}
                      <div className="flex gap-2 mb-2 items-center bg-gray-50 p-2 rounded">
                          <input className="flex-1 p-1 border rounded text-xs" placeholder="Možnosť (napr. 5 kW)" value={optLabel} onChange={e => setOptLabel(e.target.value)} />
                          <input className="w-20 p-1 border rounded text-xs text-right" type="number" placeholder="+ Cena" value={optPrice} onChange={e => setOptPrice(e.target.value)} />
                          <input className="w-20 p-1 border rounded text-xs" placeholder="Value (Auto)" value={optValue} onChange={e => setOptValue(e.target.value)} />
                          <button onClick={addOptionToAttr} className="p-1 bg-green-500 text-white rounded hover:bg-green-600"><Plus size={16}/></button>
                      </div>

                      {/* Pending Options List */}
                      {attrOptions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-100 rounded">
                              {attrOptions.map((opt, i) => (
                                  <span key={i} className="text-xs bg-white px-2 py-1 rounded border shadow-sm flex items-center gap-1">
                                      {opt.label} (+{opt.priceDelta}€)
                                      <button onClick={() => deleteOption(i)} className="text-red-500 hover:bg-red-50 rounded-full"><X size={12}/></button>
                                  </span>
                              ))}
                          </div>
                      )}

                      <button 
                        onClick={saveAttribute} 
                        disabled={!attrName || attrOptions.length === 0}
                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded border border-gray-300 disabled:opacity-50"
                      >
                          Uložiť Atribút
                      </button>
                  </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button onClick={resetAddForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded font-medium">Zrušiť</button>
                <button onClick={handleSaveNew} className="px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 font-bold shadow-sm">
                  <Save size={16}/> Uložiť Produkt do Databázy
                </button>
              </div>
            </div>
          ) : (
             <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex justify-center items-center gap-2 mb-4 font-bold text-lg"
            >
              <Plus size={24} /> Pridať nový produkt do {activeCategory}
            </button>
          )}

          <div className="space-y-2">
            {filteredProducts.length === 0 && !isAdding ? (
              <div className="text-center py-12 text-gray-400 italic">Žiadne produkty v tejto kategórii.<br/><span className="text-xs">Kliknite na tlačidlo vyššie pre pridanie.</span></div>
            ) : (
              !isAdding && filteredProducts.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex justify-between items-center group">
                  <div>
                    <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        {product.name}
                        {product.attributes && product.attributes.length > 0 && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 font-bold">
                                <Settings size={10}/> {product.attributes.length} ATTR
                            </span>
                        )}
                    </div>
                    {/* Added Manufacturer/Supplier Info in List */}
                    {(product.manufacturer || product.supplier) && (
                        <div className="text-[10px] text-gray-400 flex gap-2 mt-0.5">
                            {product.manufacturer && <span><Factory size={10} className="inline mr-0.5"/> {product.manufacturer}</span>}
                            {product.supplier && <span><Truck size={10} className="inline mr-0.5"/> {product.supplier}</span>}
                        </div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">Základ: <span className="font-bold text-blue-600">{product.price.toFixed(2)} €</span> / {product.unit}</div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                      onClick={() => onDeleteProduct(product.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="Vymazať z databázy"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleInitSelect(product)}
                      className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 text-sm font-bold rounded transition border border-gray-200 flex items-center gap-2"
                    >
                      {product.attributes && product.attributes.length > 0 ? (
                          <>Konfigurovať <ChevronRight size={16}/></>
                      ) : (
                          'Vybrať'
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </>
        )}

      </div>
    </div>
  );
};