import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_TOOLS } from '../data/toolsData';
import { ToolCategory, PDFTool } from '../types';
import { 
  PenTool, 
  FileSignature, 
  Layers, 
  Files, 
  Scissors, 
  RotateCw, 
  Trash2, 
  FileUp, 
  ArrowUpDown, 
  Crop, 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  Images, 
  Table, 
  FileSpreadsheet, 
  Minimize2, 
  Lock, 
  Unlock, 
  Stamp, 
  ScanText, 
  FileSearch, 
  Hash,
  ArrowRight
} from 'lucide-react';

// Icon mapping helper
const renderIcon = (name: string, className = 'w-5 h-5') => {
  switch (name) {
    case 'PenTool': return <PenTool className={className} />;
    case 'FileSignature': return <FileSignature className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Files': return <Files className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'RotateCw': return <RotateCw className={className} />;
    case 'Trash2': return <Trash2 className={className} />;
    case 'FileUp': return <FileUp className={className} />;
    case 'ArrowUpDown': return <ArrowUpDown className={className} />;
    case 'Crop': return <Crop className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'FileCode': return <FileCode className={className} />;
    case 'Image': return <ImageIcon className={className} />;
    case 'Images': return <Images className={className} />;
    case 'Table': return <Table className={className} />;
    case 'FileSpreadsheet': return <FileSpreadsheet className={className} />;
    case 'Minimize2': return <Minimize2 className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'Unlock': return <Unlock className={className} />;
    case 'Stamp': return <Stamp className={className} />;
    case 'ScanText': return <ScanText className={className} />;
    case 'FileSearch': return <FileSearch className={className} />;
    case 'Hash': return <Hash className={className} />;
    default: return <FileText className={className} />;
  }
};

export const PopularToolsSection: React.FC = () => {
  const { openToolWithFile, siteSettings } = useApp();
  const [filter, setFilter] = useState<ToolCategory>('all');

  const categories: { key: ToolCategory; label: string }[] = [
    { key: 'all', label: 'All Tools' },
    { key: 'edit', label: 'Edit & Sign' },
    { key: 'manage', label: 'Organize Pages' },
    { key: 'convert', label: 'Convert' },
    { key: 'compress', label: 'Compress' },
    { key: 'security', label: 'Security' },
    { key: 'advanced', label: 'OCR & AI' },
  ];

  const filteredTools = ALL_TOOLS.filter((t) => {
    if (siteSettings.disabledTools?.includes(t.id)) return false;
    if (filter === 'all') return true;
    return t.category === filter;
  });

  return (
    <section id="tools" className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular PDF Tools
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a specialized tool to start processing your documents in seconds.
            </p>
          </div>

          {/* Interactive filter segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  filter === c.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => openToolWithFile(tool.id)}
              className="group cursor-pointer rounded-2xl border border-slate-200/90 hover:border-emerald-400 bg-white hover:bg-slate-50/40 p-5 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                    {renderIcon(tool.icon)}
                  </div>
                  {tool.badge && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors">
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
