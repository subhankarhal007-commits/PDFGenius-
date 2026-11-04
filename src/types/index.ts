export type ToolCategory = 'all' | 'edit' | 'manage' | 'convert' | 'compress' | 'security' | 'advanced';

export type ToolId = 
  | 'editor'
  | 'merge'
  | 'split'
  | 'rotate'
  | 'delete-pages'
  | 'extract-pages'
  | 'reorder-pages'
  | 'crop'
  | 'compress'
  | 'pdf-to-img'
  | 'img-to-pdf'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'pdf-to-excel'
  | 'excel-to-pdf'
  | 'protect'
  | 'unlock'
  | 'watermark'
  | 'ocr'
  | 'extract-text'
  | 'page-numbers'
  | 'sign'
  | 'flatten';

export interface PDFTool {
  id: ToolId;
  title: string;
  category: ToolCategory;
  description: string;
  icon: string;
  badge?: string;
  popular?: boolean;
  enabled?: boolean;
}

export type EditorTool = 
  | 'select'
  | 'text'
  | 'draw'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'shape'
  | 'image'
  | 'signature'
  | 'eraser'
  | 'comment';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow';

export interface Point {
  x: number;
  y: number;
}

export interface AnnotationElement {
  id: string;
  type: EditorTool;
  page: number; // 1-indexed
  x: number;    // % or px relative to canvas
  y: number;
  width: number;
  height: number;
  rotation?: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  // Shape/Drawing properties
  shapeType?: ShapeType;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  opacity?: number;
  points?: Point[];
  // Image properties
  imageDataUrl?: string;
  // Comment / Note
  commentAuthor?: string;
  commentDate?: string;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  toolUsed: string;
  fileSize: number;
  pageCount: number;
  timestamp: number;
  status: 'completed' | 'processing' | 'failed';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'business';
  dailyOperationsCount: number;
  maxDailyOperations: number;
  avatar?: string;
  createdAt: string;
}

export interface PlanConfig {
  id: 'free' | 'pro' | 'business';
  name: string;
  priceMonthly: number;
  priceYearly: number;
  dailyLimit: number;
  maxFileSizeMB: number;
  features: string[];
  recommended?: boolean;
}

export interface AdsterraAdUnit {
  enabled: boolean;
  code: string; // Adsterra script tag, direct URL, iframe, or HTML snippet
}

export interface AdsterraConfig {
  socialBar: AdsterraAdUnit;
  banner728x90: AdsterraAdUnit;
  banner300x250: AdsterraAdUnit;
  banner320x50: AdsterraAdUnit;
  nativeBanner: AdsterraAdUnit;
  popunder: AdsterraAdUnit;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl?: string; // Custom uploaded logo data URL or image link
  maintenanceMode: boolean;
  showAds: boolean;
  adSenseCode?: string;
  adsterraAds?: AdsterraConfig;
  freeDailyLimit: number;
  proDailyLimit: number;
  maxUploadSizeMB: number;
  disabledTools: ToolId[];
  announcementText?: string;
}
