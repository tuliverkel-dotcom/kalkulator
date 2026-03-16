import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Link, List, ListOrdered, Table, Image as ImageIcon } from 'lucide-react';

interface StandaloneRichTextEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
  className?: string; // Allow custom classes for height/styling
  stickyToolbar?: boolean; // New prop to toggle sticky behavior
  minimalPadding?: boolean; // New prop to reduce padding
}

export const StandaloneRichTextEditor: React.FC<StandaloneRichTextEditorProps> = ({
  content,
  onChange,
  placeholder,
  className,
  stickyToolbar = true, // Default to true (for Contracts)
  minimalPadding = false // Default to false (for Contracts A4 look)
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
        if (!editorRef.current.innerHTML && content) {
            editorRef.current.innerHTML = content;
        }
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertTable = () => {
      const html = `
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tbody>
            <tr>
              <td style="border: 1px solid #000; padding: 5px;">...</td>
              <td style="border: 1px solid #000; padding: 5px;">...</td>
            </tr>
          </tbody>
        </table>
        <p><br/></p>
      `;
      execCmd('insertHTML', html);
  };

  // Default height logic: Use className prop if provided, otherwise default to A4 height
  const heightClass = className || "min-h-[297mm]";

  return (
    <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm print:border-none print:shadow-none break-inside-avoid print:h-auto print:overflow-visible relative">
      {/* Toolbar - Sticky logic conditional */}
      <div className={`bg-gray-50 p-2 flex gap-2 border-b border-gray-200 print:hidden ${stickyToolbar ? 'sticky top-0 z-20 shadow-md' : ''}`}>
         <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Tučné"><Bold size={16}/></button>
         <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Kurzíva"><Italic size={16}/></button>
         <div className="w-px bg-gray-300 mx-1"></div>
         <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Zoznam"><List size={16}/></button>
         <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Číslovanie"><ListOrdered size={16}/></button>
         <div className="w-px bg-gray-300 mx-1"></div>
         <button onClick={insertTable} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Tabuľka"><Table size={16}/></button>
      </div>

      {/* Editor Area - Padding conditional */}
      <div className={`${minimalPadding ? 'p-4' : 'p-8 md:p-12'} print:p-0 print:h-auto print:block relative z-10`}>
          <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              className={`rich-text-content w-full outline-none text-gray-900 text-sm leading-relaxed print:h-auto print:overflow-visible ${heightClass}`}
              dangerouslySetInnerHTML={{ __html: content || '' }}
          />
          {!content && placeholder && (
              <div className="text-gray-400 text-sm pointer-events-none mt-[-20px] print:hidden">
                  {placeholder}
              </div>
          )}
      </div>
    </div>
  );
};