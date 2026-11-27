import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutGrid,
  FolderTree,
  Plus,
  Upload,
  Download,
  RotateCcw,
  Search,
  Flame,
  TrendingUp,
  Pencil,
  Trash2,
  ExternalLink,
  Lock,
  AlertCircle,
  Check,
  Paintbrush,
  Palette,
  Layers,
  Database,
  HardDrive,
  Loader2,
  Cloud,
} from 'lucide-react';
import {
  AdminCatalogSheet,
  ColoringSheet,
  StaticCatalogDocument,
} from '../../types';
import {
  downloadCatalogJson,
  hasUnsavedCatalogChanges,
} from '../../data/catalog-store';
import { getLineArtDataUri } from '../../data/line-art';
import {
  R2ConnectionSettings,
  loadR2Settings,
} from '../../utils/r2-upload';
import {
  CloudStatus,
  DEFAULT_CLOUD_STATUS,
  fetchCloudStatus,
  saveCatalogToCloudD1,
} from '../../utils/cloudflare-admin';
import {
  AdminPinGate,
  isAdminSessionUnlocked,
  lockAdminSession,
} from './AdminPinGate';
import { AdminSheetModal } from './AdminSheetModal';
import { AdminBulkImportModal } from './AdminBulkImportModal';
import { AdminStructureTab } from './AdminStructureTab';
import { AdminR2SettingsPanel } from './AdminR2SettingsPanel';
import { AdminBatchUploadModal } from './AdminBatchUploadModal';

