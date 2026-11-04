import { PDFTool, PlanConfig } from '../types';

export const ALL_TOOLS: PDFTool[] = [
  // 1. PDF Editor
  {
    id: 'editor',
    title: 'PDF Editor',
    category: 'edit',
    description: 'Add text, images, shapes, signatures, comments and freehand drawings directly on your PDF pages.',
    icon: 'PenTool',
    badge: 'Popular',
    popular: true,
    enabled: true,
  },
  {
    id: 'sign',
    title: 'Sign PDF',
    category: 'edit',
    description: 'Draw or type your legal electronic signature and place it anywhere with certified timestamps.',
    icon: 'FileSignature',
    badge: 'Essential',
    popular: true,
    enabled: true,
  },
  {
    id: 'flatten',
    title: 'Flatten PDF',
    category: 'edit',
    description: 'Merge all annotations, form fields, and layers permanently into the PDF background.',
    icon: 'Layers',
    enabled: true,
  },

  // 2. PDF Management
  {
    id: 'merge',
    title: 'Merge PDF',
    category: 'manage',
    description: 'Combine multiple PDF files into a single organized document in your chosen order.',
    icon: 'Files',
    badge: 'Top Tool',
    popular: true,
    enabled: true,
  },
  {
    id: 'split',
    title: 'Split PDF',
    category: 'manage',
    description: 'Extract custom page ranges or separate every page into individual high-res PDFs.',
    icon: 'Scissors',
    badge: 'Fast',
    popular: true,
    enabled: true,
  },
  {
    id: 'rotate',
    title: 'Rotate Pages',
    category: 'manage',
    description: 'Rotate specific or all pages 90°, 180°, or 270° clockwise with instant live preview.',
    icon: 'RotateCw',
    enabled: true,
  },
  {
    id: 'delete-pages',
    title: 'Delete Pages',
    category: 'manage',
    description: 'Remove unwanted pages effortlessly with thumbnail selection and instant preview.',
    icon: 'Trash2',
    enabled: true,
  },
  {
    id: 'extract-pages',
    title: 'Extract Pages',
    category: 'manage',
    description: 'Select exactly the pages you need and generate a crisp new document in seconds.',
    icon: 'FileUp',
    enabled: true,
  },
  {
    id: 'reorder-pages',
    title: 'Organize Pages',
    category: 'manage',
    description: 'Drag and drop page thumbnails to rearrange document structure seamlessly.',
    icon: 'ArrowUpDown',
    popular: true,
    enabled: true,
  },
  {
    id: 'crop',
    title: 'Crop PDF',
    category: 'manage',
    description: 'Trim margins and crop pages to custom dimensions or standard print sizes.',
    icon: 'Crop',
    enabled: true,
  },

  // 3. PDF Conversion
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    category: 'convert',
    description: 'Convert PDFs to editable DOCX text format while preserving formatting.',
    icon: 'FileText',
    badge: 'High Accuracy',
    popular: true,
    enabled: true,
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    category: 'convert',
    description: 'Convert Microsoft Word and text documents into standard, printer-ready PDFs.',
    icon: 'FileCode',
    enabled: true,
  },
  {
    id: 'pdf-to-img',
    title: 'PDF to JPG / PNG',
    category: 'convert',
    description: 'Extract every PDF page as a pristine, high-resolution JPEG or transparent PNG image.',
    icon: 'Image',
    popular: true,
    enabled: true,
  },
  {
    id: 'img-to-pdf',
    title: 'JPG / PNG to PDF',
    category: 'convert',
    description: 'Turn your photos, scans, and graphic images into a consolidated PDF portfolio.',
    icon: 'Images',
    popular: true,
    enabled: true,
  },
  {
    id: 'pdf-to-excel',
    title: 'PDF to Excel',
    category: 'convert',
    description: 'Extract tables, financial data, and structured columns into CSV and Excel sheets.',
    icon: 'Table',
    enabled: true,
  },
  {
    id: 'excel-to-pdf',
    title: 'Excel to PDF',
    category: 'convert',
    description: 'Convert spreadsheets and CSV tables into elegant, formatted PDF reports.',
    icon: 'FileSpreadsheet',
    enabled: true,
  },

  // 4. PDF Compression
  {
    id: 'compress',
    title: 'Compress PDF',
    category: 'compress',
    description: 'Drastically reduce PDF file size while keeping visual clarity for email and web sharing.',
    icon: 'Minimize2',
    badge: 'Save up to 80%',
    popular: true,
    enabled: true,
  },

  // 5. PDF Security
  {
    id: 'protect',
    title: 'Protect PDF',
    category: 'security',
    description: 'Secure sensitive documents with strong password protection and encryption metadata.',
    icon: 'Lock',
    enabled: true,
  },
  {
    id: 'unlock',
    title: 'Unlock PDF',
    category: 'security',
    description: 'Remove password security when you have authorization and know the credentials.',
    icon: 'Unlock',
    enabled: true,
  },
  {
    id: 'watermark',
    title: 'Add Watermark',
    category: 'security',
    description: 'Stamp custom text or confidential watermarks across pages with customizable opacity.',
    icon: 'Stamp',
    popular: true,
    enabled: true,
  },

  // 6. Advanced Features
  {
    id: 'ocr',
    title: 'OCR Text Recognition',
    category: 'advanced',
    description: 'Transform scanned images and raster PDFs into searchable, selectable text.',
    icon: 'ScanText',
    badge: 'AI Engine',
    popular: true,
    enabled: true,
  },
  {
    id: 'extract-text',
    title: 'Extract Text',
    category: 'advanced',
    description: 'Instantly pull all raw text content from any PDF file without manual copy-pasting.',
    icon: 'FileSearch',
    enabled: true,
  },
  {
    id: 'page-numbers',
    title: 'Page Numbers',
    category: 'advanced',
    description: 'Insert dynamic page numbering headers and footers with custom positioning and styling.',
    icon: 'Hash',
    enabled: true,
  },
];

