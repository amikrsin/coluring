import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  UploadCloud,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Layers,
  Flame,
  TrendingUp,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminCatalogSheet, AdminCategoryItem } from '../../types';
import { slugify } from '../../data/catalog-store';
import {
  R2ConnectionSettings,
  R2UploadStage,
  convertImageToWebpAndPdf,
  filenameToTitleAndSlug,
  formatBytes,
  isR2Ready,
  uploadAssetsToR2,
} from '../../utils/r2-upload';
import { uploadAssetsViaWorkerR2 } from '../../utils/cloudflare-admin';

interface BatchQueueItem {
  localId: string;
  file: File;
  previewUrl: string;
  title: string;
  slug: string;
  stage: R2UploadStage;
  error?: string;
  webpSizeBytes?: number;
  pdfSizeBytes?: number;
  previewWebpUrl?: string;
  pdfUrl?: string;
}

interface AdminBatchUploadModalProps {
  open: boolean;
  categories: AdminCategoryItem[];
  existingSlugs: Set<string>;
  r2Settings: R2ConnectionSettings;
  workerR2Connected?: boolean;
  adminToken?: string | null;
  onOpenR2Settings: () => void;
  onClose: () => void;
  onBatchComplete: (sheets: AdminCatalogSheet[]) => void;
}

function makeUniqueSlug(baseSlug: string, used: Set<string>): string {
  const clean = slugify(baseSlug) || 'coloring-page';
  if (!used.has(clean)) {
    used.add(clean);
    return clean;
  }
  let idx = 2;
  while (used.has(`${clean}-${idx}`)) {
    idx += 1;
  }
  const unique = `${clean}-${idx}`;
  used.add(unique);
  return unique;
}

