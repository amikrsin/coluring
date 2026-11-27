import { CategoryId, Locale, LocalizedText } from '../types';

export const SUPPORTED_LOCALES: { code: Locale; label: string; nativeName: string; defaultPaper: 'a4' | 'letter' }[] = [
  { code: 'en', label: 'EN', nativeName: 'English', defaultPaper: 'letter' },
  { code: 'es', label: 'ES', nativeName: 'Español', defaultPaper: 'a4' },
  { code: 'fr', label: 'FR', nativeName: 'Français', defaultPaper: 'a4' },
  { code: 'de', label: 'DE', nativeName: 'Deutsch', defaultPaper: 'a4' },
  { code: 'pt', label: 'PT', nativeName: 'Português', defaultPaper: 'a4' },
  { code: 'it', label: 'IT', nativeName: 'Italiano', defaultPaper: 'a4' },
  { code: 'nl', label: 'NL', nativeName: 'Nederlands', defaultPaper: 'a4' },
  { code: 'pl', label: 'PL', nativeName: 'Polski', defaultPaper: 'a4' },
];

export interface TranslationDictionary {
  nav: {
    top: string;
    trending: string;
    coloringPages: string;
    holidays: string;
    worksheets: string;
    calendars: string;
    forTeachers: string;
    searchPlaceholder: string;
    printSet: string;
  };
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    popularLabel: string;
    freeNote: string;
  };
  sections: {
    comingUp: string;
    trendingThisWeek: string;
    trendingSub: string;
    newColoringPages: string;
    newSub: string;
    top100: string;
    top100Sub: string;
    browseByTheme: string;
    browseByThemeSub: string;
    viewAll: string;
    faqTitle: string;
    faqSub: string;
  };
  time: {
    weeks: string;
    days: string;
    today: string;
    tomorrow: string;
  };
  card: {
    pdf: string;
    colorOnline: string;
    pages: string;
    page: string;
    views: string;
    addToPrintSet: string;
    inPrintSet: string;
    openPack: string;
    easy: string;
    medium: string;
    detailed: string;
  };
  pack: {
    backHome: string;
    paperFormat: string;
    downloadAllPdfs: string;
    addPackToTray: string;
    relatedPacks: string;
    helpful: string;
    noSignUp: string;
    sheetsInPack: string;
  };
  canvas: {
    title: string;
    bucket: string;
    brush: string;
    eraser: string;
    pan: string;
    undo: string;
    redo: string;
    reset: string;
    saveJpg: string;
    print: string;
    tolerance: string;
    brushSize: string;
    keepLines: string;
    zoom: string;
    fit: string;
    customColor: string;
    close: string;
    downloading: string;
  };
  printTray: {
    title: string;
    empty: string;
    emptySub: string;
    clearAll: string;
    printAll: string;
    downloadPdf: string;
    paperSizeNote: string;
  };
  categories: Record<CategoryId, string>;
  footer: {
    tagline: string;
    languages: string;
    categories: string;
    resources: string;
    deployGuide: string;
    sitemap: string;
    copyright: string;
  };
}

