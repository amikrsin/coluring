import React, { useState } from 'react';
import { X, Copy, Check, Cloud, Database, HardDrive } from 'lucide-react';

interface DeployGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const CLI_SNIPPET = `# 1. Create R2 Bucket, D1 Database & KV Namespace
npx wrangler r2 bucket create colorworld-assets
npx wrangler d1 create colorworld-db
npx wrangler kv namespace create COLORING_KV

# 2. Apply D1 SQL schema
npx wrangler d1 execute colorworld-db --remote --file=./schema.sql

# 3. Upload PDFs & line-art to R2 (matching /cdn/* keys)
npx wrangler r2 object put colorworld-assets/pdfs/a4/dino-trex.pdf --file=./dino-trex-a4.pdf

# 4. Generate multilingual sitemap & deploy to Cloudflare Pages
npm run sitemap
npm run build
npx wrangler pages deploy dist --project-name=colorworld`;

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ open, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(CLI_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cloudflare Pages and R2 Deployment Guide"
      className="fixed inset-0 z-50 bg-[#0F1E36]/75 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-[#0F1E36] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-[#FFB703]" />
            <h2 className="text-base font-extrabold">Cloudflare Pages + Workers + R2 Deploy Guide</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-[#475569] dark:text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
              <HardDrive className="w-4 h-4 text-[#E63946] mb-1.5" />
              <div className="font-bold text-[#0F1E36] dark:text-white text-xs">R2 Binding</div>
              <div className="font-mono text-xs mt-0.5 text-[#64748B] dark:text-slate-400">COLORING_BUCKET</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
              <Database className="w-4 h-4 text-[#2A9D8F] mb-1.5" />
              <div className="font-bold text-[#0F1E36] dark:text-white text-xs">D1 + KV Bindings</div>
              <div className="font-mono text-xs mt-0.5 text-[#64748B] dark:text-slate-400">DB · COLORING_KV</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
              <Cloud className="w-4 h-4 text-[#FFB703] mb-1.5" />
              <div className="font-bold text-[#0F1E36] dark:text-white text-xs">Pages Functions</div>
              <div className="font-mono text-xs mt-0.5 text-[#64748B] dark:text-slate-400">/api/* &amp; /cdn/*</div>
            </div>
          </div>

          <p>
            This repository ships with production-ready <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">wrangler.toml</code>,{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">workers/api.ts</code>,{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">functions/api/[[route]].ts</code>,{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">functions/cdn/[[path]].ts</code>, and{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">schema.sql</code>.
          </p>

          <div className="relative">
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#0F1E36] text-slate-300 rounded-t-xl text-xs font-mono">
              <span>Wrangler Deployment Commands</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-white hover:text-[#FFB703] cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#111C2D] text-slate-100 rounded-b-xl overflow-x-auto text-xs font-mono leading-relaxed">
              {CLI_SNIPPET}
            </pre>
          </div>

          <div className="text-xs text-[#64748B] dark:text-slate-400">
            Full step-by-step instructions including custom domains and R2 cache rules are also included in{' '}
            <span className="font-mono font-semibold text-[#1E293B] dark:text-slate-200">CLOUDFLARE_DEPLOY.md</span>.
          </div>
        </div>
      </div>
    </div>
  );
};
