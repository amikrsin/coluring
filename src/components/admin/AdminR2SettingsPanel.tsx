import React, { useState } from 'react';
import {
  Cloud,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  PlugZap,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import {
  EMPTY_R2_SETTINGS,
  R2ConnectionSettings,
  clearR2Settings,
  isR2Ready,
  saveR2Settings,
  testR2Connection,
} from '../../utils/r2-upload';

interface AdminR2SettingsPanelProps {
  settings: R2ConnectionSettings;
  expanded: boolean;
  onToggleExpanded: () => void;
  onSaveSettings: (next: R2ConnectionSettings) => void;
}

const R2_CORS_SNIPPET = JSON.stringify(
  [
    {
      AllowedOrigins: ['https://yourdomain.com', 'http://localhost:3000'],
      AllowedMethods: ['GET', 'PUT', 'HEAD'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    },
  ],
  null,
  2
);

export const AdminR2SettingsPanel: React.FC<AdminR2SettingsPanelProps> = ({
  settings,
  expanded,
  onToggleExpanded,
  onSaveSettings,
}) => {
  const [draft, setDraft] = useState<R2ConnectionSettings>(settings);
  const [showSecret, setShowSecret] = useState(false);
  const [showCorsHelp, setShowCorsHelp] = useState(false);
  const [corsCopied, setCorsCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const configured = isR2Ready(settings);
  const hasLocalDraft =
    draft.accountId !== settings.accountId ||
    draft.accessKeyId !== settings.accessKeyId ||
    draft.secretAccessKey !== settings.secretAccessKey ||
    draft.bucketName !== settings.bucketName ||
    draft.publicBaseUrl !== settings.publicBaseUrl;

  const updateField = <K extends keyof R2ConnectionSettings>(
    key: K,
    value: string
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: R2ConnectionSettings = {
      accountId: draft.accountId.trim(),
      accessKeyId: draft.accessKeyId.trim(),
      secretAccessKey: draft.secretAccessKey.trim(),
      bucketName: draft.bucketName.trim().toLowerCase(),
      publicBaseUrl: draft.publicBaseUrl.trim().replace(/\/+$/, ''),
    };
    setDraft(cleaned);
    saveR2Settings(cleaned);
    onSaveSettings(cleaned);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const cleaned: R2ConnectionSettings = {
      accountId: draft.accountId.trim(),
      accessKeyId: draft.accessKeyId.trim(),
      secretAccessKey: draft.secretAccessKey.trim(),
      bucketName: draft.bucketName.trim().toLowerCase(),
      publicBaseUrl: draft.publicBaseUrl.trim().replace(/\/+$/, ''),
    };
    try {
      const res = await testR2Connection(cleaned);
      if (res.ok) {
        setTestResult({
          ok: true,
          message: `Connected directly from browser to R2 bucket "${res.bucketName || cleaned.bucketName}".`,
        });
      } else {
        setTestResult({
          ok: false,
          message: res.error || 'Connection test failed.',
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Network error testing R2 connection.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    clearR2Settings();
    setDraft({ ...EMPTY_R2_SETTINGS });
    onSaveSettings({ ...EMPTY_R2_SETTINGS });
    setTestResult(null);
  };

  const handleCopyCors = async () => {
    try {
      await navigator.clipboard.writeText(R2_CORS_SNIPPET);
      setCorsCopied(true);
      setTimeout(() => setCorsCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <section className="rounded-2xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 overflow-hidden">
      {/* Collapsible Header Bar */}
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAF8F5]/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              configured
                ? 'bg-[#2A9D8F]/15 text-[#2A9D8F]'
                : 'bg-[#FFB703]/20 text-[#D97706]'
            }`}
          >
            <Cloud className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-[#0F1E36] dark:text-white">
                Cloudflare R2 Storage Settings
              </span>
              {configured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#16A34A]/12 text-[#15803D] dark:text-emerald-300 text-[11px] font-extrabold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Direct Browser R2 · {settings.bucketName}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D97706]/15 text-[#B45309] dark:text-amber-300 text-[11px] font-extrabold">
                  <AlertCircle className="w-3 h-3" />
                  <span>Setup Required for 1-Click Upload</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 truncate mt-0.5">
              {settings.publicBaseUrl
                ? `Uploads directly from browser to ${settings.publicBaseUrl.replace(/\/+$/, '')}/webp/<category>/<slug>.webp & /pdf/<category>/<slug>.pdf`
                : '100% static Cloudflare Pages compatible — uploads directly from your browser to Cloudflare R2.'}
            </p>
          </div>
        </div>

        <span className="shrink-0 w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 flex items-center justify-center text-[#475569] dark:text-slate-300">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Collapsible Body */}
      {expanded && (
        <form
          onSubmit={handleSave}
          className="px-4 sm:px-5 pb-5 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 space-y-4 bg-[#FAF8F5]/50 dark:bg-slate-900/30"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1">
                R2 Account ID
              </label>
              <input
                type="text"
                autoComplete="off"
                value={draft.accountId}
                onChange={(e) => updateField('accountId', e.target.value)}
                placeholder="32-char Cloudflare Account ID"
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1">
                R2 Access Key ID
              </label>
              <input
                type="text"
                autoComplete="off"
                value={draft.accessKeyId}
                onChange={(e) => updateField('accessKeyId', e.target.value)}
                placeholder="Cloudflare R2 Access Key ID"
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1">
                R2 Secret Access Key
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  autoComplete="off"
                  value={draft.secretAccessKey}
                  onChange={(e) => updateField('secretAccessKey', e.target.value)}
                  placeholder="Cloudflare R2 Secret Access Key"
                  className="w-full h-10 pl-3 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F1E36] dark:hover:text-white cursor-pointer"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1">
                R2 Bucket Name
              </label>
              <input
                type="text"
                autoComplete="off"
                value={draft.bucketName}
                onChange={(e) => updateField('bucketName', e.target.value)}
                placeholder="e.g., colorworld-assets"
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1">
                Public Custom Domain URL
              </label>
              <input
                type="url"
                autoComplete="off"
                value={draft.publicBaseUrl}
                onChange={(e) => updateField('publicBaseUrl', e.target.value)}
                placeholder="https://cdn.yoursite.com"
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
              />
            </div>
          </div>

          {/* Collapsible R2 CORS Setup Helper for Static Cloudflare Pages */}
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/70 px-3.5 py-2.5">
            <button
              type="button"
              onClick={() => setShowCorsHelp((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-bold text-[#475569] dark:text-slate-300 cursor-pointer"
            >
              <span>Cloudflare R2 Bucket CORS Rule (one-time setup for browser uploads)</span>
              {showCorsHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showCorsHelp && (
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B] dark:text-slate-400">
                  <span>
                    Paste into Cloudflare Dashboard → R2 → Your Bucket → Settings → CORS Policy:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCors}
                    className="inline-flex items-center gap-1 font-bold text-[#2A9D8F] hover:underline cursor-pointer shrink-0"
                  >
                    {corsCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{corsCopied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-[#0F1E36] text-slate-200 font-mono text-[11px] overflow-x-auto">
                  {R2_CORS_SNIPPET}
                </pre>
              </div>
            )}
          </div>

          {testResult && (
            <div
              role="status"
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                testResult.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-[#15803D] dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-[#DC2626] dark:text-red-300'
              }`}
            >
              {testResult.ok ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-[#64748B] dark:text-slate-400">
              Saved locally in <span className="font-mono">localStorage</span> and uploaded directly from your browser via <span className="font-mono">@aws-sdk/client-s3</span> — zero backend required.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {(settings.accountId || settings.accessKeyId || settings.bucketName) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-9 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#64748B] hover:text-[#DC2626] hover:border-[#DC2626] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="h-9 px-3.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#0F1E36] text-xs font-bold text-[#0F1E36] dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlugZap className="w-3.5 h-3.5 text-[#2A9D8F]" />
                )}
                <span>Verify R2 Bucket</span>
              </button>

              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {savedFlash ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#FFB703]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>{hasLocalDraft ? 'Save R2 Settings' : 'Save Settings'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};
