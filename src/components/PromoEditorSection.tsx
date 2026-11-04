import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  PenTool, 
  Type, 
  Square, 
  FileSignature, 
  Highlighter, 
  Check, 
  ArrowRight,
  Maximize2
} from 'lucide-react';

export const PromoEditorSection: React.FC = () => {
  const { openToolWithFile } = useApp();

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Studio Canvas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            The Advanced Online PDF Editor
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Experience desktop-grade PDF editing straight in your browser. Annotate contracts, insert signatures, highlight key paragraphs, and export crystal-clear documents.
          </p>
        </div>

        {/* Feature UI Mockup Showcase */}
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm max-w-5xl mx-auto">
          {/* Mock Window Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-mono text-slate-300 ml-2">PDFGenius Studio — Partnership_Agreement.pdf</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-emerald-400 font-semibold">100% In-Memory Safe</span>
            </div>
          </div>

          {/* Interactive Document Preview Mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            {/* Features List */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Direct Text Insertion</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add custom text blocks with typography control, sizing, and styling.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <FileSignature className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Digital Signatures</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Draw, type cursive, or upload PNG signature stamps anywhere.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Highlighter className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Highlight & Shapes</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Draw rectangles, circles, indicator arrows, and markup boxes.
                  </p>
                </div>
              </div>
            </div>

            {/* Document Canvas Illustration Mockup */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 text-slate-900 shadow-xl relative min-h-[320px] flex flex-col justify-between">
              
              {/* Fake Document Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">NON-DISCLOSURE AGREEMENT</h5>
                    <p className="text-[10px] text-slate-400 font-mono">Doc ID: NDA-2026-8812 · Encrypted</p>
                  </div>
                  <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    P
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  This Mutual Agreement is entered into as of November 2, 2026. The parties desire to explore a mutual business venture regarding document processing automation.
                </p>

                {/* Highlight Callout */}
                <div className="bg-yellow-200/80 px-2 py-1 rounded text-xs text-slate-800 font-medium border border-yellow-300">
                  Confidential information shall be kept strictly protected and purged immediately.
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Neither party shall disclose any trade secrets or proprietary algorithms without prior written consent.
                </p>

                {/* Signature Stamp Mock */}
                <div className="pt-4 flex items-center justify-between">
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 w-52">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Authorized Signatory</p>
                    <p className="text-base text-purple-700 italic font-serif" style={{ fontFamily: 'cursive' }}>
                      Alexandra Vance
                    </p>
                    <div className="text-[9px] text-emerald-700 flex items-center gap-1 mt-1 font-mono">
                      <Check className="w-2.5 h-2.5" />
                      <span>Certified Signature · 2026-11-02</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400">Page 1 of 1</span>
                  </div>
                </div>
              </div>

              {/* Floating Action Overlay */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Interactive real-time canvas ready for immediate editing.
                </span>
                <button
                  onClick={() => openToolWithFile('editor')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Open Full Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
