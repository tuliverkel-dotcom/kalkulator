import React, { useState } from 'react';
import { App as CoreApp } from './CoreApp';
import { ControlSystemQuote } from './components/ControlSystemQuote';
import { LayoutGrid, Cpu } from 'lucide-react';

export const App: React.FC = () => {
    const [activeModule, setActiveModule] = useState<'core' | 'control'>('core');

    return (
        <div className="min-h-screen bg-gray-100">
            {/* --- EXTENSION LAYER (NADSTAVBA) --- */}
            <div className="bg-slate-900 text-white p-2 text-xs font-bold flex flex-col sm:flex-row justify-between items-center gap-2 no-print shadow-md z-50 relative">
                <div className="flex items-center gap-4">
                    <span className="opacity-50 font-mono">CORE: v4.9.46 (FROZEN)</span>
                    <span className="hidden sm:inline text-slate-600">|</span>
                    <span className="text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> EXTENSION LAYER ACTIVE</span>
                </div>
                <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveModule('core')}
                        className={`px-3 py-1.5 rounded flex items-center gap-2 transition text-[10px] uppercase tracking-wider font-bold ${activeModule === 'core' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        <LayoutGrid size={14}/> Kompletný Výťah
                    </button>
                    <button 
                        onClick={() => setActiveModule('control')}
                        className={`px-3 py-1.5 rounded flex items-center gap-2 transition text-[10px] uppercase tracking-wider font-bold ${activeModule === 'control' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        <Cpu size={14}/> Riadiaci Systém
                    </button>
                </div>
            </div>
            
            {/* --- MODULE RENDER --- */}
            {activeModule === 'core' ? (
                <CoreApp />
            ) : (
                <ControlSystemQuote onBack={() => setActiveModule('core')} />
            )}
        </div>
    );
};
