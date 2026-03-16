import React, { useState } from 'react';
import { QuoteTemplate } from '../types';
import { X, Plus, Search, Trash2, Save, LayoutTemplate, Box, Layers } from 'lucide-react';

interface TemplateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'select' | 'save'; // select existing or save current as new
  templateType: 'lift' | 'shaft'; // context
  templates: QuoteTemplate[];
  onSelectTemplate: (template: QuoteTemplate) => void;
  onSaveTemplate: (name: string, type: 'lift' | 'shaft') => void;
  onDeleteTemplate: (id: string) => void;
}

export const TemplateDatabaseModal: React.FC<TemplateDatabaseModalProps> = ({
  isOpen,
  onClose,
  mode,
  templateType,
  templates,
  onSelectTemplate,
  onSaveTemplate,
  onDeleteTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');

  if (!isOpen) return null;

  // Filter templates by type (lift/shaft) and search term
  const filteredTemplates = templates.filter(t => 
    t.type === templateType && 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveClick = () => {
    if (newTemplateName.trim()) {
      onSaveTemplate(newTemplateName, templateType);
      setNewTemplateName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'save' ? 'Uložiť Šablónu' : 'Vybrať Šablónu'} ({templateType === 'lift' ? 'Výťah' : 'Šachta'})
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 bg-gray-50 flex-1 overflow-y-auto">
          
          {/* SAVE MODE */}
          {mode === 'save' && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Názov novej šablóny</label>
              <input 
                autoFocus
                type="text"
                className="w-full p-2 border border-gray-300 rounded mb-4"
                placeholder={`Napr. ${templateType === 'lift' ? 'Osobný výťah 630kg' : 'Oceľová konštrukcia Exteriér'}`}
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded">Zrušiť</button>
                <button 
                  onClick={handleSaveClick}
                  disabled={!newTemplateName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-bold flex items-center gap-2"
                >
                  <Save size={16}/> Uložiť Šablónu
                </button>
              </div>
            </div>
          )}

          {/* SELECT MODE */}
          {mode === 'select' && (
            <>
               <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Hľadať šablónu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 italic">
                      Žiadne uložené šablóny pre {templateType === 'lift' ? 'výťahy' : 'šachty'}.<br/>
                      <span className="text-xs">Najskôr si nakonfigurujte ponuku a uložte ju ako šablónu.</span>
                    </div>
                  ) : (
                    filteredTemplates.map(template => (
                      <div key={template.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 shadow-sm flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                            {template.type === 'lift' ? <Layers size={18} className="text-gray-400"/> : <Box size={18} className="text-gray-400"/>}
                            <div>
                                <div className="font-bold text-gray-800">{template.name}</div>
                                <div className="text-xs text-gray-400">{template.data.categories.length} kategórií</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onDeleteTemplate(template.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Vymazať šablónu"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => onSelectTemplate(template)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 text-sm font-bold rounded transition border border-gray-200"
                          >
                            Použiť
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
