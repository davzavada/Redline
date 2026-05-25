import React from 'react';
import { AnalysisResponse } from '../types';

interface AnalysisSidebarProps {
  isLoading: boolean;
  analysis: AnalysisResponse | null;
  onAnalyze: () => void;
}

const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({ isLoading, analysis, onAnalyze }) => {
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-80 shadow-xl z-20">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Analysis
        </h2>
        <p className="text-xs text-slate-500 mt-1">Powered by Gemini 2.5 Flash</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {!analysis && !isLoading && (
          <div className="text-center py-10">
            <div className="bg-purple-50 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-4">Analyze changes for legal risks and summary.</p>
            <button
              onClick={onAnalyze}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors shadow-sm"
            >
              Analyze Differences
            </button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-20 bg-slate-100 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-20 bg-slate-100 rounded"></div>
          </div>
        )}

        {analysis && !isLoading && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Executive Summary</h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                {analysis.summary}
              </p>
            </div>

            {analysis.risks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Potential Risks
                </h3>
                <ul className="space-y-2">
                  {analysis.risks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-slate-700 bg-red-50/50 p-2 rounded border-l-2 border-red-400">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.formattingIssues && analysis.formattingIssues.length > 0 && (
              <div>
                 <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Formatting & References</h3>
                 <ul className="space-y-1 list-disc list-inside">
                    {analysis.formattingIssues.map((issue, idx) => (
                        <li key={idx} className="text-xs text-slate-600">{issue}</li>
                    ))}
                 </ul>
              </div>
            )}
            
            <div className="pt-4 mt-4 border-t border-slate-100">
                 <button 
                    onClick={onAnalyze}
                    className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                 >
                    Refresh Analysis
                 </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisSidebar;