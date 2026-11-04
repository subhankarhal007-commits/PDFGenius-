import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Lock, 
  Smartphone, 
  FileCheck2 
} from 'lucide-react';

export const WhyChooseSection: React.FC = () => {
  const reasons = [
    {
      title: 'Zero Remote Data Retention',
      desc: 'Unlike traditional tools that upload your files to unknown third-party servers, PDFGenius processes your documents directly inside your browser memory. When you close the tab, the buffer is gone.',
      icon: ShieldCheck,
    },
    {
      title: 'WebAssembly Core Speed',
      desc: 'Powered by modern JavaScript and WebAssembly compiled engines (pdf-lib & pdf.js), rendering and page manipulation execute in milliseconds with zero queue delays.',
      icon: Cpu,
    },
    {
      title: '22+ Unified PDF Tools',
      desc: 'Never juggle between separate sites for editing, merging, converting, OCR, watermarking, and compressing. Everything works in one unified modern interface.',
      icon: Layers,
    },
    {
      title: 'Bank-Grade Security & Metadata',
      desc: 'Enforce password encryption, strip unwanted metadata, flatten layers, and preserve legal document confidentiality with zero data leaks.',
      icon: Lock,
    },
    {
      title: 'Fully Mobile Optimized',
      desc: 'Edit contracts, sign signatures, and compress documents seamlessly on your iPhone, iPad, Android phone, or laptop without installing any heavy apps.',
      icon: Smartphone,
    },
    {
      title: 'Honest, High-Accuracy Output',
      desc: 'Clean vector rendering and exact coordinate scaling ensures that downloaded files look identical across Adobe Acrobat, Google Chrome, and standard printers.',
      icon: FileCheck2,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Professionals Choose PDFGenius
          </h2>
          <p className="text-sm text-slate-600">
            Engineered for speed, rigorous security, and zero document privacy compromises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/50 hover:border-emerald-300 transition-all shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
