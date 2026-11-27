import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  Flame,
  Trophy,
  Sparkles,
  Calendar,
  BookOpen,
  GraduationCap,
  Palette,
} from 'lucide-react';
import {
  AdminCategoryItem,
  CategoryId,
  ColoringSheet,
  Locale,
  PackWithSheets,
  PaperSize,
  ThemeMode,
} from '../types';
import {
  SUPPORTED_LOCALES,
  TranslationDictionary,
  getText,
} from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  locale: Locale;
  t: TranslationDictionary;
  paperSize: PaperSize;
  theme: ThemeMode;
  packs: PackWithSheets[];
  sheets: ColoringSheet[];
  adminCategories?: AdminCategoryItem[];
  activeRoute: string;
  onNavigate: (path: string) => void;
  onChangeLocale: (locale: Locale) => void;
  onChangePaperSize: (size: PaperSize) => void;
  onToggleTheme: () => void;
  onOpenColorOnline: (sheet: ColoringSheet) => void;
}

const COLORING_MEGA_CATEGORIES: { id: CategoryId; hot?: boolean }[] = [
  { id: 'dinosaurs', hot: true },
  { id: 'fantasy', hot: true },
  { id: 'animals' },
  { id: 'space' },
  { id: 'vehicles' },
  { id: 'mandalas' },
];

