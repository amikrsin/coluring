import { AdminHolidayTickerItem, HolidayEvent, Locale } from '../types';
import { getText, TranslationDictionary } from '../i18n/translations';

/**
 * Computes Gregorian Easter Sunday (month 1-12, day 1-31) for any given year
 * using the anonymous Meeus/Jones/Butcher algorithm.
 */
function getEasterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * US Thanksgiving: 4th Thursday of November for any year.
 */
function getThanksgivingDate(year: number): { month: number; day: number } {
  const novFirst = new Date(year, 10, 1);
  const dayOfWeek = novFirst.getDay(); // 0=Sun ... 4=Thu
  const firstThursday = 1 + ((4 - dayOfWeek + 7) % 7);
  return { month: 11, day: firstThursday + 21 };
}

/** Accurate lunisolar calendar dates for Diwali (2025–2032). */
const DIWALI_DATES: Record<number, { month: number; day: number }> = {
  2025: { month: 10, day: 20 },
  2026: { month: 11, day: 8 },
  2027: { month: 10, day: 29 },
  2028: { month: 10, day: 17 },
  2029: { month: 11, day: 5 },
  2030: { month: 10, day: 26 },
  2031: { month: 11, day: 14 },
  2032: { month: 11, day: 2 },
};

/** Accurate lunisolar calendar dates for Ganesh Chaturthi (2025–2032). */
const GANESH_CHATURTHI_DATES: Record<number, { month: number; day: number }> = {
  2025: { month: 8, day: 27 },
  2026: { month: 9, day: 14 },
  2027: { month: 9, day: 4 },
  2028: { month: 8, day: 23 },
  2029: { month: 9, day: 11 },
  2030: { month: 9, day: 1 },
  2031: { month: 9, day: 20 },
  2032: { month: 9, day: 8 },
};

export interface BuiltInHolidayDefinition extends HolidayEvent {
  resolveDateForYear?: (year: number) => { month: number; day: number };
}