const EN: TranslationDictionary = {
  nav: {
    top: 'Top 100',
    trending: 'Trending',
    coloringPages: 'Coloring Pages',
    holidays: 'Holidays',
    worksheets: 'Worksheets',
    calendars: 'Calendars',
    forTeachers: 'For Teachers',
    searchPlaceholder: 'Search dinosaurs, unicorns, Christmas...',
    printSet: 'Print Set',
  },
  hero: {
    title: 'Free Printable Coloring Pages for Kids, Parents & Teachers',
    subtitle: 'Instant A4 & US Letter vector PDFs and an interactive Color Online studio — no account, no watermark, ready in one click.',
    searchPlaceholder: 'Search 100+ free coloring packs, holidays, worksheets...',
    searchButton: 'Search',
    popularLabel: 'Popular:',
    freeNote: '100% Free · Instant PDF · A4 & US Letter',
  },
  sections: {
    comingUp: 'Coming Up',
    trendingThisWeek: 'Trending This Week',
    trendingSub: 'Fastest-rising printable collections across classrooms and homes.',
    newColoringPages: 'New Coloring Pages',
    newSub: 'Fresh crisp line-art sheets ready to print or paint online.',
    top100: 'Top 100 Most Popular',
    top100Sub: 'Community-voted favorites ranked by downloads and upvotes.',
    browseByTheme: 'Browse by Theme',
    browseByThemeSub: 'Explore curated collections for every age group and lesson plan.',
    viewAll: 'View all',
    faqTitle: 'Frequently Asked Questions',
    faqSub: 'Everything you need to know about printing A4 & US Letter sheets and coloring online.',
  },
  time: {
    weeks: 'wks',
    days: 'days',
    today: 'Today',
    tomorrow: 'Tomorrow',
  },
  card: {
    pdf: 'PDF',
    colorOnline: 'Color Online',
    pages: 'pages',
    page: 'page',
    views: 'views',
    addToPrintSet: 'Add to Print Set',
    inPrintSet: 'In Print Set',
    openPack: 'Open Pack',
    easy: 'Easy',
    medium: 'Medium',
    detailed: 'Detailed',
  },
  pack: {
    backHome: 'Back to Home',
    paperFormat: 'Paper Size',
    downloadAllPdfs: 'Print Entire Pack',
    addPackToTray: 'Add Pack to Print Set',
    relatedPacks: 'More Packs You May Like',
    helpful: 'Was this pack helpful?',
    noSignUp: 'One-click download · No sign-up required',
    sheetsInPack: 'printable sheets included',
  },
  canvas: {
    title: 'Color Online Studio',
    bucket: 'Fill',
    brush: 'Brush',
    eraser: 'Eraser',
    pan: 'Move',
    undo: 'Undo',
    redo: 'Redo',
    reset: 'Reset',
    saveJpg: 'Save JPG',
    print: 'Print',
    tolerance: 'Tolerance',
    brushSize: 'Size',
    keepLines: 'Protect outlines',
    zoom: 'Zoom',
    fit: 'Fit',
    customColor: 'Custom',
    close: 'Close',
    downloading: 'Saving...',
  },
  printTray: {
    title: 'Your Print Set',
    empty: 'Your print set is empty',
    emptySub: 'Click the + button on any coloring sheet to build a custom printable packet.',
    clearAll: 'Clear all',
    printAll: 'Print Packet',
    downloadPdf: 'Download PDF',
    paperSizeNote: 'Formatted for',
  },
  categories: {
    animals: 'Animals',
    dinosaurs: 'Dinosaurs',
    fantasy: 'Unicorns & Fantasy',
    space: 'Space & Science',
    vehicles: 'Cars & Vehicles',
    holidays: 'Holidays & Seasons',
    mandalas: 'Mandalas',
    worksheets: 'Worksheets',
    calendars: 'Calendars',
    teachers: 'For Teachers',
  },
  footer: {
    tagline: 'Crisp printable PDFs in A4 & US Letter plus an instant browser coloring studio powered by Cloudflare Pages & R2.',
    languages: 'Languages',
    categories: 'Collections',
    resources: 'Platform & Edge',
    deployGuide: 'Cloudflare R2 Deploy Guide',
    sitemap: 'Multilingual Sitemap',
    copyright: 'ColorWorld. Free for personal, family, and classroom printing.',
  },
};

