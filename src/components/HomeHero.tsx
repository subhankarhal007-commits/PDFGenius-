import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { createDemoPdf, loadPdfJsDoc } from '../utils/pdfEngine';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Lock, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const HomeHero: React.FC = () => {
  const { openToolWithFile, showToast } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processIncomingFile(dropped);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processIncomingFile(file);
    }
    e.target.value = '';
  };

  const processIncomingFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const doc = await loadPdfJsDoc(bytes);
      openToolWithFile('editor', {
        name: file.name,
        bytes,
        pageCount: doc.numPages,
      });
      showToast(`Loaded "${file.name}" with ${doc.numPages} page(s)!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Please upload a valid PDF document.', 'error');
    }
  };

  const handleTryDemo = async () => {
    try {
      setIsGeneratingDemo(true);
      const demoBytes = await createDemoPdf();
      const doc = await loadPdfJsDoc(demoBytes);
      openToolWithFile('editor', {
        name: 'PDFGenius_Sample_Document.pdf',
        bytes: demoBytes,
        pageCount: doc.numPages,
      });
      showToast('Loaded sample document in PDF Editor!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Could not generate sample PDF.', 'error');
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-24 bg-gradient-to-b from-white via-slate-50/60 to-white">
      {/* Subtle background ambient mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-emerald-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Next-Gen In-Browser PDF Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] text-balance">
            Everything You Need to Work with <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">PDF Files</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-2xl mx-auto text-balance">
            Edit, convert, compress, sign and manage your PDF documents online with ease. 100% private in-browser processing with zero software installation.
          </p>
        </div>

        {/* Hero Drag-and-Drop Upload Area */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 border-2 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01] shadow-xl'
                : 'border-slate-200/90 bg-white hover:border-emerald-400 shadow-xl shadow-slate-200/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Drop your PDF here to edit immediately
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports all standard PDF documents up to 50 MB
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Browse Files</span>
                </button>

                <button
                  type="button"
                  onClick={handleTryDemo}
                  disabled={isGeneratingDemo}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/80 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>{isGeneratingDemo ? 'Loading Demo...' : 'Try Demo PDF'}</span>
                </button>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>End-to-End Privacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Instant Processing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>No Registration Needed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature proof strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center">
            <p className="text-2xl font-mono font-bold text-slate-900">100%</p>
            <p className="text-xs text-slate-500 mt-0.5">Client-Side Memory</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center">
            <p className="text-2xl font-mono font-bold text-slate-900">22+</p>
            <p className="text-xs text-slate-500 mt-0.5">Professional Tools</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center">
            <p className="text-2xl font-mono font-bold text-slate-900">&lt; 15ms</p>
            <p className="text-xs text-slate-500 mt-0.5">Rendering Latency</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center">
            <p className="text-2xl font-mono font-bold text-slate-900">Zero</p>
            <p className="text-xs text-slate-500 mt-0.5">Remote Storage Risk</p>
          </div>
        </div>

      </div>
    </section>
  );
};