export const HOLIDAY_CALENDAR: BuiltInHolidayDefinition[] = [
  {
    id: 'new-year',
    slug: 'printable-calendars',
    month: 1,
    day: 1,
    packSlug: 'printable-calendars',
    accentColor: '#FFB703',
    title: {
      en: "New Year's Day",
      es: 'Año Nuevo',
      fr: 'Nouvel An',
      de: 'Neujahr',
      pt: 'Ano Novo',
      it: 'Capodanno',
      nl: 'Nieuwjaar',
      pl: 'Nowy Rok',
    },
  },
  {
    id: 'valentines',
    slug: 'magical-unicorns',
    month: 2,
    day: 14,
    packSlug: 'magical-unicorns',
    accentColor: '#E63946',
    title: {
      en: "Valentine's Day",
      es: 'San Valentín',
      fr: 'Saint-Valentin',
      de: 'Valentinstag',
      pt: 'Dia dos Namorados',
      it: 'San Valentino',
      nl: 'Valentijnsdag',
      pl: 'Walentynki',
    },
  },
  {
    id: 'easter',
    slug: 'spring-easter-fun',
    month: 4,
    day: 5,
    packSlug: 'spring-easter-fun',
    accentColor: '#2A9D8F',
    resolveDateForYear: getEasterDate,
    title: {
      en: 'Easter',
      es: 'Pascua',
      fr: 'Pâques',
      de: 'Ostern',
      pt: 'Páscoa',
      it: 'Pasqua',
      nl: 'Pasen',
      pl: 'Wielkanoc',
    },
  },
  {
    id: 'earth-day',
    slug: 'ocean-friends',
    month: 4,
    day: 22,
    packSlug: 'ocean-friends',
    accentColor: '#38B000',
    title: {
      en: 'Earth Day',
      es: 'Día de la Tierra',
      fr: 'Jour de la Terre',
      de: 'Tag der Erde',
      pt: 'Dia da Terra',
      it: 'Giornata della Terra',
      nl: 'Dag van de Aarde',
      pl: 'Dzień Ziemi',
    },
  },
  {
    id: 'ganesh-chaturthi',
    slug: 'holidays',
    month: 9,
    day: 14,
    packSlug: 'holidays',
    accentColor: '#F97316',
    resolveDateForYear: (year) =>
      GANESH_CHATURTHI_DATES[year] || { month: 9, day: 10 },
    title: {
      en: 'Ganesh Chaturthi',
      es: 'Ganesh Chaturthi',
      fr: 'Ganesh Chaturthi',
      de: 'Ganesh Chaturthi',
      pt: 'Ganesh Chaturthi',
      it: 'Ganesh Chaturthi',
      nl: 'Ganesh Chaturthi',
      pl: 'Ganesh Chaturthi',
    },
  },
  {
    id: 'back-to-school',
    slug: 'teacher-classroom-pack',
    month: 9,
    day: 1,
    packSlug: 'teacher-classroom-pack',
    accentColor: '#2A9D8F',
    title: {
      en: 'Back to School',
      es: 'Vuelta al Cole',
      fr: 'Rentrée Scolaire',
      de: 'Schulanfang',
      pt: 'Volta às Aulas',
      it: 'Ritorno a Scuola',
      nl: 'Terug naar School',
      pl: 'Powrót do Szkoły',
    },
  },
  {
    id: 'halloween',
    slug: 'spooky-halloween',
    month: 10,
    day: 31,
    packSlug: 'spooky-halloween',
    accentColor: '#F97316',
    title: {
      en: 'Halloween',
      es: 'Halloween',
      fr: 'Halloween',
      de: 'Halloween',
      pt: 'Halloween',
      it: 'Halloween',
      nl: 'Halloween',
      pl: 'Halloween',
    },
  },
  {
    id: 'diwali',
    slug: 'holidays',
    month: 11,
    day: 8,
    packSlug: 'holidays',
    accentColor: '#FFB703',
    resolveDateForYear: (year) => DIWALI_DATES[year] || { month: 11, day: 1 },
    title: {
      en: 'Diwali',
      es: 'Diwali',
      fr: 'Diwali',
      de: 'Diwali',
      pt: 'Diwali',
      it: 'Diwali',
      nl: 'Diwali',
      pl: 'Diwali',
    },
  },
  {
    id: 'thanksgiving',
    slug: 'thanksgiving-harvest',
    month: 11,
    day: 26,
    packSlug: 'thanksgiving-harvest',
    accentColor: '#D97706',
    resolveDateForYear: getThanksgivingDate,
    title: {
      en: 'Thanksgiving',
      es: 'Acción de Gracias',
      fr: 'Thanksgiving',
      de: 'Erntedankfest',
      pt: 'Ação de Graças',
      it: 'Ringraziamento',
      nl: 'Thanksgiving',
      pl: 'Święto Dziękczynienia',
    },
  },
  {
    id: 'christmas',
    slug: 'christmas-wonderland',
    month: 12,
    day: 25,
    packSlug: 'christmas-wonderland',
    accentColor: '#E63946',
    title: {
      en: 'Christmas',
      es: 'Navidad',
      fr: 'Noël',
      de: 'Weihnachten',
      pt: 'Natal',
      it: 'Natale',
      nl: 'Kerstmis',
      pl: 'Boże Narodzenie',
    },
  },
];

const BUILTIN_BY_ID = new Map(HOLIDAY_CALENDAR.map((h) => [h.id, h]));

export interface ComputedHoliday {
  id: string;
  title: string;
  packSlug: string;
  accentColor: string;
  targetDate: Date;
  daysRemaining: number;
  weeksRemaining: number;
  countdownLabel: string;
}

export function formatCountdownLabel(
  daysRemaining: number,
  t: TranslationDictionary
): string {
  if (daysRemaining <= 0) {
    return t.time.today || 'Today';
  }
  if (daysRemaining === 1) {
    return t.time.tomorrow || 'Tomorrow';
  }
  if (daysRemaining < 14) {
    return `In ${daysRemaining} ${t.time.days || 'days'}`;
  }
  const weeks = Math.round(daysRemaining / 7);
  return weeks === 1 ? 'In 1 wk' : `In ${weeks} ${t.time.weeks || 'wks'}`;
}

