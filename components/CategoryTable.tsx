
import React, { useRef, useEffect, useState } from 'react';
import { QuoteCategory, QuoteItem } from '../types';
import { Trash2, Plus, Sparkles, Bold, Italic, Link, Image as ImageIcon, Table, List, ListOrdered, FileText, ChevronDown, ChevronUp, BookOpen, Layers, Box, Eye, EyeOff, Replace, Printer, Percent, GripVertical } from 'lucide-react';

interface CategoryTableProps {
  category: QuoteCategory;
  currency: string;
  globalMargin: number;
  onUpdateCategory: (id: string, field: keyof QuoteCategory, value: any) => void;
  onDeleteCategory: (id: string) => void;
  onAddItem: (categoryId: string, isSurcharge?: boolean) => void;
  onUpdateItem: (categoryId: string, itemId: string, field: keyof QuoteItem, value: any) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onAiSuggest: (categoryId: string, categoryName: string) => void;
  onOpenCatalog: (categoryId: string, itemId?: string) => void;
  onMoveCategory?: (id: string, direction: 'up' | 'down') => void;
  isAiLoading: boolean;
  readOnly?: boolean; 
  hidePrices?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  category,
  currency,
  globalMargin,
  onUpdateCategory,
  onDeleteCategory,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAiSuggest,
  onOpenCatalog,
  onMoveCategory,
  isAiLoading,
  readOnly = false,
  hidePrices = false,
  draggable, onDragStart, onDragOver, onDragEnd
}) => {
  const [showRichText, setShowRichText] = useState(!!category.textContent);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // FIX: Cursor jumping issue logic
  // We only update the innerHTML if the incoming prop is significantly different
  // from the current ref content (e.g. loaded from template), preventing overwrite during typing.
  useEffect(() => {
    if (showRichText && editorRef.current) {
       const currentContent = editorRef.current.innerHTML;
       const newContent = category.textContent || '';
       
       if (newContent !== currentContent) {
           editorRef.current.innerHTML = newContent;
       }
    }
  }, [showRichText, category.textContent]); 

  const formatNumber = (num: number) => {
    return num.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getSellingPrice = (costPrice: number) => {
    return costPrice * (1 + globalMargin / 100);
  };

  const isEmpty = category.items.length === 0 && !category.textContent;
  const isHidden = category.isHidden;
  const isHiddenFromPrint = category.isHiddenFromPrint;

  // --- Editor Logic ---
  const handleInput = () => {
    if (editorRef.current && !readOnly) {
      const content = editorRef.current.innerHTML;
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
    const url = prompt('Vložte URL odkazu (napr. na video):');
    if (url) execCmd('createLink', url);
  };

  const insertTable = () => {
    const html = `
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tbody>
          <tr>
            <td style="border: 1px solid #ccc; padding: 5px; background-color: #f9fafb; font-weight: bold;">Parameter</td>
            <td style="border: 1px solid #ccc; padding: 5px;">Hodnota</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    execCmd('insertHTML', html);
  };

  const toggleRichText = () => {
      setShowRichText(!showRichText);
  };

  const toggleSection = () => {
      if(readOnly) return;
      const newSection = category.section === 'shaft' ? 'lift' : 'shaft';
      onUpdateCategory(category.id, 'section', newSection);
  };

  const toggleVisibility = () => {
      if(readOnly) return;
      onUpdateCategory(category.id, 'isHidden', !isHidden);
  };

  const togglePrintVisibility = () => {
      if(readOnly) return;
      onUpdateCategory(category.id, 'isHiddenFromPrint', !isHiddenFromPrint);
  }

  // --- ITEM DRAG & DROP HANDLERS ---
  const onDragStartItem = (e: React.DragEvent, itemId: string) => {
      e.stopPropagation(); // Stop propagation so category D&D doesn't trigger
      setDraggedItemId(itemId);
      e.dataTransfer.effectAllowed = 'move';
      e.currentTarget.classList.add('opacity-50');
  };

  const onDragEndItem = (e: React.DragEvent) => {
      e.stopPropagation();
      setDraggedItemId(null);
      e.currentTarget.classList.remove('opacity-50');
  };

  const onDragOverItem = (e: React.DragEvent, targetItemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!draggedItemId || draggedItemId === targetItemId) return;

      const items = category.items;
      const draggedIndex = items.findIndex(i => i.id === draggedItemId);
      const targetIndex = items.findIndex(i => i.id === targetItemId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newItems = [...items];
      const [reorderedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, reorderedItem);

      onUpdateCategory(category.id, 'items', newItems);
  };

  // Determine classes based on hidden states
  // Reduced margin bottom for print compactness (mb-4 -> print:mb-2)
  let wrapperClasses = "mb-4 print:mb-2 border-2 border-gray-800 rounded-xl overflow-hidden bg-white shadow-sm break-inside-avoid transition-all";
  if (isHidden) {
      wrapperClasses += " opacity-60 grayscale border-dashed border-gray-400 print:hidden";
  } else if (isHiddenFromPrint) {
      wrapperClasses += " border-red-300 border-dashed print:hidden bg-red-50/30";
  }

  if (isEmpty) wrapperClasses += " print:hidden";
  if (readOnly) wrapperClasses += " border-gray-800"; // Always dark border in read mode too for consistency

  return (
    <div 
        className={wrapperClasses}
        draggable={draggable && !readOnly}
        onDragStart={(e) => onDragStart && onDragStart(e, category.id)}
        onDragOver={(e) => onDragOver && onDragOver(e, category.id)}
        onDragEnd={onDragEnd}
    >
      
      {/* STRICT PRINT HIDING LOGIC */}
      {hidePrices && (
          <style>{`
              @media print {
                  .price-column-strict { display: none !important; }
              }
          `}</style>
      )}

      {/* HEADER BAR - Reduced padding for print: py-3 -> print:py-1 */}
      <div className="px-4 py-3 print:py-1 border-b-2 border-gray-800 bg-white flex justify-between items-center print:bg-gray-50">
          <div className="flex items-center gap-2 flex-1">
              <div className={`p-1.5 rounded text-white ${category.section === 'shaft' ? 'bg-orange-600' : 'bg-gray-900'}`}>
                  {category.section === 'shaft' ? <Box size={14} /> : <Layers size={14} />}
              </div>
              
              {/* Category Name Input / Display - STANDARD TEXT FIELD */}
              {readOnly ? (
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest text-left">{category.name}</h3>
              ) : (
                  <input
                      type="text"
                      value={category.name}
                      onChange={(e) => onUpdateCategory(category.id, 'name', e.target.value)}
                      className="bg-transparent font-bold text-sm text-gray-900 focus:outline-none focus:text-black placeholder-gray-400 print:text-black w-full text-left"
                      placeholder="Názov kategórie"
                  />
              )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 no-print">
               {!readOnly && onMoveCategory && (
                    <div className="flex gap-1 mr-2 border-r pr-2 border-gray-200">
                         <button onClick={() => onMoveCategory(category.id, 'up')} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"><ChevronUp size={14}/></button>
                         <button onClick={() => onMoveCategory(category.id, 'down')} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"><ChevronDown size={14}/></button>
                    </div>
               )}
               {!readOnly && (
                   <>
                        <button onClick={toggleSection} className="p-1 text-gray-300 hover:text-orange-500" title="Prepnúť sekciu (Výťah/Šachta)">
                            {category.section === 'shaft' ? <Box size={14} /> : <Layers size={14} />}
                        </button>
                        <button onClick={togglePrintVisibility} className={`p-1 ${isHiddenFromPrint ? 'text-red-500' : 'text-gray-300 hover:text-black'}`} title="Skryť pri tlači"><Printer size={14}/></button>
                        <button onClick={toggleVisibility} className={`p-1 ${isHidden ? 'text-gray-500' : 'text-gray-300 hover:text-black'}`} title="Skryť úplne"><Eye size={14}/></button>
                        <button onClick={toggleRichText} className={`p-1 ${showRichText ? 'text-blue-500' : 'text-gray-300 hover:text-blue-500'}`} title="Text"><FileText size={14}/></button>
                        <button onClick={() => onDeleteCategory(category.id)} className="p-1 text-gray-300 hover:text-red-600"><Trash2 size={14}/></button>
                   </>
               )}
          </div>
      </div>

      {/* Items Table */}
      {category.items.length > 0 ? (
      <div className="bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[10px] uppercase text-gray-500 tracking-wider">
                {!readOnly && <th className="w-6 no-print"></th>}
                <th className="px-4 py-1 font-bold w-10 text-center text-gray-400">#</th>
                <th className="px-2 py-1 font-bold text-left">Položka</th>
                <th className="px-2 py-1 font-bold text-right w-16">M.J.</th>
                <th className="px-2 py-1 font-bold text-right w-16">Mn.</th>
                <th className={`px-4 py-1 font-bold text-right w-24 price-column-strict ${hidePrices ? '' : ''}`}>
                    {readOnly ? 'Cena' : 'Nákup'}
                </th>
                {!readOnly && <th className="w-16 no-print"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {category.items.map((item, index) => {
                const sellingPrice = getSellingPrice(item.unitPrice);
                return (
                <tr 
                    key={item.id} 
                    className={`group transition-colors ${item.isSurcharge ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}
                    draggable={!readOnly}
                    onDragStart={(e) => onDragStartItem(e, item.id)}
                    onDragOver={(e) => onDragOverItem(e, item.id)}
                    onDragEnd={onDragEndItem}
                >
                  {!readOnly && (
                      <td className="text-center no-print text-gray-300 cursor-grab hover:text-gray-500 align-middle">
                          <GripVertical size={12} className="mx-auto"/>
                      </td>
                  )}
                  {/* COMPACT PADDING: py-2 -> py-0.5 for print */}
                  <td className="px-4 py-2 print:py-0.5 text-center text-gray-400 font-medium text-[10px] align-top pt-2.5 print:pt-1">{index + 1}</td>
                  
                  {/* DESCRIPTION CELL - FORCED LEFT ALIGN */}
                  <td className="px-2 py-1 print:py-0.5 align-top relative text-left">
                    {readOnly ? (
                        <div className={`text-gray-900 whitespace-pre-wrap leading-tight py-1.5 print:py-0 text-left ${item.isSurcharge ? 'pl-4 italic text-gray-600 text-[11px]' : 'text-xs font-medium'}`}>
                            {item.isSurcharge && <span className="absolute left-0 top-2 text-gray-400 text-[10px]">•</span>}
                            {item.description}
                        </div>
                    ) : (
                        <div className={`flex gap-1 py-1 print:py-0 ${item.isSurcharge ? 'pl-4' : ''}`}>
                             {item.isSurcharge && <span className="absolute left-1 top-2.5 text-gray-400 text-[10px]">•</span>}
                             <textarea
                                rows={1}
                                value={item.description}
                                onChange={(e) => {
                                    onUpdateItem(category.id, item.id, 'description', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                className={`w-full bg-transparent focus:outline-none focus:text-black resize-none text-xs placeholder-gray-300 print:text-black leading-normal overflow-hidden py-0.5 text-left ${item.isSurcharge ? 'italic text-gray-600' : 'text-gray-900 font-bold'}`}
                                style={{ minHeight: '1.5rem' }}
                                placeholder="Názov položky..."
                            />
                            <button
                                onClick={() => onOpenCatalog(category.id, item.id)}
                                className="no-print self-start p-1 text-blue-300 hover:text-blue-600 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100 mt-0.5"
                                title="Katalóg"
                            >
                                <BookOpen size={12} />
                            </button>
                        </div>
                    )}
                  </td>

                  {/* UNIT */}
                  <td className="px-2 py-1 print:py-0.5 align-top text-right pt-2 print:pt-0.5">
                    {readOnly ? (
                        <span className="text-gray-500 text-[10px] uppercase font-bold">{item.unit}</span>
                    ) : (
                        <select
                            value={item.unit}
                            onChange={(e) => onUpdateItem(category.id, item.id, 'unit', e.target.value)}
                            className="w-full text-right bg-transparent text-gray-500 font-bold text-[10px] uppercase border-none focus:outline-none cursor-pointer hover:bg-gray-100 rounded px-1 print:appearance-none"
                        >
                            <option value="ks">KS</option>
                            <option value="m">M</option>
                            <option value="kpl">KPL</option>
                            <option value="set">SET</option>
                            <option value="hod">HOD</option>
                        </select>
                    )}
                  </td>

                  {/* QUANTITY */}
                  <td className="px-2 py-1 print:py-0.5 align-top text-right pt-2 print:pt-0.5">
                    {readOnly ? (
                        <span className="text-gray-900 font-bold text-xs">{item.quantity}</span>
                    ) : (
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => onUpdateItem(category.id, item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full text-right bg-transparent text-gray-900 font-bold focus:outline-none text-xs p-0 hover:bg-gray-100 rounded"
                        />
                    )}
                  </td>

                  {/* PRICE */}
                  <td className="px-4 py-1 print:py-0.5 align-top text-right price-column-strict pt-2 print:pt-0.5">
                    {readOnly ? (
                        <span className="text-xs font-bold text-gray-900 block">
                            {formatNumber(sellingPrice)}
                        </span>
                    ) : (
                        <>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice === 0 ? '' : item.unitPrice}
                                onChange={(e) => onUpdateItem(category.id, item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className={`w-full text-right bg-transparent font-bold focus:outline-none text-xs print:hidden cursor-text p-0 hover:bg-blue-50 rounded ${hidePrices ? 'text-gray-300' : 'text-blue-600'}`}
                                placeholder="0.00"
                            />
                            <span className="hidden print:block text-xs font-bold text-black">
                                {formatNumber(sellingPrice)}
                            </span>
                        </>
                    )}
                  </td>

                  {/* ACTIONS */}
                  {!readOnly && (
                    <td className="px-2 py-1 text-center no-print align-top pt-1.5">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onAddItem(category.id, true)} className="text-gray-300 hover:text-blue-500"><Percent size={12} /></button>
                            <button onClick={() => onDeleteItem(category.id, item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                    </td>
                  )}
                </tr>
              )})}
            </tbody>
          </table>
      </div>
      ) : (
          !readOnly && (
            <div className="p-4 text-center text-gray-400 italic text-xs no-print border-b border-gray-100 bg-gray-50/50">
                Žiadne položky. Použite tlačidlo "+" alebo Materiálového Sprievodcu.
            </div>
          )
      )}
          
      {!readOnly && (
        <div className="p-1 border-t border-gray-100 bg-white no-print flex gap-2 justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
            onClick={() => onAddItem(category.id)}
            className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-blue-50 transition uppercase tracking-wide"
            >
            <Plus size={12} /> Pridať riadok
            </button>
        </div>
      )}

      {/* Embedded Rich Text Area - Forced Left */}
      {(showRichText || (readOnly && category.textContent)) && (
        <div className="border-t border-gray-200 p-4 print:p-2 bg-white text-left">
            <div className="mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider print:hidden">Technická špecifikácia / Prílohy</div>
            {/* FIX: Removed dangerouslySetInnerHTML to prevent re-render loop killing cursor position */}
            <div
                ref={editorRef}
                contentEditable={!readOnly}
                onInput={handleInput}
                className={`rich-text-content w-full min-h-[60px] outline-none text-gray-900 text-xs leading-relaxed text-left ${readOnly ? 'pointer-events-none' : ''}`}
            />
        </div>
      )}
    </div>
  );
};
