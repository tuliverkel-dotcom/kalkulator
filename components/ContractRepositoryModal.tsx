
import React, { useState } from 'react';
import { ContractTemplate } from '../types';
import { X, Save, Trash2, FileText, Download } from 'lucide-react';

interface ContractRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ContractTemplate[];
  onSelectTemplate: (content: string) => void;
  onSaveCurrent: (name: string) => void;
  onDeleteTemplate: (id: string) => void;
}

export const ContractRepositoryModal: React.FC<ContractRepositoryModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
  onSaveCurrent,
  onDeleteTemplate
}) => {
  const [mode, setMode] = useState<'list' | 'save'>('list');
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
      if (newName.trim()) {
          onSaveCurrent(newName);
          setNewName('');
          setMode('list');
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Vzory Zmlúv</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20}/>
          </button>
        </div>

        <div className="p-4 bg-gray-50 flex-1 overflow-y-auto">
            {/* Toolbar */}
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setMode('list')}
                    className={`flex-1 py-2 text-sm font-medium rounded transition ${mode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                    Zoznam vzorov
                </button>
                <button 
                    onClick={() => setMode('save')}
                    className={`flex-1 py-2 text-sm font-medium rounded transition ${mode === 'save' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                    Uložiť aktuálny text
                </button>
            </div>

            {mode === 'save' && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Názov nového vzoru</label>
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Napr. Zmluva o dielo - Bytový dom"
                        className="w-full border border-gray-300 p-2 rounded mb-3"
                    />
                    <button 
                        onClick={handleSave}
                        disabled={!newName.trim()}
                        className="w-full py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                        Uložiť do knižnice
                    </button>
                </div>
            )}

            {mode === 'list' && (
                <div className="space-y-2">
                    {templates.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 italic">Žiadne uložené vzory zmlúv.</div>
                    ) : (
                        templates.map(t => (
                            <div key={t.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 shadow-sm flex justify-between items-center group">
                                <div className="font-bold text-gray-800">{t.name}</div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onDeleteTemplate(t.id)}
                                        className="p-2 text-gray-300 hover:text-red-600 rounded"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => onSelectTemplate(t.content)}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100 flex items-center gap-1"
                                    >
                                        <Download size={14}/> Načítať
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
