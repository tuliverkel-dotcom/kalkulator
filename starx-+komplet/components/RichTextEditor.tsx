
import React, { useRef, useEffect } from 'react';
import { QuoteCategory } from '../types';
import { Trash2, Bold, Italic, Link, Image as ImageIcon, Table, List, ListOrdered, Layers, Box, Eye, EyeOff, GripVertical, FileText } from 'lucide-react';

interface RichTextEditorProps {
  category: QuoteCategory;
  onUpdateCategory: (id: string, field: keyof QuoteCategory, value: any) => void;
  onDeleteCategory: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  category,
  onUpdateCategory,
  onDeleteCategory,
  draggable,
  onDragStart,
  onDragOver,
  onDragEnd
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isHidden = category.isHidden;

  // FIX: Cursor jumping issue logic
  // We only update the innerHTML if the incoming prop is significantly different
  // from the current ref content (e.g. loaded from template), preventing overwrite during typing.
  useEffect(() => {
    if (editorRef.current) {
        const currentContent = editorRef.current.innerHTML;
        const newContent = category.textContent || '';
        
        if (newContent !== currentContent) {
            editorRef.current.innerHTML = newContent;
        }
    }
  }, [category.textContent]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      // Only update state if content actually changed to avoid unnecessary re-renders loop (though React handles state diffing, it's safer)
      if (content !== category.textContent) {
          onUpdateCategory(category.id, 'textContent', content);
      }
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const result = readerEvent.target?.result as string;
          execCmd('insertImage', result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const insertLink = () => {
    const url = prompt('Vložte URL odkazu:');
    if (url) execCmd('createLink', url);
  };

  const insertTable = () => {
    const html = `
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tbody>
          <tr>
            <td style="border: 1px solid #ccc; padding: 5px;">Parameter</td>
            <td style="border: 1px solid #ccc; padding: 5px;">Hodnota</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    execCmd('insertHTML', html);
  };

  const toggleSection = () => {
      const newSection = category.section === 'shaft' ? 'lift' : 'shaft';
      onUpdateCategory(category.id, 'section', newSection);
  };

  const toggleVisibility = () => {
      onUpdateCategory(category.id, 'isHidden', !isHidden);
  };

  return (
    <div 
        className={`mb-4 border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm break-inside-avoid transition-all ${isHidden ? 'opacity-60 grayscale print:hidden border-dashed' : ''}`}
        draggable={draggable}
        onDragStart={(e) => onDragStart && onDragStart(e, category.id)}
        onDragOver={(e) => onDragOver && onDragOver(e, category.id)}
        onDragEnd={onDragEnd}
    >
      
      {/* HEADER BAR */}
      <div className={`px-4 py-3 print:py-1 border-b border-gray-200 flex justify-between items-center ${isHidden ? 'bg-gray-100' : 'bg-white'}`}>
          <div className="flex items-center gap-2 flex-1">
              {/* Icon Type */}
              <div className={`p-1.5 rounded text-white ${category.section === 'shaft' ? 'bg-orange-600' : 'bg-gray-500'}`}>
                  <FileText size={14} />
              </div>
              
              {/* Category Name Input - STANDARD TEXT FIELD */}
              <input
                  type="text"
                  value={category.name}
                  onChange={(e) => onUpdateCategory(category.id, 'name', e.target.value)}
                  className="bg-transparent font-bold text-sm text-gray-900 focus:outline-none focus:text-black placeholder-gray-400 print:text-black w-full text-left"
                  placeholder="Názov textovej sekcie"
              />
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 no-print">
               <button onClick={toggleSection} className="p-1 text-gray-300 hover:text-orange-500" title="Prepnúť sekciu (Výťah/Šachta)">
                    {category.section === 'shaft' ? <Box size={14} /> : <Layers size={14} />}
               </button>
               <button
                onClick={toggleVisibility}
                className={`flex items-center gap-1 p-1 rounded transition ${isHidden ? 'text-gray-500 bg-gray-200' : 'text-gray-300 hover:text-black'}`}
                title={isHidden ? "Zobraziť v tlači" : "Skryť v tlači"}
              >
                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => onDeleteCategory(category.id)}
                className="p-1 text-gray-300 hover:text-red-600 transition"
                title="Odstrániť sekciu"
              >
                <Trash2 size={14} />
              </button>
              {/* Drag Handle */}
              {draggable && (
                  <div className="ml-2 cursor-grab text-gray-300 hover:text-gray-500">
                      <GripVertical size={16}/>
                  </div>
              )}
          </div>
      </div>

      {/* Editor Toolbar */}
      <div className="bg-gray-50 px-2 py-1 flex gap-2 border-b border-gray-100 print:hidden overflow-x-auto">
         <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Tučné"><Bold size={14}/></button>
         <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Kurzíva"><Italic size={14}/></button>
         <div className="w-px bg-gray-300 my-1"></div>
         <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Zoznam"><List size={14}/></button>
         <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Číslovanie"><ListOrdered size={14}/></button>
         <div className="w-px bg-gray-300 my-1"></div>
         <button onClick={insertLink} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Odkaz"><Link size={14}/></button>
         <button onClick={insertImage} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Obrázok"><ImageIcon size={14}/></button>
         <button onClick={insertTable} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Tabuľka"><Table size={14}/></button>
      </div>

      {/* Editor Area */}
      <div className="p-4 print:p-2 text-left">
            {/* FIX: Removed dangerouslySetInnerHTML to prevent re-render loop killing cursor position */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="rich-text-content w-full min-h-[80px] outline-none text-gray-900 text-sm leading-relaxed text-left"
            />
            {!category.textContent && (
                <div className="text-gray-400 text-sm absolute pointer-events-none mt-[-60px] ml-1 print:hidden italic text-left">
                    Sem napíšte text, vložte obrázok alebo tabuľku...
                </div>
            )}
      </div>
    </div>
  );
};
