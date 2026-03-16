
import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginGateProps {
  onLogin: () => void;
}

// TU SI NASTAVTE HESLO
const ACCESS_PASSWORD = "smart2025"; 

export const LoginGate: React.FC<LoginGateProps> = ({ onLogin }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ACCESS_PASSWORD) {
      onLogin();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-gray-200">
        <div className="mb-6 flex justify-center">
            <div className="bg-blue-50 p-4 rounded-full">
                <ShieldCheck size={48} className="text-blue-600" />
            </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Zabezpečený prístup</h1>
        <p className="text-gray-500 mb-6 text-sm">
            Táto aplikácia je určená len pre autorizovaný personál. Pre pokračovanie zadajte prístupový kód.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="password" 
              placeholder="Zadajte heslo" 
              value={input}
              onChange={(e) => {
                  setInput(e.target.value);
                  setError(false);
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${error ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm font-bold animate-pulse">
              Nesprávne heslo. Skúste znova.
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            Vstúpiť do systému <ArrowRight size={18} />
          </button>
        </form>
        
        <div className="mt-8 text-xs text-gray-400 border-t pt-4">
            SmartQuote SK &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
