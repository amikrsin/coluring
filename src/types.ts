export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'nl' | 'pl';

export type PaperSize = 'a4' | 'letter';

export type ThemeMode = 'light' | 'dark';

export type CategoryId =
  | 'animals'
  | 'dinosaurs'
  | 'fantasy'
  | 'space'
  | 'vehicles'
  | 'holidays'
  | 'mandalas'
  | 'worksheets'
  | 'calendars'
  | 'teachers';

export interface LocalizedText {
  en: string;
  es?: string;
  fr?: string;
  de?: string;
  pt?: string;
  it?: string;
  nl?: string;
  pl?: string;
}

export interface ColoringSheet {
  id: string;
  packSlug: string;
  title: LocalizedText;
  description: LocalizedText;
  category: CategoryId;
  subcategory?: string;
  difficulty: 'easy' | 'medium' | 'detailed';
  ageRange: string;
  tags: string[];
  views: number;
  upvotes: number;
  downvotes: number;
  weeklyGrowthPct: number;
  isNew?: boolean;
  isTrending?: boolean;
  isHot?: boolean;
  rank?: number;
  createdAt: string;
  /** R2 object keys (served via /cdn/*) */
  thumbnailUrl: string;
  lineArtUrl: string;
  /** Optional direct PDF URL rendered client-side via PDF.js with automatic line detection */
  sourcePdfUrl?: string;
  /** Optional user-uploaded local file (PDF or image) for instant zero-code Color Online */
  uploadedFile?: {
    kind: 'pdf' | 'image';
    dataUrl?: string;
    arrayBuffer?: ArrayBuffer;
    fileName: string;
  };
  pdfUrls: {
    a4: string;
    letter: string;
  };
}

export interface ColoringPack {
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  seoIntro: LocalizedText;
  category: CategoryId;
  holidayId?: string;
  tags: string[];
  views: number;
  upvotes: number;
  downvotes: number;
  weeklyGrowthPct: number;
  featured?: boolean;
  isHot?: boolean;
  createdAt: string;
  sheetIds: string[];
}

export interface PackWithSheets extends ColoringPack {
  sheets: ColoringSheet[];
}

export interface HolidayEvent {
  id: string;
  slug: string;
  month: number; // 1-12
  day: number; // 1-31
  packSlug: string;
  accentColor: string;
  title: LocalizedText;
}

export interface CatalogResponse {
  locale: Locale;
  packs: PackWithSheets[];
  sheets: ColoringSheet[];
  trendingPacks: PackWithSheets[];
  newSheets: ColoringSheet[];
  topSheets: ColoringSheet[];
  totalSheets: number;
  totalPacks: number;
  source: 'cloudflare-r2-d1' | 'local-r2-emulator';
}

export interface VoteResponse {
  id: string;
  upvotes: number;
  downvotes: number;
}

export type NavMegaGroup = 'top' | 'trending' | 'holidays' | 'coloring' | 'worksheets';

export interface AdminCategoryItem {
  id: string;
  label: string;
  subcategories: string[];
  navGroup: NavMegaGroup;
  isHot?: boolean;
}

export interface AdminHolidayTickerItem {
  id: string;
  title: string;
  /** Calendar month (1-12) for annual fixed dates, or computed when using well-known lunar/floating IDs */
  month?: number;
  /** Calendar day (1-31) */
  day?: number;
  /** Optional explicit YYYY-MM-DD date override */
  dateIso?: string;
  /** Legacy field preserved as optional for backward compatibility with older localStorage drafts */
  weeksAway?: number;
  categorySlug: string;
  accentColor: string;
}

export interface AdminCatalogSheet {
  id: string;
  slug: string;
  packSlug: string;
  title: string;
  category: string;
  subcategory: string;
  difficulty: 'easy' | 'medium' | 'detailed';
  ageRange: string;
  isTrending: boolean;
  isHot: boolean;
  previewWebpUrl: string;
  pdfUrl: string;
  pdfLetterUrl?: string;
  lineArtUrl?: string;
  sourcePdfUrl?: string;
  seoDescription: string;
  tags: string[];
  views: number;
  upvotes: number;
  downvotes: number;
  weeklyGrowthPct: number;
  createdAt: string;
}

export interface StaticCatalogDocument {
  version: number;
  updatedAt: string;
  defaultR2BaseUrl: string;
  categories: AdminCategoryItem[];
  holidayTicker: AdminHolidayTickerItem[];
  sheets: AdminCatalogSheet[];
}
