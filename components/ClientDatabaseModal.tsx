
import React, { useState } from 'react';
import { Client } from '../types';
import { X, Plus, Search, Trash2, Save, User, Building2, MapPin, Mail, Phone } from 'lucide-react';

interface ClientDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
  clients: Client[];
  onAddClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export const ClientDatabaseModal: React.FC<ClientDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectClient,
  clients,
  onAddClient,
  onDeleteClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // New Client Form State
  const [newName, setNewName] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  if (!isOpen) return null;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveNew = () => {
    if (!newName) return;
    onAddClient({
      id: crypto.randomUUID(),
      name: newName,
      details: newDetails,
      email: newEmail,
      phone: newPhone
    });
    setIsAdding(false);
    setNewName('');
    setNewDetails('');
    setNewEmail('');
    setNewPhone('');
    setSearchTerm(''); // Clear search to show new entry
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <User className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Adresár Klientov</h2>
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
              placeholder="Hľadať firmu alebo meno..."
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
              <h3 className="font-bold text-blue-800 mb-3 text-sm flex items-center gap-2"><Plus size={16}/> Nový Klient</h3>
              <div className="space-y-3 mb-3">
                <input 
                  className="w-full p-2 border rounded text-sm font-bold" 
                  placeholder="Názov firmy / Meno"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center bg-white border rounded">
                        <Mail size={16} className="ml-2 text-gray-400"/>
                        <input 
                            className="w-full p-2 text-sm outline-none" 
                            placeholder="Email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center bg-white border rounded">
                        <Phone size={16} className="ml-2 text-gray-400"/>
                        <input 
                            className="w-full p-2 text-sm outline-none" 
                            placeholder="Telefón"
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                        />
                    </div>
                </div>
                <textarea 
                  className="w-full p-2 border rounded text-sm h-24 resize-none" 
                  placeholder="Adresa, IČO, DIČ, Kontakt..."
                  value={newDetails}
                  onChange={e => setNewDetails(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded">Zrušiť</button>
                <button onClick={handleSaveNew} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                  <Save size={14}/> Uložiť Klienta
                </button>
              </div>
            </div>
          ) : (
             <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex justify-center items-center gap-2 mb-4 font-medium"
            >
              <Plus size={18} /> Pridať nového klienta
            </button>
          )}

          {/* List */}
          <div className="space-y-2">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-400 italic">Žiadni klienti v adresári.</div>
            ) : (
              filteredClients.map(client => (
                <div key={client.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 shadow-sm flex justify-between items-center group">
                  <div className="flex-1 mr-4">
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400"/>
                        {client.name}
                    </div>
                    {(client.email || client.phone) && (
                        <div className="flex gap-4 text-xs text-blue-600 mt-1">
                            {client.email && <span className="flex items-center gap-1"><Mail size={12}/> {client.email}</span>}
                            {client.phone && <span className="flex items-center gap-1"><Phone size={12}/> {client.phone}</span>}
                        </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap flex gap-1">
                         <MapPin size={12} className="mt-0.5 shrink-0"/>
                         {client.details.substring(0, 60)}{client.details.length > 60 ? '...' : ''}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                     <button 
                      onClick={() => onDeleteClient(client.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="Vymazať"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => onSelectClient(client)}
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
