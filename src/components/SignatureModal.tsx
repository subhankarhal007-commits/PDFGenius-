import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Check, RotateCcw, Pen, Type, Upload, Sparkles } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageDataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('John Doe');
  const [selectedFont, setSelectedFont] = useState<'dancing' | 'caveat' | 'serif'>('dancing');
  const [signatureColor, setSignatureColor] = useState('#0f172a');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Setup canvas resolution and context
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = signatureColor;
  }, [signatureColor]);

  useEffect(() => {
    if (isOpen && tab === 'draw') {
      // Small timeout to ensure canvas is mounted and measured
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tab, initCanvas]);

  if (!isOpen) return null;

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    setHasDrawn(true);

    ctx.strokeStyle = signatureColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Draw immediate dot so single clicks/taps create a mark
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Generate typed signature dataUrl
  const generateTypedSignatureDataUrl = (name: string, fontType: string, color: string): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 520;
    tempCanvas.height = 150;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    let fontString = 'italic 46px "Dancing Script", cursive';
    if (fontType === 'caveat') {
      fontString = '600 48px "Caveat", cursive';
    } else if (fontType === 'serif') {
      fontString = 'italic 40px "Playfair Display", Georgia, serif';
    }

    ctx.font = fontString;
    ctx.fillText(name || 'Signature', 260, 75);
    return tempCanvas.toDataURL('image/png');
  };

  const handleApplySignature = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
        onClose();
        return;
      }
      // If user hasn't drawn anything yet, generate a realistic cursive signature from their name
      const fallbackUrl = generateTypedSignatureDataUrl(typedName || 'Legal Signature', 'dancing', signatureColor);
      onSave(fallbackUrl);
      onClose();
    } else if (tab === 'type') {
      const dataUrl = generateTypedSignatureDataUrl(typedName || 'Signature', selectedFont, signatureColor);
      onSave(dataUrl);
      onClose();
    } else if (tab === 'upload') {
      if (previewImage) {
        onSave(previewImage);
        onClose();
      }
    }
  };

  // Quick preset signature handler
  const handleApplyPreset = (fontType: 'dancing' | 'caveat' | 'serif') => {
    const dataUrl = generateTypedSignatureDataUrl(typedName || 'Legal Signature', fontType, signatureColor);
    onSave(dataUrl);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPreviewImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Add Digital Signature</h3>
            <p className="text-[11px] text-slate-500">Sign with handwritten stroke, styled script, or image</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => setTab('draw')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'draw'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setTab('type')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'type'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Name</span>
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'upload'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-40 sm:h-44 touch-none block bg-transparent cursor-crosshair"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs font-medium px-4 text-center">
                    <Pen className="w-6 h-6 mb-1 text-slate-300" />
                    <span>Draw your signature with your finger, mouse, or stylus</span>
                  </div>
                )}
                {/* Signature baseline guide */}
                <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-slate-200 pointer-events-none" />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 transition-colors font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear canvas</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Ink Color:</span>
                  {[
                    { color: '#0f172a', label: 'Black' },
                    { color: '#1e3a8a', label: 'Navy' },
                    { color: '#047857', label: 'Emerald' }
                  ].map(({ color, label }) => (
                    <button
                      key={color}
                      type="button"
                      title={label}
                      onClick={() => setSignatureColor(color)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        signatureColor === color ? 'border-slate-800 scale-125 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Quick One-Click Presets */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Or use instant handwritten style:</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('dancing')}
                    className="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left"
                  >
                    <span className="text-base text-slate-800 block truncate" style={{ fontFamily: '"Dancing Script", cursive' }}>
                      {typedName || 'Quick Sign'}
                    </span>
                    <span className="text-[10px] text-slate-400">Calligraphy &rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('caveat')}
                    className="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left"
                  >
                    <span className="text-base text-slate-800 block truncate" style={{ fontFamily: '"Caveat", cursive' }}>
                      {typedName || 'Quick Sign'}
                    </span>
                    <span className="text-[10px] text-slate-400">Handwritten &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name or Initials
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g. Johnathan Doe"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedFont('dancing')}
                  className={`p-3 border rounded-xl text-center transition-all ${
                    selectedFont === 'dancing'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <p className="text-xl truncate" style={{ fontFamily: '"Dancing Script", cursive', color: signatureColor }}>
                    {typedName || 'Signature'}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">Dancing Script</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFont('caveat')}
                  className={`p-3 border rounded-xl text-center transition-all ${
                    selectedFont === 'caveat'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <p className="text-xl truncate" style={{ fontFamily: '"Caveat", cursive', color: signatureColor }}>
                    {typedName || 'Signature'}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">Caveat Casual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFont('serif')}
                  className={`p-3 border rounded-xl text-center transition-all ${
                    selectedFont === 'serif'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <p className="text-base font-serif italic truncate" style={{ color: signatureColor }}>
                    {typedName || 'Signature'}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">Executive Serif</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="text-slate-500 font-medium">Ink Color:</span>
                {[
                  { color: '#0f172a', label: 'Black' },
                  { color: '#1e3a8a', label: 'Navy Blue' },
                  { color: '#047857', label: 'Forest Green' }
                ].map(({ color, label }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onClick={() => setSignatureColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      signatureColor === color ? 'border-slate-900 scale-110 shadow-xs' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-3">
              {previewImage ? (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center space-y-3">
                  <div className="h-32 w-full flex items-center justify-center bg-white rounded-lg border border-slate-200/80 p-2">
                    <img src={previewImage} alt="Uploaded signature" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(null)}
                      className="text-xs text-rose-600 font-medium hover:underline"
                    >
                      Remove & Choose Another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 text-center bg-slate-50/60">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Upload signature image</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                    PNG, JPG or WebP image with white or transparent background
                  </p>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs">
                    <span>Browse Image</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleApplySignature}
            disabled={tab === 'upload' && !previewImage}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
