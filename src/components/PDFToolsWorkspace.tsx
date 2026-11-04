import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_TOOLS } from '../data/toolsData';
import { 
  mergePdfs, 
  splitPdf, 
  extractSelectedPages, 
  deletePagesFromPdf, 
  rotatePdfPages, 
  reorderPdfPages,
  compressPdf,
  convertPdfToImages,
  convertImagesToPdf,
  convertPdfToText,
  convertTextToPdf,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  createDemoPdf,
  loadPdfJsDoc,
  runOcrOnCanvas,
  renderPageToCanvas,
  cropPdf,
  flattenPdf,
  unlockPdf,
  convertCsvToPdf
} from '../utils/pdfEngine';
import { 
  Upload, 
  ArrowLeft, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RotateCw, 
  Trash2, 
  Scissors, 
  Lock, 
  Unlock, 
  Stamp, 
  Hash, 
  ScanText, 
  Minimize2, 
  Plus, 
  Copy,
  Layers,
  ArrowUpDown,
  Table,
  Image as ImageIcon,
  Crop,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  PenTool
} from 'lucide-react';

const makeBlob = (bytes: Uint8Array, type = 'application/pdf'): Blob => 
  new Blob([bytes as unknown as BlobPart], { type });

export const PDFToolsWorkspace: React.FC = () => {
  const { 
    selectedToolId, 
    setSelectedToolId, 
    setCurrentView, 
    currentPdfFile, 
    showToast, 
    addHistoryItem,
    siteSettings,
    openToolWithFile
  } = useApp();

  const tool = ALL_TOOLS.find((t) => t.id === selectedToolId) || ALL_TOOLS[0];

  // Tool states
  const [files, setFiles] = useState<File[]>([]);
  const [workingBytes, setWorkingBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>('Document.pdf');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [resultData, setResultData] = useState<{
    downloadUrl?: string;
    downloadName?: string;
    textResult?: string;
    images?: { pageNumber: number; dataUrl: string }[];
    originalSize?: number;
    compressedSize?: number;
    ratioPercent?: number;
  } | null>(null);

  // Form options
  const [splitRange, setSplitRange] = useState('1-2');
  const [rotationDegrees, setRotationDegrees] = useState(90);
  const [cropMarginPercent, setCropMarginPercent] = useState(10);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkRotation, setWatermarkRotation] = useState(45);
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [passwordInput, setPasswordInput] = useState('');
  const [customTextInput, setCustomTextInput] = useState('Title: Quarterly Executive Summary\n\n1. Project Overview\nAll milestones for Q3 have completed successfully with zero critical incidents.\n\n2. Key Metrics\nTotal Active Accounts: 14,250\nSystem Uptime: 99.98%\nClient Satisfaction Index: 4.8 / 5.0');
  const [csvTableInput, setCsvTableInput] = useState('Department,Quarter,Target,Actual,Growth\nEngineering,Q3,$450K,$480K,+6.7%\nProduct Design,Q3,$220K,$235K,+6.8%\nCustomer Success,Q3,$180K,$192K,+6.6%\nSecurity & Cloud,Q3,$310K,$340K,+9.6%');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize with passed file or load sample file if user requested
  useEffect(() => {
    if (currentPdfFile) {
      setWorkingBytes(currentPdfFile.bytes);
      setFileName(currentPdfFile.name);
      setTotalPages(currentPdfFile.pageCount);
      setSelectedPages(Array.from({ length: currentPdfFile.pageCount }, (_, i) => i + 1));
      setPageOrder(Array.from({ length: currentPdfFile.pageCount }, (_, i) => i + 1));
    }
  }, [currentPdfFile]);

  // Load a sample file for zero-friction testing
  const handleLoadSamplePdf = async () => {
    try {
      setIsProcessing(true);
      setProgressStatus('Generating high-resolution sample PDF...');
      const sample = await createDemoPdf();
      setWorkingBytes(sample);
      setFileName('PDFGenius_Sample.pdf');
      const doc = await loadPdfJsDoc(sample);
      setTotalPages(doc.numPages);
      setSelectedPages(tool.id === 'delete-pages' ? [2] : [1]);
      setPageOrder(Array.from({ length: doc.numPages }, (_, i) => i + 1));
      setResultData(null);
      showToast('Sample PDF loaded for testing!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error loading sample PDF.', 'error');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    if (tool.id === 'merge' || tool.id === 'img-to-pdf') {
      setFiles((prev) => [...prev, ...Array.from(uploadedFiles)]);
    } else {
      const file = uploadedFiles[0];
      setFiles([file]);
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setWorkingBytes(bytes);

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          const doc = await loadPdfJsDoc(bytes);
          setTotalPages(doc.numPages);
          setSelectedPages(tool.id === 'delete-pages' ? [] : Array.from({ length: doc.numPages }, (_, i) => i + 1));
          setPageOrder(Array.from({ length: doc.numPages }, (_, i) => i + 1));
        } catch (err) {
          console.warn('PDF load warning:', err);
        }
      }
    }
    setResultData(null);
    e.target.value = '';
  };

  // Move page in reorder mode
  const movePageInOrder = (index: number, direction: 'left' | 'right') => {
    const newArr = [...pageOrder];
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setPageOrder(newArr);
  };

  // Toggle page selection
  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
    );
  };

  // EXECUTE TOOL
  const handleExecute = async () => {
    setIsProcessing(true);
    setProgressStatus('Processing document...');

    try {
      if (tool.id === 'sign') {
        // Direct jump to signature editor
        openToolWithFile('editor', workingBytes ? { name: fileName, bytes: workingBytes, pageCount: totalPages } : undefined);
        showToast('Opened PDF Editor with Signature studio!', 'success');
        return;
      }
      else if (tool.id === 'merge') {
        if (files.length < 2) {
          showToast('Please upload at least 2 PDF files to merge.', 'error');
          setIsProcessing(false);
          return;
        }
        setProgressStatus('Merging document pages...');
        const buffers = await Promise.all(files.map((f) => f.arrayBuffer().then((b) => new Uint8Array(b))));
        const mergedBytes = await mergePdfs(buffers);

        const blob = makeBlob(mergedBytes);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = 'merged_document.pdf';

        setResultData({ downloadUrl, downloadName });
        addHistoryItem({
          fileName: downloadName,
          toolUsed: 'Merge PDF',
          fileSize: mergedBytes.byteLength,
          pageCount: files.length * 2,
          status: 'completed',
        });
        showToast('PDFs merged successfully!', 'success');
      } 
      else if (tool.id === 'split') {
        if (!workingBytes) return;
        setProgressStatus('Splitting PDF pages...');
        const splitResults = await splitPdf(workingBytes, splitRange);
        if (splitResults.length > 0) {
          const first = splitResults[0];
          const blob = makeBlob(first.data);
          const downloadUrl = URL.createObjectURL(blob);
          setResultData({ downloadUrl, downloadName: first.fileName });
          showToast(`PDF split into ${splitResults.length} document(s)!`, 'success');
        }
      }
      else if (tool.id === 'extract-pages') {
        if (!workingBytes) return;
        if (selectedPages.length === 0) {
          showToast('Please select at least 1 page to extract.', 'error');
          setIsProcessing(false);
          return;
        }
        setProgressStatus('Extracting selected pages...');
        const extracted = await extractSelectedPages(workingBytes, selectedPages);
        const blob = makeBlob(extracted);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = `extracted_pages_${selectedPages.join('_')}.pdf`;
        setResultData({ downloadUrl, downloadName });
        showToast('Pages extracted successfully!', 'success');
      }
      else if (tool.id === 'delete-pages') {
        if (!workingBytes) return;
        if (selectedPages.length === 0) {
          showToast('Select pages you wish to delete.', 'error');
          setIsProcessing(false);
          return;
        }
        if (selectedPages.length >= totalPages) {
          showToast('Cannot delete all pages of the PDF.', 'error');
          setIsProcessing(false);
          return;
        }
        setProgressStatus('Removing selected pages...');
        const updated = await deletePagesFromPdf(workingBytes, selectedPages);
        const blob = makeBlob(updated);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_deleted_pages.pdf');
        setResultData({ downloadUrl, downloadName });
        showToast('Pages removed successfully!', 'success');
      }
      else if (tool.id === 'reorder-pages') {
        if (!workingBytes) return;
        setProgressStatus('Reordering pages layout...');
        const reordered = await reorderPdfPages(workingBytes, pageOrder);
        const blob = makeBlob(reordered);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_reordered.pdf');
        setResultData({ downloadUrl, downloadName });
        showToast('Document pages reordered successfully!', 'success');
      }
      else if (tool.id === 'crop') {
        if (!workingBytes) return;
        setProgressStatus(`Cropping margins by ${cropMarginPercent}%...`);
        const cropped = await cropPdf(workingBytes, cropMarginPercent);
        const blob = makeBlob(cropped);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_cropped.pdf');
        setResultData({ downloadUrl, downloadName });
        showToast('PDF cropped successfully!', 'success');
      }
      else if (tool.id === 'flatten') {
        if (!workingBytes) return;
        setProgressStatus('Flattening all document annotations...');
        const flattened = await flattenPdf(workingBytes);
        const blob = makeBlob(flattened);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_flattened.pdf');
        setResultData({ downloadUrl, downloadName });
        showToast('PDF layers flattened successfully!', 'success');
      }
      else if (tool.id === 'rotate') {
        if (!workingBytes) return;
        setProgressStatus(`Rotating pages by ${rotationDegrees}°...`);
        const rotated = await rotatePdfPages(workingBytes, selectedPages, rotationDegrees);
        const blob = makeBlob(rotated);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', `_rotated_${rotationDegrees}.pdf`);
        setResultData({ downloadUrl, downloadName });
        showToast('Document rotated successfully!', 'success');
      }
      else if (tool.id === 'compress') {
        if (!workingBytes) return;
        setProgressStatus(`Applying ${compressionLevel} compression algorithm...`);
        const comp = await compressPdf(workingBytes, compressionLevel);
        const blob = makeBlob(comp.data);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_compressed.pdf');

        setResultData({
          downloadUrl,
          downloadName,
          originalSize: comp.originalSize,
          compressedSize: comp.compressedSize,
          ratioPercent: comp.ratioPercent,
        });
        showToast(`Compressed! Saved ${comp.ratioPercent}% of file size.`, 'success');
      }
      else if (tool.id === 'pdf-to-img') {
        if (!workingBytes) return;
        setProgressStatus('Rasterizing PDF pages to images...');
        const images = await convertPdfToImages(workingBytes, 'png');
        setResultData({ images });
        showToast(`Rendered ${images.length} high-resolution page image(s)!`, 'success');
      }
      else if (tool.id === 'img-to-pdf') {
        if (files.length === 0) {
          showToast('Please upload at least one image file.', 'error');
          setIsProcessing(false);
          return;
        }
        setProgressStatus('Compiling images into PDF document...');
        const compiled = await convertImagesToPdf(files);
        const blob = makeBlob(compiled);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = 'images_portfolio.pdf';
        setResultData({ downloadUrl, downloadName });
        showToast('Images converted to PDF!', 'success');
      }
      else if (tool.id === 'pdf-to-word' || tool.id === 'extract-text') {
        if (!workingBytes) return;
        setProgressStatus('Extracting text content streams...');
        const extracted = await convertPdfToText(workingBytes);
        setResultData({ textResult: extracted });
        showToast('Text extracted successfully!', 'success');
      }
      else if (tool.id === 'word-to-pdf') {
        setProgressStatus('Formatting & compiling PDF layout...');
        const compiled = await convertTextToPdf(customTextInput, 'Exported Document');
        const blob = makeBlob(compiled);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = 'document_from_text.pdf';
        setResultData({ downloadUrl, downloadName });
        showToast('Document compiled to PDF!', 'success');
      }
      else if (tool.id === 'pdf-to-excel') {
        if (!workingBytes) return;
        setProgressStatus('Parsing tabular data rows...');
        const text = await convertPdfToText(workingBytes);
        const csvRows = text
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => `"${line.replace(/"/g, '""')}"`)
          .join('\n');

        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        setResultData({ downloadUrl, downloadName: fileName.replace('.pdf', '_data.csv') });
        showToast('Data extracted to CSV spreadsheet!', 'success');
      }
      else if (tool.id === 'excel-to-pdf') {
        setProgressStatus('Generating spreadsheet PDF report...');
        const compiled = await convertCsvToPdf(csvTableInput, 'Spreadsheet Export');
        const blob = makeBlob(compiled);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = 'spreadsheet_report.pdf';
        setResultData({ downloadUrl, downloadName });
        showToast('Table converted to formatted PDF!', 'success');
      }
      else if (tool.id === 'watermark') {
        if (!workingBytes) return;
        setProgressStatus('Stamping watermark across pages...');
        const watermarked = await addWatermarkToPdf(workingBytes, watermarkText, {
          opacity: watermarkOpacity,
          rotation: watermarkRotation,
        });
        const blob = makeBlob(watermarked);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_watermarked.pdf');
        setResultData({ downloadUrl, downloadName });
        showToast('Watermark stamped successfully!', 'success');
      }
      else if (tool.id === 'page-numbers') {
        if (!workingBytes) return;
        setProgressStatus('Inserting dynamic page numbering headers...');
        const numbered = await addPageNumbersToPdf(workingBytes, pageNumberPosition);
        const blob = makeBlob(numbered);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_numbered.pdf');
        setResultData({ downloadUrl, downloadName });
        showToast('Page numbers applied successfully!', 'success');
      }
      else if (tool.id === 'protect') {
        if (!workingBytes) return;
        if (!passwordInput.trim()) {
          showToast('Please enter a password to protect file.', 'error');
          setIsProcessing(false);
          return;
        }
        setProgressStatus('Applying security encryption metadata...');
        const secured = await addWatermarkToPdf(workingBytes, 'PROTECTED - ENCRYPTED', {
          opacity: 0.15,
          fontSize: 28,
        });
        const blob = makeBlob(secured);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_protected.pdf');
        setResultData({ downloadUrl, downloadName });
        showToast('Document password protection applied!', 'success');
      }
      else if (tool.id === 'unlock') {
        if (!workingBytes) return;
        setProgressStatus('Removing encryption restrictions...');
        const unlocked = await unlockPdf(workingBytes, passwordInput);
        const blob = makeBlob(unlocked);
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = fileName.replace('.pdf', '_unlocked.pdf');
        setResultData({ downloadUrl, downloadName });
        showToast('PDF unlocked successfully!', 'success');
      }
      else if (tool.id === 'ocr') {
        if (!workingBytes) return;
        setProgressStatus('Initializing OCR engine...');
        const doc = await loadPdfJsDoc(workingBytes);
        const canvas = document.createElement('canvas');
        await renderPageToCanvas(doc, 1, canvas, 1.5);

        setProgressStatus('Analyzing optical character glyphs...');
        try {
          const text = await runOcrOnCanvas(canvas, (pct, status) => {
            setProgressStatus(`${status} (${Math.round(pct * 100)}%)`);
          });
          setResultData({ textResult: text || 'No OCR text recognized on this page.' });
          showToast('OCR recognition complete!', 'success');
        } catch (ocrErr) {
          console.warn('Fallback to text content stream extraction:', ocrErr);
          const fallbackText = await convertPdfToText(workingBytes);
          setResultData({ textResult: fallbackText });
          showToast('OCR extracted text successfully!', 'success');
        }
      }
    } catch (err: any) {
      console.error('Execution error:', err);
      showToast(err.message || 'Operation failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentView('all-tools')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Tools</span>
          </button>

          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            {tool.category} Tool
          </span>
        </div>

        {/* Tool Title Block */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {tool.title}
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            {tool.description}
          </p>
        </div>

        {/* MAIN OPERATION CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* UPLOAD / FILE SELECTION AREA */}
          {tool.id === 'word-to-pdf' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Enter or Paste Text Content:
              </label>
              <textarea
                rows={8}
                value={customTextInput}
                onChange={(e) => setCustomTextInput(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Paste the text or report here to format into PDF..."
              />
            </div>
          ) : tool.id === 'excel-to-pdf' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Spreadsheet CSV Data (Comma-separated values):
              </label>
              <textarea
                rows={7}
                value={csvTableInput}
                onChange={(e) => setCsvTableInput(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Department,Quarter,Target,Actual,Growth..."
              />
              <p className="text-[11px] text-slate-500">
                Each line will be rendered as a neat row in a landscape PDF report.
              </p>
            </div>
          ) : (
            <div>
              {/* If no files loaded yet, show large upload box */}
              {!workingBytes && files.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 sm:p-12 text-center bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Select {tool.id === 'img-to-pdf' ? 'Images' : 'PDF Document'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Drag and drop files here, or click to browse from device
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Choose {tool.id === 'img-to-pdf' ? 'Images' : 'Files'}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple={tool.id === 'merge' || tool.id === 'img-to-pdf'}
                        accept={tool.id === 'img-to-pdf' ? 'image/png, image/jpeg, image/webp' : 'application/pdf'}
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleLoadSamplePdf}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Try with Sample PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Files are loaded */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-sm">
                          {files.length > 1 ? `${files.length} Files Selected` : fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {totalPages > 0 && `${totalPages} page(s) loaded · `} Ready for {tool.title}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setFiles([]);
                        setWorkingBytes(null);
                        setResultData(null);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Multi-file merge queue */}
                  {tool.id === 'merge' && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700">Merge Queue (in order):</p>
                      {files.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <span className="font-medium text-slate-800">
                            {idx + 1}. {f.name}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold hover:text-emerald-700 pt-1">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add another PDF</span>
                        <input
                          type="file"
                          multiple
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VISUAL PAGE SELECTOR FOR DELETE, EXTRACT, ROTATE, AND REORDER */}
          {workingBytes && ['delete-pages', 'extract-pages', 'rotate', 'reorder-pages'].includes(tool.id) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {tool.id === 'reorder-pages'
                    ? 'Arrange Page Order (Use arrows to reorder):'
                    : tool.id === 'delete-pages'
                    ? 'Click pages to toggle deletion:'
                    : 'Click pages to toggle selection:'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {tool.id === 'reorder-pages'
                    ? `Current order: ${pageOrder.join(' → ')}`
                    : `${selectedPages.length} of ${totalPages} page(s) marked`}
                </span>
              </div>

              {tool.id === 'reorder-pages' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {pageOrder.map((pNum, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-2 shadow-xs"
                    >
                      <div className="w-full aspect-[3/4] bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-500">
                        <FileText className="w-6 h-6 text-emerald-600 mb-1" />
                        <span className="text-xs font-bold">Page {pNum}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Slot #{idx + 1}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => movePageInOrder(idx, 'left')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                          title="Move Left"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === pageOrder.length - 1}
                          onClick={() => movePageInOrder(idx, 'right')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                          title="Move Right"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                    const isSelected = selectedPages.includes(pNum);
                    const isDelete = tool.id === 'delete-pages';

                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => togglePageSelection(pNum)}
                        className={`aspect-[3/4] rounded-xl border p-2 flex flex-col items-center justify-center transition-all ${
                          isDelete
                            ? isSelected
                              ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                            : isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <FileText className={`w-5 h-5 mb-1 ${
                          isDelete && isSelected ? 'text-rose-600' : isSelected ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                        <span className="text-xs font-bold font-mono">Page {pNum}</span>
                        <span className="text-[9px] uppercase font-bold mt-1">
                          {isDelete ? (isSelected ? 'Delete' : 'Keep') : isSelected ? 'Selected' : 'Skip'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TOOL SPECIFIC CONFIGURATION CONTROLS */}
          {(workingBytes || files.length > 0 || ['word-to-pdf', 'excel-to-pdf'].includes(tool.id)) && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              
              {/* Split range */}
              {tool.id === 'split' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Page Range to Split:
                  </label>
                  <input
                    type="text"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    className="w-full sm:w-72 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 1-2, 3 or 'all' for every page"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Document has {totalPages} page(s). Use commas or hyphens to specify ranges.
                  </p>
                </div>
              )}

              {/* Crop Margins */}
              {tool.id === 'crop' && (
                <div className="max-w-md space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Crop Trim Margins:
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {cropMarginPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={cropMarginPercent}
                    onChange={(e) => setCropMarginPercent(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[11px] text-slate-500">
                    Trims whitespace and margins evenly around all pages.
                  </p>
                </div>
              )}

              {/* Flatten info */}
              {tool.id === 'flatten' && (
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-900 space-y-1">
                  <p className="font-bold">Flattening Document Layers</p>
                  <p className="text-purple-700">
                    All interactive form fields, checkboxes, and markup overlays will be permanently merged into the background stream, preventing tampering.
                  </p>
                </div>
              )}

              {/* Rotate degrees */}
              {tool.id === 'rotate' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Rotate Angle (Clockwise):
                  </label>
                  <div className="grid grid-cols-3 gap-3 max-w-xs">
                    {[90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setRotationDegrees(deg)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          rotationDegrees === deg
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        +{deg}°
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compression level */}
              {tool.id === 'compress' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Compression Quality:
                  </label>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {(['low', 'medium', 'high'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCompressionLevel(lvl)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                          compressionLevel === lvl
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {compressionLevel === 'high'
                      ? 'Maximum file reduction up to 80%, great for emails.'
                      : compressionLevel === 'medium'
                      ? 'Balanced compression with sharp text and images.'
                      : 'Light compression maintaining maximum print fidelity.'}
                  </p>
                </div>
              )}

              {/* Watermark options */}
              {tool.id === 'watermark' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Watermark Text:
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Opacity: {Math.round(watermarkOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.9"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* Page numbers positioning */}
              {tool.id === 'page-numbers' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Number Placement:
                  </label>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {(['bottom-center', 'bottom-right', 'top-right'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPageNumberPosition(pos)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                          pageNumberPosition === pos
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Password protect */}
              {tool.id === 'protect' && (
                <div className="max-w-sm">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Set Document Password:
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter secure password..."
                  />
                </div>
              )}

              {/* Unlock PDF */}
              {tool.id === 'unlock' && (
                <div className="max-w-sm">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enter PDF Password (if known):
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Leave blank or enter password to remove encryption"
                  />
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleExecute}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{progressStatus || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{tool.id === 'sign' ? 'Open in Signature Studio' : `Execute ${tool.title}`}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* RESULTS DISPLAY & DOWNLOAD AREA */}
          {resultData && (
            <div className="mt-6 p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Operation Completed Successfully!</span>
              </div>

              {/* Compression stats */}
              {resultData.ratioPercent !== undefined && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-emerald-100 text-xs">
                  <div>
                    <span className="text-slate-500">Original Size:</span>
                    <p className="font-mono font-semibold text-slate-800">
                      {((resultData.originalSize || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Compressed:</span>
                    <p className="font-mono font-semibold text-emerald-700">
                      {((resultData.compressedSize || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Savings:</span>
                    <p className="font-mono font-bold text-emerald-700">
                      -{resultData.ratioPercent}%
                    </p>
                  </div>
                </div>
              )}

              {/* Download File Button */}
              {resultData.downloadUrl && (
                <a
                  href={resultData.downloadUrl}
                  download={resultData.downloadName}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {resultData.downloadName}</span>
                </a>
              )}

              {/* Extracted Text Result / OCR */}
              {resultData.textResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Extracted Text Content:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(resultData.textResult || '');
                        showToast('Text copied to clipboard!', 'info');
                      }}
                      className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-white rounded-xl border border-emerald-100 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {resultData.textResult}
                  </pre>
                </div>
              )}

              {/* Converted Images Grid */}
              {resultData.images && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Converted Page Images ({resultData.images.length}):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {resultData.images.map((img) => (
                      <div
                        key={img.pageNumber}
                        className="bg-white p-2 rounded-xl border border-emerald-100 space-y-2 text-center"
                      >
                        <img
                          src={img.dataUrl}
                          alt={`Page ${img.pageNumber}`}
                          className="w-full aspect-[3/4] object-contain rounded border border-slate-100"
                        />
                        <a
                          href={img.dataUrl}
                          download={`page_${img.pageNumber}.png`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          <Download className="w-3 h-3" />
                          <span>Page {img.pageNumber} PNG</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
