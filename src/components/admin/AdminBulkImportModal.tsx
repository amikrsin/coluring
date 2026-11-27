import React, { useMemo, useState } from 'react';
import { X, Upload, AlertTriangle, CheckCircle2, FileSpreadsheet, FileJson } from 'lucide-react';
import { AdminCatalogSheet } from '../../types';
import { parseBulkImportInput } from '../../data/catalog-store';

interface AdminBulkImportModalProps {
  open: boolean;
  existingSlugs: Set<string>;
  defaultR2BaseUrl: string;
  onClose: () => void;
  onImport: (sheets: AdminCatalogSheet[], mode: 'skip' | 'overwrite') => void;
}

const SAMPLE_CSV = `title,slug,category,subcategory,difficulty,previewWebpUrl,pdfUrl,seoDescription,tags,isTrending,isHot
Cute Baby Triceratops,cute-baby-triceratops,dinosaurs,Herbivores,easy,https://cdn.yoursite.com/cute-baby-triceratops.webp,https://cdn.yoursite.com/cute-baby-triceratops.pdf,"Smiling baby triceratops munching fern leaves.",dinosaurs;triceratops;kids,true,true
Friendly Gingerbread House,friendly-gingerbread-house,holidays,Christmas,medium,https://cdn.yoursite.com/friendly-gingerbread-house.webp,https://cdn.yoursite.com/friendly-gingerbread-house.pdf,"Candy-cane gingerbread cottage for winter craft time.",christmas;gingerbread;holidays,true,false
Solar System Orbit Chart,solar-system-orbit-chart,space,Planets,detailed,https://cdn.yoursite.com/solar-system-orbit-chart.webp,https://cdn.yoursite.com/solar-system-orbit-chart.pdf,"Printable solar system coloring worksheet with all eight planets.",space;planets;science,false,false`;

const SAMPLE_JSON = JSON.stringify(
  [
    {
      title: 'Kawaii Panda Eating Bamboo',
      slug: 'kawaii-panda-bamboo',
      category: 'animals',
      subcategory: 'Woodland',
      difficulty: 'easy',
      previewWebpUrl: 'https://cdn.yoursite.com/kawaii-panda-bamboo.webp',
      pdfUrl: 'https://cdn.yoursite.com/kawaii-panda-bamboo.pdf',
      seoDescription: 'Adorable kawaii panda sitting in a sunny bamboo grove.',
      tags: ['animals', 'panda', 'cute', 'easy'],
      isTrending: true,
      isHot: true,
    },
    {
      title: 'Number Tracing 1 to 10 Worksheet',
      slug: 'number-tracing-1-10',
      category: 'worksheets',
      subcategory: 'Line Tracing',
      difficulty: 'easy',
      previewWebpUrl: 'https://cdn.yoursite.com/number-tracing-1-10.webp',
      pdfUrl: 'https://cdn.yoursite.com/number-tracing-1-10.pdf',
      seoDescription: 'Guided dotted number tracing worksheet for kindergarten learners.',
      tags: ['worksheets', 'numbers', 'tracing', 'preschool'],
      isTrending: true,
      isHot: false,
    },
  ],
  null,
  2
);

