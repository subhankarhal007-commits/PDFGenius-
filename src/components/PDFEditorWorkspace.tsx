import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  createDemoPdf, 
  loadPdfJsDoc, 
  renderPageToCanvas, 
  saveAnnotationsToPdf,
  rotatePdfPages,
  setPdfPageAbsoluteRotation,
  deletePagesFromPdf
} from '../utils/pdfEngine';
import { AnnotationElement, EditorTool, ShapeType } from '../types';
import { SignatureModal } from './SignatureModal';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Save, 
  Undo, 
  Redo, 
  Type, 
  Pen, 
  Highlighter, 
  Square, 
  Circle, 
  ArrowRight, 
  Image as ImageIcon, 
  FileSignature, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  MousePointer,
  Sparkles,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Maximize2,
  SlidersHorizontal,
  X,
  Check,
  ArrowLeft,
  Eraser,
  ScanText
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

export const PDFEditorWorkspace: React.FC = () => {
  const { currentPdfFile, setCurrentView, showToast, addHistoryItem } = useApp();

  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // PDF Document states
  const [pdfJsDoc, setPdfJsDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return Math.min(1.0, Math.max(0.48, (window.innerWidth - 32) / 595));
    }
    return 1.25;
  });
  const [fileName, setFileName] = useState<string>('Document.pdf');
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  // Active Tool & Editing State
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [annotations, setAnnotations] = useState<AnnotationElement[]>([]);
  const [historyStack, setHistoryStack] = useState<AnnotationElement[][]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationElement[][]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Modals & Drawers
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false); // default closed on mobile, toggleable
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const [isRotationDrawerOpen, setIsRotationDrawerOpen] = useState(false);
  const [pageRotation, setPageRotation] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showExistingTextOverlay, setShowExistingTextOverlay] = useState<boolean>(false);
  const [isDetectingText, setIsDetectingText] = useState<boolean>(false);
  const [detectedTextItems, setDetectedTextItems] = useState<Array<{
    id: string;
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  }>>([]);
  const isInitializedRef = useRef(false);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);

  // Canvas dimensions in CSS pixels
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 800 });
  const mainViewportRef = useRef<HTMLElement | null>(null);

  // Auto-fit to width function (works seamlessly for portrait and rotated landscape)
  const handleFitToWidth = useCallback(async () => {
    if (!pdfJsDoc) return;
    try {
      const page = await pdfJsDoc.getPage(currentPage);
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const docPageWidth = unscaledViewport.width || 595;
      
      const viewportEl = mainViewportRef.current;
      const availableWidth = viewportEl 
        ? Math.max(280, viewportEl.clientWidth - 40)
        : (typeof window !== 'undefined' ? Math.max(280, window.innerWidth - 32) : 500);

      const calculatedScale = Math.min(2.0, Math.max(0.35, availableWidth / docPageWidth));
      setZoomScale(Number(calculatedScale.toFixed(2)));
      showToast(`Fit to view: ${Math.round(calculatedScale * 100)}%`, 'info');
    } catch (e) {
      console.error(e);
    }
  }, [pdfJsDoc, currentPage, showToast]);

  // Load initial PDF file or create demo PDF
  const loadPdfData = useCallback(async (data: Uint8Array, name: string, keepAnnotations = false) => {
    try {
      setIsLoadingPdf(true);
      setPdfBytes(data);
      setFileName(name);
      const doc = await loadPdfJsDoc(data);
      setPdfJsDoc(doc);
      setTotalPages(doc.numPages);
      if (!keepAnnotations) {
        setCurrentPage(1);
        setAnnotations([]);
        setHistoryStack([]);
        setRedoStack([]);
        setSelectedElementId(null);
      }

      // On phone, auto-fit to width
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        const fitScale = Math.min(1.0, Math.max(0.48, (window.innerWidth - 32) / 595));
        setZoomScale(fitScale);
      }
    } catch (err) {
      console.error('Failed to load PDF in editor:', err);
      showToast('Could not load PDF document. Please check file format.', 'error');
    } finally {
      setIsLoadingPdf(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (currentPdfFile) {
      loadPdfData(currentPdfFile.bytes, currentPdfFile.name);
      isInitializedRef.current = true;
    } else if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      createDemoPdf().then((demoBytes) => {
        loadPdfData(demoBytes, 'PDFGenius_Sample_Document.pdf');
      });
    }
  }, [currentPdfFile]);

  // Render current page when page, scale, or doc changes
  useEffect(() => {
    if (!pdfJsDoc || !canvasRef.current) return;
    let isCancelled = false;

    renderPageToCanvas(pdfJsDoc, currentPage, canvasRef.current, zoomScale)
      .then((dim) => {
        if (!isCancelled) {
          setCanvasDimensions(dim);
        }
      })
      .catch((err) => {
        console.error('Render page error:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfJsDoc, currentPage, zoomScale]);

  // Push to Undo history
  const pushStateToHistory = (newAnnotations: AnnotationElement[]) => {
    setHistoryStack((prev) => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations(newAnnotations);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setRedoStack((prev) => [...prev, annotations]);
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setAnnotations(previous);
    setSelectedElementId(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistoryStack((prev) => [...prev, annotations]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setAnnotations(next);
    setSelectedElementId(null);
  };

  // Add text element onto the canvas (at default or custom clicked coordinates)
  const handleAddText = (customText?: string, customX?: number, customY?: number) => {
    const x = customX !== undefined ? customX : Math.max(20, Math.floor(canvasDimensions.width * 0.15));
    const y = customY !== undefined ? customY : Math.max(40, Math.floor(canvasDimensions.height * 0.2));
    const newElement: AnnotationElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      page: currentPage,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.min(220, canvasDimensions.width - 40),
      height: 38,
      text: customText !== undefined ? customText : 'Type your text here...',
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#0f172a',
      backgroundColor: 'transparent',
      opacity: 1,
    };
    pushStateToHistory([...annotations, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
    if (isMobile) setShowMobileProperties(true);
    showToast(customText === '' ? 'Text box placed! Start typing.' : 'Text box added! Drag or type to edit.', 'success');
  };

  // Add whiteout eraser patch
  const handleAddWhiteout = (customX?: number, customY?: number) => {
    const x = customX !== undefined ? customX : Math.max(20, Math.floor(canvasDimensions.width * 0.2));
    const y = customY !== undefined ? customY : Math.max(40, Math.floor(canvasDimensions.height * 0.25));
    const newElement: AnnotationElement = {
      id: `eraser_${Date.now()}`,
      type: 'eraser',
      page: currentPage,
      x: Math.round(x),
      y: Math.round(y),
      width: 140,
      height: 30,
      strokeColor: '#ffffff',
      strokeWidth: 1,
      fillColor: '#ffffff',
      backgroundColor: '#ffffff',
      opacity: 1,
    };
    pushStateToHistory([...annotations, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
    if (isMobile) setShowMobileProperties(true);
    showToast('Whiteout eraser placed! Drag & resize over text to hide it.', 'success');
  };

  // Detect and highlight existing text from the PDF page
  const handleToggleEditExistingText = async () => {
    if (showExistingTextOverlay) {
      setShowExistingTextOverlay(false);
      return;
    }

    if (!pdfJsDoc) return;
    setIsDetectingText(true);
    try {
      const page = await pdfJsDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoomScale });
      const textContent = await page.getTextContent();
      const items: Array<{
        id: string;
        str: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize: number;
      }> = [];

      for (let i = 0; i < textContent.items.length; i++) {
        const item = textContent.items[i] as any;
        if (!item.str || !item.str.trim()) continue;

        const tx = item.transform[4];
        const ty = item.transform[5];
        const fontHeight = Math.hypot(item.transform[2], item.transform[3]) || item.height || 12;
        const [vx, vy] = viewport.convertToViewportPoint(tx, ty);

        const fontSize = Math.max(11, Math.round(fontHeight * zoomScale));
        const width = Math.max(24, Math.round((item.width || (item.str.length * 7)) * zoomScale));
        const height = Math.max(16, Math.round(fontSize * 1.3));
        const x = Math.max(0, Math.round(vx));
        const y = Math.max(0, Math.round(vy - height * 0.85));

        items.push({
          id: `det_${currentPage}_${i}`,
          str: item.str,
          x,
          y,
          width,
          height,
          fontSize,
        });
      }

      setDetectedTextItems(items);
      setShowExistingTextOverlay(true);
      if (items.length > 0) {
        showToast(`Detected ${items.length} existing text lines. Click any line to edit or erase it!`, 'info');
      } else {
        showToast('No selectable text found on this page (might be a scanned image). Try adding new text or whiteout.', 'info');
      }
    } catch (err) {
      console.error('Scan text error:', err);
      showToast('Could not scan page text.', 'error');
    } finally {
      setIsDetectingText(false);
    }
  };

  // Samples background color around coordinates on the underlying rendered PDF canvas to blend seamlessly
  const sampleCanvasBgColor = useCallback((x: number, y: number): string => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.width || !canvas.height) return 'transparent';
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return 'transparent';

      const scaleX = canvas.width / (canvasDimensions.width || 1);
      const scaleY = canvas.height / (canvasDimensions.height || 1);

      // Check nearby points (to the left, above, and around text) to find background color
      const probes = [
        { px: Math.round((x - 4) * scaleX), py: Math.round((y + 4) * scaleY) },
        { px: Math.round((x + 4) * scaleX), py: Math.round((y - 4) * scaleY) },
        { px: Math.round((x - 6) * scaleX), py: Math.round((y - 2) * scaleY) },
        { px: Math.round((x + 2) * scaleX), py: Math.round((y + 2) * scaleY) },
      ];

      for (const p of probes) {
        const sx = Math.max(0, Math.min(canvas.width - 1, p.px));
        const sy = Math.max(0, Math.min(canvas.height - 1, p.py));
        const pixel = ctx.getImageData(sx, sy, 1, 1).data;
        // Check if pixel is opaque and not text ink (sum > 120)
        if (pixel[3] > 100 && (pixel[0] + pixel[1] + pixel[2] > 120)) {
          const r = pixel[0].toString(16).padStart(2, '0');
          const g = pixel[1].toString(16).padStart(2, '0');
          const b = pixel[2].toString(16).padStart(2, '0');
          return `#${r}${g}${b}`;
        }
      }
      return 'transparent';
    } catch {
      return 'transparent';
    }
  }, [canvasDimensions]);

  // Convert an existing PDF text item into an editable overlay
  const handleSelectDetectedText = (item: {
    id: string;
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  }) => {
    // Hide that item from detection overlay
    setDetectedTextItems((prev) => prev.filter((d) => d.id !== item.id));

    // Sample the background color from canvas behind this text item so it blends with the document
    const sampledBg = sampleCanvasBgColor(item.x, item.y);

    const newElement: AnnotationElement = {
      id: `existing_text_${Date.now()}`,
      type: 'text',
      page: currentPage,
      x: item.x,
      y: item.y,
      width: Math.max(item.width + 12, 120),
      height: Math.max(item.height + 4, 28),
      text: item.str,
      fontSize: item.fontSize,
      fontFamily: 'Helvetica',
      color: '#0f172a',
      backgroundColor: sampledBg !== 'transparent' ? sampledBg : 'transparent',
      opacity: 1,
    };

    pushStateToHistory([...annotations, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
    if (isMobile) {
      setShowMobileProperties(true);
    }
    showToast('Original text loaded! Background blended with page.', 'success');
  };

  // Add shape
  const handleAddShape = (shape: ShapeType) => {
    const isLine = shape === 'line' || shape === 'arrow';
    const newElement: AnnotationElement = {
      id: `shape_${Date.now()}`,
      type: 'shape',
      shapeType: shape,
      page: currentPage,
      x: Math.max(20, Math.floor(canvasDimensions.width * 0.15)),
      y: Math.max(40, Math.floor(canvasDimensions.height * 0.25)),
      width: isLine ? 160 : 140,
      height: isLine ? 4 : 90,
      strokeColor: '#059669', // Emerald
      strokeWidth: 3,
      fillColor: 'transparent',
      opacity: 1,
    };
    pushStateToHistory([...annotations, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
    if (isMobile) setShowMobileProperties(true);
  };

  // Add highlight rectangle
  const handleAddHighlight = () => {
    const newElement: AnnotationElement = {
      id: `hl_${Date.now()}`,
      type: 'highlight',
      page: currentPage,
      x: Math.max(20, Math.floor(canvasDimensions.width * 0.1)),
      y: Math.max(40, Math.floor(canvasDimensions.height * 0.2)),
      width: Math.min(240, canvasDimensions.width - 40),
      height: 24,
      opacity: 0.4,
    };
    pushStateToHistory([...annotations, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
  };

  // Add digital signature
  const handleSignatureSave = (imageDataUrl: string) => {
    if (!imageDataUrl) {
      showToast('Signature could not be created.', 'error');
      return;
    }

    const cWidth = canvasDimensions.width > 50 ? canvasDimensions.width : 595;
    const cHeight = canvasDimensions.height > 50 ? canvasDimensions.height : 842;

    // Standard signature dimensions: scaled comfortably relative to canvas
    const sigWidth = Math.max(140, Math.min(220, Math.floor(cWidth * 0.38)));
    const sigHeight = Math.max(55, Math.round(sigWidth * (75 / 220)));
    
    // Position comfortably in the visible upper-middle of the document so user immediately sees it
    const targetX = Math.max(20, Math.floor((cWidth - sigWidth) / 2));
    const targetY = Math.max(40, Math.min(160, Math.floor(cHeight * 0.22)));

    const newElement: AnnotationElement = {
      id: `sig_${Date.now()}`,
      type: 'signature',
      page: Number(currentPage),
      x: targetX,
      y: targetY,
      width: sigWidth,
      height: sigHeight,
      imageDataUrl,
      opacity: 1,
    };
    pushStateToHistory([...annotations, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
    if (isMobile) {
      setShowMobileProperties(true);
    }
    showToast('Signature placed on page! Drag to reposition or adjust size.', 'success');
  };

  // Handle image upload onto PDF
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        const img = new Image();
        img.onload = () => {
          const naturalW = img.naturalWidth || img.width || 300;
          const naturalH = img.naturalHeight || img.height || 200;
          const aspect = naturalH / naturalW;

          const cWidth = canvasDimensions.width > 50 ? canvasDimensions.width : 595;
          const cHeight = canvasDimensions.height > 50 ? canvasDimensions.height : 842;

          const targetW = Math.max(120, Math.min(220, Math.floor(cWidth * 0.35)));
          const targetH = Math.max(50, Math.round(targetW * (aspect > 0 ? aspect : 0.65)));
          const targetX = Math.max(20, Math.floor((cWidth - targetW) / 2));
          const targetY = Math.max(40, Math.min(160, Math.floor(cHeight * 0.2)));

          const newElement: AnnotationElement = {
            id: `img_${Date.now()}`,
            type: 'image',
            page: Number(currentPage),
            x: targetX,
            y: targetY,
            width: targetW,
            height: targetH,
            imageDataUrl: dataUrl,
            opacity: 1,
          };

          pushStateToHistory([...annotations, newElement]);
          setSelectedElementId(newElement.id);
          setActiveTool('select');
          if (isMobile) {
            setShowMobileProperties(true);
          }
          showToast('Image inserted onto page! Drag to position or resize.', 'success');
        };
        img.onerror = () => {
          const cWidth = canvasDimensions.width > 50 ? canvasDimensions.width : 595;
          const cHeight = canvasDimensions.height > 50 ? canvasDimensions.height : 842;
          const newElement: AnnotationElement = {
            id: `img_${Date.now()}`,
            type: 'image',
            page: Number(currentPage),
            x: Math.max(20, Math.floor(cWidth * 0.15)),
            y: Math.max(40, Math.floor(cHeight * 0.2)),
            width: 160,
            height: 120,
            imageDataUrl: dataUrl,
            opacity: 1,
          };
          pushStateToHistory([...annotations, newElement]);
          setSelectedElementId(newElement.id);
          setActiveTool('select');
          showToast('Image inserted!', 'success');
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    const filtered = annotations.filter((a) => a.id !== selectedElementId);
    pushStateToHistory(filtered);
    setSelectedElementId(null);
    setShowMobileProperties(false);
  };

  // Rotate current page by delta (e.g. +90 or -90)
  const handleRotatePageDelta = async (degreesDelta = 90) => {
    if (!pdfBytes) return;
    try {
      setIsLoadingPdf(true);
      const newAngle = (((pageRotation + degreesDelta) % 360) + 360) % 360;
      const rotated = await setPdfPageAbsoluteRotation(pdfBytes, [currentPage], newAngle);
      setPageRotation(newAngle);
      await loadPdfData(rotated, fileName, true);
      showToast(`Page ${currentPage} rotated ${degreesDelta > 0 ? '+' : ''}${degreesDelta}° to ${newAngle}°.`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Could not rotate page.', 'error');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Set current page to specific absolute rotation (0, 90, 180, 270)
  const handleSetPageRotation = async (targetDeg: number) => {
    if (!pdfBytes) return;
    try {
      setIsLoadingPdf(true);
      const target = (((targetDeg % 360) + 360) % 360);
      const rotated = await setPdfPageAbsoluteRotation(pdfBytes, [currentPage], target);
      setPageRotation(target);
      await loadPdfData(rotated, fileName, true);
      showToast(`Page ${currentPage} rotation set to ${target}°.`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Could not rotate page.', 'error');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Set selected element rotation angle
  const handleSetElementRotation = (targetDeg: number) => {
    if (!selectedElementId) return;
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === selectedElementId ? { ...a, rotation: targetDeg } : a
      )
    );
    showToast(`Element rotated to ${targetDeg}°`, 'success');
  };

  // Rotate selected element 90° clockwise
  const handleRotateSelectedElement = () => {
    if (!selectedElementId) return;
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id === selectedElementId) {
          const nextRot = ((a.rotation || 0) + 90) % 360;
          return { ...a, rotation: nextRot };
        }
        return a;
      })
    );
    showToast('Element rotated 90°', 'success');
  };

  // Main Rotate Action (opens rotation drawer to let user select 90°, 180°, 270°, or step rotation)
  const handleRotateClick = () => {
    setIsRotationDrawerOpen(true);
  };

  // Delete current page
  const handleDeleteCurrentPage = async () => {
    if (!pdfBytes || totalPages <= 1) {
      showToast('Cannot delete the only page in document.', 'error');
      return;
    }
    try {
      const updated = await deletePagesFromPdf(pdfBytes, [currentPage]);
      await loadPdfData(updated, fileName);
      showToast(`Page ${currentPage} removed.`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Could not delete page.', 'error');
    }
  };

  // Save and download final PDF
  const handleDownloadPdf = async () => {
    if (!pdfBytes) return;
    try {
      setIsSaving(true);
      const outputBytes = await saveAnnotationsToPdf(
        pdfBytes,
        annotations,
        canvasDimensions.width,
        canvasDimensions.height
      );

      const blob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace(/\.pdf$/i, '') + '_edited.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addHistoryItem({
        fileName: a.download,
        toolUsed: 'PDF Editor',
        fileSize: outputBytes.byteLength,
        pageCount: totalPages,
        status: 'completed',
      });

      showToast('PDF compiled & downloaded successfully!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to generate final PDF. Try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Touch and Mouse Dragging & Resizing
  const [dragState, setDragState] = useState<{
    elementId: string;
    startX: number;
    startY: number;
    elemX: number;
    elemY: number;
  } | null>(null);

  type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'e' | 's' | 'w' | 'n';

  interface ResizeState {
    elementId: string;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
  }

  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  const startDragMouse = (e: React.MouseEvent, element: AnnotationElement) => {
    e.stopPropagation();
    setSelectedElementId(element.id);
    setDragState({
      elementId: element.id,
      startX: e.clientX,
      startY: e.clientY,
      elemX: element.x,
      elemY: element.y,
    });
  };

  const startDragTouch = (e: React.TouchEvent, element: AnnotationElement) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    setSelectedElementId(element.id);
    const touch = e.touches[0];
    setDragState({
      elementId: element.id,
      startX: touch.clientX,
      startY: touch.clientY,
      elemX: element.x,
      elemY: element.y,
    });
  };

  const startResizeMouse = (e: React.MouseEvent, element: AnnotationElement, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(element.id);
    setResizeState({
      elementId: element.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initX: element.x,
      initY: element.y,
      initW: element.width,
      initH: element.height,
    });
  };

  const startResizeTouch = (e: React.TouchEvent, element: AnnotationElement, handle: ResizeHandle) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setSelectedElementId(element.id);
    const touch = e.touches[0];
    setResizeState({
      elementId: element.id,
      handle,
      startX: touch.clientX,
      startY: touch.clientY,
      initX: element.x,
      initY: element.y,
      initW: element.width,
      initH: element.height,
    });
  };

  const handleResizeMove = (clientX: number, clientY: number) => {
    if (!resizeState) return;
    const dx = clientX - resizeState.startX;
    const dy = clientY - resizeState.startY;

    setAnnotations((prev) =>
      prev.map((item) => {
        if (item.id !== resizeState.elementId) return item;

        let newX = resizeState.initX;
        let newY = resizeState.initY;
        let newW = resizeState.initW;
        let newH = resizeState.initH;

        const isLine = item.shapeType === 'line' || item.shapeType === 'arrow';
        const minW = isLine ? 20 : 25;
        const minH = isLine ? 4 : 20;

        if (resizeState.handle === 'se') {
          newW = Math.max(minW, resizeState.initW + dx);
          newH = Math.max(minH, resizeState.initH + dy);
        } else if (resizeState.handle === 'sw') {
          const potW = resizeState.initW - dx;
          if (potW >= minW) {
            newW = potW;
            newX = resizeState.initX + dx;
          }
          newH = Math.max(minH, resizeState.initH + dy);
        } else if (resizeState.handle === 'ne') {
          newW = Math.max(minW, resizeState.initW + dx);
          const potH = resizeState.initH - dy;
          if (potH >= minH) {
            newH = potH;
            newY = resizeState.initY + dy;
          }
        } else if (resizeState.handle === 'nw') {
          const potW = resizeState.initW - dx;
          if (potW >= minW) {
            newW = potW;
            newX = resizeState.initX + dx;
          }
          const potH = resizeState.initH - dy;
          if (potH >= minH) {
            newH = potH;
            newY = resizeState.initY + dy;
          }
        } else if (resizeState.handle === 'e') {
          // Horizontal stretch (longer / "lomba")
          newW = Math.max(minW, resizeState.initW + dx);
        } else if (resizeState.handle === 's') {
          // Vertical stretch (taller / "choto-boro")
          newH = Math.max(minH, resizeState.initH + dy);
        } else if (resizeState.handle === 'w') {
          const potW = resizeState.initW - dx;
          if (potW >= minW) {
            newW = potW;
            newX = resizeState.initX + dx;
          }
        } else if (resizeState.handle === 'n') {
          const potH = resizeState.initH - dy;
          if (potH >= minH) {
            newH = potH;
            newY = resizeState.initY + dy;
          }
        }

        return {
          ...item,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        };
      })
    );
  };

  const onMouseMoveOverlay = (e: React.MouseEvent) => {
    if (resizeState) {
      handleResizeMove(e.clientX, e.clientY);
      return;
    }
    if (dragState) {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setAnnotations((prev) =>
        prev.map((item) =>
          item.id === dragState.elementId
            ? { ...item, x: Math.max(0, dragState.elemX + dx), y: Math.max(0, dragState.elemY + dy) }
            : item
        )
      );
    }
  };

  const onTouchMoveOverlay = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (resizeState) {
      if (e.cancelable) e.preventDefault();
      handleResizeMove(touch.clientX, touch.clientY);
      return;
    }
    if (dragState) {
      if (e.cancelable) e.preventDefault();
      const dx = touch.clientX - dragState.startX;
      const dy = touch.clientY - dragState.startY;
      setAnnotations((prev) =>
        prev.map((item) =>
          item.id === dragState.elementId
            ? { ...item, x: Math.max(0, dragState.elemX + dx), y: Math.max(0, dragState.elemY + dy) }
            : item
        )
      );
    }
  };

  const endDrag = () => {
    if (dragState || resizeState) {
      pushStateToHistory(annotations);
    }
    setDragState(null);
    setResizeState(null);
  };

  // Canvas Background Click: places text or deselects/commits active element
  const handleCanvasBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'text') {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clickX = Math.max(10, Math.min(canvasDimensions.width - 160, e.clientX - rect.left));
      const clickY = Math.max(10, Math.min(canvasDimensions.height - 30, e.clientY - rect.top));
      handleAddText('', clickX, clickY);
      return;
    }

    if (activeTool === 'eraser') {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clickX = Math.max(10, Math.min(canvasDimensions.width - 120, e.clientX - rect.left));
      const clickY = Math.max(10, Math.min(canvasDimensions.height - 24, e.clientY - rect.top));
      handleAddWhiteout(clickX, clickY);
      return;
    }

    if (selectedElementId) {
      setSelectedElementId(null);
      setShowMobileProperties(false);
      showToast('Position saved in document!', 'success');
    }
  };

  // Canvas Background Touch End: commits placement on mobile screen tap
  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragState || resizeState) {
      endDrag();
      return;
    }

    if (activeTool === 'text') {
      const touch = e.changedTouches[0];
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clickX = Math.max(10, Math.min(canvasDimensions.width - 160, touch.clientX - rect.left));
      const clickY = Math.max(10, Math.min(canvasDimensions.height - 30, touch.clientY - rect.top));
      handleAddText('', clickX, clickY);
      return;
    }

    if (activeTool === 'eraser') {
      const touch = e.changedTouches[0];
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clickX = Math.max(10, Math.min(canvasDimensions.width - 120, touch.clientX - rect.left));
      const clickY = Math.max(10, Math.min(canvasDimensions.height - 24, touch.clientY - rect.top));
      handleAddWhiteout(clickX, clickY);
      return;
    }

    if (selectedElementId) {
      setSelectedElementId(null);
      setShowMobileProperties(false);
      showToast('Position saved in document!', 'success');
    }
  };

  const selectedElement = annotations.find((a) => a.id === selectedElementId);
  const currentAnnotationsForPage = annotations.filter((a) => Number(a.page) === Number(currentPage));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100 overflow-hidden select-none relative">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            file.arrayBuffer().then((buf) => {
              loadPdfData(new Uint8Array(buf), file.name);
            });
          }
          e.target.value = '';
        }}
      />
      <input
        ref={imageUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* TOP WORKSPACE TOOLBAR */}
      <div className="h-14 bg-white border-b border-slate-200 px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-4 shrink-0 shadow-xs z-30 max-w-full">
        
        {/* Left: Home/Back, Document Title & Thumbnails trigger */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            onClick={() => setCurrentView('home')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            title="Toggle Page Drawer"
            className={`p-1 sm:p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              showThumbnails
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] sm:text-xs">
              <span className="hidden xs:inline">Pages </span>({currentPage}/{totalPages})
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 max-w-[140px] md:max-w-xs truncate">
            <span className="text-xs font-semibold text-slate-800 truncate" title={fileName}>
              {fileName}
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-emerald-700 font-bold hover:underline shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Center: Undo/Redo & Page Stepper */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80">
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              title="Undo"
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo"
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page stepper */}
          <div className="flex items-center gap-0.5 bg-slate-100 px-1 py-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-0.5 sm:p-1 disabled:opacity-30 hover:text-slate-900"
            >
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold px-0.5 sm:px-1">
              {currentPage}/{totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-0.5 sm:p-1 disabled:opacity-30 hover:text-slate-900"
            >
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Page Rotation Indicator in Top Bar (Desktop/Tablet) */}
          <button
            onClick={() => setIsRotationDrawerOpen(true)}
            title="Page Rotation (Click to choose 90°, 180°, 270°, 0°)"
            className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all shadow-xs ${
              pageRotation > 0
                ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-300'
                : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700 border-slate-200'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${pageRotation > 0 ? 'text-white' : 'text-purple-600'}`} />
            <span className="font-mono text-[11px]">{pageRotation}°</span>
          </button>
        </div>

        {/* Right: Properties on mobile & Download PDF button (Always fully visible, never clipped) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {selectedElement && isMobile && (
            <button
              onClick={() => setShowMobileProperties(!showMobileProperties)}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1"
              title="Style Properties"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={isSaving || !pdfBytes}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition-all shrink-0 ring-2 ring-emerald-500/20 active:scale-95"
            title="Download completed PDF file"
          >
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span className="text-[11px] sm:text-xs font-extrabold tracking-tight">
              {isSaving ? 'Saving...' : 'Download'}
            </span>
          </button>
        </div>
      </div>

      {/* WORKSPACE MAIN BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* DESKTOP LEFT TOOLBAR (Hidden on mobile, mobile gets bottom bar) */}
        <aside className="hidden lg:flex w-14 bg-white border-r border-slate-200 flex-col items-center py-3 gap-2 shrink-0 z-20">
          <button
            onClick={() => {
              setActiveTool('select');
              setSelectedElementId(null);
            }}
            title="Selection Tool"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTool === 'select'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MousePointer className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleAddText()}
            title="Add Text"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Type className="w-4 h-4 text-purple-600" />
          </button>

          <button
            onClick={() => setIsSignatureModalOpen(true)}
            title="Freehand Pen / Signature"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Pen className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={handleAddHighlight}
            title="Highlight Box"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Highlighter className="w-4 h-4 text-amber-500" />
          </button>

          <button
            onClick={() => handleAddShape('rectangle')}
            title="Rectangle"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Square className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={() => handleAddShape('circle')}
            title="Circle"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Circle className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={() => handleAddShape('arrow')}
            title="Arrow Line"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={() => imageUploadRef.current?.click()}
            title="Insert Image / Stamp"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={() => setIsSignatureModalOpen(true)}
            title="Add Digital Signature"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FileSignature className="w-4 h-4 text-purple-600" />
          </button>

          <div className="w-8 h-px bg-slate-200 my-1" />

          <button
            onClick={handleRotateClick}
            title="Rotate Page or Element"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDeleteCurrentPage}
            title="Delete this page"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </aside>

        {/* PAGE THUMBNAILS DRAWER: SLIDE-OVER OVERLAY (DOES NOT SQUEEZE CANVAS) */}
        {showThumbnails && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowThumbnails(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-in fade-in"
            />
            
            <aside className="fixed inset-y-0 left-0 w-64 sm:w-72 bg-white shadow-2xl border-r border-slate-200 flex flex-col p-4 space-y-3 z-50 pt-16 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">
                  Document Pages ({totalPages})
                </span>
                <button
                  onClick={() => setShowThumbnails(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => {
                      setCurrentPage(pNum);
                      setShowThumbnails(false);
                    }}
                    className={`w-full group text-left rounded-xl p-2.5 border transition-all ${
                      currentPage === pNum
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-white rounded-lg shadow-xs border border-slate-200/80 flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 text-xs">
                      <FileText className="w-6 h-6 mb-1 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      <span className="font-mono text-xs font-bold text-slate-700">
                        Page {pNum}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </>
        )}

        {/* CENTER VIEWPORT CANVAS - OCCUPIES 100% OF REMAINING WIDTH */}
        <main
          ref={mainViewportRef}
          className="flex-1 overflow-auto p-3 sm:p-6 flex flex-col items-center justify-start bg-slate-100/90 relative pb-20 lg:pb-6 w-full"
          onMouseMove={onMouseMoveOverlay}
          onMouseUp={endDrag}
          onTouchMove={onTouchMoveOverlay}
          onTouchEnd={endDrag}
          onClick={() => {
            setSelectedElementId(null);
            setShowMobileProperties(false);
          }}
        >

          {/* Page Rotation Status Banner (Always clearly shows page rotation at the top) */}
          {pageRotation > 0 && (
            <div className="mb-2.5 py-1 px-3 bg-purple-100/90 text-purple-800 rounded-full border border-purple-300 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
              <RotateCw className="w-3.5 h-3.5 text-purple-600" />
              <span>Page {currentPage} is rotated {pageRotation}° clockwise</span>
              <button
                type="button"
                onClick={() => handleSetPageRotation(0)}
                className="ml-1 text-[11px] underline font-bold text-purple-900 hover:text-purple-700"
              >
                Reset to 0°
              </button>
            </div>
          )}

          {/* Active Tool Guidance Banners */}
          {activeTool === 'text' && (
            <div className="mb-2.5 py-1.5 px-3 bg-purple-600 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
              <Type className="w-3.5 h-3.5" />
              <span>Text Mode Active: Tap anywhere on the page to place cursor</span>
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className="ml-2 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full"
              >
                Cancel
              </button>
            </div>
          )}

          {activeTool === 'eraser' && (
            <div className="mb-2.5 py-1.5 px-3 bg-rose-600 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser Mode: Click or tap anywhere on page to place whiteout</span>
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className="ml-2 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full"
              >
                Cancel
              </button>
            </div>
          )}

          <div
            className="relative shadow-2xl rounded-md bg-white border border-slate-300 transition-transform duration-75 my-auto"
            style={{
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
            }}
          >
            {isLoadingPdf && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 rounded-md">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-700 mt-2">Updating PDF page...</p>
              </div>
            )}

            {/* Underlying Rendered PDF Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 block rounded-md pointer-events-none z-10"
            />

            {/* Interactive Annotation Overlay Layer */}
            <div
              ref={overlayRef}
              onClick={handleCanvasBackgroundClick}
              onTouchEnd={handleCanvasTouchEnd}
              className={`absolute inset-0 overflow-hidden z-20 pointer-events-auto ${
                activeTool === 'text' ? 'cursor-text' : activeTool === 'eraser' ? 'cursor-crosshair' : ''
              }`}
            >
              {/* Existing PDF Text Detection Layer */}
              {showExistingTextOverlay && (
                <div className="absolute inset-0 z-15 pointer-events-auto">
                  {detectedTextItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDetectedText(item);
                      }}
                      className="absolute border border-dashed border-purple-500 bg-purple-500/15 hover:bg-purple-600/30 cursor-pointer rounded-xs transition-colors group"
                      style={{
                        left: `${item.x}px`,
                        top: `${item.y}px`,
                        width: `${item.width}px`,
                        height: `${item.height}px`,
                      }}
                      title={`Click to edit or remove: "${item.str}"`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold bg-purple-800 text-white px-1 py-0.5 rounded absolute -top-4 left-0 whitespace-nowrap shadow-sm pointer-events-none z-30">
                        Click to Edit
                      </span>
                    </div>
                  ))}
                </div>
              )}

                {currentAnnotationsForPage.map((elem) => {
                  const isSelected = selectedElementId === elem.id;

                  return (
                    <div
                      key={elem.id}
                      onMouseDown={(e) => startDragMouse(e, elem)}
                      onTouchStart={(e) => startDragTouch(e, elem)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(elem.id);
                        if (isMobile) setShowMobileProperties(true);
                      }}
                      className={`absolute cursor-move group touch-none ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 ring-offset-1 rounded-sm'
                          : 'hover:ring-1 hover:ring-emerald-400/80'
                      }`}
                      style={{
                        left: `${elem.x}px`,
                        top: `${elem.y}px`,
                        width: `${elem.width}px`,
                        height: `${elem.height}px`,
                        opacity: elem.opacity ?? 1,
                        transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined,
                        transformOrigin: 'center center',
                      }}
                    >
                      {/* Floating Save Action Bar directly on selected element */}
                      {isSelected && (
                        <div
                          className="absolute -top-7 left-0 flex items-center gap-1 z-30 pointer-events-auto select-none"
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedElementId(null);
                              setShowMobileProperties(false);
                              showToast('✓ Saved & locked in place!', 'success');
                            }}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-md flex items-center gap-1 active:scale-95 transition-all"
                            title="Save and lock position"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSelected();
                            }}
                            className="p-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Whiteout Eraser Element */}
                      {elem.type === 'eraser' && (
                        <div className="w-full h-full bg-white border border-dashed border-rose-300 rounded-xs flex items-center justify-center select-none shadow-xs">
                          <span className="text-[9px] text-rose-400 font-semibold uppercase tracking-wider">Whiteout</span>
                        </div>
                      )}
                      {/* Text Element */}
                      {elem.type === 'text' && (
                        isSelected ? (
                          <textarea
                            value={elem.text || ''}
                            onChange={(e) => {
                              const newText = e.target.value;
                              setAnnotations((prev) =>
                                prev.map((a) => (a.id === elem.id ? { ...a, text: newText } : a))
                              );
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            placeholder="Type text..."
                            className="w-full h-full p-1 border border-emerald-500 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none overflow-hidden select-text leading-snug"
                            style={{
                              fontSize: `${elem.fontSize || 16}px`,
                              color: elem.color || '#0f172a',
                              backgroundColor: elem.backgroundColor && elem.backgroundColor !== 'transparent'
                                ? elem.backgroundColor
                                : 'rgba(255, 255, 255, 0.4)',
                              fontFamily: elem.fontFamily || 'sans-serif',
                              fontWeight: elem.fontWeight || 'normal',
                              fontStyle: elem.fontStyle || 'normal',
                              textDecoration: `${elem.isUnderline ? 'underline' : ''} ${
                                elem.isStrikethrough ? 'line-through' : ''
                              }`.trim(),
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full p-1 select-none pointer-events-none break-words whitespace-pre-wrap leading-snug overflow-hidden"
                            style={{
                              fontSize: `${elem.fontSize || 16}px`,
                              color: elem.color || '#0f172a',
                              backgroundColor: elem.backgroundColor || 'transparent',
                              fontFamily: elem.fontFamily || 'sans-serif',
                              fontWeight: elem.fontWeight || 'normal',
                              fontStyle: elem.fontStyle || 'normal',
                              textDecoration: `${elem.isUnderline ? 'underline' : ''} ${
                                elem.isStrikethrough ? 'line-through' : ''
                              }`.trim(),
                            }}
                          >
                            {elem.text || 'Type your text here...'}
                          </div>
                        )
                      )}

                      {/* Highlight Box */}
                      {elem.type === 'highlight' && (
                        <div className="w-full h-full bg-yellow-300/40 rounded-xs" />
                      )}

                      {/* Shape */}
                      {elem.type === 'shape' && (
                        <div className="w-full h-full">
                          {elem.shapeType === 'circle' ? (
                            <div
                              className="w-full h-full rounded-full"
                              style={{
                                border: `${elem.strokeWidth || 2}px solid ${elem.strokeColor || '#059669'}`,
                                backgroundColor: elem.fillColor || 'transparent',
                              }}
                            />
                          ) : elem.shapeType === 'line' || elem.shapeType === 'arrow' ? (
                            <div
                              className="w-full relative"
                              style={{
                                height: `${elem.strokeWidth || 3}px`,
                                backgroundColor: elem.strokeColor || '#059669',
                                top: '50%',
                              }}
                            >
                              {elem.shapeType === 'arrow' && (
                                <div
                                  className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8"
                                  style={{ borderLeftColor: elem.strokeColor || '#059669' }}
                                />
                              )}
                            </div>
                          ) : (
                            <div
                              className="w-full h-full rounded-xs"
                              style={{
                                border: `${elem.strokeWidth || 2}px solid ${elem.strokeColor || '#059669'}`,
                                backgroundColor: elem.fillColor || 'transparent',
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Image / Signature */}
                      {(elem.type === 'signature' || elem.type === 'image') && (
                        <div className="w-full h-full relative flex items-center justify-center select-none">
                          {elem.imageDataUrl ? (
                            <img
                              src={elem.imageDataUrl}
                              alt={elem.type}
                              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xs"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full border-2 border-dashed border-purple-400 bg-purple-50/70 flex items-center justify-center text-[10px] text-purple-700 font-bold p-1 text-center">
                              {elem.type === 'signature' ? '✍️ Signature' : '🖼️ Image'}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute -top-6 left-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm pointer-events-none uppercase tracking-wider whitespace-nowrap z-30">
                              {elem.type === 'signature' ? '✍️ Digital Signature' : '🖼️ Image'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selection Resizer Handles & Quick Action Badges */}
                      {isSelected && (
                        <>
                          {/* Corner Handles */}
                          <div
                            onMouseDown={(e) => startResizeMouse(e, elem, 'nw')}
                            onTouchStart={(e) => startResizeTouch(e, elem, 'nw')}
                            className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-40 touch-none"
                            title="Resize top-left"
                          >
                            <div className="w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-full shadow-xs ring-1 ring-black/10" />
                          </div>

                          <div
                            onMouseDown={(e) => startResizeMouse(e, elem, 'ne')}
                            onTouchStart={(e) => startResizeTouch(e, elem, 'ne')}
                            className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-40 touch-none"
                            title="Resize top-right"
                          >
                            <div className="w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-full shadow-xs ring-1 ring-black/10" />
                          </div>

                          <div
                            onMouseDown={(e) => startResizeMouse(e, elem, 'sw')}
                            onTouchStart={(e) => startResizeTouch(e, elem, 'sw')}
                            className="absolute -bottom-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-40 touch-none"
                            title="Resize bottom-left"
                          >
                            <div className="w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-full shadow-xs ring-1 ring-black/10" />
                          </div>

                          <div
                            onMouseDown={(e) => startResizeMouse(e, elem, 'se')}
                            onTouchStart={(e) => startResizeTouch(e, elem, 'se')}
                            className="absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-40 touch-none"
                            title="Resize bottom-right"
                          >
                            <div className="w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-full shadow-xs ring-1 ring-black/10" />
                          </div>

                          {/* Edge Stretch Handles (Lengthen / Widen / Height) */}
                          <div
                            onMouseDown={(e) => startResizeMouse(e, elem, 'e')}
                            onTouchStart={(e) => startResizeTouch(e, elem, 'e')}
                            className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-6 h-8 flex items-center justify-center cursor-ew-resize z-40 touch-none"
                            title="Stretch width / make longer"
                          >
                            <div className="w-2.5 h-5 bg-white border-2 border-emerald-600 rounded-xs shadow-xs" />
                          </div>

                          <div
                            onMouseDown={(e) => startResizeMouse(e, elem, 's')}
                            onTouchStart={(e) => startResizeTouch(e, elem, 's')}
                            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-8 h-6 flex items-center justify-center cursor-ns-resize z-40 touch-none"
                            title="Stretch height / make taller"
                          >
                            <div className="w-5 h-2.5 bg-white border-2 border-emerald-600 rounded-xs shadow-xs" />
                          </div>

                          {/* Quick Floating Action Badges: Rotate & Delete */}
                          <div className="absolute -top-9 right-0 flex items-center gap-1 z-40">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRotateSelectedElement();
                              }}
                              className="p-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-transform active:scale-90"
                              title="Rotate 90° Clockwise"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSelected();
                              }}
                              className="p-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-transform active:scale-90"
                              title="Delete Element"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
        </main>

        {/* DESKTOP RIGHT PROPERTIES SIDEBAR (Only rendered on xl screens when an element is actively selected) */}
        {selectedElement && (
          <aside className="hidden xl:flex w-64 bg-white border-l border-slate-200 p-4 shrink-0 flex-col justify-between overflow-y-auto z-20 animate-in fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Properties
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete element"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Text styling */}
              {selectedElement.type === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Text Content
                    </label>
                    <textarea
                      rows={3}
                      value={selectedElement.text || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnnotations((prev) =>
                          prev.map((a) => (a.id === selectedElement.id ? { ...a, text: val } : a))
                        );
                      }}
                      placeholder="Type your text here..."
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 resize-y"
                    />
                  </div>

                  {/* Quick presets */}
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">Quick Presets</span>
                    <div className="flex flex-wrap gap-1">
                      {['Approved', 'Paid', 'Confidential', 'Draft', 'Verified'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, text: preset } : a))
                            );
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Font Size
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="10"
                        max="60"
                        value={selectedElement.fontSize || 16}
                        onChange={(e) => {
                          const size = parseInt(e.target.value, 10);
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, fontSize: size } : a))
                          );
                        }}
                        className="w-full accent-emerald-600"
                      />
                      <span className="text-xs font-mono font-medium text-slate-700 min-w-[28px]">
                        {selectedElement.fontSize || 16}px
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {['#0f172a', '#dc2626', '#059669', '#2563eb', '#7c3aed', '#f59e0b', '#ffffff'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, color: c } : a))
                            );
                          }}
                          className={`w-6 h-6 rounded-full border-2 ${
                            selectedElement.color === c ? 'border-slate-800 scale-110' : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id
                              ? { ...a, fontWeight: a.fontWeight === 'bold' ? 'normal' : 'bold' }
                              : a
                          )
                        );
                      }}
                      className={`px-2.5 py-1 text-xs rounded border ${
                        selectedElement.fontWeight === 'bold'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id
                              ? { ...a, fontStyle: a.fontStyle === 'italic' ? 'normal' : 'italic' }
                              : a
                          )
                        );
                      }}
                      className={`px-2.5 py-1 text-xs italic font-serif rounded border ${
                        selectedElement.fontStyle === 'italic'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id ? { ...a, isUnderline: !a.isUnderline } : a
                          )
                        );
                      }}
                      className={`p-1 text-xs rounded border ${
                        selectedElement.isUnderline
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      title="Underline"
                    >
                      <UnderlineIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id ? { ...a, isStrikethrough: !a.isStrikethrough } : a
                          )
                        );
                      }}
                      className={`p-1 text-xs rounded border ${
                        selectedElement.isStrikethrough
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      title="Strikethrough"
                    >
                      <StrikethroughIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Width of text box */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Box Width ({Math.round(selectedElement.width)}px)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, width: a.width + 40 } : a))
                          );
                        }}
                        className="text-[10px] text-purple-700 font-bold hover:underline"
                      >
                        + Wider
                      </button>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max={Math.min(600, canvasDimensions.width - 20)}
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setAnnotations((prev) =>
                          prev.map((a) => (a.id === selectedElement.id ? { ...a, width: val } : a))
                        );
                      }}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* Shape styling & sizing */}
              {selectedElement.type === 'shape' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Stroke Color
                    </label>
                    <div className="flex items-center gap-2">
                      {['#059669', '#7c3aed', '#dc2626', '#2563eb', '#0f172a'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, strokeColor: c } : a))
                            );
                          }}
                          className={`w-6 h-6 rounded-full border-2 ${
                            selectedElement.strokeColor === c ? 'border-slate-800 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Width / Length
                      </label>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold">
                        {Math.round(selectedElement.width)}px
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id
                                ? { ...a, width: Math.max(20, a.width - 20) }
                                : a
                            )
                          );
                        }}
                        className="px-2 py-0.5 text-xs font-bold bg-slate-100 rounded border hover:bg-slate-200"
                        title="Shorten"
                      >
                        -20
                      </button>
                      <input
                        type="range"
                        min="20"
                        max={Math.min(600, Math.max(300, canvasDimensions.width - 10))}
                        value={Math.round(selectedElement.width)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, width: val } : a))
                          );
                        }}
                        className="w-full accent-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id
                                ? { ...a, width: Math.min(600, a.width + 20) }
                                : a
                            )
                          );
                        }}
                        className="px-2 py-0.5 text-xs font-bold bg-slate-100 rounded border hover:bg-slate-200"
                        title="Lengthen"
                      >
                        +20
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Height / Size
                      </label>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold">
                        {Math.round(selectedElement.height)}px
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id
                                ? { ...a, height: Math.max(4, a.height - 20) }
                                : a
                            )
                          );
                        }}
                        className="px-2 py-0.5 text-xs font-bold bg-slate-100 rounded border hover:bg-slate-200"
                        title="Make smaller"
                      >
                        -20
                      </button>
                      <input
                        type="range"
                        min="4"
                        max={Math.min(600, Math.max(300, canvasDimensions.height - 10))}
                        value={Math.round(selectedElement.height)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, height: val } : a))
                          );
                        }}
                        className="w-full accent-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id
                                ? { ...a, height: Math.min(600, a.height + 20) }
                                : a
                            )
                          );
                        }}
                        className="px-2 py-0.5 text-xs font-bold bg-slate-100 rounded border hover:bg-slate-200"
                        title="Make bigger"
                      >
                        +20
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRotateSelectedElement}
                      className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate 90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id
                              ? { ...a, width: a.width + 40 }
                              : a
                          )
                        );
                        showToast('Shape lengthened +40px', 'info');
                      }}
                      className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-center"
                    >
                      Longer (+40)
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Stroke Width ({selectedElement.strokeWidth || 2}px)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={selectedElement.strokeWidth || 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setAnnotations((prev) =>
                          prev.map((a) => (a.id === selectedElement.id ? { ...a, strokeWidth: val } : a))
                        );
                      }}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* Signature & Image Controls */}
              {(selectedElement.type === 'signature' || selectedElement.type === 'image') && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                    <FileSignature className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <p className="font-bold text-purple-900">
                        {selectedElement.type === 'signature' ? 'Digital Signature' : 'Embedded Image'}
                      </p>
                      <p className="text-[10px] text-purple-700">
                        Size: {Math.round(selectedElement.width)} × {Math.round(selectedElement.height)}px
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Signature Width ({Math.round(selectedElement.width)}px)
                    </label>
                    <input
                      type="range"
                      min="80"
                      max={Math.min(500, Math.max(250, canvasDimensions.width - 20))}
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => {
                        const newW = parseInt(e.target.value, 10);
                        const ratio = (selectedElement.height || 70) / (selectedElement.width || 200);
                        const newH = Math.max(25, Math.round(newW * (ratio > 0 ? ratio : 0.35)));
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id ? { ...a, width: newW, height: newH } : a
                          )
                        );
                      }}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>Small</span>
                      <span>Standard</span>
                      <span>Large</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id
                              ? { ...a, x: Math.max(10, Math.floor((canvasDimensions.width - a.width) / 2)) }
                              : a
                          )
                        );
                      }}
                      className="py-1.5 px-2 text-[11px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      Center
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      Change Sign
                    </button>
                  </div>
                </div>
              )}

              {/* Opacity */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Layer Opacity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round((selectedElement.opacity ?? 1) * 100)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) / 100;
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === selectedElement.id ? { ...a, opacity: val } : a))
                      );
                    }}
                    className="w-full accent-emerald-600"
                  />
                  <span className="text-xs font-mono font-medium text-slate-700 min-w-[32px]">
                    {Math.round((selectedElement.opacity ?? 1) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Quick Tips:</p>
              <p>• Click & drag to reposition.</p>
              <p>• Use size slider or handles to scale.</p>
            </div>
          </aside>
        )}

        {/* MOBILE / TABLET PROPERTIES BOTTOM SHEET (Slides up over canvas without squeezing it) */}
        {showMobileProperties && selectedElement && (
          <div className="xl:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-4 max-h-[55vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Style & Properties
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteSelected}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setShowMobileProperties(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="py-3 space-y-3">
              {selectedElement.type === 'text' && (
                <div className="space-y-3">
                  {/* Dedicated Text Content Input (PRIMARY FOR MOBILE) */}
                  <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-purple-700" />
                        <span>Type Text</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {selectedElement.text && (
                          <button
                            type="button"
                            onClick={() => {
                              setAnnotations((prev) =>
                                prev.map((a) => (a.id === selectedElement.id ? { ...a, text: '' } : a))
                              );
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:underline px-1.5 py-0.5 rounded bg-rose-50"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowMobileProperties(false)}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      autoFocus
                      rows={3}
                      value={selectedElement.text || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnnotations((prev) =>
                          prev.map((a) => (a.id === selectedElement.id ? { ...a, text: val } : a))
                        );
                      }}
                      placeholder="Type your text here..."
                      className="w-full p-2.5 text-sm bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium shadow-inner"
                    />

                    {/* Quick 1-tap text presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                      {['Approved', 'Paid', 'Confidential', 'Draft', 'Verified', 'Signature Here'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, text: preset } : a))
                            );
                          }}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 shrink-0 shadow-2xs"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Steppers & Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Font Size ({selectedElement.fontSize || 16}px)
                      </label>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = selectedElement.fontSize || 16;
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, fontSize: Math.max(10, cur - 2) } : a))
                            );
                          }}
                          className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-white rounded"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = selectedElement.fontSize || 16;
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, fontSize: Math.min(60, cur + 2) } : a))
                            );
                          }}
                          className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-white rounded"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={selectedElement.fontSize || 16}
                      onChange={(e) => {
                        const size = parseInt(e.target.value, 10);
                        setAnnotations((prev) =>
                          prev.map((a) => (a.id === selectedElement.id ? { ...a, fontSize: size } : a))
                        );
                      }}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  {/* Text Color Picker */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {[
                        { color: '#0f172a', name: 'Black' },
                        { color: '#dc2626', name: 'Red' },
                        { color: '#059669', name: 'Emerald' },
                        { color: '#2563eb', name: 'Blue' },
                        { color: '#7c3aed', name: 'Purple' },
                        { color: '#f59e0b', name: 'Amber' },
                        { color: '#ffffff', name: 'White' },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => {
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, color: item.color } : a))
                            );
                          }}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            selectedElement.color === item.color
                              ? 'border-slate-900 scale-110 shadow-md ring-2 ring-emerald-400'
                              : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Background Fill Color (Blend seamlessly with document) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Background Fill (Page Blend)</span>
                      <span className="text-[10px] font-mono text-purple-700">
                        {!selectedElement.backgroundColor || selectedElement.backgroundColor === 'transparent'
                          ? 'Transparent'
                          : selectedElement.backgroundColor}
                      </span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, backgroundColor: 'transparent' } : a))
                          );
                          showToast('Background set to Transparent (seamless blend)', 'info');
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                          !selectedElement.backgroundColor || selectedElement.backgroundColor === 'transparent'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        None (Transparent)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const detected = sampleCanvasBgColor(selectedElement.x, selectedElement.y);
                          const chosen = detected !== 'transparent' ? detected : '#ffffff';
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, backgroundColor: chosen } : a))
                          );
                          showToast(`Matched page color: ${chosen}`, 'success');
                        }}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                      >
                        Auto-Match Page
                      </button>

                      {[
                        { color: '#ffffff', name: 'White' },
                        { color: '#f8fafc', name: 'Off-White' },
                        { color: '#f1f5f9', name: 'Light Slate' },
                        { color: '#fef3c7', name: 'Cream' },
                        { color: '#ecfdf5', name: 'Mint' },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => {
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, backgroundColor: item.color } : a))
                            );
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            selectedElement.backgroundColor === item.color
                              ? 'border-slate-900 scale-110 shadow-sm ring-2 ring-emerald-400'
                              : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        />
                      ))}

                      <input
                        type="color"
                        value={selectedElement.backgroundColor && selectedElement.backgroundColor !== 'transparent' ? selectedElement.backgroundColor : '#ffffff'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, backgroundColor: val } : a))
                          );
                        }}
                        className="w-6 h-6 p-0 rounded-full border border-slate-300 cursor-pointer overflow-hidden"
                        title="Custom background color"
                      />
                    </div>
                  </div>

                  {/* Formatting Toggles: Bold, Italic, Underline, Center on page */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id
                                ? { ...a, fontWeight: a.fontWeight === 'bold' ? 'normal' : 'bold' }
                                : a
                            )
                          );
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          selectedElement.fontWeight === 'bold'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        B
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id
                                ? { ...a, fontStyle: a.fontStyle === 'italic' ? 'normal' : 'italic' }
                                : a
                            )
                          );
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center italic font-serif text-xs border ${
                          selectedElement.fontStyle === 'italic'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        I
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id ? { ...a, isUnderline: !a.isUnderline } : a
                            )
                          );
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${
                          selectedElement.isUnderline
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <UnderlineIcon className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id ? { ...a, isStrikethrough: !a.isStrikethrough } : a
                            )
                          );
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${
                          selectedElement.isStrikethrough
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <StrikethroughIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Center Text box on canvas */}
                    <button
                      type="button"
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id
                              ? { ...a, x: Math.max(10, Math.floor((canvasDimensions.width - a.width) / 2)) }
                              : a
                          )
                        );
                        showToast('Text centered on page', 'info');
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100"
                    >
                      Center Box
                    </button>
                  </div>

                  {/* Text Box Width slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Box Width ({Math.round(selectedElement.width)}px)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, width: a.width + 40 } : a))
                          );
                        }}
                        className="text-[10px] text-purple-700 font-bold hover:underline"
                      >
                        + Wider
                      </button>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max={Math.min(500, Math.max(200, canvasDimensions.width - 20))}
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setAnnotations((prev) =>
                          prev.map((a) => (a.id === selectedElement.id ? { ...a, width: val } : a))
                        );
                      }}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              )}

              {selectedElement.type === 'shape' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Stroke Color
                    </label>
                    <div className="flex items-center gap-3">
                      {['#059669', '#7c3aed', '#dc2626', '#2563eb', '#0f172a'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedElement.id ? { ...a, strokeColor: c } : a))
                            );
                          }}
                          className={`w-7 h-7 rounded-full border-2 ${
                            selectedElement.strokeColor === c ? 'border-slate-800 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mobile Width / Length Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Width / Length
                      </label>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold">
                        {Math.round(selectedElement.width)}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id ? { ...a, width: Math.max(20, a.width - 25) } : a
                            )
                          );
                        }}
                        className="px-2 py-1 text-xs font-bold bg-slate-100 rounded-lg border hover:bg-slate-200"
                      >
                        -25
                      </button>
                      <input
                        type="range"
                        min="20"
                        max={Math.min(550, Math.max(250, canvasDimensions.width - 10))}
                        value={Math.round(selectedElement.width)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, width: val } : a))
                          );
                        }}
                        className="w-full accent-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id ? { ...a, width: Math.min(600, a.width + 25) } : a
                            )
                          );
                        }}
                        className="px-2 py-1 text-xs font-bold bg-slate-100 rounded-lg border hover:bg-slate-200"
                      >
                        +25
                      </button>
                    </div>
                  </div>

                  {/* Mobile Height / Tall Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Height / Size
                      </label>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold">
                        {Math.round(selectedElement.height)}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id ? { ...a, height: Math.max(4, a.height - 20) } : a
                            )
                          );
                        }}
                        className="px-2 py-1 text-xs font-bold bg-slate-100 rounded-lg border hover:bg-slate-200"
                      >
                        -20
                      </button>
                      <input
                        type="range"
                        min="4"
                        max={Math.min(550, Math.max(250, canvasDimensions.height - 10))}
                        value={Math.round(selectedElement.height)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === selectedElement.id ? { ...a, height: val } : a))
                          );
                        }}
                        className="w-full accent-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedElement.id ? { ...a, height: Math.min(600, a.height + 20) } : a
                            )
                          );
                        }}
                        className="px-2 py-1 text-xs font-bold bg-slate-100 rounded-lg border hover:bg-slate-200"
                      >
                        +20
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRotateSelectedElement}
                      className="py-2 px-2 text-xs font-bold rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate 90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id
                              ? { ...a, width: a.width + 50 }
                              : a
                          )
                        );
                        showToast('Shape lengthened +50px', 'info');
                      }}
                      className="py-2 px-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-center"
                    >
                      Longer (+50px)
                    </button>
                  </div>
                </div>
              )}

              {/* Signature & Image Mobile Controls */}
              {(selectedElement.type === 'signature' || selectedElement.type === 'image') && (
                <div className="space-y-3 p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <FileSignature className="w-4 h-4 text-purple-600" />
                      <span>{selectedElement.type === 'signature' ? 'Signature Size' : 'Image Size'}</span>
                    </span>
                    <span className="text-[11px] font-mono text-purple-800 font-bold">
                      {Math.round(selectedElement.width)} × {Math.round(selectedElement.height)}px
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Width ({Math.round(selectedElement.width)}px)
                    </label>
                    <input
                      type="range"
                      min="60"
                      max={Math.min(500, Math.max(240, canvasDimensions.width - 20))}
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => {
                        const newW = parseInt(e.target.value, 10);
                        const ratio = (selectedElement.height || 70) / (selectedElement.width || 200);
                        const newH = Math.max(20, Math.round(newW * (ratio > 0 ? ratio : 0.35)));
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id ? { ...a, width: newW, height: newH } : a
                          )
                        );
                      }}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Height / Stretch ({Math.round(selectedElement.height)}px)
                    </label>
                    <input
                      type="range"
                      min="20"
                      max={Math.min(450, Math.max(200, canvasDimensions.height - 20))}
                      value={Math.round(selectedElement.height)}
                      onChange={(e) => {
                        const newH = parseInt(e.target.value, 10);
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id ? { ...a, height: newH } : a
                          )
                        );
                      }}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRotateSelectedElement}
                      className="py-1.5 px-2 text-[11px] font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center gap-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedElement.id
                              ? { ...a, x: Math.max(10, Math.floor((canvasDimensions.width - a.width) / 2)) }
                              : a
                          )
                        );
                      }}
                      className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 text-center shadow-xs"
                    >
                      Center
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-emerald-600 text-white text-center shadow-xs"
                    >
                      New Sign
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Layer Opacity ({Math.round((selectedElement.opacity ?? 1) * 100)}%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={Math.round((selectedElement.opacity ?? 1) * 100)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) / 100;
                    setAnnotations((prev) =>
                      prev.map((a) => (a.id === selectedElement.id ? { ...a, opacity: val } : a))
                    );
                  }}
                  className="w-full accent-emerald-600"
                />
              </div>

              <button
                onClick={() => setShowMobileProperties(false)}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Floating Text Editing Bar (Immediate Text Bar for quick desktop and non-sheet typing) */}
      {selectedElement && selectedElement.type === 'text' && !showMobileProperties && (
        <div className="fixed bottom-16 lg:bottom-4 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 max-w-lg w-[calc(100%-16px)] sm:w-auto z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-200 p-2.5 sm:p-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-4 h-4 text-purple-600 shrink-0" />
            <input
              type="text"
              value={selectedElement.text || ''}
              onChange={(e) => {
                const val = e.target.value;
                setAnnotations((prev) =>
                  prev.map((a) => (a.id === selectedElement.id ? { ...a, text: val } : a))
                );
              }}
              placeholder="Edit text..."
              className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-800"
            />
            <button
              type="button"
              onClick={() => setSelectedElementId(null)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>

          {/* Quick Background Blend Control */}
          <div className="flex items-center justify-between gap-1 py-1 px-1.5 bg-slate-50 rounded-lg border border-slate-100 my-1 text-[11px]">
            <span className="font-bold text-slate-600 text-[10px]">Background:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedElement.id ? { ...a, backgroundColor: 'transparent' } : a))
                  );
                  showToast('Background: Transparent (seamless blend)', 'info');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  !selectedElement.backgroundColor || selectedElement.backgroundColor === 'transparent'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Transparent
              </button>
              <button
                type="button"
                onClick={() => {
                  const sampled = sampleCanvasBgColor(selectedElement.x, selectedElement.y);
                  const chosen = sampled !== 'transparent' ? sampled : '#f8fafc';
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedElement.id ? { ...a, backgroundColor: chosen } : a))
                  );
                  showToast('Background: Matched Page Color', 'success');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
              >
                Match Page
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedElement.id ? { ...a, backgroundColor: '#ffffff' } : a))
                  );
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  selectedElement.backgroundColor === '#ffffff'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                White
              </button>
              <input
                type="color"
                value={selectedElement.backgroundColor && selectedElement.backgroundColor !== 'transparent' ? selectedElement.backgroundColor : '#ffffff'}
                onChange={(e) => {
                  const c = e.target.value;
                  setAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedElement.id ? { ...a, backgroundColor: c } : a))
                  );
                }}
                className="w-4 h-4 p-0 rounded border border-slate-300 cursor-pointer overflow-hidden"
                title="Custom background color"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 flex-wrap pt-1 border-t border-slate-100">
            {/* Font Size Steppers */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const currentSize = selectedElement.fontSize || 16;
                  setAnnotations((prev) =>
                    prev.map((a) =>
                      a.id === selectedElement.id ? { ...a, fontSize: Math.max(10, currentSize - 2) } : a
                    )
                  );
                }}
                className="px-1.5 py-0.5 text-xs font-bold text-slate-700 hover:bg-white rounded"
              >
                A-
              </button>
              <span className="font-mono text-[11px] font-bold px-1 text-slate-700">
                {selectedElement.fontSize || 16}px
              </span>
              <button
                type="button"
                onClick={() => {
                  const currentSize = selectedElement.fontSize || 16;
                  setAnnotations((prev) =>
                    prev.map((a) =>
                      a.id === selectedElement.id ? { ...a, fontSize: Math.min(48, currentSize + 2) } : a
                    )
                  );
                }}
                className="px-1.5 py-0.5 text-xs font-bold text-slate-700 hover:bg-white rounded"
              >
                A+
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1.5">
              {['#0f172a', '#dc2626', '#059669', '#2563eb', '#7c3aed'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setAnnotations((prev) =>
                      prev.map((a) => (a.id === selectedElement.id ? { ...a, color: c } : a))
                    );
                  }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    selectedElement.color === c ? 'border-slate-900 scale-125 shadow-xs' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Bold, Rotate, Delete */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setAnnotations((prev) =>
                    prev.map((a) =>
                      a.id === selectedElement.id
                        ? { ...a, fontWeight: a.fontWeight === 'bold' ? 'normal' : 'bold' }
                        : a
                    )
                  );
                }}
                className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${
                  selectedElement.fontWeight === 'bold'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Bold"
              >
                B
              </button>

              <button
                type="button"
                onClick={handleRotateSelectedElement}
                className="w-7 h-7 rounded flex items-center justify-center text-purple-700 hover:bg-purple-50 border border-purple-200"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDeleteSelected}
                className="w-7 h-7 rounded flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-rose-200"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM TOOLBAR (Floating, touch-friendly, gives 100% width to document!) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-between px-2 sm:px-4 shadow-lg">
        <button
          onClick={() => {
            setActiveTool('select');
            setSelectedElementId(null);
          }}
          className={`p-1.5 rounded-xl flex flex-col items-center justify-center ${
            activeTool === 'select' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'
          }`}
          title="Select"
        >
          <MousePointer className="w-4 h-4" />
          <span className="text-[9px] font-semibold">Select</span>
        </button>

        <button
          onClick={() => {
            if (activeTool === 'text') {
              handleAddText();
            } else {
              setActiveTool('text');
              setSelectedElementId(null);
              showToast('Tap anywhere on the PDF page to place text cursor!', 'info');
            }
          }}
          className={`p-1.5 rounded-xl flex flex-col items-center justify-center transition-colors ${
            activeTool === 'text' ? 'text-purple-700 bg-purple-50 ring-1 ring-purple-300' : 'text-slate-600 hover:text-purple-600'
          }`}
          title="Add Text"
        >
          <Type className="w-4 h-4 text-purple-600" />
          <span className="text-[9px] font-semibold">Text</span>
        </button>

        <button
          onClick={handleToggleEditExistingText}
          disabled={isDetectingText}
          className={`p-1.5 rounded-xl flex flex-col items-center justify-center transition-colors ${
            showExistingTextOverlay ? 'text-purple-700 bg-purple-100 ring-1 ring-purple-400' : 'text-slate-600'
          }`}
          title="Detect and edit existing PDF text"
        >
          <ScanText className={`w-4 h-4 text-purple-600 ${isDetectingText ? 'animate-spin' : ''}`} />
          <span className="text-[9px] font-semibold">Edit PDF</span>
        </button>

        {/* PRIMARY PROMINENT DOWNLOAD BUTTON IN CENTER OF MOBILE TOOLBAR - NEVER COVERED BY CORNER BADGES */}
        <button
          onClick={handleDownloadPdf}
          disabled={isSaving || !pdfBytes}
          className="p-1 px-3 -mt-3.5 rounded-2xl flex flex-col items-center justify-center bg-emerald-600 active:bg-emerald-700 text-white shadow-xl active:scale-95 transition-all shrink-0 font-bold border-2 border-white ring-2 ring-emerald-500/40"
          title="Download PDF Document"
        >
          <Download className="w-4 h-4 text-white animate-bounce" />
          <span className="text-[8.5px] font-black uppercase tracking-tight">{isSaving ? '...' : 'Download'}</span>
        </button>

        <button
          onClick={() => setIsSignatureModalOpen(true)}
          className="p-1.5 rounded-xl flex flex-col items-center justify-center text-slate-600 hover:text-emerald-600"
          title="Draw / Sign"
        >
          <FileSignature className="w-4 h-4 text-emerald-600" />
          <span className="text-[9px] font-semibold">Sign</span>
        </button>

        <button
          onClick={() => handleAddWhiteout()}
          className="p-1.5 rounded-xl flex flex-col items-center justify-center text-slate-600 hover:text-rose-500"
          title="Whiteout Eraser"
        >
          <Eraser className="w-4 h-4 text-rose-500" />
          <span className="text-[9px] font-semibold">Eraser</span>
        </button>

        <button
          onClick={() => imageUploadRef.current?.click()}
          className="p-1.5 rounded-xl flex flex-col items-center justify-center text-slate-600"
          title="Image"
        >
          <ImageIcon className="w-4 h-4 text-blue-600" />
          <span className="text-[9px] font-semibold">Image</span>
        </button>

        <button
          onClick={handleRotateClick}
          className={`p-1.5 rounded-xl flex flex-col items-center justify-center transition-colors ${
            pageRotation > 0 || isRotationDrawerOpen
              ? 'text-purple-700 bg-purple-50 ring-1 ring-purple-300'
              : 'text-slate-600'
          }`}
          title="Rotate (90°, 180°, 270°, 0°)"
        >
          <RotateCw className="w-4 h-4" />
          <span className="text-[9px] font-semibold">{pageRotation > 0 ? `${pageRotation}°` : 'Rotate'}</span>
        </button>
      </div>

      {/* ROTATION CONTROLS BOTTOM SHEET (Opens on Rotate tap: shows 90°, 180°, 270°, 0° and step controls) */}
      {isRotationDrawerOpen && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-purple-200 p-4 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                <RotateCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Rotation Controls
                </h3>
                <p className="text-[11px] text-slate-500">
                  Current Page {currentPage}: <span className="font-bold text-purple-700 font-mono">{pageRotation}°</span>
                  {selectedElement && (
                    <> · Selected Item: <span className="font-bold text-emerald-700 font-mono">{selectedElement.rotation || 0}°</span></>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRotationDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-3 space-y-4">
            {/* Quick Angle Buttons: 90°, 180°, 270°, 0° */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Rotate PDF Page {currentPage}</span>
                <span className="font-mono text-purple-700 text-xs font-bold">{pageRotation}° Current</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { deg: 90, label: '90° Clockwise', sub: 'Quarter turn' },
                  { deg: 180, label: '180° Flip', sub: 'Half turn' },
                  { deg: 270, label: '270° Left', sub: 'Counter-clockwise' },
                  { deg: 0, label: '0° Normal', sub: 'Original' },
                ].map((item) => (
                  <button
                    key={item.deg}
                    type="button"
                    onClick={() => handleSetPageRotation(item.deg)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      pageRotation === item.deg
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300 scale-102'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                    }`}
                  >
                    <span className="font-bold text-sm font-mono">{item.deg}°</span>
                    <span className="text-[10px] font-semibold leading-tight mt-0.5">{item.label}</span>
                    <span className="text-[9px] opacity-75 mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Turn Step Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRotatePageDelta(-90)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-transform"
              >
                <RotateCw className="w-4 h-4 text-purple-600 -scale-x-100" />
                <span>Turn Left (-90°)</span>
              </button>

              <button
                type="button"
                onClick={() => handleRotatePageDelta(90)}
                className="py-2.5 px-3 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-transform"
              >
                <RotateCw className="w-4 h-4 text-purple-600" />
                <span>Turn Right (+90°)</span>
              </button>
            </div>

            {/* Selected Element Rotation (If image, text, signature or shape is selected) */}
            {selectedElement && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Selected {selectedElement.type.toUpperCase()}: {selectedElement.rotation || 0}°</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Active Element
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 90, 180, 270].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSetElementRotation(d)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                        (selectedElement.rotation || 0) === d
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {d}°
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRotateSelectedElement}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate Item +90°</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsRotationDrawerOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
      />
    </div>
  );
};
