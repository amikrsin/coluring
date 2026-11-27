import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Flame,
  CalendarClock,
  FolderTree,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import {
  AdminCategoryItem,
  AdminHolidayTickerItem,
  NavMegaGroup,
} from '../../types';
import { slugify } from '../../data/catalog-store';
import {
  formatCountdownLabel,
  resolveHolidayTargetDate,
} from '../../utils/holidays';
import { TRANSLATIONS } from '../../i18n/translations';

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

interface AdminStructureTabProps {
  categories: AdminCategoryItem[];
  holidayTicker: AdminHolidayTickerItem[];
  sheetCountsByCategory: Record<string, number>;
  onUpdateCategories: (next: AdminCategoryItem[]) => void;
  onUpdateHolidays: (next: AdminHolidayTickerItem[]) => void;
}

const NAV_GROUPS: { id: NavMegaGroup; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'trending', label: 'Trending' },
  { id: 'holidays', label: 'Holidays' },
  { id: 'coloring', label: 'Coloring Pages' },
  { id: 'worksheets', label: 'Worksheets' },
];

export const AdminStructureTab: React.FC<AdminStructureTabProps> = ({
  categories,
  holidayTicker,
  sheetCountsByCategory,
  onUpdateCategories,
  onUpdateHolidays,
}) => {
  // New Category form state
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatGroup, setNewCatGroup] = useState<NavMegaGroup>('coloring');
  const [newCatSubs, setNewCatSubs] = useState('');
  const [subInputs, setSubInputs] = useState<Record<string, string>>({});

  // New Holiday Ticker form state (real calendar date)
  const [holTitle, setHolTitle] = useState('');
  const [holMonth, setHolMonth] = useState<number>(12);
  const [holDay, setHolDay] = useState<number>(25);
  const [holSlug, setHolSlug] = useState('');
  const [holColor, setHolColor] = useState('#E63946');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newCatLabel.trim();
    const id = slugify(label);
    if (!label || !id) return;
    if (categories.some((c) => c.id === id)) return;

    const subs = newCatSubs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onUpdateCategories([
      ...categories,
      {
        id,
        label,
        subcategories: subs.length > 0 ? subs : ['General'],
        navGroup: newCatGroup,
        isHot: false,
      },
    ]);
    setNewCatLabel('');
    setNewCatSubs('');
  };

  const handleAddSubcategory = (catId: string) => {
    const val = (subInputs[catId] || '').trim();
    if (!val) return;
    onUpdateCategories(
      categories.map((c) =>
        c.id === catId && !c.subcategories.includes(val)
          ? { ...c, subcategories: [...c.subcategories, val] }
          : c
      )
    );
    setSubInputs((prev) => ({ ...prev, [catId]: '' }));
  };

  const handleRemoveSubcategory = (catId: string, sub: string) => {
    onUpdateCategories(
      categories.map((c) =>
        c.id === catId
          ? { ...c, subcategories: c.subcategories.filter((s) => s !== sub) }
          : c
      )
    );
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = holTitle.trim();
    if (!cleanTitle) return;
    const id = slugify(cleanTitle) || `holiday-${Date.now()}`;
    const safeMonth = Math.min(12, Math.max(1, Number(holMonth) || 1));
    const safeDay = Math.min(31, Math.max(1, Number(holDay) || 1));
    onUpdateHolidays([
      ...holidayTicker,
      {
        id,
        title: cleanTitle,
        month: safeMonth,
        day: safeDay,
        categorySlug: slugify(holSlug) || 'holidays',
        accentColor: holColor,
      },
    ]);
    setHolTitle('');
    setHolSlug('');
  };

  const moveHoliday = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= holidayTicker.length) return;
    const copy = [...holidayTicker];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    onUpdateHolidays(copy);
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: Categories, Sub-Categories & Mega-Menu Groupings */}
      <section className="rounded-2xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-[#2A9D8F]" />
            <div>
              <h2 className="text-base font-extrabold text-[#0F1E36] dark:text-white">
                Categories, Sub-Categories &amp; Navbar Mega-Menu
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Assign categories to Top, Trending, Holidays, Coloring Pages, or Worksheets navigation menus.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold tabular-nums text-[#64748B] dark:text-slate-400">
            {categories.length} categories
          </span>
        </div>

        {/* Add Category Row */}
        <form
          onSubmit={handleAddCategory}
          className="px-5 py-3.5 bg-[#FAF8F5] dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
        >
          <input
            type="text"
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            placeholder="New category name (e.g., Superheroes)"
            className="sm:col-span-4 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-medium text-[#0F1E36] dark:text-white"
          />
          <select
            value={newCatGroup}
            onChange={(e) => setNewCatGroup(e.target.value as NavMegaGroup)}
            aria-label="Navbar mega-menu group"
            className="sm:col-span-3 h-9 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white"
          >
            {NAV_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                Menu: {g.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newCatSubs}
            onChange={(e) => setNewCatSubs(e.target.value)}
            placeholder="Sub-categories (comma separated)"
            className="sm:col-span-3 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-medium text-[#0F1E36] dark:text-white"
          />
          <button
            type="submit"
            className="sm:col-span-2 h-9 px-3 rounded-lg bg-[#0F1E36] hover:bg-[#192D4E] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </form>

        {/* Categories List Table */}
        <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
          {categories.map((cat) => {
            const count = sheetCountsByCategory[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 dark:hover:bg-slate-800/30"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-extrabold text-[#0F1E36] dark:text-white">
                      {cat.label}
                    </span>
                    <span className="text-xs font-mono text-[#64748B] dark:text-slate-400">
                      /{cat.id}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-slate-400 tabular-nums">
                      · {count} {count === 1 ? 'sheet' : 'sheets'}
                      {count === 0 ? ' · hidden on storefront' : ''}
                    </span>
                  </div>

                  {/* Sub-category chips + inline add */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-xs font-semibold text-[#334155] dark:text-slate-200"
                      >
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(cat.id, sub)}
                          aria-label={`Remove ${sub}`}
                          className="text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={subInputs[cat.id] || ''}
                        onChange={(e) =>
                          setSubInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubcategory(cat.id);
                          }
                        }}
                        placeholder="+ Add sub-category"
                        className="h-7 w-36 px-2 rounded-md bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-xs text-[#0F1E36] dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubcategory(cat.id)}
                        className="h-7 px-2 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Controls: Mega-Menu Group Selector, Hot Toggle, Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={cat.navGroup}
                    onChange={(e) =>
                      onUpdateCategories(
                        categories.map((c) =>
                          c.id === cat.id
                            ? { ...c, navGroup: e.target.value as NavMegaGroup }
                            : c
                        )
                      )
                    }
                    aria-label={`Navbar group for ${cat.label}`}
                    className="h-8 px-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-slate-100"
                  >
                    {NAV_GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCategories(
                        categories.map((c) =>
                          c.id === cat.id ? { ...c, isHot: !c.isHot } : c
                        )
                      )
                    }
                    className={`h-8 px-2.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      cat.isHot
                        ? 'bg-[#E63946]/12 border-[#E63946] text-[#B7102A] dark:text-red-300'
                        : 'bg-white dark:bg-slate-900 border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-400'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Hot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCategories(categories.filter((c) => c.id !== cat.id))
                    }
                    aria-label={`Delete ${cat.label}`}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#64748B] hover:text-[#DC2626] flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: "Coming Up" Holiday Countdown Ticker Manager */}
      <section className="rounded-2xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-5 h-5 text-[#E63946]" />
            <div>
              <h2 className="text-base font-extrabold text-[#0F1E36] dark:text-white">
                “Coming Up” Real-Date Holiday Countdown
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Countdowns calculate dynamically from today&apos;s date and automatically show only holidays occurring within the next 90 days.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold tabular-nums text-[#64748B] dark:text-slate-400">
            {holidayTicker.length} events
          </span>
        </div>

        {/* Add Holiday Ticker Form */}
        <form
          onSubmit={handleAddHoliday}
          className="px-5 py-3.5 bg-[#FAF8F5] dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
        >
          <input
            type="text"
            value={holTitle}
            onChange={(e) => setHolTitle(e.target.value)}
            placeholder="Holiday title (e.g., St. Patrick’s Day)"
            className="sm:col-span-3 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-medium text-[#0F1E36] dark:text-white"
          />
          <div className="sm:col-span-3 flex items-center gap-1.5">
            <select
              value={holMonth}
              onChange={(e) => setHolMonth(Number(e.target.value))}
              aria-label="Holiday month"
              className="flex-1 h-9 px-2 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={31}
              value={holDay}
              onChange={(e) => setHolDay(Number(e.target.value))}
              aria-label="Holiday day"
              className="w-16 h-9 px-2 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs tabular-nums text-[#0F1E36] dark:text-white"
            />
          </div>
          <input
            type="text"
            value={holSlug}
            onChange={(e) => setHolSlug(e.target.value)}
            placeholder="Target pack/category slug"
            className="sm:col-span-3 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-white"
          />
          <div className="sm:col-span-1 flex justify-center">
            <input
              type="color"
              value={holColor}
              onChange={(e) => setHolColor(e.target.value)}
              aria-label="Accent color"
              className="w-8 h-8 rounded cursor-pointer border border-[#CBD5E1] bg-transparent p-0"
            />
          </div>
          <button
            type="submit"
            className="sm:col-span-2 h-9 px-3 rounded-lg bg-[#E63946] hover:bg-[#D62839] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Holiday</span>
          </button>
        </form>

        {/* Editable Holiday Rows */}
        <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
          {holidayTicker.map((item, idx) => {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const resolvedDate = resolveHolidayTargetDate(item, now);
            const daysRemaining = resolvedDate
              ? Math.round((resolvedDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))
              : null;
            const liveLabel =
              daysRemaining !== null
                ? formatCountdownLabel(daysRemaining, TRANSLATIONS.en)
                : 'No date';
            const inWindow = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 90;

            return (
              <div
                key={item.id}
                className="px-5 py-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center hover:bg-[#FAF8F5]/60 dark:hover:bg-slate-800/30"
              >
                <div className="sm:col-span-3 flex items-center gap-2">
                  <input
                    type="color"
                    value={item.accentColor || '#E63946'}
                    onChange={(e) =>
                      onUpdateHolidays(
                        holidayTicker.map((h) =>
                          h.id === item.id ? { ...h, accentColor: e.target.value } : h
                        )
                      )
                    }
                    aria-label={`Color for ${item.title}`}
                    className="w-7 h-7 rounded border border-[#CBD5E1] shrink-0 cursor-pointer bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      onUpdateHolidays(
                        holidayTicker.map((h) =>
                          h.id === item.id ? { ...h, title: e.target.value } : h
                        )
                      )
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-1.5">
                  <select
                    value={item.month || (resolvedDate ? resolvedDate.getMonth() + 1 : 1)}
                    onChange={(e) =>
                      onUpdateHolidays(
                        holidayTicker.map((h) =>
                          h.id === item.id
                            ? { ...h, month: Number(e.target.value) }
                            : h
                        )
                      )
                    }
                    aria-label={`Month for ${item.title}`}
                    className="flex-1 h-9 px-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F1E36] dark:text-white"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={item.day || (resolvedDate ? resolvedDate.getDate() : 1)}
                    onChange={(e) =>
                      onUpdateHolidays(
                        holidayTicker.map((h) =>
                          h.id === item.id
                            ? {
                                ...h,
                                day: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                              }
                            : h
                        )
                      )
                    }
                    aria-label={`Day for ${item.title}`}
                    className="w-16 h-9 px-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs tabular-nums text-[#0F1E36] dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3 space-y-0.5">
                  <input
                    type="text"
                    value={item.categorySlug}
                    onChange={(e) =>
                      onUpdateHolidays(
                        holidayTicker.map((h) =>
                          h.id === item.id ? { ...h, categorySlug: e.target.value } : h
                        )
                      )
                    }
                    placeholder="category or pack slug"
                    className="w-full h-9 px-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 font-mono text-xs text-[#0F1E36] dark:text-slate-200"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2">
                  <span
                    className={`text-[11px] font-bold tabular-nums whitespace-nowrap ${
                      inWindow
                        ? 'text-[#16A34A] dark:text-emerald-400'
                        : 'text-[#64748B] dark:text-slate-400'
                    }`}
                  >
                    {liveLabel}
                    {inWindow ? ' · live' : ' · >90d'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveHoliday(idx, -1)}
                      aria-label="Move up"
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center text-[#64748B] cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === holidayTicker.length - 1}
                      onClick={() => moveHoliday(idx, 1)}
                      aria-label="Move down"
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center text-[#64748B] cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateHolidays(holidayTicker.filter((h) => h.id !== item.id))
                      }
                      aria-label={`Remove ${item.title}`}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#64748B] hover:text-[#DC2626] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
