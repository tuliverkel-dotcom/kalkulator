
import React, { useState } from 'react';
import { Supplier } from '../types';
import { X, Plus, Search, Trash2, Save, Building, MapPin, Upload, Image as ImageIcon } from 'lucide-react';

interface SupplierDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupplier: (supplier: Supplier) => void;
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

export const SupplierDatabaseModal: React.FC<SupplierDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectSupplier,
  suppliers,
  onAddSupplier,
  onDeleteSupplier
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // New Supplier Form State
  const [newName, setNewName] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newLogo, setNewLogo] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNew = () => {
    if (!newName) return;
    onAddSupplier({
      id: crypto.randomUUID(),
      name: newName,
      details: newDetails,
      logoUrl: newLogo
    });
    setIsAdding(false);
    setNewName('');
    setNewDetails('');
    setNewLogo(undefined);
    setSearchTerm(''); // Clear search to show new entry
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Building className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Adresár Dodávateľov</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20}/>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Hľadať dodávateľa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          
          {/* Add New Form */}
          {isAdding ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold text-blue-800 mb-3 text-sm flex items-center gap-2"><Plus size={16}/> Nový Dodávateľ</h3>
              <div className="space-y-3 mb-3">
                <input 
                  className="w-full p-2 border rounded text-sm font-bold" 
                  placeholder="Názov firmy"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
                <textarea 
                  className="w-full p-2 border rounded text-sm h-24 resize-none" 
                  placeholder="Adresa, IČO, DIČ, IBAN, Kontakt..."
                  value={newDetails}
                  onChange={e => setNewDetails(e.target.value)}
                />
                
                {/* Logo Upload in Form */}
                <div className="flex items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-600 transition">
                        <Upload size={16} /> Nahrať Logo
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {newLogo && (
                        <div className="h-10 w-24 border border-gray-200 bg-white flex items-center justify-center p-1 rounded">
                            <img src={newLogo} alt="Preview" className="max-h-full max-w-full object-contain" />
                        </div>
                    )}
                </div>

              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded">Zrušiť</button>
                <button onClick={handleSaveNew} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                  <Save size={14}/> Uložiť Dodávateľa
                </button>
              </div>
            </div>
          ) : (
             <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex justify-center items-center gap-2 mb-4 font-medium"
            >
              <Plus size={18} /> Pridať nového dodávateľa
            </button>
          )}

          {/* List */}
          <div className="space-y-2">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 italic">Žiadni dodávatelia v adresári.</div>
            ) : (
              filteredSuppliers.map(supplier => (
                <div key={supplier.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 shadow-sm flex justify-between items-center group">
                  <div className="flex-1 mr-4 flex items-start gap-3">
                    {/* Logo Preview in List */}
                    <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded flex items-center justify-center shrink-0">
                        {supplier.logoUrl ? (
                            <img src={supplier.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <ImageIcon size={20} className="text-gray-300" />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                            {supplier.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap flex gap-1">
                             <MapPin size={12} className="mt-0.5 shrink-0"/>
                             {supplier.details.substring(0, 60)}{supplier.details.length > 60 ? '...' : ''}
                        </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                     <button 
                      onClick={() => onDeleteSupplier(supplier.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="Vymazať"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => onSelectSupplier(supplier)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 text-sm font-bold rounded transition border border-gray-200"
                    >
                      Použiť
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
