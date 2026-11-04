import React from 'react';
import { UploadCloud, Sliders, DownloadCloud } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Select or Drag Your PDF',
      desc: 'Upload your document directly from your computer, phone, or tablet. No sign-up or installation required.',
      icon: UploadCloud,
    },
    {
      num: '02',
      title: 'Edit, Transform, or Convert',
      desc: 'Use our powerful browser-side engine to modify text, merge pages, compress size, sign, or extract data.',
      icon: Sliders,
    },
    {
      num: '03',
      title: 'Download Pristine Document',
      desc: 'Save your completed PDF instantly with original formatting intact. Memory buffers are immediately wiped.',
      icon: DownloadCloud,
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How PDFGenius Works
          </h2>
          <p className="text-sm text-slate-600">
            Streamlined document processing in three effortless steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xl font-bold text-slate-300">
                      {step.num}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <span>Fast in-memory execution</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
