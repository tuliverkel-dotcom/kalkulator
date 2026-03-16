
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../types';
import { X, Settings, Save, Hash, Database, Download, Upload, AlertTriangle, Trash2, CheckCircle, FileText } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onFactoryReset: () => void;
  appVersion?: string;
  availableCategories?: string[]; // Added to list categories
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  onFactoryReset,
  appVersion,
  availableCategories = []
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'numbering' | 'texts' | 'data'>('numbering');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageUsage, setStorageUsage] = useState<{ used: number, percent: number }>({ used: 0, percent: 0 });

  useEffect(() => {
    if (isOpen && activeTab === 'data') {
        let total = 0;
        for (let x in localStorage) {
            if (localStorage.hasOwnProperty(x)) {
                total += ((localStorage[x].length + x.length) * 2);
            }
        }
        const usedKB = total / 1024;
        const limitKB = 5120; // Approx 5MB
        setStorageUsage({
            used: usedKB,
            percent: Math.min((usedKB / limitKB) * 100, 100)
        });
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleChange = (field: keyof AppSettings, value: string) => {
    const numValue = parseInt(value) || 1;
    setLocalSettings(prev => ({ ...prev, [field]: numValue }));
  };

  const handleTextChange = (cat: string, text: string) => {
      setLocalSettings(prev => ({
          ...prev,
          defaultCategoryTexts: {
              ...(prev.defaultCategoryTexts || {}),
              [cat]: text
          }
      }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if(window.confirm("POZOR: Táto akcia prepíše všetky aktuálne dáta v aplikácii dátami zo zálohy. Chcete pokračovať?")) {
            onImportData(file);
            onClose();
        }
    }
  };

  const handleResetClick = () => {
      if(window.confirm("KRITICKÉ VAROVANIE: Táto akcia vymaže KOMPLETNE celú databázu, nastavenia, klientov aj šablóny. Aplikácia bude v stave ako po prvej inštalácii. Naozaj pokračovať?")) {
          if(window.confirm("Ste si istý? Dáta nebudú obnoviteľné.")) {
              onFactoryReset();
              onClose();
          }
      }
  };

  const currentYear = new Date().getFullYear().toString().slice(-2);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Settings className="text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Nastavenia Aplikácie</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('numbering')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'numbering' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                <div className="flex items-center justify-center gap-2">
                    <Hash size={16}/> Číslovanie
                </div>
            </button>
            <button 
                onClick={() => setActiveTab('texts')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'texts' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                <div className="flex items-center justify-center gap-2">
                    <FileText size={16}/> Texty Kategórií
                </div>
            </button>
            <button 
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'data' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                <div className="flex items-center justify-center gap-2">
                    <Database size={16}/> Systém & Dáta
                </div>
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* TAB: NUMBERING */}
            {activeTab === 'numbering' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800 flex gap-2">
                        <AlertTriangle className="shrink-0" size={18}/>
                        <div>
                           Systém automaticky generuje čísla. Tu môžete nastaviť <strong>počiatočnú sekvenciu</strong> (napr. začať od 100), ak prechádzate z iného systému.
                        </div>
                    </div>

                    {/* CP Settings */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Štartovacie číslo pre Cenové Ponuky (CP)</label>
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 px-3 py-2 rounded text-gray-500 font-mono text-sm border border-gray-200">
                                CP_SK_<span className="text-black font-bold">XX</span>_{currentYear}_BA
                            </div>
                            <input 
                                type="number" 
                                min="1"
                                value={localSettings.nextCpSequence}
                                onChange={(e) => handleChange('nextCpSequence', e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 outline-none font-bold text-right"
                            />
                        </div>
                    </div>

                    {/* OBJ Settings */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Štartovacie číslo pre Objednávky (OBJ)</label>
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 px-3 py-2 rounded text-gray-500 font-mono text-sm border border-gray-200">
                                OBJ_SK_<span className="text-black font-bold">XX</span>_{currentYear}_BA
                            </div>
                            <input 
                                type="number" 
                                min="1"
                                value={localSettings.nextObjSequence}
                                onChange={(e) => handleChange('nextObjSequence', e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 outline-none font-bold text-right"
                            />
                        </div>
                    </div>

                    {/* PL Settings */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Štartovacie číslo pre Prílohy (PL)</label>
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 px-3 py-2 rounded text-gray-500 font-mono text-sm border border-gray-200">
                                PL_SK_<span className="text-black font-bold">XX</span>_{currentYear}_BA
                            </div>
                            <input 
                                type="number" 
                                min="1"
                                value={localSettings.nextPlSequence}
                                onChange={(e) => handleChange('nextPlSequence', e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 outline-none font-bold text-right"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TEXTS */}
            {activeTab === 'texts' && (
                <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm text-purple-800">
                        Nastavte si <strong>predvolené texty</strong>, ktoré sa automaticky načítajú pri vytvorení novej ponuky pre jednotlivé kategórie.
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {availableCategories.map(cat => (
                            <div key={cat} className="border rounded-lg p-3 bg-gray-50">
                                <label className="block text-sm font-bold text-gray-700 mb-2">{cat}</label>
                                <textarea 
                                    className="w-full border rounded p-2 text-xs h-20 outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                                    placeholder="Sem vložte predvolený text..."
                                    value={localSettings.defaultCategoryTexts?.[cat] || ''}
                                    onChange={e => handleTextChange(cat, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: DATA MANAGEMENT */}
            {activeTab === 'data' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                     <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                        Táto sekcia slúži na <strong>plnú zálohu</strong> celej aplikácie. Exportovaný súbor obsahuje všetky ponuky, klientov, produkty aj nastavenia.
                    </div>

                    {/* Storage Usage Indicator */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><Database size={14}/> Využitie pamäte prehliadača</span>
                            <span className={`text-xs font-bold ${storageUsage.percent > 90 ? 'text-red-600' : 'text-gray-500'}`}>
                                {storageUsage.used.toFixed(0)} KB / 5120 KB ({storageUsage.percent.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full transition-all duration-500 ${storageUsage.percent > 90 ? 'bg-red-600' : storageUsage.percent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                style={{ width: `${storageUsage.percent}%` }}
                            ></div>
                        </div>
                        {storageUsage.percent > 80 && (
                            <div className="mt-2 text-xs text-red-600 font-bold flex items-center gap-1">
                                <AlertTriangle size={12}/> Pozor: Pamäť je takmer plná! Odporúčame vykonať Export a následne Továrenské nastavenia pre uvoľnenie miesta.
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4">
                        <button 
                            onClick={onExportData}
                            className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition group"
                        >
                            <div className="text-left">
                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                    <Download size={18} className="text-green-600"/> Stiahnuť Zálohu (Export)
                                </div>
                                <div className="text-xs text-gray-500">Uloží kompletnú databázu do súboru .json</div>
                            </div>
                            <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs font-bold group-hover:bg-gray-300">STIAHNUŤ</div>
                        </button>

                        <div className="relative">
                            <input 
                                type="file" 
                                accept=".json" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition group"
                            >
                                <div className="text-left">
                                    <div className="font-bold text-gray-800 flex items-center gap-2">
                                        <Upload size={18} className="text-blue-600"/> Obnoviť zo Zálohy (Import)
                                    </div>
                                    <div className="text-xs text-gray-500">Načíta dáta zo súboru .json a nahradí aktuálne</div>
                                </div>
                                <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs font-bold group-hover:bg-gray-300">NAHRAŤ</div>
                            </button>
                        </div>
                    </div>

                    <hr className="border-gray-200"/>

                    <button 
                        onClick={handleResetClick}
                        className="w-full p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition"
                    >
                        <Trash2 size={16}/> Vymazať všetky dáta (Továrenské nastavenia)
                    </button>

                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
            <div className="text-xs text-gray-400">
                Verzia aplikácie: <span className="font-mono font-bold">{appVersion || 'Neznáma'}</span>
            </div>
            <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">
                    Zavrieť
                </button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
                    <Save size={18} /> Uložiť nastavenia
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
