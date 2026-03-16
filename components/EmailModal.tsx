
import React, { useState, useEffect } from 'react';
import { X, Mail, ExternalLink, AlertCircle } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, message: string) => void;
  defaultTo?: string;
  defaultSubject: string;
  defaultMessage: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  defaultTo = '',
  defaultSubject,
  defaultMessage
}) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTo(defaultTo);
      setSubject(defaultSubject);
      setMessage(defaultMessage);
    }
  }, [isOpen, defaultTo, defaultSubject, defaultMessage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Mail className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Odoslať PDF E-mailom</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800 flex gap-2">
                <AlertCircle className="shrink-0" size={18} />
                <div>
                    <strong>Dôležité upozornenie:</strong><br/>
                    1. Najskôr si <strong>uložte PDF</strong> do počítača cez tlačidlo <strong>Tlač → Uložiť ako PDF</strong>.<br/>
                    2. Kliknutím dole sa otvorí váš e-mailový klient (Outlook, Mail...).<br/>
                    3. Vygenerované PDF musíte do správy <strong>priložiť ručne</strong>.
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Príjemca (Komu)</label>
                <input 
                    type="email" 
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="klient@firma.sk"
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Predmet</label>
                <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Správa</label>
                <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none h-48 resize-none whitespace-pre-wrap"
                />
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">
                Zrušiť
            </button>
            <button onClick={() => onSend(to, subject, message)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
                <ExternalLink size={18} /> Otvoriť E-mail klienta
            </button>
        </div>

      </div>
    </div>
  );
};
