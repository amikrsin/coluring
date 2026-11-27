import React from 'react';
import { Palette, Lock } from 'lucide-react';
import { Locale } from '../types';
import { SUPPORTED_LOCALES, TranslationDictionary } from '../i18n/translations';

interface FooterProps {
  locale: Locale;
  t: TranslationDictionary;
  populatedCategories: { id: string; label: string }[];
  onNavigate: (path: string) => void;
  onChangeLocale: (locale: Locale) => void;
  onOpenCookieSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  locale,
  t,
  populatedCategories,
  onNavigate,
  onChangeLocale,
  onOpenCookieSettings,
}) => {
  return (
    <footer className="no-print bg-[#0F1E36] text-slate-300 border-t border-white/10 mt-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Brand */}
        <div className="md:col-span-3 space-y-3">
          <button
            type="button"
            onClick={() => onNavigate(`/${locale}/`)}
            className="flex items-center gap-2.5 text-white cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-[#E63946] flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">ColorWorld</span>
          </button>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            {t.footer.tagline}
          </p>
        </div>

        {/* Dynamic Non-Empty Categories Only */}
        <div className="md:col-span-3">
          <h3 className="text-sm font-extrabold text-white mb-3">{t.footer.categories}</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {populatedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigate(`/${locale}/category/${cat.id}`)}
                className="text-left text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legal & Trust (AdSense Compliance) */}
        <div className="md:col-span-3">
          <h3 className="text-sm font-extrabold text-white mb-3">About &amp; Legal</h3>
          <div className="flex flex-col gap-2 text-sm">
            <button
              type="button"
              onClick={() => onNavigate('/about')}
              className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              About ColorWorld
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Contact Us
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/privacy-policy')}
              className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/terms-of-use')}
              className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Terms of Use
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/dmca')}
              className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              DMCA &amp; Copyright
            </button>
          </div>
        </div>

        {/* International Locales & Resources */}
        <div className="md:col-span-3 space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-white mb-3">{t.footer.languages}</h3>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => onChangeLocale(loc.code)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    loc.code === locale
                      ? 'bg-[#E63946] text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {loc.nativeName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-white mb-2">{t.footer.resources}</h3>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={onOpenCookieSettings}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cookie Settings
              </button>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                {t.footer.sitemap}
              </a>
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3 text-[#2A9D8F]" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} {t.footer.copyright}</span>
          <span>Free PDF • 300 DPI • US Letter &amp; A4</span>
        </div>
      </div>
    </footer>
  );
};