export const TRANSLATIONS: Record<Locale, TranslationDictionary> = {
  en: EN,
  es: {
    ...EN,
    nav: {
      top: 'Top 100',
      trending: 'Tendencias',
      coloringPages: 'Dibujos',
      holidays: 'Festivos',
      worksheets: 'Fichas',
      calendars: 'Calendarios',
      forTeachers: 'Profesores',
      searchPlaceholder: 'Buscar dinosaurios, unicornios, Navidad...',
      printSet: 'Lote',
    },
    hero: {
      title: 'Dibujos para Colorear Gratis para Imprimir y Pintar Online',
      subtitle: 'PDFs vectoriales en A4 y Carta US al instante o pinta en nuestro lienzo interactivo — sin registro ni marcas de agua.',
      searchPlaceholder: 'Busca más de 100 paquetes de dibujos, fichas y festivos...',
      searchButton: 'Buscar',
      popularLabel: 'Populares:',
      freeNote: '100% Gratis · PDF Instantáneo · A4 y Carta US',
    },
    sections: {
      comingUp: 'Próximos Eventos',
      trendingThisWeek: 'Tendencias de la Semana',
      trendingSub: 'Las colecciones imprimibles que más crecen esta semana.',
      newColoringPages: 'Nuevos Dibujos para Colorear',
      newSub: 'Láminas recién publicadas listas para imprimir o colorear online.',
      top100: 'Top 100 Más Populares',
      top100Sub: 'Los favoritos votados por familias y docentes.',
      browseByTheme: 'Explorar por Tema',
      browseByThemeSub: 'Descubre colecciones organizadas por edad y temática.',
      viewAll: 'Ver todo',
      faqTitle: 'Preguntas Frecuentes',
      faqSub: 'Todo sobre la impresión en A4 / Carta y el estudio de colorear online.',
    },
    time: { weeks: 'sem', days: 'días', today: 'Hoy', tomorrow: 'Mañana' },
    card: {
      ...EN.card,
      colorOnline: 'Colorear Online',
      pages: 'páginas',
      page: 'página',
      views: 'vistas',
      openPack: 'Abrir Pack',
      easy: 'Fácil',
      medium: 'Medio',
      detailed: 'Detallado',
    },
    pack: {
      ...EN.pack,
      backHome: 'Volver al Inicio',
      paperFormat: 'Tamaño de Papel',
      downloadAllPdfs: 'Imprimir Pack',
      addPackToTray: 'Añadir al Lote',
      relatedPacks: 'Packs Relacionados',
      helpful: '¿Te gustó este pack?',
      noSignUp: 'Descarga directa · Sin registro',
      sheetsInPack: 'láminas imprimibles incluidas',
    },
    canvas: {
      ...EN.canvas,
      title: 'Estudio Colorear Online',
      bucket: 'Rellenar',
      brush: 'Pincel',
      eraser: 'Borrador',
      pan: 'Mover',
      undo: 'Deshacer',
      redo: 'Rehacer',
      reset: 'Reiniciar',
      saveJpg: 'Guardar JPG',
      print: 'Imprimir',
      tolerance: 'Tolerancia',
      brushSize: 'Grosor',
      keepLines: 'Proteger líneas',
      fit: 'Ajustar',
      customColor: 'Color',
      close: 'Cerrar',
    },
    categories: {
      animals: 'Animales',
      dinosaurs: 'Dinosaurios',
      fantasy: 'Unicornios y Fantasía',
      space: 'Espacio y Ciencia',
      vehicles: 'Coches y Vehículos',
      holidays: 'Festivos y Estaciones',
      mandalas: 'Mandalas',
      worksheets: 'Fichas Educativas',
      calendars: 'Calendarios',
      teachers: 'Para Profesores',
    },
  },
  fr: {
    ...EN,
    nav: {
      top: 'Top 100',
      trending: 'Tendances',
      coloringPages: 'Coloriages',
      holidays: 'Fêtes',
      worksheets: 'Fiches',
      calendars: 'Calendriers',
      forTeachers: 'Enseignants',
      searchPlaceholder: 'Rechercher dinosaures, licornes, Noël...',
      printSet: 'À imprimer',
    },
    hero: {
      title: 'Coloriages Gratuits à Imprimer et à Colorier en Ligne',
      subtitle: 'PDF haute définition A4 et US Letter en un clic ou atelier de coloriage interactif — sans inscription.',
      searchPlaceholder: 'Rechercher coloriages, fêtes, fiches éducatives...',
      searchButton: 'Rechercher',
      popularLabel: 'Populaires :',
      freeNote: '100% Gratuit · PDF Immédiat · A4 & US Letter',
    },
    sections: {
      comingUp: 'À Venir',
      trendingThisWeek: 'Tendances de la Semaine',
      trendingSub: 'Les collections les plus téléchargées cette semaine.',
      newColoringPages: 'Nouveaux Coloriages',
      newSub: 'Nouvelles planches prêtes à imprimer ou colorier en ligne.',
      top100: 'Top 100 des Plus Populaires',
      top100Sub: 'Classés par votes des parents et enseignants.',
      browseByTheme: 'Parcourir par Thème',
      browseByThemeSub: 'Des dossiers classés pour chaque âge et projet.',
      viewAll: 'Tout voir',
      faqTitle: 'Questions Fréquentes',
      faqSub: 'Conseils d’impression A4 / US Letter et coloriage en ligne.',
    },
    time: { weeks: 'sem', days: 'jours', today: 'Aujourd’hui', tomorrow: 'Demain' },
    card: {
      ...EN.card,
      colorOnline: 'Colorier en ligne',
      pages: 'pages',
      page: 'page',
      views: 'vues',
      openPack: 'Voir le pack',
      easy: 'Facile',
      medium: 'Moyen',
      detailed: 'Détaillé',
    },
    canvas: {
      ...EN.canvas,
      title: 'Atelier Coloriage en Ligne',
      bucket: 'Pot',
      brush: 'Pinceau',
      eraser: 'Gomme',
      pan: 'Déplacer',
      undo: 'Annuler',
      redo: 'Rétablir',
      reset: 'Réinitialiser',
      saveJpg: 'Enregistrer JPG',
      print: 'Imprimer',
      tolerance: 'Tolérance',
      brushSize: 'Taille',
      keepLines: 'Protéger traits',
      fit: 'Ajuster',
      close: 'Fermer',
    },
    categories: {
      animals: 'Animaux',
      dinosaurs: 'Dinosaures',
      fantasy: 'Licornes & Magie',
      space: 'Espace & Science',
      vehicles: 'Voitures & Véhicules',
      holidays: 'Fêtes & Saisons',
      mandalas: 'Mandalas',
      worksheets: 'Fiches Éducatives',
      calendars: 'Calendriers',
      teachers: 'Pour Enseignants',
    },
  },
  de: {
    ...EN,
    nav: {
      top: 'Top 100',
      trending: 'Trends',
      coloringPages: 'Ausmalbilder',
      holidays: 'Feiertage',
      worksheets: 'Arbeitsblätter',
      calendars: 'Kalender',
      forTeachers: 'Für Lehrer',
      searchPlaceholder: 'Dinosaurier, Einhörner, Weihnachten suchen...',
      printSet: 'Druckset',
    },
    hero: {
      title: 'Kostenlose Ausmalbilder zum Ausdrucken & Online Ausmalen',
      subtitle: 'Gestochen scharfe A4- & US-Letter-PDFs mit einem Klick herunterladen oder direkt im Browser ausmalen.',
      searchPlaceholder: 'Suche nach Ausmalbildern, Feiertagen, Arbeitsblättern...',
      searchButton: 'Suchen',
      popularLabel: 'Beliebt:',
      freeNote: '100% Kostenlos · Sofort-PDF · A4 & US Letter',
    },
    sections: {
      comingUp: 'Demnächst',
      trendingThisWeek: 'Trends dieser Woche',
      trendingSub: 'Die am schnellsten wachsenden Malvorlagen dieser Woche.',
      newColoringPages: 'Neue Ausmalbilder',
      newSub: 'Frische Vorlagen zum Ausdrucken oder Online-Ausmalen.',
      top100: 'Top 100 Beliebteste',
      top100Sub: 'Von Eltern und Lehrkräften am besten bewertet.',
      browseByTheme: 'Nach Thema entdecken',
      browseByThemeSub: 'Kuratiert für jedes Alter und den Unterricht.',
      viewAll: 'Alle ansehen',
      faqTitle: 'Häufige Fragen',
      faqSub: 'Alles über A4/US-Letter-Druck und unser Online-Malstudio.',
    },
    time: { weeks: 'Wo.', days: 'Tage', today: 'Heute', tomorrow: 'Morgen' },
    card: {
      ...EN.card,
      colorOnline: 'Online Ausmalen',
      pages: 'Seiten',
      page: 'Seite',
      views: 'Aufrufe',
      openPack: 'Paket öffnen',
      easy: 'Einfach',
      medium: 'Mittel',
      detailed: 'Detailreich',
    },
    canvas: {
      ...EN.canvas,
      title: 'Online Malstudio',
      bucket: 'Füllen',
      brush: 'Pinsel',
      eraser: 'Radierer',
      pan: 'Verschieben',
      undo: 'Zurück',
      redo: 'Vor',
      reset: 'Neu',
      saveJpg: 'JPG speichern',
      print: 'Drucken',
      tolerance: 'Toleranz',
      brushSize: 'Größe',
      keepLines: 'Linien schützen',
      fit: 'Einpassen',
      close: 'Schließen',
    },
    categories: {
      animals: 'Tiere',
      dinosaurs: 'Dinosaurier',
      fantasy: 'Einhörner & Fantasie',
      space: 'Weltraum & Wissen',
      vehicles: 'Autos & Fahrzeuge',
      holidays: 'Feiertage & Feste',
      mandalas: 'Mandalas',
      worksheets: 'Arbeitsblätter',
      calendars: 'Kalender',
      teachers: 'Für Lehrer',
    },
  },
  pt: {
    ...EN,
    nav: {
      top: 'Top 100',
      trending: 'Em Alta',
      coloringPages: 'Desenhos',
      holidays: 'Feriados',
      worksheets: 'Atividades',
      calendars: 'Calendários',
      forTeachers: 'Professores',
      searchPlaceholder: 'Buscar dinossauros, unicórnios, Natal...',
      printSet: 'Imprimir',
    },
    hero: {
      title: 'Desenhos para Colorir Grátis para Imprimir e Pintar Online',
      subtitle: 'PDFs vetoriais em A4 e Carta US instantâneos ou pinte direto no navegador — sem cadastro.',
      searchPlaceholder: 'Buscar desenhos para colorir, feriados, atividades...',
      searchButton: 'Buscar',
      popularLabel: 'Populares:',
      freeNote: '100% Grátis · PDF Instantâneo · A4 & US Letter',
    },
    sections: {
      comingUp: 'Próximas Datas',
      trendingThisWeek: 'Em Alta na Semana',
      trendingSub: 'As coleções mais procuradas por famílias e escolas.',
      newColoringPages: 'Novos Desenhos',
      newSub: 'Folhas recém-criadas para imprimir ou colorir online.',
      top100: 'Top 100 Mais Populares',
      top100Sub: 'Favoritos classificados por votos e downloads.',
      browseByTheme: 'Explorar por Tema',
      browseByThemeSub: 'Coleções selecionadas para todas as idades.',
      viewAll: 'Ver tudo',
      faqTitle: 'Perguntas Frequentes',
      faqSub: 'Dúvidas sobre impressão A4/Carta e pintura online.',
    },
    time: { weeks: 'sem', days: 'dias', today: 'Hoje', tomorrow: 'Amanhã' },
    card: {
      ...EN.card,
      colorOnline: 'Colorir Online',
      pages: 'páginas',
      page: 'página',
      views: 'visitas',
      openPack: 'Abrir Pacote',
      easy: 'Fácil',
      medium: 'Médio',
      detailed: 'Detalhado',
    },
    categories: {
      animals: 'Animais',
      dinosaurs: 'Dinossauros',
      fantasy: 'Unicórnios e Fantasia',
      space: 'Espaço e Ciência',
      vehicles: 'Carros e Veículos',
      holidays: 'Feriados e Estações',
      mandalas: 'Mandalas',
      worksheets: 'Atividades',
      calendars: 'Calendários',
      teachers: 'Para Professores',
    },
  },
  it: {
    ...EN,
    nav: {
      top: 'Top 100',
      trending: 'Di Tendenza',
      coloringPages: 'Disegni',
      holidays: 'Festività',
      worksheets: 'Schede',
      calendars: 'Calendari',
      forTeachers: 'Insegnanti',
      searchPlaceholder: 'Cerca dinosauri, unicorni, Natale...',
      printSet: 'Stampa',
    },
    hero: {
      title: 'Disegni da Colorare Gratis da Stampare e Colorare Online',
      subtitle: 'PDF nitidi in formato A4 e US Letter con un clic o colora direttamente online senza registrazione.',
      searchPlaceholder: 'Cerca disegni, festività, schede didattiche...',
      searchButton: 'Cerca',
      popularLabel: 'Popolari:',
      freeNote: '100% Gratis · PDF Immediato · A4 & US Letter',
    },
    sections: {
      comingUp: 'In Arrivo',
      trendingThisWeek: 'Di Tendenza Questa Settimana',
      trendingSub: 'Le raccolte più amate questa settimana.',
      newColoringPages: 'Nuovi Disegni da Colorare',
      newSub: 'Nuove tavole pronte per la stampa o il colore online.',
      top100: 'Top 100 Più Popolari',
      top100Sub: 'I preferiti votati da genitori e insegnanti.',
      browseByTheme: 'Esplora per Tema',
      browseByThemeSub: 'Raccolte curate per ogni età.',
      viewAll: 'Vedi tutto',
      faqTitle: 'Domande Frequenti',
      faqSub: 'Tutto sulla stampa A4/US Letter e la colorazione online.',
    },
    time: { weeks: 'sett', days: 'giorni', today: 'Oggi', tomorrow: 'Domani' },
    card: {
      ...EN.card,
      colorOnline: 'Colora Online',
      pages: 'pagine',
      page: 'pagina',
      views: 'visite',
      openPack: 'Apri Pacchetto',
      easy: 'Facile',
      medium: 'Medio',
      detailed: 'Dettagliato',
    },
    categories: {
      animals: 'Animali',
      dinosaurs: 'Dinosauri',
      fantasy: 'Unicorni e Fantasia',
      space: 'Spazio e Scienza',
      vehicles: 'Auto e Veicoli',
      holidays: 'Festività e Stagioni',
      mandalas: 'Mandala',
      worksheets: 'Schede Didattiche',
      calendars: 'Calendari',
      teachers: 'Per Insegnanti',
    },
  },
  nl: {
    ...EN,
    nav: {
      top: 'Top 100',
      trending: 'Trending',
      coloringPages: 'Kleurplaten',
      holidays: 'Feestdagen',
      worksheets: 'Werkbladen',
      calendars: 'Kalenders',
      forTeachers: 'Leraren',
      searchPlaceholder: 'Zoek dinosaurussen, eenhoorns, Kerst...',
      printSet: 'Printset',
    },
    hero: {
      title: 'Gratis Kleurplaten om te Printen & Online in te Kleuren',
      subtitle: 'Directe A4 & US Letter PDF’s zonder account, of kleur direct online met onze slimme verfemmer.',
      searchPlaceholder: 'Zoek kleurplaten, feestdagen, werkbladen...',
      searchButton: 'Zoeken',
      popularLabel: 'Populair:',
      freeNote: '100% Gratis · Direct PDF · A4 & US Letter',
    },
    sections: {
      comingUp: 'Binnenkort',
      trendingThisWeek: 'Trending Deze Week',
      trendingSub: 'De snelst groeiende kleurplaten van deze week.',
      newColoringPages: 'Nieuwe Kleurplaten',
      newSub: 'Verse kleurplaten klaar om te printen of online te kleuren.',
      top100: 'Top 100 Meest Populair',
      top100Sub: 'Favorieten gekozen door ouders en leerkrachten.',
      browseByTheme: 'Blader op Thema',
      browseByThemeSub: 'Collecties voor elke leeftijd en klas.',
      viewAll: 'Alles bekijken',
      faqTitle: 'Veelgestelde Vragen',
      faqSub: 'Alles over printen op A4/US Letter en online kleuren.',
    },
    time: { weeks: 'wkn', days: 'dgn', today: 'Vandaag', tomorrow: 'Morgen' },
    card: {
      ...EN.card,
      colorOnline: 'Online Kleuren',
      pages: 'pagina’s',
      page: 'pagina',
      views: 'weergaven',
      openPack: 'Open Pakket',
      easy: 'Makkelijk',
      medium: 'Gemiddeld',
      detailed: 'Gedetailleerd',
    },
    categories: {
      animals: 'Dieren',
      dinosaurs: 'Dinosaurussen',
      fantasy: 'Eenhoorns & Fantasie',
      space: 'Ruimte & Wetenschap',
      vehicles: 'Auto’s & Voertuigen',
      holidays: 'Feestdagen',
      mandalas: 'Mandala’s',
      worksheets: 'Werkbladen',
      calendars: 'Kalenders',
      teachers: 'Voor Leraren',
    },
  },
  pl: {
    ...EN,
    nav: {
      top: 'Top 100',
      trending: 'Trendy',
      coloringPages: 'Kolorowanki',
      holidays: 'Święta',
      worksheets: 'Karty pracy',
      calendars: 'Kalendarze',
      forTeachers: 'Dla nauczycieli',
      searchPlaceholder: 'Szukaj dinozaurów, jednorożców, Świąt...',
      printSet: 'Do druku',
    },
    hero: {
      title: 'Darmowe Kolorowanki do Druku PDF i Kolorowania Online',
      subtitle: 'Pobierz czyste pliki PDF w formacie A4 i US Letter jednym kliknięciem lub koloruj od razu w przeglądarce.',
      searchPlaceholder: 'Szukaj kolorowanek, świąt, kart pracy...',
      searchButton: 'Szukaj',
      popularLabel: 'Popularne:',
      freeNote: '100% Za darmo · Natychmiastowy PDF · A4 i US Letter',
    },
    sections: {
      comingUp: 'Nadchodzące',
      trendingThisWeek: 'Trendy w tym tygodniu',
      trendingSub: 'Najszybciej zyskujące popularność zestawy do druku.',
      newColoringPages: 'Nowe Kolorowanki',
      newSub: 'Świeże arkusze gotowe do wydruku lub kolorowania online.',
      top100: 'Top 100 Najpopularniejszych',
      top100Sub: 'Ulubione wzory wybrane przez rodziców i nauczycieli.',
      browseByTheme: 'Przeglądaj według tematu',
      browseByThemeSub: 'Starannie dobrane kolekcje dla każdego wieku.',
      viewAll: 'Zobacz wszystko',
      faqTitle: 'Często Zadawane Pytania',
      faqSub: 'Wszystko o druku A4/US Letter i kolorowaniu online.',
    },
    time: { weeks: 'tyg.', days: 'dni', today: 'Dzisiaj', tomorrow: 'Jutro' },
    card: {
      ...EN.card,
      colorOnline: 'Koloruj Online',
      pages: 'stron',
      page: 'strona',
      views: 'wyświetleń',
      openPack: 'Otwórz zestaw',
      easy: 'Łatwe',
      medium: 'Średnie',
      detailed: 'Szczegółowe',
    },
    categories: {
      animals: 'Zwierzęta',
      dinosaurs: 'Dinozaury',
      fantasy: 'Jednorożce i Fantazja',
      space: 'Kosmos i Nauka',
      vehicles: 'Auta i Pojazdy',
      holidays: 'Święta i Pory Roku',
      mandalas: 'Mandale',
      worksheets: 'Karty Pracy',
      calendars: 'Kalendarze',
      teachers: 'Dla Nauczycieli',
    },
  },
};

export function getText(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.en;
}

export function isValidLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.some((l) => l.code === value);
}