export const PRICING_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free Starter',
    priceMonthly: 0,
    priceYearly: 0,
    dailyLimit: 5,
    maxFileSizeMB: 15,
    features: [
      '5 free PDF operations per day',
      'Core PDF Editor with text & pen',
      'Basic page merging & splitting',
      'Standard compression mode',
      'PDF to JPG image extraction',
      'Browser-based in-memory processing',
      'Standard community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Genius',
    priceMonthly: 8,
    priceYearly: 69,
    dailyLimit: 200,
    maxFileSizeMB: 150,
    recommended: true,
    features: [
      'Unlimited high-speed processing',
      'Advanced Editor: shapes, layers & stamps',
      'AI OCR text recognition engine',
      'High-ratio compression (up to 80%)',
      'Digital signature legal stamps',
      'PDF to Word & Excel conversion',
      'Zero advertisements & faster speeds',
      'Priority 24/7 customer support',
    ],
  },
  {
    id: 'business',
    name: 'Business Enterprise',
    priceMonthly: 24,
    priceYearly: 199,
    dailyLimit: 9999,
    maxFileSizeMB: 500,
    features: [
      'Everything in Pro plan',
      'High-volume batch file operations',
      'Multi-seat team workspace',
      'Role-based access & team audit log',
      'Custom watermark & corporate branding',
      'Dedicated cloud processing queue',
      'Custom SLA & enterprise agreement',
    ],
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Is PDFGenius really safe to use with confidential files?',
    answer:
      'Yes, 100%. PDFGenius executes document operations directly in your browser using modern WebAssembly and canvas engines. Your documents are not permanently stored on any remote server, and all memory buffers are wiped immediately once your session ends.',
  },
  {
    question: 'How do the free daily limits work?',
    answer:
      'Guests and Free account holders receive 5 complete PDF operations every 24 hours. Upgrading to Pro or Business gives you virtually unlimited processing, larger file limits up to 500 MB, and advanced OCR features.',
  },
  {
    question: 'Can I edit existing text in a PDF?',
    answer:
      'PDF documents are compiled layouts rather than flowable word processor documents. PDFGenius allows you to add new text, annotate, whiteout/redact, add watermarks, and overlay custom fonts. You can also convert to Word (DOCX) for complete text reflowing.',
  },
  {
    question: 'Does the OCR tool support scanned documents?',
    answer:
      'Yes! Our built-in Optical Character Recognition (OCR) analyzes pixel scans of receipts, contracts, and printed documents, extracting searchable and copyable plain text accurately.',
  },
  {
    question: 'Can I use PDFGenius on mobile phones and tablets?',
    answer:
      'Yes. PDFGenius is fully responsive. On mobile devices, the workspace adapts with streamlined touch-friendly controls for quick signing, page rotation, compression, and conversions.',
  },
];
