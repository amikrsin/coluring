import React, {
  Suspense,
  lazy,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  Search,
  TrendingUp,
  Sparkles,
  Trophy,
  ArrowRight,
  Layers,
  Filter,
  Upload,
  Paintbrush,
} from 'lucide-react';
import {
  CategoryId,
  ColoringSheet,
  Locale,
  PaperSize,
  StaticCatalogDocument,
  ThemeMode,
} from './types';
import {
  SUPPORTED_LOCALES,
  TRANSLATIONS,
  getText,
  isValidLocale,
} from './i18n/translations';
import {
  buildStorefrontCatalog,
  loadCatalogDocument,
  resetCatalogDocument,
  saveCatalogDocument,
  slugify,
} from './data/catalog-store';
import { getCategorySeoContent } from './data/category-seo';
import { fetchLiveCatalogFromD1 } from './utils/cloudflare-admin';
import { useSeo } from './hooks/useSeo';
import { Header } from './components/Header';
import { HolidayStrip } from './components/HolidayStrip';
import { PackCard } from './components/PackCard';
import { SheetCard } from './components/SheetCard';
import { AdSlot } from './components/AdSlot';
import { PackDetailView } from './components/PackDetailView';
import { SheetDetailView } from './components/SheetDetailView';
import { CategoryPageView } from './components/CategoryPageView';
import { ColorOnlineModal } from './components/ColorOnlineModal';
import { PrintSetDrawer } from './components/PrintSetDrawer';
import { FloatingPrintSetBar } from './components/FloatingPrintSetBar';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LegalPageSlug, LegalPageView } from './components/LegalPages';
import {
  CookieConsentBanner,
  loadCookieConsent,
  saveCookieConsent,
} from './components/CookieConsentBanner';

// Lazy-load AdminDashboard so AWS S3 SDK & pdf-lib stay completely out of the storefront bundle
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  }))
);

const STORAGE_PAPER = 'colorworld_paper_size';
const STORAGE_THEME = 'colorworld_theme';
const STORAGE_PRINT_SET = 'colorworld_print_set';

const POPULAR_TAGS: { label: string; query: string }[] = [
  { label: 'Dinosaurs', query: 'dinosaurs' },
  { label: 'Unicorns', query: 'unicorns' },
  { label: 'Christmas', query: 'christmas' },
  { label: 'Space', query: 'space' },
  { label: 'Mandalas', query: 'mandalas' },
  { label: 'Alphabet', query: 'alphabet' },
  { label: 'Race Cars', query: 'cars' },
  { label: 'Ocean', query: 'ocean' },
];

const LEGAL_SLUGS = new Set<LegalPageSlug>([
  'privacy-policy',
  'terms-of-use',
  'dmca',
  'about',
  'contact',
]);

const LEGAL_SEO_META: Record<LegalPageSlug, { title: string; description: string }> = {
  'privacy-policy': {
    title: 'Privacy Policy – ColorWorld Free Printable Coloring Pages',
    description:
      'ColorWorld collects no personal accounts or logins. Print Set selections stay in your browser localStorage, and third-party ad networks like Google AdSense may use cookies.',
  },
  'terms-of-use': {
    title: 'Terms of Use – ColorWorld Free Printable Coloring Pages',
    description:
      'All ColorWorld coloring pages and worksheets are free for personal, home, and classroom printing. Commercial redistribution or resale is prohibited.',
  },
  dmca: {
    title: 'DMCA & Copyright Policy – ColorWorld',
    description:
      'Read ColorWorld copyright ownership information and how to submit a formal DMCA takedown notice.',
  },
  about: {
    title: 'About ColorWorld – Free 300 DPI Printable Coloring Pages',
    description:
      'Learn about ColorWorld’s mission to deliver free 300 DPI printable coloring pages, worksheets, and browser-based online coloring for families and classrooms.',
  },
  contact: {
    title: 'Contact ColorWorld – Support, Requests & Inquiries',
    description:
      'Get in touch with the ColorWorld team for coloring sheet requests, classroom questions, bug reports, or copyright inquiries.',
  },
};

interface ParsedRoute {
  locale: Locale;
  view: 'home' | 'pack' | 'sheet' | 'category' | 'top' | 'trending' | 'search' | 'admin' | 'legal';
  slug?: string;
  category?: CategoryId;
  subSlug?: string;
  sub?: string;
  query?: string;
  legalPage?: LegalPageSlug;
}

function parseUrlPath(pathname: string, search: string): ParsedRoute {
  const parts = pathname.split('/').filter(Boolean);
  let locale: Locale = 'en';
  let rest = parts;

  if (parts.length > 0 && isValidLocale(parts[0])) {
    locale = parts[0];
    rest = parts.slice(1);
  }

  const params = new URLSearchParams(search);
  const query = params.get('q') || '';
  const sub = params.get('sub') || '';

  if (rest.length === 0) {
    return { locale, view: 'home' };
  }
  if (rest[0] === 'admin') {
    return { locale, view: 'admin' };
  }
  if (LEGAL_SLUGS.has(rest[0] as LegalPageSlug)) {
    return { locale, view: 'legal', legalPage: rest[0] as LegalPageSlug };
  }
  if (rest[0] === 'page' && rest[1]) {
    return { locale, view: 'sheet', slug: decodeURIComponent(rest[1]) };
  }
  if (rest[0] === 'coloring-pages' && rest[1]) {
    return { locale, view: 'pack', slug: rest[1] };
  }
  if (rest[0] === 'category' && rest[1]) {
    return {
      locale,
      view: 'category',
      category: decodeURIComponent(rest[1]) as CategoryId,
      subSlug: rest[2] ? decodeURIComponent(rest[2]) : undefined,
      sub: sub || undefined,
    };
  }
  if (rest[0] === 'top') {
    return { locale, view: 'top' };
  }
  if (rest[0] === 'trending') {
    return { locale, view: 'trending' };
  }
  if (rest[0] === 'search') {
    return { locale, view: 'search', query };
  }
  return { locale, view: 'home' };
}