export const AdminBulkImportModal: React.FC<AdminBulkImportModalProps> = ({
  open,
  existingSlugs,
  defaultR2BaseUrl,
  onClose,
  onImport,
}) => {
  const [rawText, setRawText] = useState('');
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'overwrite'>('skip');

  const parsed = useMemo(
    () => parseBulkImportInput(rawText, existingSlugs, defaultR2BaseUrl),
    [rawText, existingSlugs, defaultR2BaseUrl]
  );

  if (!open) return null;

  const newItems = parsed.items.filter(
    (item) => !item.isDuplicateExisting && !item.isDuplicateInBatch
  );
  const duplicateExistingCount = parsed.items.filter(
    (item) => item.isDuplicateExisting
  ).length;
  const duplicateBatchCount = parsed.items.filter(
    (item) => item.isDuplicateInBatch
  ).length;

  const actionableCount =
    duplicateMode === 'overwrite'
      ? parsed.items.filter((i) => !i.isDuplicateInBatch).length
      : newItems.length;

  const handleConfirmImport = () => {
    if (actionableCount === 0) return;
    // Deduplicate within pasted batch (last wins if overwrite, first wins if skip)
    const uniqueBySlug = new Map<string, AdminCatalogSheet>();
    for (const item of parsed.items) {
      if (duplicateMode === 'skip') {
        if (item.isDuplicateExisting || uniqueBySlug.has(item.sheet.slug)) continue;
        uniqueBySlug.set(item.sheet.slug, item.sheet);
      } else {
        uniqueBySlug.set(item.sheet.slug, item.sheet);
      }
    }
    onImport(Array.from(uniqueBySlug.values()), duplicateMode);
    setRawText('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bulk Import Coloring Pages"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0F1E36] dark:text-white">
              Bulk Import (CSV / JSON)
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Paste 50–500 rows from a Python script or spreadsheet to add or update coloring pages in one click.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bulk import"
            className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#475569] dark:text-slate-300">
              Paste CSV with header row or JSON array:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_CSV)}
                className="h-8 px-3 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-slate-200 hover:border-[#2A9D8F] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#2A9D8F]" />
                <span>Load Sample CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_JSON)}
                className="h-8 px-3 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-slate-200 hover:border-[#2A9D8F] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-[#FFB703]" />
                <span>Load Sample JSON</span>
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Paste CSV or JSON array here...\nExample CSV headers: title,slug,category,subcategory,difficulty,previewWebpUrl,pdfUrl,seoDescription,tags,isTrending,isHot`}
            className="w-full p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-slate-100 focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
          />

          {parsed.error && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-[#DC2626] dark:text-red-300 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parsed.error}</span>
            </div>
          )}

          {/* Detection Summary & Duplicate Strategy */}
          {parsed.items.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold tabular-nums">
                  <span className="text-[#0F1E36] dark:text-white">
                    Detected: {parsed.format.toUpperCase()} · {parsed.items.length} rows
                  </span>
                  <span className="text-[#16A34A] inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {newItems.length} new
                  </span>
                  {(duplicateExistingCount > 0 || duplicateBatchCount > 0) && (
                    <span className="text-[#D97706] inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {duplicateExistingCount} existing duplicates
                      {duplicateBatchCount > 0 ? `, ${duplicateBatchCount} in-batch duplicates` : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('skip')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      duplicateMode === 'skip'
                        ? 'bg-[#0F1E36] text-white'
                        : 'text-[#64748B] dark:text-slate-400'
                    }`}
                  >
                    Skip Duplicates
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('overwrite')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      duplicateMode === 'overwrite'
                        ? 'bg-[#D97706] text-white'
                        : 'text-[#64748B] dark:text-slate-400'
                    }`}
                  >
                    Update Existing
                  </button>
                </div>
              </div>

              {/* Preview Table (first 50 items) */}
              <div className="border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="max-h-56 overflow-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#FAF8F5] dark:bg-slate-900 sticky top-0 border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B] dark:text-slate-400">
                      <tr>
                        <th className="py-2 px-3 font-bold">Status</th>
                        <th className="py-2 px-3 font-bold">Title</th>
                        <th className="py-2 px-3 font-bold">Slug</th>
                        <th className="py-2 px-3 font-bold">Category</th>
                        <th className="py-2 px-3 font-bold">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                      {parsed.items.slice(0, 50).map((row, idx) => (
                        <tr
                          key={`${row.sheet.slug}-${idx}`}
                          className="hover:bg-[#FAF8F5] dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2 px-3 whitespace-nowrap">
                            {row.isDuplicateInBatch ? (
                              <span className="font-bold text-[#DC2626]">Batch Dup</span>
                            ) : row.isDuplicateExisting ? (
                              <span className="font-bold text-[#D97706]">
                                {duplicateMode === 'overwrite' ? 'Update' : 'Skip Dup'}
                              </span>
                            ) : (
                              <span className="font-bold text-[#16A34A]">New</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-[#0F1E36] dark:text-slate-100">
                            {row.sheet.title}
                          </td>
                          <td className="py-2 px-3 font-mono text-[#64748B] dark:text-slate-400">
                            {row.sheet.slug}
                          </td>
                          <td className="py-2 px-3 text-[#475569] dark:text-slate-300">
                            {row.sheet.category} / {row.sheet.subcategory}
                          </td>
                          <td className="py-2 px-3 capitalize text-[#475569] dark:text-slate-300">
                            {row.sheet.difficulty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.items.length > 50 && (
                  <div className="px-3 py-1.5 bg-[#FAF8F5] dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
                    Showing first 50 of {parsed.items.length} parsed rows. All valid rows will be imported.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-sm font-bold text-[#475569] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={actionableCount === 0}
            onClick={handleConfirmImport}
            className="h-10 px-5 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] disabled:opacity-40 text-white text-sm font-extrabold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4 text-[#FFB703]" />
            <span>Import {actionableCount} Coloring {actionableCount === 1 ? 'Page' : 'Pages'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