interface AdminDashboardProps {
  catalogDoc: StaticCatalogDocument;
  storefrontSheets: ColoringSheet[];
  onUpdateCatalog: (next: StaticCatalogDocument) => void;
  onResetToLive: () => void;
  onExitToStorefront: () => void;
  onPreviewSheet: (sheet: ColoringSheet) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  catalogDoc,
  storefrontSheets,
  onUpdateCatalog,
  onResetToLive,
  onExitToStorefront,
  onPreviewSheet,
}) => {
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>({
    ...DEFAULT_CLOUD_STATUS,
  });
  const [statusLoaded, setStatusLoaded] = useState(false);
  // Bearer token stays strictly in JS/React memory (never stored in localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<boolean>(() => isAdminSessionUnlocked());
  const [d1SyncState, setD1SyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [d1SyncError, setD1SyncError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'structure'>('pages');

  useEffect(() => {
    let active = true;
    fetchCloudStatus()
      .then((next) => {
        if (!active) return;
        setCloudStatus(next);
        if (next.d1Bound || next.r2Bound || next.pinConfigured) {
          // Enforce server-verified in-memory Bearer token whenever Worker auth/bindings are active
          setUnlocked(false);
        }
      })
      .finally(() => {
        if (active) setStatusLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Table search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterFlag, setFilterFlag] = useState<'all' | 'trending' | 'hot'>('all');

  // Modals & confirmations (never use window.alert / window.confirm)
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<AdminCatalogSheet | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [batchUploadModalOpen, setBatchUploadModalOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cloudflare R2 Storage Settings state (optional fallback when Worker R2 binding isn't attached)
  const [r2Settings, setR2Settings] = useState<R2ConnectionSettings>(() =>
    loadR2Settings()
  );
  const [r2PanelExpanded, setR2PanelExpanded] = useState(false);
  const r2PanelRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const hasUnsaved = useMemo(
    () => !cloudStatus.d1Bound && hasUnsavedCatalogChanges(catalogDoc),
    [catalogDoc, cloudStatus.d1Bound]
  );

  const existingSlugs = useMemo(
    () => new Set(catalogDoc.sheets.map((s) => s.slug)),
    [catalogDoc.sheets]
  );

  const sheetCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of catalogDoc.sheets) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [catalogDoc.sheets]);

  const filteredSheets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogDoc.sheets.filter((s) => {
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      if (filterDifficulty !== 'all' && s.difficulty !== filterDifficulty) return false;
      if (filterFlag === 'trending' && !s.isTrending) return false;
      if (filterFlag === 'hot' && !s.isHot) return false;
      if (!q) return true;
      const hay = `${s.title} ${s.slug} ${s.category} ${s.subcategory} ${s.tags.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalogDoc.sheets, searchQuery, filterCategory, filterDifficulty, filterFlag]);

  const persistCatalogUpdate = (next: StaticCatalogDocument) => {
    onUpdateCatalog(next);
    if (cloudStatus.d1Bound && adminToken) {
      setD1SyncState('saving');
      setD1SyncError(null);
      void saveCatalogToCloudD1(next, adminToken).then((res) => {
        if (res.ok) {
          setD1SyncState('saved');
          setD1SyncError(null);
        } else if (res.unauthorized) {
          setAdminToken(null);
          setUnlocked(false);
        } else {
          setD1SyncState('error');
          setD1SyncError(res.error);
        }
      });
    }
  };

  if (!statusLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1320] flex items-center justify-center gap-2 text-sm font-bold text-[#64748B]">
        <Loader2 className="w-4 h-4 animate-spin text-[#2A9D8F]" />
        <span>Loading Admin Catalog Manager...</span>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <AdminPinGate
        initialStatus={cloudStatus}
        onUnlock={({ token, status }) => {
          setCloudStatus(status);
          setAdminToken(token);
          setUnlocked(true);
        }}
        onExit={onExitToStorefront}
      />
    );
  }

  const trendingCount = catalogDoc.sheets.filter((s) => s.isTrending).length;
  const hotCount = catalogDoc.sheets.filter((s) => s.isHot).length;
  const totalSubcategories = catalogDoc.categories.reduce(
    (sum, c) => sum + c.subcategories.length,
    0
  );

  const handleSaveSheet = (
    saved: AdminCatalogSheet,
    meta: {
      newCategory?: { id: string; label: string };
      newSubcategory?: { categoryId: string; name: string };
      updatedR2BaseUrl?: string;
    }
  ) => {
    let nextCategories = [...catalogDoc.categories];

    if (meta.newCategory && !nextCategories.some((c) => c.id === meta.newCategory!.id)) {
      nextCategories.push({
        id: meta.newCategory.id,
        label: meta.newCategory.label,
        subcategories: [saved.subcategory || 'General'],
        navGroup: 'coloring',
        isHot: false,
      });
    } else if (meta.newSubcategory) {
      nextCategories = nextCategories.map((c) =>
        c.id === meta.newSubcategory!.categoryId &&
        !c.subcategories.includes(meta.newSubcategory!.name)
          ? { ...c, subcategories: [...c.subcategories, meta.newSubcategory!.name] }
          : c
      );
    }

    const isEdit = Boolean(editingSheet);
    const nextSheets = isEdit
      ? catalogDoc.sheets.map((s) => (s.slug === editingSheet!.slug ? saved : s))
      : [saved, ...catalogDoc.sheets];

    persistCatalogUpdate({
      ...catalogDoc,
      updatedAt: new Date().toISOString(),
      defaultR2BaseUrl: meta.updatedR2BaseUrl || catalogDoc.defaultR2BaseUrl,
      categories: nextCategories,
      sheets: nextSheets,
    });

    setSheetModalOpen(false);
    setEditingSheet(null);
    showToast(
      cloudStatus.d1Bound
        ? isEdit
          ? `Published updates to "${saved.title}" in Cloudflare D1`
          : `Published "${saved.title}" live to Cloudflare D1`
        : isEdit
        ? `Updated "${saved.title}"`
        : `Added "${saved.title}" to catalog`
    );
  };

  const handleToggleSheetFlag = (slug: string, flag: 'isTrending' | 'isHot') => {
    const nextSheets = catalogDoc.sheets.map((s) =>
      s.slug === slug ? { ...s, [flag]: !s[flag] } : s
    );
    persistCatalogUpdate({
      ...catalogDoc,
      updatedAt: new Date().toISOString(),
      sheets: nextSheets,
    });
  };

  const handleDeleteSheet = (slug: string) => {
    const target = catalogDoc.sheets.find((s) => s.slug === slug);
    persistCatalogUpdate({
      ...catalogDoc,
      updatedAt: new Date().toISOString(),
      sheets: catalogDoc.sheets.filter((s) => s.slug !== slug),
    });
    setConfirmDeleteSlug(null);
    if (target) {
      showToast(
        cloudStatus.d1Bound
          ? `Deleted "${target.title}" from Cloudflare D1`
          : `Deleted "${target.title}"`
      );
    }
  };

  const handleBulkImport = (
    imported: AdminCatalogSheet[],
    mode: 'skip' | 'overwrite'
  ) => {
    const existingMap = new Map(catalogDoc.sheets.map((s) => [s.slug, s]));
    const nextCategories = [...catalogDoc.categories];
    const catSet = new Set(nextCategories.map((c) => c.id));

    for (const item of imported) {
      if (!catSet.has(item.category)) {
        catSet.add(item.category);
        nextCategories.push({
          id: item.category,
          label: item.category
            .split('-')
            .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
            .join(' '),
          subcategories: [item.subcategory || 'General'],
          navGroup: 'coloring',
          isHot: false,
        });
      }
      if (mode === 'overwrite' || !existingMap.has(item.slug)) {
        existingMap.set(item.slug, item);
      }
    }

    // Place newly added sheets at top for instant visibility
    const importedSlugs = new Set(imported.map((i) => i.slug));
    const untouched = catalogDoc.sheets.filter((s) => !importedSlugs.has(s.slug));
    const merged = [...imported, ...untouched];

    persistCatalogUpdate({
      ...catalogDoc,
      updatedAt: new Date().toISOString(),
      categories: nextCategories,
      sheets: merged,
    });
    showToast(
      cloudStatus.d1Bound
        ? `Imported & published ${imported.length} coloring pages to Cloudflare D1`
        : `Imported ${imported.length} coloring pages into local catalog`
    );
  };

  const handleBatchUploadComplete = (uploadedSheets: AdminCatalogSheet[]) => {
    if (uploadedSheets.length === 0) return;
    const uploadedSlugs = new Set(uploadedSheets.map((s) => s.slug));
    const untouched = catalogDoc.sheets.filter((s) => !uploadedSlugs.has(s.slug));
    persistCatalogUpdate({
      ...catalogDoc,
      updatedAt: new Date().toISOString(),
      defaultR2BaseUrl: r2Settings.publicBaseUrl || catalogDoc.defaultR2BaseUrl,
      sheets: [...uploadedSheets, ...untouched],
    });
    showToast(
      `Uploaded ${uploadedSheets.length} coloring page${
        uploadedSheets.length === 1 ? '' : 's'
      } to Cloudflare R2${cloudStatus.d1Bound ? ' and published live to D1' : ' and added to catalog'}`
    );
  };

  const handleOpenR2Settings = () => {
    setR2PanelExpanded(true);
    setTimeout(() => {
      r2PanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSaveR2Settings = (next: R2ConnectionSettings) => {
    setR2Settings(next);
    if (next.publicBaseUrl && next.publicBaseUrl !== catalogDoc.defaultR2BaseUrl) {
      persistCatalogUpdate({
        ...catalogDoc,
        updatedAt: new Date().toISOString(),
        defaultR2BaseUrl: next.publicBaseUrl,
      });
    }
    showToast('Saved Cloudflare R2 storage settings');
  };

  const handleExport = () => {
    downloadCatalogJson(catalogDoc);
    showToast('Downloaded catalog.json backup');
  };

  const handleConfirmReset = () => {
    onResetToLive();
    setConfirmReset(false);
    showToast('Discarded local drafts and restored catalog.json');
  };

  const handleLock = () => {
    lockAdminSession();
    setAdminToken(null);
    setUnlocked(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1320] text-[#1E293B] dark:text-slate-100 flex flex-col">
      {/* Top Admin Workspace Header */}
      <header className="sticky top-0 z-30 h-16 bg-[#0F1E36] text-white border-b border-white/10 px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExitToStorefront}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-[#E63946] flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </span>
            <span className="text-base font-extrabold tracking-tight whitespace-nowrap">
              ColorWorld
            </span>
          </button>
          <span className="text-white/30 hidden sm:inline">/</span>
          <span className="text-sm font-bold text-slate-200 truncate hidden sm:inline">
            Admin Catalog Manager
          </span>

          {cloudStatus.d1Bound ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2A9D8F]/20 border border-[#2A9D8F]/45 text-[#99F6E4] text-xs font-extrabold whitespace-nowrap shrink-0">
              {d1SyncState === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing D1...</span>
                </>
              ) : d1SyncState === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-[#FCA5A5]" />
                  <span>D1 Sync Error</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Cloudflare D1 Live</span>
                </>
              )}
            </span>
          ) : (
            hasUnsaved && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#D97706]/25 border border-[#FFB703]/50 text-[#FFDEA9] text-xs font-extrabold whitespace-nowrap shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-[#FFB703]" />
                <span>Unsaved Changes</span>
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExitToStorefront}
            className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">View Live Storefront</span>
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-500/50 rounded-lg px-2 py-1">
              <span className="text-[11px] font-bold text-red-200 hidden sm:inline">
                Discard drafts?
              </span>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="h-7 px-2 rounded bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="h-7 px-2 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={!hasUnsaved}
              title="Discard local drafts and reset to live src/data/catalog.json"
              className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset to Live File</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExport}
            className="h-9 px-3.5 rounded-lg bg-[#FFB703] hover:bg-[#F2A900] text-[#0F1E36] text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export catalog.json</span>
          </button>

          <button
            type="button"
            onClick={handleLock}
            title="Lock Admin Session"
            aria-label="Lock Admin Session"
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout: Sidebar + Content Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Navigation Sidebar */}
        <aside className="lg:w-60 bg-white dark:bg-[#111C2D] border-b lg:border-b-0 lg:border-r border-[#E2E8F0] dark:border-slate-800 p-3 lg:p-4 flex lg:flex-col gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pages')}
            className={`flex-1 lg:flex-none h-10 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pages'
                ? 'bg-[#0F1E36] text-white'
                : 'text-[#475569] dark:text-slate-300 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span>Coloring Pages</span>
            </span>
            <span className="text-xs font-mono tabular-nums opacity-75">
              {catalogDoc.sheets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`flex-1 lg:flex-none h-10 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'structure'
                ? 'bg-[#0F1E36] text-white'
                : 'text-[#475569] dark:text-slate-300 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              <span>Categories &amp; Ticker</span>
            </span>
            <span className="text-xs font-mono tabular-nums opacity-75">
              {catalogDoc.categories.length}
            </span>
          </button>

          {/* Workflow Guide Note (Desktop Sidebar Bottom) */}
          <div className="hidden lg:block mt-auto pt-4 border-t border-[#E2E8F0] dark:border-slate-800 space-y-2 text-xs text-[#64748B] dark:text-slate-400">
            <div className="font-extrabold text-[#0F1E36] dark:text-slate-200">
              {cloudStatus.d1Bound || cloudStatus.r2Bound
                ? 'Cloudflare Edge Connected'
                : 'Static Deploy Workflow'}
            </div>
            {cloudStatus.d1Bound || cloudStatus.r2Bound ? (
              <>
                <p className="leading-relaxed">
                  • <strong>D1 Database:</strong>{' '}
                  {cloudStatus.d1Bound ? 'Auto-publishes every edit live.' : 'Not bound yet.'}
                </p>
                <p className="leading-relaxed">
                  • <strong>R2 Storage:</strong>{' '}
                  {cloudStatus.r2Bound
                    ? 'Uploads WebP & PDF directly via Worker (/cdn/*).'
                    : 'Using browser R2 settings.'}
                </p>
              </>
            ) : (
              <>
                <p className="leading-relaxed">
                  1. Add, edit, or bulk-import sheets here (saved in localStorage).
                </p>
                <p className="leading-relaxed">
                  2. Click <strong>Export catalog.json</strong> or bind Cloudflare D1 &amp; R2 to publish live automatically.
                </p>
              </>
            )}
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
          {/* Clean Flat Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 p-4">
              <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                Total Coloring Pages
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#0F1E36] dark:text-white tabular-nums">
                {catalogDoc.sheets.length}
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 p-4">
              <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                Trending / Hot
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#0F1E36] dark:text-white tabular-nums">
                {trendingCount} <span className="text-sm font-semibold text-[#64748B]">/ {hotCount}</span>
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 p-4">
              <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                Categories · Sub-Categories
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#0F1E36] dark:text-white tabular-nums">
                {catalogDoc.categories.length}{' '}
                <span className="text-sm font-semibold text-[#64748B]">· {totalSubcategories}</span>
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 p-4">
              <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                Holiday Ticker Items
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#0F1E36] dark:text-white tabular-nums">
                {catalogDoc.holidayTicker.length}
              </div>
            </div>
          </div>

          {d1SyncError && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold text-red-700 dark:text-red-300"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>D1 Sync Error: {d1SyncError}</span>
              </span>
              <button
                type="button"
                onClick={() => persistCatalogUpdate(catalogDoc)}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer whitespace-nowrap"
              >
                Retry Sync
              </button>
            </div>
          )}

          {/* Bound Cloudflare Worker R2 & D1 Live Banner */}
          {cloudStatus.r2Bound ? (
            <div className="rounded-2xl bg-white dark:bg-[#111C2D] border border-[#2A9D8F]/40 px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-[#2A9D8F]/15 text-[#2A9D8F] flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-[#0F1E36] dark:text-white flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Cloudflare Worker R2 &amp; D1 Active</span>
                    <span className="text-xs font-semibold text-[#2A9D8F] inline-flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      COLORING_BUCKET bound
                    </span>
                    {cloudStatus.d1Bound && (
                      <span className="text-xs font-semibold text-[#2A9D8F] inline-flex items-center gap-1">
                        <Database className="w-3.5 h-3.5" />
                        DB live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">
                    Drag-and-drop uploads save directly to your bound R2 bucket at <span className="font-mono">/cdn/...</span> — no browser API keys or CORS configuration needed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setR2PanelExpanded((v) => !v)}
                className="text-xs font-bold text-[#64748B] hover:text-[#0F1E36] dark:hover:text-white cursor-pointer whitespace-nowrap"
              >
                {r2PanelExpanded ? 'Hide Custom R2 Keys' : 'Custom R2 Keys'}
              </button>
            </div>
          ) : null}

          {/* Collapsible Cloudflare R2 Storage Settings Panel */}
          {(!cloudStatus.r2Bound || r2PanelExpanded) && (
            <div ref={r2PanelRef}>
              <AdminR2SettingsPanel
                settings={r2Settings}
                expanded={r2PanelExpanded}
                onToggleExpanded={() => setR2PanelExpanded((v) => !v)}
                onSaveSettings={handleSaveR2Settings}
              />
            </div>
          )}

          {activeTab === 'pages' ? (
            <section className="rounded-2xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 overflow-hidden">
              {/* Toolbar: Search, Filters & Primary Actions */}
              <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, slug, tag..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
                    />
                  </div>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    aria-label="Filter by category"
                    className="h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-slate-100"
                  >
                    <option value="all">All Categories</option>
                    {catalogDoc.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    aria-label="Filter by difficulty"
                    className="h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-slate-100"
                  >
                    <option value="all">All Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="detailed">Detailed</option>
                  </select>

                  <div className="flex items-center bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl p-0.5 text-xs font-bold">
                    {(['all', 'trending', 'hot'] as const).map((flag) => (
                      <button
                        key={flag}
                        type="button"
                        onClick={() => setFilterFlag(flag)}
                        className={`h-8 px-2.5 rounded-lg capitalize transition-colors cursor-pointer ${
                          filterFlag === flag
                            ? 'bg-[#0F1E36] text-white'
                            : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F1E36] dark:hover:text-white'
                        }`}
                      >
                        {flag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setBulkModalOpen(true)}
                    className="h-10 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#0F1E36] dark:hover:border-slate-500 text-xs font-bold text-[#0F1E36] dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4 text-[#64748B]" />
                    <span>CSV / JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchUploadModalOpen(true)}
                    className="h-10 px-3.5 rounded-xl border border-[#2A9D8F]/50 bg-[#2A9D8F]/10 hover:bg-[#2A9D8F]/20 text-xs sm:text-sm font-extrabold text-[#115E59] dark:text-teal-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Layers className="w-4 h-4 text-[#2A9D8F]" />
                    <span>Batch Upload to R2</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingSheet(null);
                      setSheetModalOpen(true);
                    }}
                    className="h-10 px-4 rounded-xl bg-[#E63946] hover:bg-[#D62839] text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Coloring Page</span>
                  </button>
                </div>
              </div>

              {/* High-Density CRUD Data Table */}
              {filteredSheets.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-sm font-bold text-[#0F1E36] dark:text-white">
                    No coloring pages match your current filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('all');
                      setFilterDifficulty('all');
                      setFilterFlag('all');
                    }}
                    className="h-9 px-4 rounded-xl bg-[#0F1E36] text-white text-xs font-bold cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#FAF8F5] dark:bg-slate-900/70 border-b border-[#E2E8F0] dark:border-slate-800 text-[11px] font-extrabold text-[#64748B] dark:text-slate-400">
                      <tr>
                        <th className="py-3 px-4 w-16">Preview</th>
                        <th className="py-3 px-3">Title &amp; Slug</th>
                        <th className="py-3 px-3">Category / Sub-Category</th>
                        <th className="py-3 px-3">Difficulty</th>
                        <th className="py-3 px-3 text-center">Trending</th>
                        <th className="py-3 px-3 text-center">Hot</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-sm">
                      {filteredSheets.map((item) => {
                        const thumb =
                          item.previewWebpUrl &&
                          !item.previewWebpUrl.startsWith('/cdn/thumbs/')
                            ? item.previewWebpUrl
                            : getLineArtDataUri(item.slug);
                        const matchingStoreSheet = storefrontSheets.find(
                          (s) => s.id === item.slug
                        );

                        return (
                          <tr
                            key={item.slug}
                            className="hover:bg-[#FAF8F5]/70 dark:hover:bg-slate-800/35 transition-colors"
                          >
                            <td className="py-2.5 px-4">
                              <div className="w-11 h-14 rounded-lg bg-white border border-[#CBD5E1] dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                                <img
                                  src={thumb}
                                  alt={item.title}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      getLineArtDataUri('dino-trex');
                                  }}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </td>

                            <td className="py-2.5 px-3 min-w-[220px]">
                              <div className="font-bold text-[#0F1E36] dark:text-white leading-snug">
                                {item.title}
                              </div>
                              <div className="text-xs font-mono text-[#64748B] dark:text-slate-400 mt-0.5">
                                {item.slug}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="text-xs font-bold text-[#1E293B] dark:text-slate-200 capitalize">
                                {item.category}
                              </div>
                              <div className="text-xs text-[#64748B] dark:text-slate-400">
                                {item.subcategory || 'General'}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`text-xs font-extrabold capitalize ${
                                  item.difficulty === 'easy'
                                    ? 'text-[#16A34A]'
                                    : item.difficulty === 'medium'
                                    ? 'text-[#D97706]'
                                    : 'text-[#7C3AED] dark:text-purple-400'
                                }`}
                              >
                                {item.difficulty}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleSheetFlag(item.slug, 'isTrending')
                                }
                                aria-pressed={item.isTrending}
                                title="Toggle Trending"
                                className={`h-8 px-2.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                  item.isTrending
                                    ? 'bg-[#16A34A]/12 border-[#16A34A] text-[#15803D] dark:text-emerald-300'
                                    : 'bg-white dark:bg-slate-900 border-[#CBD5E1] dark:border-slate-700 text-[#94A3B8]'
                                }`}
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>{item.isTrending ? 'On' : 'Off'}</span>
                              </button>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSheetFlag(item.slug, 'isHot')}
                                aria-pressed={item.isHot}
                                title="Toggle Hot"
                                className={`h-8 px-2.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                  item.isHot
                                    ? 'bg-[#E63946]/12 border-[#E63946] text-[#B7102A] dark:text-red-300'
                                    : 'bg-white dark:bg-slate-900 border-[#CBD5E1] dark:border-slate-700 text-[#94A3B8]'
                                }`}
                              >
                                <Flame className="w-3.5 h-3.5" />
                                <span>{item.isHot ? 'On' : 'Off'}</span>
                              </button>
                            </td>

                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1">
                                {matchingStoreSheet && (
                                  <button
                                    type="button"
                                    onClick={() => onPreviewSheet(matchingStoreSheet)}
                                    title="Test in Color Online"
                                    aria-label={`Color online ${item.title}`}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#2A9D8F] flex items-center justify-center cursor-pointer"
                                  >
                                    <Paintbrush className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSheet(item);
                                    setSheetModalOpen(true);
                                  }}
                                  title="Edit"
                                  aria-label={`Edit ${item.title}`}
                                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#475569] dark:text-slate-300 flex items-center justify-center cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {confirmDeleteSlug === item.slug ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSheet(item.slug)}
                                    className="h-8 px-2.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteSlug(item.slug)}
                                    title="Delete"
                                    aria-label={`Delete ${item.title}`}
                                    className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#64748B] hover:text-[#DC2626] flex items-center justify-center cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <AdminStructureTab
              categories={catalogDoc.categories}
              holidayTicker={catalogDoc.holidayTicker}
              sheetCountsByCategory={sheetCountsByCategory}
              onUpdateCategories={(next) =>
                persistCatalogUpdate({
                  ...catalogDoc,
                  updatedAt: new Date().toISOString(),
                  categories: next,
                })
              }
              onUpdateHolidays={(next) =>
                persistCatalogUpdate({
                  ...catalogDoc,
                  updatedAt: new Date().toISOString(),
                  holidayTicker: next,
                })
              }
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AdminSheetModal
        open={sheetModalOpen}
        editingSheet={editingSheet}
        categories={catalogDoc.categories}
        defaultR2BaseUrl={r2Settings.publicBaseUrl || catalogDoc.defaultR2BaseUrl}
        existingSlugs={existingSlugs}
        r2Settings={r2Settings}
        workerR2Connected={cloudStatus.r2Bound}
        adminToken={adminToken}
        onOpenR2Settings={handleOpenR2Settings}
        onSwitchToBatch={() => {
          setSheetModalOpen(false);
          setEditingSheet(null);
          setBatchUploadModalOpen(true);
        }}
        onClose={() => {
          setSheetModalOpen(false);
          setEditingSheet(null);
        }}
        onSave={handleSaveSheet}
      />

      <AdminBatchUploadModal
        open={batchUploadModalOpen}
        categories={catalogDoc.categories}
        existingSlugs={existingSlugs}
        r2Settings={r2Settings}
        workerR2Connected={cloudStatus.r2Bound}
        adminToken={adminToken}
        onOpenR2Settings={handleOpenR2Settings}
        onClose={() => setBatchUploadModalOpen(false)}
        onBatchComplete={handleBatchUploadComplete}
      />

      <AdminBulkImportModal
        open={bulkModalOpen}
        existingSlugs={existingSlugs}
        defaultR2BaseUrl={r2Settings.publicBaseUrl || catalogDoc.defaultR2BaseUrl}
        onClose={() => setBulkModalOpen(false)}
        onImport={handleBulkImport}
      />

      {/* Quiet Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#0F1E36] text-white border border-white/15 shadow-2xl text-xs font-bold flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-[#FFB703]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
