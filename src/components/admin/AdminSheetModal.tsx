import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Wand2,
  Plus,
  Flame,
  TrendingUp,
  Check,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  Layers,
  Settings,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { AdminCatalogSheet, AdminCategoryItem } from '../../types';
import { generateR2Links, slugify } from '../../data/catalog-store';
import { getLineArtDataUri } from '../../data/line-art';
import {
  ConvertedColoringAssets,
  R2ConnectionSettings,
  R2UploadStage,
  convertImageToWebpAndPdf,
  filenameToTitleAndSlug,
  formatBytes,
  isR2Ready,
  uploadAssetsToR2,
} from '../../utils/r2-upload';
import { uploadAssetsViaWorkerR2 } from '../../utils/cloudflare-admin';

interface AdminSheetModalProps {
  open: boolean;
  editingSheet: AdminCatalogSheet | null;
  categories: AdminCategoryItem[];
  defaultR2BaseUrl: string;
  existingSlugs: Set<string>;
  r2Settings: R2ConnectionSettings;
  workerR2Connected?: boolean;
  adminToken?: string | null;
  onOpenR2Settings: () => void;
  onSwitchToBatch: () => void;
  onClose: () => void;
  onSave: (
    sheet: AdminCatalogSheet,
    meta: {
      newCategory?: { id: string; label: string };
      newSubcategory?: { categoryId: string; name: string };
      updatedR2BaseUrl?: string;
    }
  ) => void;
}

const STAGE_PROGRESS: Record<R2UploadStage, { pct: number; label: string }> = {
  idle: { pct: 0, label: 'Ready to upload to Cloudflare R2' },
  converting: { pct: 28, label: 'Converting to 700px WebP & US Letter PDF...' },
  'uploading-webp': { pct: 58, label: 'Uploading WebP...' },
  'uploading-pdf': { pct: 86, label: 'Uploading PDF...' },
  done: { pct: 100, label: 'Done! Public R2 links auto-filled.' },
  error: { pct: 0, label: 'Upload failed' },
};