export const Header: React.FC<HeaderProps> = ({
  locale,
  t,
  paperSize,
  theme,
  packs,
  sheets,
  adminCategories,
  activeRoute,
  onNavigate,
  onChangeLocale,
  onChangePaperSize,
  onToggleTheme,
  onOpenColorOnline,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [openMenu, setOpenMenu] = useState<'coloring' | 'holidays' | 'lang' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const searchResults = searchQuery.trim().length > 0
    ? {
        packs: packs
          .filter((p) => {
            const hay = `${getText(p.title, locale)} ${p.title.en} ${p.tags.join(' ')}`.toLowerCase();
            return hay.includes(searchQuery.trim().toLowerCase());
          })
          .slice(0, 4),
        sheets: sheets
          .filter((s) => {
            const hay = `${getText(s.title, locale)} ${s.title.en} ${s.tags.join(' ')}`.toLowerCase();
            return hay.includes(searchQuery.trim().toLowerCase());
          })
          .slice(0, 4),
      }
    : { packs: [], sheets: [] };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchFocused(false);
    onNavigate(`/${locale}/search?q=${encodeURIComponent(q)}`);
  };

  const countByCategory = (cat: string) =>
    sheets.filter((s) => s.category === cat).length;

  const megaCategories = (
    adminCategories && adminCategories.length > 0
      ? adminCategories
          .filter((c) => c.navGroup !== 'worksheets' && c.navGroup !== 'holidays')
          .map((c) => ({
            id: c.id,
            label:
              (t.categories as Record<string, string>)[c.id] || c.label,
            hot: Boolean(c.isHot),
            count: countByCategory(c.id),
            subcategories: c.subcategories.filter((sub) =>
              sheets.some((s) => s.category === c.id && s.subcategory === sub)
            ),
          }))
      : COLORING_MEGA_CATEGORIES.map((c) => ({
          id: c.id,
          label: t.categories[c.id],
          hot: Boolean(c.hot),
          count: countByCategory(c.id),
          subcategories: [] as string[],
        }))
  )
    .filter((c) => c.count > 0)
    .slice(0, 8);

  const holidayPacks = packs.filter(
    (p) => p.category === 'holidays' && p.sheets.length > 0
  );
  const hasHolidays = countByCategory('holidays') > 0;
  const hasWorksheets = countByCategory('worksheets') > 0;
  const hasCalendars = countByCategory('calendars') > 0;
  const hasTeachers = countByCategory('teachers') > 0;

  return (
    <div ref={headerRef} className="no-print">
      {/* Sticky Deep Navy Utility Chrome (64px) */}
      <header className="sticky top-0 z-40 h-16 bg-[#0F1E36] text-white border-b border-white/10 shadow-sm">
        <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-5">
          {/* Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate(`/${locale}/`)}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB703] rounded-lg"
          >
            <span className="w-8 h-8 rounded-lg bg-[#E63946] flex items-center justify-center shadow-sm shrink-0">
              <Palette className="w-5 h-5 text-white" strokeWidth={2.4} />
            </span>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              ColorWorld
            </span>
          </button>

          {/* Live Header Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md hidden md:block"
          >
            <div className="relative flex items-center">
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                aria-label={t.nav.searchPlaceholder}
                className="w-full h-10 pl-4 pr-11 rounded-full bg-white text-[#1E293B] placeholder:text-[#64748B] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FFB703]"
              />
              <button
                type="submit"
                aria-label={t.hero.searchButton}
                className="absolute right-1.5 w-7 h-7 rounded-full bg-[#E63946] hover:bg-[#D62839] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Instant Search Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 text-[#1E293B] dark:text-slate-100 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 shadow-2xl overflow-hidden z-50">
                {searchResults.packs.length === 0 && searchResults.sheets.length === 0 ? (
                  <div className="p-4 text-sm text-[#64748B] dark:text-slate-400">
                    No matching coloring pages for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                    {searchResults.packs.length > 0 && (
                      <div className="p-2">
                        <div className="px-2.5 py-1 text-xs font-bold text-[#64748B] dark:text-slate-400">
                          Collections
                        </div>
                        {searchResults.packs.map((pack) => (
                          <button
                            key={pack.slug}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              setSearchQuery('');
                              onNavigate(`/${locale}/coloring-pages/${pack.slug}`);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                          >
                            <span className="text-sm font-semibold truncate">
                              {getText(pack.title, locale)}
                            </span>
                            <span className="text-xs text-[#64748B] dark:text-slate-400 shrink-0 ml-2 tabular-nums">
                              {pack.sheets.length} {pack.sheets.length === 1 ? t.card.page : t.card.pages}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.sheets.length > 0 && (
                      <div className="p-2">
                        <div className="px-2.5 py-1 text-xs font-bold text-[#64748B] dark:text-slate-400">
                          Coloring Sheets
                        </div>
                        {searchResults.sheets.map((sheet) => (
                          <button
                            key={sheet.id}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              setSearchQuery('');
                              onNavigate(`/page/${sheet.id}`);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                          >
                            <span className="text-sm font-medium truncate">
                              {getText(sheet.title, locale)}
                            </span>
                            <span className="text-xs font-bold text-[#E63946] shrink-0 ml-2">
                              View &amp; PDF
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* In-App PWA Install Prompt */}
            <PWAInstallButton variant="header" />

            {/* A4 / US Letter Toggle */}
            <div
              role="group"
              aria-label={t.pack.paperFormat}
              className="hidden sm:flex items-center bg-white/10 rounded-full p-0.5 border border-white/15"
            >
              <button
                type="button"
                onClick={() => onChangePaperSize('a4')}
                className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                  paperSize === 'a4'
                    ? 'bg-[#2A9D8F] text-white shadow-sm'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => onChangePaperSize('letter')}
                className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                  paperSize === 'letter'
                    ? 'bg-[#2A9D8F] text-white shadow-sm'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                US Letter
              </button>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'lang' ? null : 'lang')}
                aria-label="Language"
                className="h-9 px-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-1.5 text-xs font-bold text-white transition-colors whitespace-nowrap cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#FFB703]" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {openMenu === 'lang' && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 text-[#1E293B] dark:text-slate-100 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-2xl py-1.5 z-50">
                  {SUPPORTED_LOCALES.map((loc) => (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        onChangeLocale(loc.code);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-sm flex items-center justify-between hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        loc.code === locale ? 'font-bold text-[#E63946]' : 'font-medium'
                      }`}
                    >
                      <span>{loc.nativeName}</span>
                      <span className="text-xs text-[#64748B] dark:text-slate-400">{loc.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Light / Dark Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#FFB703]" />
              ) : (
                <Moon className="w-4 h-4 text-slate-200" />
              )}
            </button>

            {/* Mobile Nav Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle Menu"
              className="lg:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Mega-Menu Category Strip (Non-sticky to preserve viewport space) */}
      <nav
        aria-label="Main categories"
        className="relative bg-white dark:bg-[#111C2D] border-b border-[#E2E8F0] dark:border-slate-800 hidden lg:block z-30"
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                onNavigate(`/${locale}/top`);
              }}
              className={`h-8 px-3.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeRoute === 'top'
                  ? 'bg-[#E63946] text-white'
                  : 'text-[#1E293B] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#FFB703]" />
              {t.nav.top}
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                onNavigate(`/${locale}/trending`);
              }}
              className={`h-8 px-3.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeRoute === 'trending'
                  ? 'bg-[#E63946] text-white'
                  : 'text-[#1E293B] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#E63946]" />
              {t.nav.trending}
            </button>

            {/* Coloring Pages Mega Dropdown */}
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'coloring' ? null : 'coloring')}
              className={`h-8 px-3.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                openMenu === 'coloring'
                  ? 'bg-[#E63946] text-white'
                  : 'text-[#1E293B] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.nav.coloringPages}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  openMenu === 'coloring' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Holidays Mega Dropdown (only if populated) */}
            {hasHolidays && (
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'holidays' ? null : 'holidays')}
                className={`h-8 px-3.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  openMenu === 'holidays' || activeRoute === 'holidays'
                    ? 'bg-[#E63946] text-white'
                    : 'text-[#1E293B] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
                }`}
              >
                {t.nav.holidays}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    openMenu === 'holidays' ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}

            {hasWorksheets && (
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  onNavigate(`/${locale}/category/worksheets`);
                }}
                className={`h-8 px-3.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeRoute === 'category:worksheets'
                    ? 'bg-[#2A9D8F] text-white'
                    : 'text-[#1E293B] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                {t.nav.worksheets}
              </button>
            )}

            {hasCalendars && (
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  onNavigate(`/${locale}/category/calendars`);
                }}
                className={`h-8 px-3.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeRoute === 'category:calendars'
                    ? 'bg-[#2A9D8F] text-white'
                    : 'text-[#1E293B] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {t.nav.calendars}
              </button>
            )}

            {hasTeachers && (
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  onNavigate(`/${locale}/category/teachers`);
                }}
                className={`h-8 px-3.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeRoute === 'category:teachers'
                    ? 'bg-[#2A9D8F] text-white'
                    : 'text-[#1E293B] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                {t.nav.forTeachers}
              </button>
            )}
          </div>

          <span className="text-xs font-medium text-[#64748B] dark:text-slate-400 whitespace-nowrap">
            {t.hero.freeNote}
          </span>
        </div>

        {/* Mega Dropdown Drawer: Coloring Pages */}
        {openMenu === 'coloring' && (
          <div className="absolute left-0 right-0 bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 shadow-2xl z-40">
            <div className="max-w-[1280px] mx-auto px-8 py-6 grid grid-cols-12 gap-8">
              <div className="col-span-5">
                <h3 className="text-xs font-extrabold text-[#64748B] dark:text-slate-400 mb-3">
                  {t.sections.browseByTheme}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {megaCategories.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        onNavigate(`/${locale}/category/${item.id}`);
                      }}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                        {item.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs tabular-nums text-[#64748B] dark:text-slate-400">
                        {item.hot && (
                          <span className="text-[11px] font-extrabold text-[#E63946]">HOT</span>
                        )}
                        <span>{countByCategory(item.id)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-7 border-l border-[#E2E8F0] dark:border-slate-800 pl-8">
                <h3 className="text-xs font-extrabold text-[#64748B] dark:text-slate-400 mb-3">
                  Featured Printable Packs
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {packs.slice(0, 4).map((pack) => (
                    <button
                      key={pack.slug}
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        onNavigate(`/${locale}/coloring-pages/${pack.slug}`);
                      }}
                      className="p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 hover:border-[#E63946] dark:hover:border-[#E63946] bg-[#FAF8F5] dark:bg-slate-800/60 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-sm font-bold text-[#1E293B] dark:text-slate-100 truncate">
                        {getText(pack.title, locale)}
                      </div>
                      <div className="text-xs text-[#64748B] dark:text-slate-400 mt-1 tabular-nums">
                        {pack.sheets.length} {pack.sheets.length === 1 ? t.card.page : t.card.pages} · Free PDF • 300 DPI
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mega Dropdown Drawer: Holidays */}
        {openMenu === 'holidays' && (
          <div className="absolute left-0 right-0 bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 shadow-2xl z-40">
            <div className="max-w-[1280px] mx-auto px-8 py-6 grid grid-cols-3 gap-4">
              {holidayPacks.map((pack) => (
                <button
                  key={pack.slug}
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onNavigate(`/${locale}/coloring-pages/${pack.slug}`);
                  }}
                  className="p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-800 hover:border-[#E63946] bg-[#FAF8F5] dark:bg-slate-800/50 text-left transition-colors cursor-pointer"
                >
                  <div className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                    {getText(pack.title, locale)}
                  </div>
                  <div className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                    {getText(pack.subtitle, locale)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Collapsible Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 px-4 py-4 space-y-4 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="w-full h-10 pl-4 pr-11 rounded-full bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-sm text-[#1E293B] dark:text-slate-100"
            />
            <button
              type="submit"
              aria-label={t.hero.searchButton}
              className="absolute right-1.5 w-7 h-7 rounded-full bg-[#E63946] text-white flex items-center justify-center"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
              {t.pack.paperFormat}
            </span>
            <div className="flex items-center bg-[#FAF8F5] dark:bg-slate-800 rounded-full p-0.5 border border-[#E2E8F0] dark:border-slate-700">
              <button
                type="button"
                onClick={() => onChangePaperSize('a4')}
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  paperSize === 'a4' ? 'bg-[#2A9D8F] text-white' : 'text-[#64748B] dark:text-slate-300'
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => onChangePaperSize('letter')}
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  paperSize === 'letter' ? 'bg-[#2A9D8F] text-white' : 'text-[#64748B] dark:text-slate-300'
                }`}
              >
                US Letter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t.nav.top, path: `/${locale}/top`, show: true },
              { label: t.nav.trending, path: `/${locale}/trending`, show: true },
              { label: t.nav.holidays, path: `/${locale}/category/holidays`, show: hasHolidays },
              { label: t.nav.worksheets, path: `/${locale}/category/worksheets`, show: hasWorksheets },
              { label: t.nav.calendars, path: `/${locale}/category/calendars`, show: hasCalendars },
              { label: t.nav.forTeachers, path: `/${locale}/category/teachers`, show: hasTeachers },
            ]
              .filter((item) => item.show)
              .map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate(item.path);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 text-sm font-bold text-[#1E293B] dark:text-slate-100 text-left"
                >
                  {item.label}
                </button>
              ))}
          </div>

          <div className="pt-1">
            <PWAInstallButton variant="mobile-menu" />
          </div>
        </div>
      )}
    </div>
  );
};