export default function App() {
  const [route, setRoute] = useState<ParsedRoute>(() =>
    parseUrlPath(window.location.pathname, window.location.search)
  );

  const [paperSize, setPaperSize] = useState<PaperSize>(() => {
    const saved = localStorage.getItem(STORAGE_PAPER);
    if (saved === 'a4' || saved === 'letter') return saved;
    const locMeta = SUPPORTED_LOCALES.find((l) => l.code === route.locale);
    return locMeta?.defaultPaper || 'a4';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  const [printSetIds, setPrintSetIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PRINT_SET);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [catalogDoc, setCatalogDoc] = useState<StaticCatalogDocument>(() =>
    loadCatalogDocument()
  );
  const [heroSearch, setHeroSearch] = useState('');
  const [activeSheetModal, setActiveSheetModal] = useState<ColoringSheet | null>(null);
  const [printTrayOpen, setPrintTrayOpen] = useState(false);
  const [cookieBannerVisible, setCookieBannerVisible] = useState<boolean>(
    () => loadCookieConsent() === null
  );
  const heroUploadRef = useRef<HTMLInputElement | null>(null);

  const handleUpdateCatalogDoc = useCallback((next: StaticCatalogDocument) => {
    setCatalogDoc(next);
    saveCatalogDocument(next);
  }, []);

  const handleResetCatalogDoc = useCallback(() => {
    const fresh = resetCatalogDocument();
    setCatalogDoc(fresh);
  }, []);

  const handleUploadCustomFile = useCallback(async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const cleanName = file.name.replace(/\.[^.]+$/, '');

    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      const customSheet: ColoringSheet = {
        id: `upload-${Date.now()}`,
        packSlug: 'custom-upload',
        title: { en: cleanName || 'Uploaded PDF Coloring Sheet' },
        description: { en: 'Uploaded PDF rendered locally with automatic black-outline detection.' },
        category: 'holidays',
        difficulty: 'medium',
        ageRange: 'All Ages',
        tags: ['pdf', 'upload'],
        views: 1,
        upvotes: 0,
        downvotes: 0,
        weeklyGrowthPct: 0,
        createdAt: new Date().toISOString().split('T')[0],
        thumbnailUrl: '',
        lineArtUrl: '',
        uploadedFile: {
          kind: 'pdf',
          arrayBuffer,
          fileName: file.name,
        },
        pdfUrls: { a4: '#', letter: '#' },
      };
      setActiveSheetModal(customSheet);
    } else {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
      });
      const customSheet: ColoringSheet = {
        id: `upload-${Date.now()}`,
        packSlug: 'custom-upload',
        title: { en: cleanName || 'Uploaded Coloring Sheet' },
        description: { en: 'Uploaded line-art image with automatic outline detection.' },
        category: 'holidays',
        difficulty: 'medium',
        ageRange: 'All Ages',
        tags: ['image', 'upload'],
        views: 1,
        upvotes: 0,
        downvotes: 0,
        weeklyGrowthPct: 0,
        createdAt: new Date().toISOString().split('T')[0],
        thumbnailUrl: dataUrl,
        lineArtUrl: dataUrl,
        uploadedFile: {
          kind: 'image',
          dataUrl,
          fileName: file.name,
        },
        pdfUrls: { a4: '#', letter: '#' },
      };
      setActiveSheetModal(customSheet);
    }
  }, []);

  const locale = route.locale;
  const t = TRANSLATIONS[locale] || TRANSLATIONS.en;

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  // Persist paper size & print set
  useEffect(() => {
    localStorage.setItem(STORAGE_PAPER, paperSize);
  }, [paperSize]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PRINT_SET, JSON.stringify(printSetIds));
  }, [printSetIds]);

  // Normalize bare `/` URL to `/en/` on first load
  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState(null, '', `/${locale}/`);
    }
  }, [locale]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setRoute(parseUrlPath(window.location.pathname, window.location.search));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Build live catalog directly from local-first catalog.json + localStorage edits
  const catalog = useMemo(
    () => buildStorefrontCatalog(catalogDoc, locale),
    [catalogDoc, locale]
  );

  // Hydrate live catalog from Cloudflare D1 when bound on production Workers
  useEffect(() => {
    let active = true;
    void fetchLiveCatalogFromD1().then((result) => {
      if (!active || !result) return;
      if (result.source === 'cloudflare-d1') {
        setCatalogDoc(result.catalog);
        saveCatalogDocument(result.catalog);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Sync live catalog changes across browser tabs if admin edits in another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'colorworld_admin_catalog_v1') {
        setCatalogDoc(loadCatalogDocument());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    const url = new URL(path, window.location.origin);
    setRoute(parseUrlPath(url.pathname, url.search));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChangeLocale = useCallback(
    (nextLocale: Locale) => {
      const currentPath = window.location.pathname;
      const parts = currentPath.split('/').filter(Boolean);
      const rest = parts.length > 0 && isValidLocale(parts[0]) ? parts.slice(1) : parts;
      const nextPath = `/${nextLocale}/${rest.join('/')}${window.location.search}`;
      navigate(nextPath);
    },
    [navigate]
  );

  const printSetSet = useMemo(() => new Set(printSetIds), [printSetIds]);

  const printSetSheets = useMemo(() => {
    const sheetMap = new Map(catalog.sheets.map((s) => [s.id, s]));
    return printSetIds
      .map((id) => sheetMap.get(id))
      .filter((s): s is ColoringSheet => Boolean(s));
  }, [catalog.sheets, printSetIds]);

  const togglePrintSet = useCallback((sheet: ColoringSheet) => {
    setPrintSetIds((prev) =>
      prev.includes(sheet.id) ? prev.filter((id) => id !== sheet.id) : [...prev, sheet.id]
    );
  }, []);

  const addPackToPrintSet = useCallback((sheets: ColoringSheet[]) => {
    setPrintSetIds((prev) => {
      const next = new Set(prev);
      sheets.forEach((s) => next.add(s.id));
      return Array.from(next);
    });
    setPrintTrayOpen(true);
  }, []);

  const addSheetsToPrintSet = useCallback((sheets: ColoringSheet[]) => {
    setPrintSetIds((prev) => {
      const next = new Set(prev);
      sheets.forEach((s) => next.add(s.id));
      return Array.from(next);
    });
  }, []);

  const openColorOnline = useCallback((sheet: ColoringSheet) => {
    setActiveSheetModal(sheet);
  }, []);

  const openSheetPage = useCallback(
    (sheet: ColoringSheet) => {
      navigate(`/page/${sheet.id}`);
    },
    [navigate]
  );

  const activePack = useMemo(() => {
    if (route.view !== 'pack' || !route.slug) return null;
    return catalog.packs.find((p) => p.slug === route.slug) || null;
  }, [catalog.packs, route]);

  const activeSheet = useMemo(() => {
    if (route.view !== 'sheet' || !route.slug) return null;
    return catalog.sheets.find((s) => s.id === route.slug) || null;
  }, [catalog.sheets, route]);

  // Categories with > 0 coloring pages (empty categories stay hidden on storefront)
  const populatedCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of catalog.sheets) {
      counts.set(s.category, (counts.get(s.category) || 0) + 1);
    }
    return catalogDoc.categories
      .map((c) => ({
        id: c.id,
        label: (t.categories as Record<string, string>)[c.id] || c.label,
        count: counts.get(c.id) || 0,
      }))
      .filter((c) => c.count > 0);
  }, [catalogDoc.categories, catalog.sheets, t.categories]);

  const sheetSubcategoryById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of catalogDoc.sheets) {
      if (s.subcategory) map.set(s.slug, s.subcategory);
    }
    return map;
  }, [catalogDoc.sheets]);

  const activeSheetCategoryLabel = useMemo(() => {
    if (!activeSheet) return '';
    const adminCat = catalogDoc.categories.find((c) => c.id === activeSheet.category);
    return (
      (t.categories as Record<string, string>)[activeSheet.category] ||
      adminCat?.label ||
      activeSheet.category
    );
  }, [activeSheet, catalogDoc.categories, t.categories]);

  const activeSheetSubcategory = useMemo(() => {
    if (!activeSheet) return '';
    return sheetSubcategoryById.get(activeSheet.id) || '';
  }, [activeSheet, sheetSubcategoryById]);

  // 8 Related Coloring Pages prioritized by same sub-category -> same category -> catalog
  const relatedSheetsForActiveSheet = useMemo(() => {
    if (!activeSheet) return [];
    const others = catalog.sheets.filter((s) => s.id !== activeSheet.id);
    const sameSub = activeSheetSubcategory
      ? others.filter((s) => sheetSubcategoryById.get(s.id) === activeSheetSubcategory)
      : [];
    const sameSubIds = new Set(sameSub.map((s) => s.id));
    const sameCat = others.filter(
      (s) => s.category === activeSheet.category && !sameSubIds.has(s.id)
    );
    const sameCatIds = new Set([...sameSubIds, ...sameCat.map((s) => s.id)]);
    const fallback = others.filter((s) => !sameCatIds.has(s.id));
    return [...sameSub, ...sameCat, ...fallback].slice(0, 8);
  }, [activeSheet, activeSheetSubcategory, catalog.sheets, sheetSubcategoryById]);

  // Filtered collections for Category / Search views
  const filteredCategoryPacks = useMemo(() => {
    if (route.view === 'category' && route.category) {
      return catalog.packs.filter((p) => p.category === route.category);
    }
    if (route.view === 'search' && route.query) {
      const q = route.query.toLowerCase();
      return catalog.packs.filter((p) =>
        `${getText(p.title, locale)} ${p.title.en} ${p.tags.join(' ')} ${p.category}`
          .toLowerCase()
          .includes(q)
      );
    }
    return [];
  }, [catalog.packs, route, locale]);

  const filteredCategorySheets = useMemo(() => {
    if (route.view === 'category' && route.category) {
      return catalog.sheets.filter((s) => s.category === route.category);
    }
    if (route.view === 'search' && route.query) {
      const q = route.query.toLowerCase();
      return catalog.sheets.filter((s) =>
        `${getText(s.title, locale)} ${s.title.en} ${s.tags.join(' ')} ${s.category}`
          .toLowerCase()
          .includes(q)
      );
    }
    return [];
  }, [catalog.sheets, route, locale]);

  // Only show sub-categories that currently have > 0 sheets in this category
  const populatedSubcategories = useMemo(() => {
    if (route.view !== 'category') return [];
    const counts = new Map<string, number>();
    for (const sheet of filteredCategorySheets) {
      const sub = sheetSubcategoryById.get(sheet.id);
      if (sub) counts.set(sub, (counts.get(sub) || 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({ name, slug: slugify(name), count }));
  }, [route.view, filteredCategorySheets, sheetSubcategoryById]);

  const activeSubcategoryName = useMemo(() => {
    if (route.view !== 'category') return null;
    if (route.subSlug) {
      const bySlug = populatedSubcategories.find(
        (sub) => sub.slug === route.subSlug || sub.slug === slugify(route.subSlug || '')
      );
      if (bySlug) return bySlug.name;
    }
    if (route.sub) {
      const byExact = populatedSubcategories.find(
        (sub) =>
          sub.name.toLowerCase() === route.sub!.toLowerCase() ||
          sub.slug === slugify(route.sub!)
      );
      if (byExact) return byExact.name;
    }
    return null;
  }, [route.view, route.subSlug, route.sub, populatedSubcategories]);

  const activeCategoryLabel = useMemo(() => {
    if (!route.category) return '';
    const adminCat = catalogDoc.categories.find((c) => c.id === route.category);
    return (
      (t.categories as Record<string, string>)[route.category] ||
      adminCat?.label ||
      route.category
    );
  }, [route.category, catalogDoc.categories, t.categories]);

  const activeSubcategorySheetCount = useMemo(() => {
    if (!activeSubcategoryName) return filteredCategorySheets.length;
    return filteredCategorySheets.filter(
      (s) => sheetSubcategoryById.get(s.id) === activeSubcategoryName
    ).length;
  }, [activeSubcategoryName, filteredCategorySheets, sheetSubcategoryById]);

  const activeCategorySeo = useMemo(() => {
    if (route.view !== 'category' || !route.category) return null;
    return getCategorySeoContent(
      route.category,
      activeCategoryLabel,
      activeSubcategorySheetCount,
      activeSubcategoryName || undefined
    );
  }, [
    route.view,
    route.category,
    activeCategoryLabel,
    activeSubcategorySheetCount,
    activeSubcategoryName,
  ]);

  // Dynamic SEO metadata per page & locale
  const seoMeta = useMemo(() => {
    if (route.view === 'admin') {
      return {
        title: 'Admin Catalog Manager | ColorWorld',
        description: 'Manage ColorWorld coloring pages, categories, and Cloudflare R2 assets.',
        path: '/admin',
      };
    }

    if (route.view === 'legal' && route.legalPage) {
      const meta = LEGAL_SEO_META[route.legalPage];
      return {
        title: meta.title,
        description: meta.description,
        path: `/${route.legalPage}`,
      };
    }

    if (route.view === 'sheet' && activeSheet) {
      const sheetTitle = getText(activeSheet.title, locale);
      const rawDesc = getText(activeSheet.description, locale);
      const seoDesc = `${rawDesc} Download as a free 300 DPI US Letter & A4 PDF, print directly, or color online on ColorWorld.`.slice(
        0,
        158
      );
      const origin = window.location.origin;
      const breadcrumbItems: Array<{
        '@type': string;
        position: number;
        name: string;
        item: string;
      }> = [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/${locale}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: activeSheetCategoryLabel,
          item: `${origin}/${locale}/category/${activeSheet.category}`,
        },
      ];
      if (activeSheetSubcategory) {
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: 3,
          name: activeSheetSubcategory,
          item: `${origin}/${locale}/category/${activeSheet.category}/${slugify(
            activeSheetSubcategory
          )}`,
        });
      }
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: breadcrumbItems.length + 1,
        name: sheetTitle,
        item: `${origin}/page/${activeSheet.id}`,
      });

      return {
        title: `${sheetTitle} – Free Printable PDF Coloring Page | ColorWorld`,
        description: seoDesc,
        path: `/page/${activeSheet.id}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CreativeWork',
              name: sheetTitle,
              description: seoDesc,
              inLanguage: locale,
              isAccessibleForFree: true,
              encodingFormat: 'application/pdf',
              thumbnailUrl: activeSheet.thumbnailUrl || undefined,
              url: `${origin}/page/${activeSheet.id}`,
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumbItems,
            },
          ],
        },
      };
    }

    if (route.view === 'pack' && activePack) {
      const title = `${getText(activePack.title, locale)} – Free Printable PDF | ColorWorld`;
      const desc = getText(activePack.seoIntro, locale).slice(0, 158);
      return {
        title,
        description: desc,
        path: `/${locale}/coloring-pages/${activePack.slug}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: getText(activePack.title, locale),
          description: desc,
          inLanguage: locale,
          numberOfItems: activePack.sheets.length,
        },
      };
    }

    if (route.view === 'category' && route.category && activeCategorySeo) {
      const origin = window.location.origin;
      const categoryPath = `/${locale}/category/${route.category}`;
      const canonicalPath = activeSubcategoryName
        ? `${categoryPath}/${slugify(activeSubcategoryName)}`
        : categoryPath;

      const breadcrumbItems: Array<{
        '@type': string;
        position: number;
        name: string;
        item: string;
      }> = [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/${locale}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Coloring Pages',
          item: `${origin}/${locale}/`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: activeCategoryLabel,
          item: `${origin}${categoryPath}`,
        },
      ];

      if (activeSubcategoryName) {
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: 4,
          name: activeSubcategoryName,
          item: `${origin}${canonicalPath}`,
        });
      }

      return {
        title: activeCategorySeo.metaTitle,
        description: activeCategorySeo.metaDescription,
        path: canonicalPath,
        jsonLd: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: activeSubcategoryName
                ? `Free Printable ${activeSubcategoryName} (${activeCategoryLabel}) Coloring Pages`
                : `Free Printable ${activeCategoryLabel} Coloring Pages`,
              description: activeCategorySeo.metaDescription,
              inLanguage: locale,
              numberOfItems: activeSubcategorySheetCount,
              url: `${origin}${canonicalPath}`,
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumbItems,
            },
            {
              '@type': 'FAQPage',
              mainEntity: activeCategorySeo.faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.a,
                },
              })),
            },
          ],
        },
      };
    }

    if (route.view === 'top') {
      return {
        title: 'Top Printable Coloring Pages – Most Popular 300 DPI PDFs | ColorWorld',
        description:
          'Browse the most popular free printable coloring pages for kids and adults in crisp 300 DPI US Letter and A4 PDF formats.',
        path: `/${locale}/top`,
      };
    }

    if (route.view === 'trending') {
      return {
        title: 'Trending Coloring Pages This Week – Free Printable PDFs | ColorWorld',
        description:
          'Discover trending printable coloring packs and seasonal activity sheets ready to print in 300 DPI or color online for free.',
        path: `/${locale}/trending`,
      };
    }

    if (route.view === 'search') {
      return {
        title: route.query
          ? `Search "${route.query}" Coloring Pages | ColorWorld`
          : 'Search Free Coloring Pages | ColorWorld',
        description:
          'Search hundreds of free printable 300 DPI coloring sheets, worksheets, and seasonal packs on ColorWorld.',
        path: `/${locale}/search${route.query ? `?q=${encodeURIComponent(route.query)}` : ''}`,
      };
    }

    return {
      title: 'ColorWorld – Free Printable Coloring Pages & Color Online',
      description: t.hero.subtitle,
      path: `/${locale}/`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ColorWorld',
        inLanguage: locale,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/${locale}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    };
  }, [
    route,
    activeSheet,
    activeSheetCategoryLabel,
    activeSheetSubcategory,
    activePack,
    activeCategorySeo,
    activeCategoryLabel,
    activeSubcategoryName,
    activeSubcategorySheetCount,
    locale,
    t,
  ]);

  useSeo({
    ...seoMeta,
    locale,
  });

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroSearch.trim();
    if (!q) return;
    navigate(`/${locale}/search?q=${encodeURIComponent(q)}`);
  };

  const handleSelectHolidayTarget = useCallback(
    (slug: string) => {
      if (catalog.packs.some((p) => p.slug === slug)) {
        navigate(`/${locale}/coloring-pages/${slug}`);
        return;
      }
      if (populatedCategories.some((c) => c.id === slug)) {
        navigate(`/${locale}/category/${slug}`);
        return;
      }
      if (populatedCategories.some((c) => c.id === 'holidays')) {
        navigate(`/${locale}/category/holidays`);
        return;
      }
      navigate(`/${locale}/search?q=${encodeURIComponent(slug.replace(/-/g, ' '))}`);
    },
    [catalog.packs, populatedCategories, locale, navigate]
  );

  const activeRouteKey =
    route.view === 'category'
      ? `category:${route.category}`
      : route.view;

  if (route.view === 'admin') {
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1320] flex items-center justify-center text-sm font-bold text-[#64748B]">
              Loading Admin Catalog Manager...
            </div>
          }
        >
          <AdminDashboard
            catalogDoc={catalogDoc}
            storefrontSheets={catalog.sheets}
            onUpdateCatalog={handleUpdateCatalogDoc}
            onResetToLive={handleResetCatalogDoc}
            onExitToStorefront={() => navigate(`/${locale}/`)}
            onPreviewSheet={openColorOnline}
          />
        </Suspense>
        {activeSheetModal && (
          <ColorOnlineModal
            sheet={activeSheetModal}
            locale={locale}
            t={t}
            paperSize={paperSize}
            onClose={() => setActiveSheetModal(null)}
            onUploadFile={handleUploadCustomFile}
          />
        )}
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#0B1320] text-[#1E293B] dark:text-slate-100">
      <Header
        locale={locale}
        t={t}
        paperSize={paperSize}
        theme={theme}
        packs={catalog.packs}
        sheets={catalog.sheets}
        adminCategories={catalogDoc.categories}
        activeRoute={activeRouteKey}
        onNavigate={navigate}
        onChangeLocale={handleChangeLocale}
        onChangePaperSize={setPaperSize}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenColorOnline={openColorOnline}
      />

      {/* VIEW 0: LEGAL & TRUST PAGES (/privacy-policy, /terms-of-use, /dmca, /about, /contact) */}
      {route.view === 'legal' && route.legalPage && (
        <LegalPageView
          page={route.legalPage}
          locale={locale}
          onNavigate={navigate}
          onOpenCookieSettings={() => setCookieBannerVisible(true)}
        />
      )}

      {/* VIEW 0.5: INDIVIDUAL COLORING SHEET PAGE (/page/:slug) */}
      {route.view === 'sheet' && activeSheet && (
        <SheetDetailView
          sheet={activeSheet}
          categoryLabel={activeSheetCategoryLabel}
          subcategory={activeSheetSubcategory}
          relatedSheets={relatedSheetsForActiveSheet}
          locale={locale}
          t={t}
          paperSize={paperSize}
          inPrintSet={printSetSet.has(activeSheet.id)}
          printSetIds={printSetSet}
          onChangePaperSize={setPaperSize}
          onNavigate={navigate}
          onOpenSheet={openSheetPage}
          onTogglePrintSet={togglePrintSet}
          onColorOnline={openColorOnline}
        />
      )}

      {route.view === 'sheet' && !activeSheet && (
        <main className="flex-1 max-w-[720px] w-full mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-8 sm:p-10 paper-card-shadow">
            <h1 className="text-2xl font-extrabold text-[#0F1E36] dark:text-white">
              Coloring Page Not Found
            </h1>
            <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400">
              We couldn&apos;t find a coloring sheet at that URL. Explore all free 300 DPI printable coloring pages below.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/${locale}/`)}
              className="mt-5 h-10 px-5 rounded-xl bg-[#E63946] hover:bg-[#D62839] text-white text-sm font-extrabold cursor-pointer"
            >
              Browse All Coloring Pages
            </button>
          </div>
        </main>
      )}

      {/* VIEW 1: PACK DETAIL PAGE (/:locale/coloring-pages/:slug) */}
      {route.view === 'pack' && activePack && (
        <PackDetailView
          pack={activePack}
          relatedPacks={catalog.packs.filter((p) => p.slug !== activePack.slug).slice(0, 4)}
          locale={locale}
          t={t}
          paperSize={paperSize}
          printSetIds={printSetSet}
          onChangePaperSize={setPaperSize}
          onBackHome={() => navigate(`/${locale}/`)}
          onOpenPack={(slug) => navigate(`/${locale}/coloring-pages/${slug}`)}
          onOpenSheet={openSheetPage}
          onTogglePrintSet={togglePrintSet}
          onAddPackToPrintSet={addPackToPrintSet}
          onColorOnline={openColorOnline}
        />
      )}

      {/* VIEW 2: TOP 100 PAGE */}
      {route.view === 'top' && (
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#FFB703]">
              <Trophy className="w-4 h-4" />
              <span>{t.nav.top}</span>
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              {t.sections.top100}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#64748B] dark:text-slate-400">
              {t.sections.top100Sub}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {catalog.topSheets.map((sheet, idx) => (
              <SheetCard
                key={sheet.id}
                sheet={sheet}
                locale={locale}
                t={t}
                paperSize={paperSize}
                rank={idx + 1}
                inPrintSet={printSetSet.has(sheet.id)}
                onOpenSheet={openSheetPage}
                onTogglePrintSet={togglePrintSet}
                onColorOnline={openColorOnline}
              />
            ))}
          </div>
        </main>
      )}

      {/* VIEW 3: TRENDING PAGE */}
      {route.view === 'trending' && (
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#38B000]">
              <TrendingUp className="w-4 h-4" />
              <span>{t.nav.trending}</span>
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              {t.sections.trendingThisWeek}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#64748B] dark:text-slate-400">
              {t.sections.trendingSub}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {catalog.trendingPacks.map((pack) => (
              <PackCard
                key={pack.slug}
                pack={pack}
                locale={locale}
                t={t}
                showGrowthBadge
                onOpenPack={(slug) => navigate(`/${locale}/coloring-pages/${slug}`)}
              />
            ))}
          </div>
        </main>
      )}

      {/* VIEW 4A: CATEGORY & SUB-CATEGORY PAGES (/category/:slug & /category/:slug/:subSlug) */}
      {route.view === 'category' && route.category && activeCategorySeo && (
        <CategoryPageView
          categoryId={route.category}
          categoryLabel={activeCategoryLabel}
          activeSubcategory={activeSubcategoryName}
          allCategorySheets={filteredCategorySheets}
          categoryPacks={filteredCategoryPacks}
          populatedSubcategories={populatedSubcategories}
          sheetSubcategoryById={sheetSubcategoryById}
          seo={activeCategorySeo}
          locale={locale}
          t={t}
          paperSize={paperSize}
          printSetIds={printSetSet}
          onChangePaperSize={setPaperSize}
          onNavigate={navigate}
          onOpenSheet={openSheetPage}
          onTogglePrintSet={togglePrintSet}
          onAddSheetsToPrintSet={addSheetsToPrintSet}
          onColorOnline={openColorOnline}
        />
      )}

      {/* VIEW 4B: SEARCH RESULTS */}
      {route.view === 'search' && (
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#2A9D8F]">
                <Filter className="w-3.5 h-3.5" />
                <span>Search results</span>
              </div>
              <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
                “{route.query}”
              </h1>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/${locale}/`)}
              className="text-sm font-bold text-[#E63946] hover:underline self-start sm:self-auto shrink-0 cursor-pointer"
            >
              {t.pack.backHome}
            </button>
          </div>

          {filteredCategoryPacks.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white mb-4">
                Collections ({filteredCategoryPacks.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredCategoryPacks.map((pack) => (
                  <PackCard
                    key={pack.slug}
                    pack={pack}
                    locale={locale}
                    t={t}
                    onOpenPack={(slug) => navigate(`/${locale}/coloring-pages/${slug}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white mb-4">
              Printable Coloring Sheets ({filteredCategorySheets.length})
            </h2>
            {filteredCategorySheets.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 text-center">
                <p className="text-base font-bold text-[#1E293B] dark:text-slate-100">
                  No coloring sheets matched your search.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/${locale}/`)}
                  className="mt-4 h-10 px-5 rounded-xl bg-[#E63946] text-white text-sm font-bold cursor-pointer"
                >
                  Explore All Coloring Pages
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredCategorySheets.map((sheet) => (
                  <SheetCard
                    key={sheet.id}
                    sheet={sheet}
                    locale={locale}
                    t={t}
                    paperSize={paperSize}
                    inPrintSet={printSetSet.has(sheet.id)}
                    onOpenSheet={openSheetPage}
                    onTogglePrintSet={togglePrintSet}
                    onColorOnline={openColorOnline}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* VIEW 5: HOMEPAGE */}
      {(route.view === 'home' || (route.view === 'pack' && !activePack)) && (
        <div className="flex-1">
          {/* Playful Craft Hero Search Section */}
          <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF9] to-[#FAF8F5] dark:from-[#0F1E36] dark:to-[#0B1320] pt-10 pb-10 sm:pt-14 sm:pb-12">
            <div className="max-w-[920px] mx-auto px-4 sm:px-6 text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0F1E36] dark:text-white tracking-tight leading-[1.15]">
                {t.hero.title}
              </h1>
              <p className="mt-3.5 text-sm sm:text-base text-[#475569] dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {t.hero.subtitle}
              </p>

              {/* Prominent Pill Search Input */}
              <form
                onSubmit={handleHeroSearchSubmit}
                className="mt-7 max-w-2xl mx-auto relative flex items-center"
              >
                <input
                  type="search"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={t.hero.searchPlaceholder}
                  aria-label={t.hero.searchPlaceholder}
                  className="w-full h-13 sm:h-14 pl-6 pr-32 rounded-full bg-white dark:bg-slate-900 border-2 border-[#E2E8F0] dark:border-slate-700 focus:border-[#E63946] dark:focus:border-[#E63946] text-[#1E293B] dark:text-slate-100 placeholder:text-[#64748B] text-sm sm:text-base font-medium shadow-sm focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-[#E63946] hover:bg-[#D62839] text-white text-sm font-extrabold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>{t.hero.searchButton}</span>
                </button>
              </form>

              {/* Clickable Popular Search Tags */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-bold text-[#64748B] dark:text-slate-400 mr-1">
                  {t.hero.popularLabel}
                </span>
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag.query}
                    type="button"
                    onClick={() => navigate(`/${locale}/search?q=${encodeURIComponent(tag.query)}`)}
                    className="h-8 px-3.5 rounded-full bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 hover:border-[#2A9D8F] hover:text-[#2A9D8F] dark:hover:border-[#6FD8C8] dark:hover:text-[#6FD8C8] text-xs font-bold text-[#1E293B] dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Direct Color Online & Custom Upload Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <input
                  ref={heroUploadRef}
                  type="file"
                  accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadCustomFile(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                {catalog.sheets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const featuredSheet =
                        catalog.sheets.find((s) => s.id === 'thanksgiving-turkey') ||
                        catalog.sheets[0];
                      if (featuredSheet) openColorOnline(featuredSheet);
                    }}
                    className="h-10 px-4 rounded-xl bg-[#E63946] hover:bg-[#D62839] text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Paintbrush className="w-4 h-4" />
                    <span>Color Online</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => heroUploadRef.current?.click()}
                  className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 hover:border-[#2A9D8F] text-[#0F1E36] dark:text-slate-100 text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#2A9D8F]" />
                  <span>Upload PDF or Image to Color</span>
                </button>
              </div>
            </div>
          </section>

          {/* Coming Up Seasonal Holiday Countdown Strip (Real-Date 90-Day Lookahead) */}
          <HolidayStrip
            locale={locale}
            t={t}
            tickerItems={catalogDoc.holidayTicker}
            onSelectPack={handleSelectHolidayTarget}
          />

          {/* Section 1: Trending This Week */}
          <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#38B000]">
                  <TrendingUp className="w-4 h-4" />
                  <span>{t.nav.trending}</span>
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
                  {t.sections.trendingThisWeek}
                </h2>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                  {t.sections.trendingSub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/${locale}/trending`)}
                className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#E63946] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{t.sections.viewAll}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {catalog.trendingPacks.slice(0, 4).map((pack) => (
                <PackCard
                  key={pack.slug}
                  pack={pack}
                  locale={locale}
                  t={t}
                  showGrowthBadge
                  onOpenPack={(slug) => navigate(`/${locale}/coloring-pages/${slug}`)}
                />
              ))}
            </div>
          </section>

          <AdSlot slotId="home-after-trending" format="leaderboard" />

          {/* Section 2: New Coloring Pages (Direct PDF & Color Online) */}
          <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2A9D8F] dark:text-[#6FD8C8]">
                  <Sparkles className="w-4 h-4" />
                  <span>Fresh Printables</span>
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
                  {t.sections.newColoringPages}
                </h2>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                  {t.sections.newSub}
                </p>
              </div>
              <span className="hidden sm:inline text-xs font-bold text-[#64748B] dark:text-slate-400">
                Active Format: {paperSize === 'a4' ? 'A4 (210×297mm)' : 'US Letter (8.5×11in)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {catalog.newSheets.slice(0, 8).map((sheet) => (
                <SheetCard
                  key={sheet.id}
                  sheet={sheet}
                  locale={locale}
                  t={t}
                  paperSize={paperSize}
                  inPrintSet={printSetSet.has(sheet.id)}
                  onOpenSheet={openSheetPage}
                  onTogglePrintSet={togglePrintSet}
                  onColorOnline={openColorOnline}
                />
              ))}
            </div>
          </section>

          <AdSlot slotId="home-after-new" format="inline" />

          {/* Section 3: Top 100 Most Popular */}
          <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#D97706] dark:text-[#FFB703]">
                  <Trophy className="w-4 h-4" />
                  <span>Community Ranked</span>
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
                  {t.sections.top100}
                </h2>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                  {t.sections.top100Sub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/${locale}/top`)}
                className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#E63946] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{t.sections.viewAll}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {catalog.topSheets.slice(0, 4).map((sheet, idx) => (
                <SheetCard
                  key={sheet.id}
                  sheet={sheet}
                  locale={locale}
                  t={t}
                  paperSize={paperSize}
                  rank={idx + 1}
                  inPrintSet={printSetSet.has(sheet.id)}
                  onOpenSheet={openSheetPage}
                  onTogglePrintSet={togglePrintSet}
                  onColorOnline={openColorOnline}
                />
              ))}
            </div>
          </section>

          {/* Section 4: Browse by Theme Directory (Populated Categories Only) */}
          {populatedCategories.length > 0 && (
            <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2A9D8F] dark:text-[#6FD8C8]">
                  <Layers className="w-4 h-4" />
                  <span>Directory</span>
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
                  {t.sections.browseByTheme}
                </h2>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                  {t.sections.browseByThemeSub}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {populatedCategories.map((catItem) => (
                  <button
                    key={catItem.id}
                    type="button"
                    onClick={() => navigate(`/${locale}/category/${catItem.id}`)}
                    className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 hover:border-[#E63946] dark:hover:border-[#E63946] paper-card-shadow text-left transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="text-sm sm:text-base font-extrabold text-[#0F1E36] dark:text-white group-hover:text-[#E63946] transition-colors">
                      {catItem.label}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 tabular-nums">
                      <span>
                        {catItem.count} {catItem.count === 1 ? t.card.page : t.card.pages}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:text-[#E63946] transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* FAQ Accordion */}
          <FaqSection t={t} />
        </div>
      )}

      <Footer
        locale={locale}
        t={t}
        populatedCategories={populatedCategories}
        onNavigate={navigate}
        onChangeLocale={handleChangeLocale}
        onOpenCookieSettings={() => setCookieBannerVisible(true)}
      />

      {/* Interactive HTML5 Canvas Color Online Studio */}
      {activeSheetModal && (
        <ColorOnlineModal
          sheet={activeSheetModal}
          locale={locale}
          t={t}
          paperSize={paperSize}
          onClose={() => setActiveSheetModal(null)}
          onUploadFile={handleUploadCustomFile}
        />
      )}

      {/* Floating Bottom Print Set Bar */}
      <FloatingPrintSetBar
        sheets={printSetSheets}
        locale={locale}
        t={t}
        paperSize={paperSize}
        onClearAll={() => setPrintSetIds([])}
        onOpenDrawer={() => setPrintTrayOpen(true)}
      />

      {/* Slide-Over Print Set Drawer */}
      <PrintSetDrawer
        open={printTrayOpen}
        sheets={printSetSheets}
        locale={locale}
        t={t}
        paperSize={paperSize}
        onChangePaperSize={setPaperSize}
        onClose={() => setPrintTrayOpen(false)}
        onRemoveSheet={(id) => setPrintSetIds((prev) => prev.filter((item) => item !== id))}
        onClearAll={() => setPrintSetIds([])}
        onColorOnline={openColorOnline}
      />

      {/* Dismissible GDPR / US Cookie Consent Banner for AdSense Compliance */}
      <CookieConsentBanner
        visible={cookieBannerVisible}
        hasFloatingPrintBar={printSetSheets.length > 0}
        onAcceptAll={() => {
          saveCookieConsent('accepted');
          setCookieBannerVisible(false);
        }}
        onEssentialOnly={() => {
          saveCookieConsent('essential');
          setCookieBannerVisible(false);
        }}
        onOpenPrivacyPolicy={() => navigate('/privacy-policy')}
      />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