export const AdminBatchUploadModal: React.FC<AdminBatchUploadModalProps> = ({
  open,
  categories,
  existingSlugs,
  r2Settings,
  workerR2Connected = false,
  adminToken = null,
  onOpenR2Settings,
  onClose,
  onBatchComplete,
}) => {
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [category, setCategory] = useState(categories[0]?.id || 'dinosaurs');
  const [subcategory, setSubcategory] = useState(
    categories[0]?.subcategories[0] || 'General'
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'detailed'>('easy');
  const [ageRange, setAgeRange] = useState('4–10 yrs');
  const [isTrending, setIsTrending] = useState(false);
  const [isHot, setIsHot] = useState(false);
  const [running, setRunning] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queueRef = useRef<BatchQueueItem[]>([]);
  queueRef.current = queue;

  useEffect(() => {
    if (open) {
      setGlobalError(null);
      setProcessedCount(0);
      if (categories.length > 0 && !categories.some((c) => c.id === category)) {
        setCategory(categories[0].id);
        setSubcategory(categories[0].subcategories[0] || 'General');
      }
    }
    return () => {
      if (!open) {
        queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      }
    };
  }, [open, categories, category]);

  if (!open) return null;

  const useWorkerR2 = Boolean(workerR2Connected && adminToken);
  const r2Ready = useWorkerR2 || isR2Ready(r2Settings);
  const selectedCatObj = categories.find((c) => c.id === category);
  const availableSubcats = selectedCatObj?.subcategories || [];

  const addFilesToQueue = (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(f.name)
    );
    if (files.length === 0) {
      setGlobalError('Please drop PNG, JPG, or WebP coloring page images.');
      return;
    }

    const used = new Set<string>(existingSlugs);
    queue.forEach((item) => used.add(item.slug));

    const maxToAdd = Math.max(0, 25 - queue.length);
    const sliced = files.slice(0, maxToAdd);
    if (files.length > maxToAdd) {
      setGlobalError(`Queue capped at 25 files per batch. Added the first ${sliced.length} files.`);
    } else {
      setGlobalError(null);
    }

    const added: BatchQueueItem[] = sliced.map((file, idx) => {
      const { title, slug } = filenameToTitleAndSlug(file.name);
      return {
        localId: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        title,
        slug: makeUniqueSlug(slug, used),
        stage: 'idle',
      };
    });

    setQueue((prev) => [...prev, ...added]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (running) return;
    if (e.dataTransfer.files?.length) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleRemoveItem = (localId: string) => {
    if (running) return;
    setQueue((prev) => {
      const target = prev.find((i) => i.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.localId !== localId);
    });
  };

  const handleUpdateItem = (
    localId: string,
    patch: Partial<Pick<BatchQueueItem, 'title' | 'slug'>>
  ) => {
    setQueue((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item))
    );
  };

  const updateItemState = (localId: string, patch: Partial<BatchQueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item))
    );
  };

  const handleRunBatch = async () => {
    if (!r2Ready) {
      setGlobalError('Configure Cloudflare R2 Storage Settings first before uploading.');
      return;
    }
    const pendingItems = queue.filter((i) => i.stage !== 'done');
    if (pendingItems.length === 0) return;

    setRunning(true);
    setGlobalError(null);
    setProcessedCount(0);

    const createdSheets: AdminCatalogSheet[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      const cleanSlug = slugify(item.slug || item.title);
      const cleanTitle = item.title.trim() || filenameToTitleAndSlug(item.file.name).title;

      try {
        updateItemState(item.localId, { stage: 'converting', error: undefined });
        const assets = await convertImageToWebpAndPdf(item.file, {
          maxWebpWidth: 700,
          title: cleanTitle,
        });
        URL.revokeObjectURL(assets.previewObjectUrl);

        updateItemState(item.localId, {
          webpSizeBytes: assets.webpSizeBytes,
          pdfSizeBytes: assets.pdfSizeBytes,
        });

        const uploaded =
          useWorkerR2 && adminToken
            ? await uploadAssetsViaWorkerR2({
                token: adminToken,
                categorySlug: category,
                slug: cleanSlug,
                assets,
                onStageChange: (stage) => {
                  updateItemState(item.localId, { stage });
                },
              })
            : await uploadAssetsToR2({
                settings: r2Settings,
                categorySlug: category,
                slug: cleanSlug,
                assets,
                onStageChange: (stage) => {
                  updateItemState(item.localId, { stage });
                },
              });

        updateItemState(item.localId, {
          stage: 'done',
          previewWebpUrl: uploaded.previewWebpUrl,
          pdfUrl: uploaded.pdfUrl,
        });

        createdSheets.push({
          id: cleanSlug,
          slug: cleanSlug,
          packSlug: category,
          title: cleanTitle,
          category,
          subcategory: subcategory || 'General',
          difficulty,
          ageRange: ageRange.trim() || '4–10 yrs',
          isTrending,
          isHot,
          previewWebpUrl: uploaded.previewWebpUrl,
          pdfUrl: uploaded.pdfUrl,
          pdfLetterUrl: uploaded.pdfLetterUrl,
          lineArtUrl: uploaded.previewWebpUrl,
          sourcePdfUrl: uploaded.pdfUrl,
          seoDescription: `Free printable ${cleanTitle} coloring page in optimized US Letter PDF.`,
          tags: [category, cleanSlug, ...(subcategory ? [slugify(subcategory)] : [])],
          views: 150,
          upvotes: 18,
          downvotes: 0,
          weeklyGrowthPct: isTrending ? 215 : 85,
          createdAt: today,
        });
      } catch (err) {
        updateItemState(item.localId, {
          stage: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        });
      } finally {
        setProcessedCount(i + 1);
      }
    }

    setRunning(false);

    if (createdSheets.length > 0) {
      onBatchComplete(createdSheets);
      if (createdSheets.length === pendingItems.length) {
        // Clear previews and close cleanly when all succeeded
        queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        setQueue([]);
        onClose();
      } else {
        setGlobalError(
          `${createdSheets.length} of ${pendingItems.length} pages uploaded and added to catalog. Review any failed rows below and retry.`
        );
      }
    } else {
      setGlobalError('None of the queued files uploaded. Check your R2 credentials and try again.');
    }
  };

  const pendingCount = queue.filter((q) => q.stage !== 'done').length;
  const doneCount = queue.filter((q) => q.stage === 'done').length;
  const overallPct =
    running && pendingCount > 0
      ? Math.min(100, Math.round((processedCount / Math.max(1, queue.length)) * 100))
      : doneCount > 0 && queue.length > 0
      ? Math.round((doneCount / queue.length) * 100)
      : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Batch Upload to Cloudflare R2"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#2A9D8F]/15 text-[#2A9D8F] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0F1E36] dark:text-white">
                Batch Upload to Cloudflare R2
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Drop 5–20 PNG/JPG sheets at once to auto-convert to 700px WebP + US Letter PDF, upload sequentially to R2, and add straight to your catalog.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={running}
            onClick={() => {
              queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
              setQueue([]);
              onClose();
            }}
            aria-label="Close modal"
            className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!r2Ready && (
            <div className="px-4 py-3 rounded-xl bg-[#FFB703]/15 border border-[#FFB703]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#92400E] dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Cloudflare R2 Storage Settings are not configured yet. Configure your bucket to enable direct uploads.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenR2Settings();
                }}
                className="h-8 px-3 rounded-lg bg-[#0F1E36] text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Open R2 Settings</span>
              </button>
            </div>
          )}

          {globalError && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-[#DC2626] dark:text-red-300"
            >
              {globalError}
            </div>
          )}

          {/* Batch Metadata Defaults */}
          <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-900/70 border border-[#E2E8F0] dark:border-slate-800 p-4 space-y-3">
            <div className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
              Batch Metadata &amp; R2 Folder Target
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 mb-1">
                  Category (R2 Folder)
                </label>
                <select
                  value={category}
                  disabled={running}
                  onChange={(e) => {
                    const nextCat = e.target.value;
                    setCategory(nextCat);
                    const found = categories.find((c) => c.id === nextCat);
                    setSubcategory(found?.subcategories[0] || 'General');
                  }}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 mb-1">
                  Sub-Category
                </label>
                {availableSubcats.length > 0 ? (
                  <select
                    value={subcategory}
                    disabled={running}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white"
                  >
                    {availableSubcats.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subcategory}
                    disabled={running}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs text-[#0F1E36] dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  disabled={running}
                  onChange={(e) =>
                    setDifficulty(e.target.value as 'easy' | 'medium' | 'detailed')
                  }
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] dark:text-slate-400 mb-1">
                  Age Range
                </label>
                <input
                  type="text"
                  value={ageRange}
                  disabled={running}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs text-[#0F1E36] dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={running}
                  onClick={() => setIsTrending((v) => !v)}
                  className={`h-8 px-3 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                    isTrending
                      ? 'bg-[#16A34A]/12 border-[#16A34A] text-[#15803D] dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 text-[#64748B]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Trending: {isTrending ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  type="button"
                  disabled={running}
                  onClick={() => setIsHot((v) => !v)}
                  className={`h-8 px-3 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                    isHot
                      ? 'bg-[#E63946]/12 border-[#E63946] text-[#B7102A] dark:text-red-300'
                      : 'bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 text-[#64748B]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Hot: {isHot ? 'ON' : 'OFF'}</span>
                </button>
              </div>
              <div className="text-[11px] font-mono text-[#64748B] dark:text-slate-400">
                R2 path: webp/{category}/&lt;slug&gt;.webp &amp; pdf/{category}/&lt;slug&gt;.pdf
              </div>
            </div>
          </div>

          {/* Multi-File Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!running) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !running && fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-[#2A9D8F] bg-[#2A9D8F]/10'
                : 'border-[#CBD5E1] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-900/50 hover:border-[#0F1E36] dark:hover:border-[#FFB703]'
            } ${running ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  addFilesToQueue(e.target.files);
                }
                e.target.value = '';
              }}
            />
            <div className="w-11 h-11 rounded-2xl bg-[#0F1E36] text-[#FFB703] mx-auto flex items-center justify-center mb-2.5">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-sm font-extrabold text-[#0F1E36] dark:text-white">
              Drop 5–20 PNG / JPG Coloring Pages here or Click to Browse
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
              Each file is converted in your browser to an optimized 700px WebP + print-ready US Letter (8.5×11&quot;) PDF before uploading sequentially to R2.
            </p>
          </div>

          {/* Sequential Progress Bar when Running */}
          {running && (
            <div className="rounded-xl bg-[#0F1E36] text-white p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFB703]" />
                  <span>
                    Processing &amp; uploading sequentially ({processedCount} / {queue.length})...
                  </span>
                </span>
                <span className="font-mono tabular-nums text-[#FFB703]">{overallPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-[#FFB703] transition-all duration-300"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Queued Files List */}
          {queue.length > 0 && (
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#FAF8F5] dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-[#0F1E36] dark:text-white">
                <span className="tabular-nums">
                  Queued Coloring Pages ({queue.length})
                </span>
                {!running && (
                  <button
                    type="button"
                    onClick={() => {
                      queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                      setQueue([]);
                    }}
                    className="text-[#DC2626] hover:underline font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800 max-h-72 overflow-y-auto">
                {queue.map((item) => (
                  <div
                    key={item.localId}
                    className="p-3 flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-[#111C2D]"
                  >
                    <div className="w-11 h-14 rounded-lg bg-white border border-[#CBD5E1] dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                      <input
                        type="text"
                        disabled={running || item.stage === 'done'}
                        value={item.title}
                        onChange={(e) =>
                          handleUpdateItem(item.localId, { title: e.target.value })
                        }
                        aria-label="Page Title"
                        className="h-8 px-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white"
                      />
                      <input
                        type="text"
                        disabled={running || item.stage === 'done'}
                        value={item.slug}
                        onChange={(e) =>
                          handleUpdateItem(item.localId, {
                            slug: slugify(e.target.value),
                          })
                        }
                        aria-label="URL Slug"
                        className="h-8 px-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#475569] dark:text-slate-300"
                      />
                      {item.error && (
                        <div className="sm:col-span-2 text-[11px] font-bold text-[#DC2626]">
                          {item.error}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                      <div className="text-right">
                        {item.stage === 'idle' && (
                          <span className="text-[11px] font-bold text-[#64748B]">
                            Ready · {formatBytes(item.file.size)}
                          </span>
                        )}
                        {item.stage === 'converting' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#D97706]">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Converting...</span>
                          </span>
                        )}
                        {item.stage === 'uploading-webp' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2A9D8F]">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Uploading WebP...</span>
                          </span>
                        )}
                        {item.stage === 'uploading-pdf' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0F1E36] dark:text-[#FFB703]">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Uploading PDF...</span>
                          </span>
                        )}
                        {item.stage === 'done' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#16A34A]">
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              Done ({formatBytes(item.webpSizeBytes || 0)} /{' '}
                              {formatBytes(item.pdfSizeBytes || 0)})
                            </span>
                          </span>
                        )}
                        {item.stage === 'error' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#DC2626]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </div>

                      {!running && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.localId)}
                          aria-label={`Remove ${item.title}`}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#64748B] hover:text-[#DC2626] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#111C2D]">
          <div className="text-xs text-[#64748B] dark:text-slate-400 tabular-nums">
            {queue.length === 0
              ? 'No files queued yet.'
              : `${pendingCount} pending · ${doneCount} uploaded`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={running}
              onClick={() => {
                queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                setQueue([]);
                onClose();
              }}
              className="h-10 px-4 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-sm font-bold text-[#475569] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={running || pendingCount === 0 || !r2Ready}
              onClick={handleRunBatch}
              className="h-10 px-5 rounded-xl bg-[#E63946] hover:bg-[#D62839] disabled:opacity-45 text-white text-sm font-extrabold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading {processedCount}/{queue.length}...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload {pendingCount || ''} to R2 &amp; Add to Catalog</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