function getNextOccurrenceDate(
  startOfToday: Date,
  resolver: (year: number) => { month: number; day: number }
): Date {
  const year = startOfToday.getFullYear();
  const thisYearParts = resolver(year);
  const candidate = new Date(year, thisYearParts.month - 1, thisYearParts.day);
  if (candidate.getTime() >= startOfToday.getTime()) {
    return candidate;
  }
  const nextYearParts = resolver(year + 1);
  return new Date(year + 1, nextYearParts.month - 1, nextYearParts.day);
}

export function resolveHolidayTargetDate(
  item: {
    id: string;
    month?: number;
    day?: number;
    dateIso?: string;
  },
  now: Date = new Date()
): Date | null {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Explicit ISO date (YYYY-MM-DD)
  if (item.dateIso && /^\d{4}-\d{2}-\d{2}$/.test(item.dateIso.trim())) {
    const [y, m, d] = item.dateIso.trim().split('-').map(Number);
    const explicit = new Date(y, m - 1, d);
    if (!Number.isNaN(explicit.getTime())) {
      if (explicit.getTime() >= startOfToday.getTime()) {
        return explicit;
      }
      // Roll annual month/day forward if explicit date already passed
      return getNextOccurrenceDate(startOfToday, () => ({ month: m, day: d }));
    }
  }

  // 2. Well-known holiday with dynamic lunar/floating date calculation (Easter, Thanksgiving, Diwali, Ganesh Chaturthi)
  const builtIn = BUILTIN_BY_ID.get(item.id);
  if (builtIn?.resolveDateForYear) {
    return getNextOccurrenceDate(startOfToday, builtIn.resolveDateForYear);
  }

  // 3. Explicit month + day
  if (
    typeof item.month === 'number' &&
    typeof item.day === 'number' &&
    item.month >= 1 &&
    item.month <= 12 &&
    item.day >= 1 &&
    item.day <= 31
  ) {
    return getNextOccurrenceDate(startOfToday, () => ({
      month: item.month!,
      day: item.day!,
    }));
  }

  // 4. Built-in fixed date fallback by ID
  if (builtIn) {
    return getNextOccurrenceDate(startOfToday, () => ({
      month: builtIn.month,
      day: builtIn.day,
    }));
  }

  return null;
}

/**
 * Computes chronological upcoming holidays strictly within `maxDaysAhead` (default 90 days)
 * using the user's real current date (`new Date()`).
 */
export function getUpcomingHolidays(
  locale: Locale,
  t: TranslationDictionary,
  adminItems?: AdminHolidayTickerItem[],
  now: Date = new Date(),
  maxDaysAhead: number = 90
): ComputedHoliday[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Build unified candidate list from admin items (when present) + built-in calendar
  const candidates: Array<{
    id: string;
    title: string;
    packSlug: string;
    accentColor: string;
    month?: number;
    day?: number;
    dateIso?: string;
  }> = [];

  const seenIds = new Set<string>();

  if (adminItems && adminItems.length > 0) {
    for (const item of adminItems) {
      const builtIn = BUILTIN_BY_ID.get(item.id);
      seenIds.add(item.id);
      candidates.push({
        id: item.id,
        title:
          builtIn && locale !== 'en'
            ? getText(builtIn.title, locale)
            : item.title,
        packSlug: item.categorySlug,
        accentColor: item.accentColor || builtIn?.accentColor || '#E63946',
        month: item.month ?? builtIn?.month,
        day: item.day ?? builtIn?.day,
        dateIso: item.dateIso,
      });
    }
  } else {
    for (const ev of HOLIDAY_CALENDAR) {
      seenIds.add(ev.id);
      candidates.push({
        id: ev.id,
        title: getText(ev.title, locale),
        packSlug: ev.packSlug,
        accentColor: ev.accentColor,
        month: ev.month,
        day: ev.day,
      });
    }
  }

  const results: ComputedHoliday[] = [];

  for (const c of candidates) {
    const targetDate = resolveHolidayTargetDate(c, now);
    if (!targetDate) continue;

    const diffMs = targetDate.getTime() - startOfToday.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0 || daysRemaining > maxDaysAhead) continue;

    const weeksRemaining = Math.round(daysRemaining / 7);
    results.push({
      id: c.id,
      title: c.title,
      packSlug: c.packSlug,
      accentColor: c.accentColor,
      targetDate,
      daysRemaining,
      weeksRemaining,
      countdownLabel: formatCountdownLabel(daysRemaining, t),
    });
  }

  return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
