import React, { useState, useEffect, useRef } from 'react';
import { Document, DiffSegment, ChangeType } from './types';
import InputPanel from './components/InputPanel';
import RedlineViewer from './components/RedlineViewer';
import ExportModal from './components/ExportModal';
import { generateSmartDiff } from './utils/diffEngine';
import { X, Type, Palette, Moon, Sun } from 'lucide-react';

const DEMO_ORIGINAL = `Příliš žluťoučký kůň úpěl ďábelské ódy.`;

const DEMO_MODIFIED = `Příliš žluťoučký kůň úpěl ďábelské ódy na měsíci.`;

interface Settings {
  font: 'sans' | 'serif' | 'mono';
  theme: 'light' | 'dark' | 'slate';
  accentColor: string;
  fontSize: number;
  removeLineBreaks: boolean;
  removeExtraSpaces: boolean;
}

const SETTINGS_KEY = 'redline-settings';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(() => {
    return [
      { id: '1', name: '1', text: DEMO_ORIGINAL },
      { id: '2', name: '2', text: DEMO_MODIFIED },
    ];
  });
  
  const [leftDocId, setLeftDocId] = useState('1');
  const [rightDocId, setRightDocId] = useState('2');
  const [diffSegments, setDiffSegments] = useState<DiffSegment[]>([]);
  
  // Navigation State
  const [activeChangeIndex, setActiveChangeIndex] = useState(-1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDownloadingApp, setIsDownloadingApp] = useState(false);
  
  const handleDownloadApp = async () => {
    setIsDownloadingApp(true);
    try {
      const response = await fetch('/api/download-html');
      if (!response.ok) throw new Error('Build failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'LegalLens-Redline-Offline.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error(e);
      alert('Stahování selhalo. Zkuste to prosím znovu.');
    } finally {
      setIsDownloadingApp(false);
    }
  };
  
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return {
      font: 'sans',
      theme: 'light',
      accentColor: '#3b82f6', // blue-500
      fontSize: 14,
      removeLineBreaks: false,
      removeExtraSpaces: false,
    };
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync Scroll Refs
  const leftRef = useRef<HTMLTextAreaElement>(null);
  const rightRef = useRef<HTMLTextAreaElement>(null);
  const redlineRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const leftDoc = documents.find(d => d.id === leftDocId) || documents[0];
  const rightDoc = documents.find(d => d.id === rightDocId) || documents[1] || documents[0];

  useEffect(() => {
    const handler = setTimeout(() => {
      if (leftDoc && rightDoc) {
        let t1 = leftDoc.text;
        let t2 = rightDoc.text;

        if (settings.removeLineBreaks) {
          t1 = t1.replace(/[\r\n]+/g, ' ');
          t2 = t2.replace(/[\r\n]+/g, ' ');
        }
        if (settings.removeExtraSpaces) {
          t1 = t1.replace(/[ \t]{2,}/g, ' ');
          t2 = t2.replace(/[ \t]{2,}/g, ' ');
        }

        const segments = generateSmartDiff(t1, t2);
        setDiffSegments(segments);
        setActiveChangeIndex(-1);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [leftDoc, rightDoc, settings.removeLineBreaks, settings.removeExtraSpaces]);

  // Synchronized Scrolling Logic
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const ratio = scrollTop / (scrollHeight - clientHeight);

    const targets = [leftRef.current, rightRef.current, redlineRef.current];
    targets.forEach(target => {
      if (target && target !== e.currentTarget) {
        target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
      }
    });
    
    setTimeout(() => { isSyncing.current = false; }, 50);
  };

  const handleUpdateText = (id: string, newText: string) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, text: newText } : doc));
  };

  const handleRenameDoc = (id: string, newName: string) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, name: newName } : doc));
  };

  const handleSwapPanels = () => {
    const temp = leftDocId;
    setLeftDocId(rightDocId);
    setRightDocId(temp);
  };

  const handleReset = () => {
    if (window.confirm('Opravdu chcete resetovat pracovní prostor? Tímto vymažete veškerý text a dokumenty.')) {
      setDocuments([
        { id: '1', name: '1', text: '' },
        { id: '2', name: '2', text: '' }
      ]);
      setLeftDocId('1');
      setRightDocId('2');
      setActiveChangeIndex(-1);
    }
  };

  const navigateChange = (direction: 'next' | 'prev') => {
    const changes = diffSegments.filter(s => s.type !== ChangeType.UNCHANGED);
    if (changes.length === 0) return;

    let nextIndex = direction === 'next' ? activeChangeIndex + 1 : activeChangeIndex - 1;
    if (nextIndex >= changes.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = changes.length - 1;

    setActiveChangeIndex(nextIndex);
    const element = document.getElementById(changes[nextIndex].id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
      setTimeout(() => element.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50'), 2000);
    }
  };

  const handleAddDocument = () => {
    if (documents.length >= 8) return;
    const newId = Date.now().toString();
    
    // Find next available number
    const existingNames = new Set(documents.map(d => d.name));
    let nextNum = 1;
    while (existingNames.has(nextNum.toString())) {
      nextNum++;
    }

    const newDoc: Document = {
      id: newId,
      name: nextNum.toString(),
      text: ''
    };
    setDocuments([...documents, newDoc]);
    setRightDocId(newId);
  };

  const handleDeleteDocument = (id: string) => {
    if (documents.length <= 2) return;
    const remaining = documents.filter(d => d.id !== id);
    setDocuments(remaining);
    if (leftDocId === id) setLeftDocId(remaining[0].id);
    if (rightDocId === id) setRightDocId(remaining[1]?.id || remaining[0].id);
  };

  const changesCount = diffSegments.filter(s => s.type !== ChangeType.UNCHANGED).length;

  const fontClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  };

  const themeClasses = {
    light: 'bg-slate-50 text-slate-900',
    dark: 'bg-slate-950 text-slate-100',
    slate: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${themeClasses[settings.theme]} ${fontClasses[settings.font]}`}>
      <main className="flex-1 flex overflow-hidden relative p-1">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-1 overflow-hidden">
          
          {/* Column 1: Source */}
          <div className="flex flex-col h-full overflow-hidden">
             <InputPanel 
                label="Zdroj" 
                roleDescription="Původní" 
                selectedDocId={leftDocId} 
                documents={documents}
                onSelectDoc={setLeftDocId} 
                onChangeText={handleUpdateText} 
                onRenameDoc={handleRenameDoc}
                onDeleteDoc={handleDeleteDocument} 
                onAddDoc={handleAddDocument}
                scrollRef={leftRef} 
                onScroll={handleScroll}
                settings={settings}
             />
          </div>

          {/* Column 2: Target */}
          <div className="flex flex-col h-full overflow-hidden">
             <InputPanel 
                label="Cíl" 
                roleDescription="Upravený" 
                selectedDocId={rightDocId} 
                documents={documents}
                onSelectDoc={setRightDocId} 
                onChangeText={handleUpdateText} 
                onRenameDoc={handleRenameDoc}
                onDeleteDoc={handleDeleteDocument} 
                onAddDoc={handleAddDocument}
                scrollRef={rightRef} 
                onScroll={handleScroll}
                settings={settings}
                headerAction={
                   <div className="flex items-center gap-2">
                       <button
                         onClick={handleSwapPanels}
                         className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                         title="Prohodit Zdroj a Cíl"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                       </button>
                       <div className="h-4 w-px bg-slate-200"></div>
                       <button 
                           onClick={handleReset}
                           className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50 flex items-center gap-1"
                           title="Resetovat pracovní prostor"
                       >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           <span className="text-[10px] font-bold uppercase tracking-wide hidden xl:inline">Reset</span>
                       </button>
                   </div>
                }
             />
          </div>

          {/* Column 3: Redline */}
          <div className="flex flex-col h-full overflow-hidden">
             <div className={`flex flex-col h-full rounded-lg shadow-sm border border-slate-200 overflow-hidden ${settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} border-b flex flex-col shrink-0`}>
                  <div className="px-3 flex justify-between items-center h-[38px] border-b border-slate-200/50">
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Změny</span>
                     </div>

                     <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSettings(s => ({ ...s, removeLineBreaks: !s.removeLineBreaks }))}
                          className={`text-[10px] px-2 py-1 rounded transition-colors ${settings.removeLineBreaks ? 'bg-slate-100 text-slate-800 font-medium shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-transparent'}`}
                          title="Spojí odstavce do jednoho bloku"
                        >
                          Ignorovat odřádkování
                        </button>
                        <button
                          onClick={() => setSettings(s => ({ ...s, removeExtraSpaces: !s.removeExtraSpaces }))}
                          className={`text-[10px] px-2 py-1 rounded transition-colors ${settings.removeExtraSpaces ? 'bg-slate-100 text-slate-800 font-medium shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-transparent'}`}
                          title="Odstraní vícenásobné mezery a tabulátory"
                        >
                          Slučovat mezery
                        </button>
                     </div>

                     <div className="flex items-center gap-2">
                        <div className={`flex items-center border rounded-md shadow-sm ${settings.theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <button 
                            onClick={() => navigateChange('prev')} 
                            disabled={changesCount === 0}
                            className="p-1 hover:bg-slate-50 rounded-l-md text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          
                          <div className="px-2 text-[10px] font-mono text-slate-500 font-medium min-w-[3rem] text-center border-x border-slate-100 h-full flex items-center justify-center">
                             {changesCount > 0 ? activeChangeIndex + 1 : 0} / {changesCount}
                          </div>

                          <button 
                            onClick={() => navigateChange('next')} 
                            disabled={changesCount === 0}
                            className="p-1 hover:bg-slate-50 rounded-r-md text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>
                     </div>
                  </div>
                  
                  <div className="h-[36px] w-full flex items-center justify-between px-3">
                     <div className="flex gap-3 text-[9px] font-bold uppercase tracking-tight">
                        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span><span className="text-slate-500">Přidáno</span></div>
                        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span><span className="text-slate-500">Smazáno</span></div>
                     </div>
                     <span className="text-[10px] text-slate-400 italic">
                        {changesCount === 0 ? 'Beze změn' : `${changesCount} úprav`}
                     </span>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                   <RedlineViewer segments={diffSegments} scrollRef={redlineRef} onScroll={handleScroll} onOpenExport={() => setIsExportOpen(true)} settings={settings} />
                </div>

                <div className={`px-3 h-[24px] border-t text-[9px] flex justify-between items-center ${
                  settings.theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-100 text-slate-400'
                }`}>
                      <span 
                        onDoubleClick={!isDownloadingApp ? handleDownloadApp : undefined}
                        className="cursor-default select-none text-slate-300 hover:text-slate-400 transition-colors"
                        title="Dvojklikem stáhnete offline HTML aplikaci"
                      >
                        {isDownloadingApp ? 'Kompilace release...' : 'Build 25.10.42'}
                      </span>
                      <span>{changesCount} změn celkem</span>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        sourceDoc={leftDoc}
        targetDoc={rightDoc}
        segments={diffSegments}
        settings={{ accentColor: settings.accentColor, theme: settings.theme }}
      />
    </div>
  );
};

export default App;
