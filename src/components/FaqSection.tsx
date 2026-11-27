import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { TranslationDictionary } from '../i18n/translations';

interface FaqSectionProps {
  t: TranslationDictionary;
}

const FAQ_ITEMS = [
  {
    q: 'Are all ColorWorld printable PDFs completely free with no sign-up?',
    a: 'Yes. Every coloring sheet, holiday collection, preschool worksheet, and monthly calendar downloads in one click with zero account registration and no watermarks. Parents and teachers may print unlimited copies for home or classroom use.',
  },
  {
    q: 'What is the difference between A4 and US Letter PDFs?',
    a: 'A4 (210 × 297 mm) is the standard printer paper across Europe, Latin America, Asia, and Australia, while US Letter (8.5 × 11 in) is standard across North America. Toggle your preferred size in the top bar—ColorWorld remembers it in your browser and serves exact-fit vector PDFs from Cloudflare R2.',
  },
  {
    q: 'How does the Color Online Paint Bucket stay inside the black outlines?',
    a: 'Our interactive HTML5 Canvas uses an iterative scanline flood-fill algorithm paired with an immutable black-ink luminance mask. It fills anti-aliased edges cleanly without leaving white halos while preserving razor-sharp black lines even when you brush or erase.',
  },
  {
    q: 'Can teachers build a custom packet of sheets to print together?',
    a: 'Yes. Click the red + button on any coloring card to add it to your Print Set tray in the header. When ready, open the Print Set drawer to print the entire custom bundle at once in A4 or US Letter.',
  },
];

export const FaqSection: React.FC<FaqSectionProps> = ({ t }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
            {t.sections.faqTitle}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#64748B] dark:text-slate-400">
            {t.sections.faqSub}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 divide-y divide-[#E2E8F0] dark:divide-slate-800 paper-card-shadow overflow-hidden">
          {FAQ_ITEMS.map((item, idx) => {
            const expanded = openIdx === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpenIdx(expanded ? null : idx)}
                  className="w-full px-6 py-4.5 flex items-center justify-between gap-4 text-left hover:bg-[#FAF8F5] dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-[#1E293B] dark:text-slate-100">
                    {item.q}
                  </span>
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      expanded
                        ? 'bg-[#E63946] text-white'
                        : 'bg-[#FAF8F5] dark:bg-slate-800 text-[#0F1E36] dark:text-slate-200 border border-[#E2E8F0] dark:border-slate-700'
                    }`}
                  >
                    {expanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {expanded && (
                  <div className="px-6 pb-5 text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
