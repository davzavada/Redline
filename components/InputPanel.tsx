import React, { useState, useRef, useEffect } from 'react';
import { Document } from '../types';

interface InputPanelProps {
  label: string;
  roleDescription: string;
  selectedDocId: string;
  documents: Document[];
  onSelectDoc: (id: string) => void;
  onChangeText: (id: string, text: string) => void;
  onRenameDoc: (id: string, newName: string) => void;
  onDeleteDoc?: (id: string) => void;
  onAddDoc?: () => void;
  headerAction?: React.ReactNode;
  scrollRef?: React.RefObject<HTMLTextAreaElement | null>;
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  settings: {
    font: 'sans' | 'serif' | 'mono';
    theme: 'light' | 'dark' | 'slate';
    accentColor: string;
    fontSize: number;
  };
}

const InputPanel: React.FC<InputPanelProps> = ({ 
  label, 
  roleDescription,
  selectedDocId, 
  documents, 
  onSelectDoc, 
  onChangeText,
  onRenameDoc,
  onDeleteDoc,
  onAddDoc,
  headerAction,
  scrollRef,
  onScroll,
  settings
}) => {
  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setTempName(currentName);
  };

  const finishEditing = () => {
    if (editingId && tempName.trim()) {
      onRenameDoc(editingId, tempName.trim());
    }
    setEditingId(null);
  };

  const themeBg = settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const headerBg = settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textSecondary = settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex flex-col h-full rounded-lg shadow-sm border overflow-hidden ${themeBg}`}>
      <div className={`${headerBg} border-b flex flex-col shrink-0`}>
        <div className="px-3 flex justify-between items-center h-[38px] border-b border-slate-200/50">
             <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>{label}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                  settings.theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                    {roleDescription}
                </span>
             </div>
             {headerAction && (
                <div className="flex items-center">
                   {headerAction}
                </div>
             )}
        </div>

        <div className="flex px-3 h-[36px] gap-1 overflow-x-auto no-scrollbar items-stretch">
            {documents.map(doc => {
                const isActive = doc.id === selectedDocId;
                const isEditing = editingId === doc.id;
                
                return (
                    <div key={doc.id} className="relative flex-shrink-0 min-w-[3rem] max-w-[8rem] flex-1 group py-1">
                      {isEditing ? (
                        <input
                          autoFocus
                          className="w-full h-full px-2 rounded-md border border-blue-400 text-xs font-medium focus:outline-none shadow-inner"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onBlur={finishEditing}
                          onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                        />
                      ) : (
                        <button
                          onClick={() => onSelectDoc(doc.id)}
                          onDoubleClick={() => startEditing(doc.id, doc.name)}
                          className={`
                              w-full h-full group flex items-center justify-center pl-2 pr-4 rounded-md border text-xs font-medium transition-all duration-200 relative
                              ${isActive 
                                  ? (settings.theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white shadow-sm z-10' : 'bg-white border-slate-300 text-slate-800 shadow-sm z-10')
                                  : (settings.theme === 'dark' ? 'bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700 hover:text-slate-300' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-600')
                              }
                          `}
                          title="Kliknutím vyberte, dvojklikem přejmenujte"
                        >
                          <span className="truncate block">{doc.name}</span>
                        </button>
                      )}

                      {/* Close Button - Top Right on Hover */}
                      {!isEditing && documents.length > 2 && onDeleteDoc && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDoc(doc.id);
                            }}
                            className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center rounded-bl-md bg-red-50 text-red-400 border-l border-b border-red-100 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 shadow-sm"
                            title="Zavřít"
                        >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                )
            })}
            
            {onAddDoc && (
               <button
                 onClick={onAddDoc}
                 disabled={documents.length >= 8}
                 className={`
                    flex items-center justify-center w-7 h-7 rounded-md border text-xs transition-colors flex-shrink-0 ml-1 self-center
                    ${documents.length >= 8 
                       ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                       : (settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-blue-400 hover:border-blue-500 hover:text-blue-300 shadow-sm' : 'bg-white border-slate-200 text-blue-500 hover:border-blue-300 hover:text-blue-600 shadow-sm')
                    }
                 `}
                 title="Přidat nový dokument"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
               </button>
            )}
        </div>
      </div>

      <div className="relative flex-1 group">
        <textarea
          ref={scrollRef}
          onScroll={onScroll}
          className={`w-full h-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed ${
            settings.theme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-white text-slate-700'
          }`}
          style={{ fontSize: `${settings.fontSize}px` }}
          value={selectedDoc?.text || ''}
          onChange={(e) => selectedDoc && onChangeText(selectedDoc.id, e.target.value)}
          placeholder="Vyberte dokument nebo vložte text..."
          spellCheck={false}
        />
        
        {/* Clear Text Button - Floating Bottom Right to avoid collision with text start */}
        <button 
           onClick={() => selectedDoc && onChangeText(selectedDoc.id, '')}
           className="absolute bottom-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md text-slate-400 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm z-10"
           title="Vymazat text"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
      
       <div className={`px-3 h-[24px] border-t text-[9px] flex justify-between items-center ${
         settings.theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-100 text-slate-400'
       }`}>
             <span>{selectedDoc?.text.split(/\s+/).filter(x => x).length || 0} slov</span>
             <span>{selectedDoc?.text.length || 0} znaků</span>
       </div>
    </div>
  );
};

export default InputPanel;