export const AdminSheetModal: React.FC<AdminSheetModalProps> = ({
  open,
  editingSheet,
  categories,
  defaultR2BaseUrl,
  existingSlugs,
  r2Settings,
  workerR2Connected = false,
  adminToken = null,
  onOpenR2Settings,
  onSwitchToBatch,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState('dinosaurs');
  const [subcategory, setSubcategory] = useState('');
  const [packSlug, setPackSlug] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'detailed'>('easy');
  const [ageRange, setAgeRange] = useState('4–10 yrs');
  const [isTrending, setIsTrending] = useState(false);
  const [isHot, setIsHot] = useState(false);
  const [previewWebpUrl, setPreviewWebpUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLetterUrl, setPdfLetterUrl] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Drag & Drop + Browser Conversion + Direct R2 Upload state
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertedAssets, setConvertedAssets] = useState<ConvertedColoringAssets | null>(null);
  const [uploadStage, setUploadStage] = useState<R2UploadStage>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Manual URL Fallback Helper (collapsible)
  const [showManualHelper, setShowManualHelper] = useState(false);
  const [r2Base, setR2Base] = useState(defaultR2BaseUrl);
  const [r2Filename, setR2Filename] = useState('');
  const [r2Structure, setR2Structure] = useState<'flat' | 'structured'>('flat');
  const [r2AppliedFlash, setR2AppliedFlash] = useState(false);

  // Inline create Category / Subcategory
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingSubcat, setCreatingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const revokeLocalPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      revokeLocalPreview();
      return;
    }
    setError(null);
    setUploadError(null);
    setUploadStage('idle');
    setSelectedFile(null);
    setConvertedAssets(null);
    revokeLocalPreview();
    setCreatingCategory(false);
    setNewCategoryName('');
    setCreatingSubcat(false);
    setNewSubcatName('');
    setR2Base(r2Settings.publicBaseUrl || defaultR2BaseUrl);
    setR2AppliedFlash(false);
    setShowManualHelper(Boolean(editingSheet));

    if (editingSheet) {
      setTitle(editingSheet.title);
      setSlug(editingSheet.slug);
      setSlugTouched(true);
      setCategory(editingSheet.category);
      setSubcategory(editingSheet.subcategory);
      setPackSlug(editingSheet.packSlug);
      setDifficulty(editingSheet.difficulty);
      setAgeRange(editingSheet.ageRange || '4–10 yrs');
      setIsTrending(editingSheet.isTrending);
      setIsHot(editingSheet.isHot);
      setPreviewWebpUrl(editingSheet.previewWebpUrl);
      setPdfUrl(editingSheet.pdfUrl);
      setPdfLetterUrl(editingSheet.pdfLetterUrl || editingSheet.pdfUrl);
      setSeoDescription(editingSheet.seoDescription);
      setTagsInput(editingSheet.tags.join(', '));
      setR2Filename(editingSheet.slug);
    } else {
      const firstCat = categories[0]?.id || 'dinosaurs';
      const firstSub = categories[0]?.subcategories[0] || '';
      setTitle('');
      setSlug('');
      setSlugTouched(false);
      setCategory(firstCat);
      setSubcategory(firstSub);
      setPackSlug('');
      setDifficulty('easy');
      setAgeRange('4–10 yrs');
      setIsTrending(false);
      setIsHot(false);
      setPreviewWebpUrl('');
      setPdfUrl('');
      setPdfLetterUrl('');
      setSeoDescription('');
      setTagsInput('');
      setR2Filename('');
    }
  }, [open, editingSheet, categories, defaultR2BaseUrl, r2Settings.publicBaseUrl]);

  useEffect(() => {
    return () => revokeLocalPreview();
  }, []);

  if (!open) return null;

  const useWorkerR2 = Boolean(workerR2Connected && adminToken);
  const r2Ready = useWorkerR2 || isR2Ready(r2Settings);
  const selectedCategoryObj = categories.find((c) => c.id === category);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];
  const activeCategorySlug = creatingCategory
    ? slugify(newCategoryName) || 'general'
    : category || 'general';
  const activeSheetSlug = slugify(slug || title) || 'your-sheet-slug';

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched) {
      const autoSlug = slugify(val);
      setSlug(autoSlug);
      if (!r2Filename || r2Filename === slug) {
        setR2Filename(autoSlug);
      }
    }
  };

  const processSelectedFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      setUploadError('Please drop a PNG, JPG, or WebP coloring sheet image.');
      return;
    }

    setUploadError(null);
    setError(null);
    setSelectedFile(file);
    setUploadStage('converting');
    revokeLocalPreview();

    // Auto-fill Title & URL Slug from filename if empty
    const derived = filenameToTitleAndSlug(file.name);
    let effectiveTitle = title.trim();
    if (!effectiveTitle) {
      effectiveTitle = derived.title;
      setTitle(derived.title);
    }
    if (!slug.trim() && !slugTouched) {
      setSlug(derived.slug);
      setR2Filename(derived.slug);
    }

    try {
      const assets = await convertImageToWebpAndPdf(file, {
        maxWebpWidth: 700,
        title: effectiveTitle,
      });
      previewUrlRef.current = assets.previewObjectUrl;
      setConvertedAssets(assets);
      setUploadStage('idle');
    } catch (err) {
      setConvertedAssets(null);
      setUploadStage('error');
      setUploadError(
        err instanceof Error ? err.message : 'Failed to convert image to WebP and PDF.'
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1 && !editingSheet) {
      setUploadError(
        `You dropped ${files.length} files. Click "Batch Upload (5–20 Files)" above to upload multiple pages at once.`
      );
      return;
    }
    void processSelectedFile(files[0]);
  };

  const handleUploadToR2 = async () => {
    if (!selectedFile) {
      setUploadError('Drop or select a coloring page image first.');
      return;
    }
    if (!r2Ready) {
      setUploadError('Configure your Cloudflare R2 Storage Settings first.');
      return;
    }

    const cleanSlug = slugify(slug || title || filenameToTitleAndSlug(selectedFile.name).slug);
    if (!cleanSlug) {
      setUploadError('Enter a valid Page Title or URL Slug before uploading.');
      return;
    }
    if (!slug) {
      setSlug(cleanSlug);
    }

    setUploadError(null);
    setError(null);

    try {
      let assetsToUpload = convertedAssets;
      if (!assetsToUpload) {
        setUploadStage('converting');
        assetsToUpload = await convertImageToWebpAndPdf(selectedFile, {
          maxWebpWidth: 700,
          title: title.trim() || filenameToTitleAndSlug(selectedFile.name).title,
        });
        revokeLocalPreview();
        previewUrlRef.current = assetsToUpload.previewObjectUrl;
        setConvertedAssets(assetsToUpload);
      }

      const uploaded =
        useWorkerR2 && adminToken
          ? await uploadAssetsViaWorkerR2({
              token: adminToken,
              categorySlug: activeCategorySlug,
              slug: cleanSlug,
              assets: assetsToUpload,
              onStageChange: (stage) => setUploadStage(stage),
            })
          : await uploadAssetsToR2({
              settings: r2Settings,
              categorySlug: activeCategorySlug,
              slug: cleanSlug,
              assets: assetsToUpload,
              onStageChange: (stage) => setUploadStage(stage),
            });

      setPreviewWebpUrl(uploaded.previewWebpUrl);
      setPdfUrl(uploaded.pdfUrl);
      setPdfLetterUrl(uploaded.pdfLetterUrl);
      if (!useWorkerR2 && r2Settings.publicBaseUrl) {
        setR2Base(r2Settings.publicBaseUrl);
      }
      setUploadStage('done');
    } catch (err) {
      setUploadStage('error');
      setUploadError(
        err instanceof Error ? err.message : 'Cloudflare R2 upload failed.'
      );
    }
  };

  const handleDownloadLocalAsset = (kind: 'webp' | 'pdf') => {
    if (!convertedAssets) return;
    const blob = kind === 'webp' ? convertedAssets.webpBlob : convertedAssets.pdfBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSheetSlug}.${kind}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleApplyR2Links = () => {
    const baseName = r2Filename.trim() || slug || slugify(title);
    if (!baseName) {
      setError('Enter a filename (e.g., cute-dino-1) or page title first.');
      return;
    }
    const links = generateR2Links(r2Base, baseName, r2Structure);
    setPreviewWebpUrl(links.previewWebpUrl);
    setPdfUrl(links.pdfUrl);
    setPdfLetterUrl(links.pdfLetterUrl);
    if (!slug) {
      setSlug(slugify(baseName));
      setSlugTouched(true);
    }
    setError(null);
    setR2AppliedFlash(true);
    setTimeout(() => setR2AppliedFlash(false), 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanSlug = slugify(slug || cleanTitle);
    if (!cleanTitle) {
      setError('Title is required.');
      return;
    }
    if (!cleanSlug) {
      setError('A valid URL slug is required.');
      return;
    }

    const isDuplicate =
      existingSlugs.has(cleanSlug) &&
      (!editingSheet || editingSheet.slug !== cleanSlug);
    if (isDuplicate) {
      setError(`Slug "${cleanSlug}" already exists. Choose a unique slug.`);
      return;
    }

    let finalCatId = category;
    let newCategoryMeta: { id: string; label: string } | undefined;
    if (creatingCategory) {
      const label = newCategoryName.trim();
      const id = slugify(label);
      if (!label || !id) {
        setError('Enter a name for the new category.');
        return;
      }
      finalCatId = id;
      newCategoryMeta = { id, label };
    }

    let finalSubcat = subcategory.trim() || 'General';
    let newSubcatMeta: { categoryId: string; name: string } | undefined;
    if (creatingSubcat) {
      const subName = newSubcatName.trim();
      if (!subName) {
        setError('Enter a name for the new sub-category.');
        return;
      }
      finalSubcat = subName;
      newSubcatMeta = { categoryId: finalCatId, name: subName };
    }

    const fallbackLinks = generateR2Links(r2Base, cleanSlug, r2Structure);
    const finalWebp = previewWebpUrl.trim() || fallbackLinks.previewWebpUrl;
    const finalPdf = pdfUrl.trim() || fallbackLinks.pdfUrl;
    const finalLetterPdf = pdfLetterUrl.trim() || finalPdf;

    const isSafeUrl = (u: string) =>
      u.startsWith('https://') || u.startsWith('http://') || u.startsWith('/');
    if (!isSafeUrl(finalWebp) || !isSafeUrl(finalPdf) || !isSafeUrl(finalLetterPdf)) {
      setError('Asset URLs must start with https://, http://, or /.');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const today = new Date().toISOString().split('T')[0];

    const savedSheet: AdminCatalogSheet = {
      id: editingSheet?.id || cleanSlug,
      slug: cleanSlug,
      packSlug: slugify(packSlug) || editingSheet?.packSlug || finalCatId,
      title: cleanTitle,
      category: finalCatId,
      subcategory: finalSubcat,
      difficulty,
      ageRange: ageRange.trim() || '4–10 yrs',
      isTrending,
      isHot,
      previewWebpUrl: finalWebp,
      pdfUrl: finalPdf,
      pdfLetterUrl: finalLetterPdf,
      lineArtUrl: editingSheet?.lineArtUrl || finalWebp,
      sourcePdfUrl:
        editingSheet?.sourcePdfUrl ||
        (finalPdf.endsWith('.pdf') && !finalPdf.startsWith('/cdn/pdfs/')
          ? finalPdf
          : undefined),
      seoDescription:
        seoDescription.trim() ||
        `Free printable ${cleanTitle} coloring page in A4 and US Letter PDF.`,
      tags: tags.length > 0 ? tags : [finalCatId, cleanSlug],
      views: editingSheet?.views ?? 150,
      upvotes: editingSheet?.upvotes ?? 18,
      downvotes: editingSheet?.downvotes ?? 0,
      weeklyGrowthPct: editingSheet?.weeklyGrowthPct ?? (isTrending ? 215 : 85),
      createdAt: editingSheet?.createdAt || today,
    };

    onSave(savedSheet, {
      newCategory: newCategoryMeta,
      newSubcategory: newSubcatMeta,
      updatedR2BaseUrl: r2Base.trim() || undefined,
    });
  };

  const isBusy =
    uploadStage === 'converting' ||
    uploadStage === 'uploading-webp' ||
    uploadStage === 'uploading-pdf';

  const stageInfo = STAGE_PROGRESS[uploadStage];

  const livePreviewSrc =
    convertedAssets?.previewObjectUrl ||
    (previewWebpUrl && !previewWebpUrl.startsWith('/cdn/thumbs/')
      ? previewWebpUrl
      : getLineArtDataUri(slug || 'dino-trex'));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editingSheet ? 'Edit Coloring Page' : 'Add Coloring Page'}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[93vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0F1E36] dark:text-white">
              {editingSheet ? 'Edit Coloring Page' : 'Add New Coloring Page'}
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Drop a PNG/JPG to auto-convert (700px WebP + US Letter PDF) and upload straight to Cloudflare R2.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!editingSheet && (
              <button
                type="button"
                onClick={onSwitchToBatch}
                className="h-8 px-3 rounded-lg bg-[#2A9D8F]/12 hover:bg-[#2A9D8F]/20 border border-[#2A9D8F]/35 text-[#115E59] dark:text-teal-300 text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Batch Upload (5–20 Files)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-[#DC2626] dark:text-red-300"
            >
              {error}
            </div>
          )}

          {/* 1. Prominent Single-Window Drag & Drop + Auto-Convert + Direct R2 Upload Zone */}
          <div className="rounded-2xl border border-[#CBD5E1] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-900/60 overflow-hidden">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
              {/* Dropzone & Upload Pipeline */}
              <div className="sm:col-span-8 flex flex-col justify-between gap-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isBusy) setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !isBusy && fileInputRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? 'border-[#2A9D8F] bg-[#2A9D8F]/10'
                      : selectedFile
                      ? 'border-[#2A9D8F]/60 bg-white dark:bg-slate-900'
                      : 'border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#0F1E36] dark:hover:border-[#FFB703]'
                  } ${isBusy ? 'opacity-65 pointer-events-none' : ''}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void processSelectedFile(f);
                      e.target.value = '';
                    }}
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0F1E36] text-[#FFB703] flex items-center justify-center">
                      {uploadStage === 'converting' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-sm font-extrabold text-[#0F1E36] dark:text-white">
                      {selectedFile
                        ? selectedFile.name
                        : 'Drop PNG/JPG Coloring Page here or Click to Browse'}
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                      {selectedFile
                        ? `Source: ${formatBytes(selectedFile.size)} · Click or drop another file to replace`
                        : 'Auto-converts to 700px WebP + print-ready US Letter (8.5×11") PDF in your browser'}
                    </p>
                  </div>
                </div>

                {/* Converted File Badges & Target R2 Paths */}
                {convertedAssets && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-extrabold text-[#0F1E36] dark:text-white flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#2A9D8F]" />
                            <span>WebP Ready</span>
                          </div>
                          <div className="text-[11px] font-mono text-[#64748B] tabular-nums truncate">
                            {convertedAssets.webpWidth}×{convertedAssets.webpHeight} ·{' '}
                            {formatBytes(convertedAssets.webpSizeBytes)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadLocalAsset('webp')}
                          title="Download local WebP preview"
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#64748B] flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-extrabold text-[#0F1E36] dark:text-white flex items-center gap-1">
                            <FileText className="w-3 h-3 text-[#E63946]" />
                            <span>US Letter PDF</span>
                          </div>
                          <div className="text-[11px] font-mono text-[#64748B] tabular-nums truncate">
                            8.5×11 in · {formatBytes(convertedAssets.pdfSizeBytes)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadLocalAsset('pdf')}
                          title="Download local US Letter PDF"
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#64748B] flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-[#64748B] dark:text-slate-400 px-1 truncate">
                      R2 keys: webp/{activeCategorySlug}/{activeSheetSlug}.webp · pdf/
                      {activeCategorySlug}/{activeSheetSlug}.pdf
                    </div>
                  </div>
                )}

                {/* Progress Bar & 1-Click Direct R2 Upload Button */}
                <div className="space-y-2">
                  {(isBusy || uploadStage === 'done') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-extrabold">
                        <span
                          className={
                            uploadStage === 'done'
                              ? 'text-[#15803D] dark:text-emerald-300'
                              : 'text-[#0F1E36] dark:text-slate-200'
                          }
                        >
                          {stageInfo.label}
                        </span>
                        <span className="font-mono tabular-nums text-[#64748B]">
                          {stageInfo.pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            uploadStage === 'done' ? 'bg-[#16A34A]' : 'bg-[#2A9D8F]'
                          }`}
                          style={{ width: `${stageInfo.pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div
                      role="alert"
                      className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-[#DC2626] dark:text-red-300 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!selectedFile || isBusy || !r2Ready}
                      onClick={handleUploadToR2}
                      className="flex-1 h-10 px-4 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] disabled:opacity-45 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#FFB703]" />
                          <span>{stageInfo.label}</span>
                        </>
                      ) : uploadStage === 'done' ? (
                        <>
                          <Check className="w-4 h-4 text-[#FFB703]" />
                          <span>Uploaded! Re-Upload to R2</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-[#FFB703]" />
                          <span>Upload to R2 &amp; Auto-Fill Links</span>
                        </>
                      )}
                    </button>

                    {!r2Ready && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenR2Settings();
                        }}
                        className="h-10 px-3 rounded-xl bg-[#FFB703] hover:bg-[#F2A900] text-[#0F1E36] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Setup R2</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Instant Live Sheet Preview */}
              <div className="sm:col-span-4 flex flex-col">
                <div className="text-[11px] font-bold text-[#64748B] dark:text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Live Sheet Preview</span>
                  {convertedAssets && (
                    <span className="text-[#16A34A] font-extrabold">Ready</span>
                  )}
                </div>
                <div className="flex-1 min-h-[180px] aspect-[4/5] rounded-xl bg-white border border-[#CBD5E1] dark:border-slate-700 p-2.5 flex items-center justify-center overflow-hidden">
                  {livePreviewSrc ? (
                    <img
                      src={livePreviewSrc}
                      alt={title || 'Coloring sheet preview'}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          getLineArtDataUri('dino-trex');
                      }}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Page Title & Auto-Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                Page Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Cute Baby Triceratops"
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#475569] dark:text-slate-300">
                  URL Slug *
                </label>
                {slugTouched && (
                  <button
                    type="button"
                    onClick={() => {
                      setSlugTouched(false);
                      setSlug(slugify(title));
                    }}
                    className="text-[11px] font-bold text-[#2A9D8F] hover:underline cursor-pointer"
                  >
                    Auto-sync from title
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="cute-baby-triceratops"
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
              />
            </div>
          </div>

          {/* 3. Category & Sub-Category (Select existing or create new inline) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#475569] dark:text-slate-300">
                  Category (also sets R2 folder)
                </label>
                <button
                  type="button"
                  onClick={() => setCreatingCategory((v) => !v)}
                  className="text-[11px] font-bold text-[#E63946] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{creatingCategory ? 'Use existing' : 'New category'}</span>
                </button>
              </div>
              {creatingCategory ? (
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Superheroes"
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E63946] text-sm text-[#0F1E36] dark:text-white"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    const nextCat = e.target.value;
                    setCategory(nextCat);
                    const catObj = categories.find((c) => c.id === nextCat);
                    setSubcategory(catObj?.subcategories[0] || '');
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#475569] dark:text-slate-300">
                  Sub-Category
                </label>
                <button
                  type="button"
                  onClick={() => setCreatingSubcat((v) => !v)}
                  className="text-[11px] font-bold text-[#2A9D8F] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{creatingSubcat ? 'Use existing' : 'New sub-category'}</span>
                </button>
              </div>
              {creatingSubcat || availableSubcategories.length === 0 ? (
                <input
                  type="text"
                  value={creatingSubcat ? newSubcatName : subcategory}
                  onChange={(e) =>
                    creatingSubcat
                      ? setNewSubcatName(e.target.value)
                      : setSubcategory(e.target.value)
                  }
                  placeholder="e.g., Baby Dinosaurs"
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white"
                />
              ) : (
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white"
                >
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                  {subcategory && !availableSubcategories.includes(subcategory) && (
                    <option value={subcategory}>{subcategory}</option>
                  )}
                </select>
              )}
            </div>
          </div>

          {/* 4. Editable R2 URLs (Auto-filled on upload, always editable as fallback) */}
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                Public Cloudflare R2 Asset URLs
                {uploadStage === 'done' && (
                  <span className="ml-2 text-[#16A34A] font-extrabold">
                    · Auto-filled from R2
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowManualHelper((v) => !v)}
                className="text-[11px] font-bold text-[#2A9D8F] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3 h-3" />
                <span>Filename URL Helper</span>
                {showManualHelper ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {showManualHelper && (
              <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-900/70 border border-[#CBD5E1] dark:border-slate-700 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#64748B]">
                    Manual fallback: generate URLs from an existing R2 filename
                  </span>
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-[#E2E8F0] dark:border-slate-700 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setR2Structure('flat')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        r2Structure === 'flat'
                          ? 'bg-[#0F1E36] text-white'
                          : 'text-[#64748B] dark:text-slate-400'
                      }`}
                    >
                      Flat (/file.pdf)
                    </button>
                    <button
                      type="button"
                      onClick={() => setR2Structure('structured')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        r2Structure === 'structured'
                          ? 'bg-[#0F1E36] text-white'
                          : 'text-[#64748B] dark:text-slate-400'
                      }`}
                    >
                      Folders (/pdfs/a4/)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="url"
                    value={r2Base}
                    onChange={(e) => setR2Base(e.target.value)}
                    placeholder="https://cdn.yoursite.com"
                    aria-label="R2 Base URL"
                    className="sm:col-span-5 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={r2Filename}
                    onChange={(e) => setR2Filename(e.target.value)}
                    placeholder="cute-dino-1"
                    aria-label="Base filename"
                    className="sm:col-span-4 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleApplyR2Links}
                    className="sm:col-span-3 h-9 px-3 rounded-lg bg-[#2A9D8F] hover:bg-[#228579] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {r2AppliedFlash ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Filled!</span>
                      </>
                    ) : (
                      <span>Fill URLs</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Preview WebP URL (previewWebpUrl)
                </label>
                <input
                  type="text"
                  value={previewWebpUrl}
                  onChange={(e) => setPreviewWebpUrl(e.target.value)}
                  placeholder="https://cdn.yoursite.com/webp/dinosaurs/cute-dino-1.webp"
                  className="w-full h-9 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Print PDF URL (pdfUrl)
                </label>
                <input
                  type="text"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://cdn.yoursite.com/pdf/dinosaurs/cute-dino-1.pdf"
                  className="w-full h-9 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* 5. Difficulty, Age Range, Collection Pack Slug & Quick Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as 'easy' | 'medium' | 'detailed')
                }
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                Age Range
              </label>
              <input
                type="text"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                placeholder="4–10 yrs"
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                Collection Pack Slug
              </label>
              <input
                type="text"
                value={packSlug}
                onChange={(e) => setPackSlug(slugify(e.target.value))}
                placeholder="friendly-dinosaurs"
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsTrending((v) => !v)}
              className={`h-9 px-3.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                isTrending
                  ? 'bg-[#16A34A]/12 border-[#16A34A] text-[#15803D] dark:text-emerald-300'
                  : 'bg-[#FAF8F5] dark:bg-slate-900 border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending: {isTrending ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHot((v) => !v)}
              className={`h-9 px-3.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                isHot
                  ? 'bg-[#E63946]/12 border-[#E63946] text-[#B7102A] dark:text-red-300'
                  : 'bg-[#FAF8F5] dark:bg-slate-900 border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hot: {isHot ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* 6. SEO Description & Tags */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1">
                SEO Meta Description
              </label>
              <textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Write a concise 1–2 sentence printable coloring page description..."
                className="w-full p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1">
                Search Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="dinosaurs, t-rex, preschool, easy, printable"
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-sm font-bold text-[#475569] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="h-10 px-5 rounded-xl bg-[#E63946] hover:bg-[#D62839] disabled:opacity-50 text-white text-sm font-extrabold transition-colors cursor-pointer"
            >
              {editingSheet ? 'Save Changes' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
