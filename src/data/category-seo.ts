export interface CategoryFaqItem {
  q: string;
  a: string;
}

export interface CategorySeoContent {
  metaTitle: string;
  metaDescription: string;
  leadIntro: string;
  headerIntroParagraphs: [string, string];
  extendedGuide: string[];
  faqs: CategoryFaqItem[];
}

const CATEGORY_SEO_MAP: Record<string, CategorySeoContent> = {
  dinosaurs: {
    metaTitle: 'Free Printable Dinosaur Coloring Pages – 300 DPI PDFs | ColorWorld',
    metaDescription:
      'Download and print free dinosaur coloring pages in crisp 300 DPI US Letter and A4 PDFs, or color T-Rex, Triceratops, and Stegosaurus sheets online instantly.',
    leadIntro:
      'Explore our free printable dinosaur coloring pages featuring friendly T-Rexes, gentle Triceratops, towering Brachiosaurus, and playful prehistoric scenes designed for toddlers, elementary kids, and dino enthusiasts of every age.',
    headerIntroParagraphs: [
      'Explore our free printable dinosaur coloring pages featuring friendly T-Rexes, gentle Triceratops, armored Stegosaurus, and playful prehistoric scenes crafted for toddlers, elementary kids, and dinosaur lovers of all ages. Parents and teachers will find both thick-outline easy pages for ages 3–6 and richly detailed Jurassic landscapes for older artists.',
      'Every sheet is drawn on a crisp white background at 300 DPI so home inkjet printers and school photocopiers deliver razor-sharp black lines without wasting ink. Download individual sheets, bundle the entire dinosaur pack into one printable PDF booklet in a single click, or paint directly on a tablet or computer with Color Online.',
    ],
    extendedGuide: [
      'To get the sharpest dinosaur coloring sheets from any home inkjet or laser printer, choose US Letter (8.5 × 11 inches) or A4 (210 × 297 mm) above and select "Fit to Printable Area" in your print dialog. Standard 20 lb copy paper works wonderfully for chunky crayons and colored pencils, while heavier 65–80 lb cardstock prevents bleed-through when kids color with washable markers, gel pens, or watercolor pencils.',
      'Coloring prehistoric creatures does more than fill a rainy afternoon—it strengthens pencil grip, hand-eye coordination, color recognition, and early science curiosity. Preschool and elementary teachers frequently pair our easy baby dinosaur sheets with our more detailed Mesozoic habitats to differentiate activities across mixed-age classrooms, dino birthday party tables, and homeschool paleontology units.',
      'Want to prepare an entire week of dinosaur activities in seconds? Use the "Download All Pages as 1 PDF" bundler above to generate a complete cover-paged coloring book, or tap the + button on individual sheets to mix dinosaurs with space rockets, animals, and worksheets inside your custom Print Set. All ColorWorld printables are 100% free for personal, home, and classroom use with zero sign-up required.',
    ],
    faqs: [
      {
        q: 'Are these dinosaur coloring pages free for teachers and classrooms?',
        a: 'Yes. Every dinosaur coloring page on ColorWorld is completely free to download, photocopy, and print for home, homeschool, daycare, and classroom activities.',
      },
      {
        q: 'What paper sizes do the dinosaur PDFs support?',
        a: 'All sheets are formatted for both US Letter (8.5 × 11 inches) and A4 (210 × 297 mm) home and school printers at crisp 300 DPI print resolution.',
      },
      {
        q: 'Can I download every dinosaur sheet together as one PDF booklet?',
        a: 'Yes! Click "Download All Pages as 1 PDF" in the header above to automatically merge all dinosaur sheets—complete with a clean title cover page—into one ready-to-print PDF.',
      },
      {
        q: 'Can kids color the dinosaurs on an iPad or Chromebook without printing?',
        a: 'Yes! Click Color Online on any dinosaur sheet to open our touch-friendly coloring studio with bucket fill, brush tools, undo/redo, and instant image saving.',
      },
    ],
  },
  fantasy: {
    metaTitle: 'Free Printable Unicorn & Fantasy Coloring Pages – 300 DPI PDFs | ColorWorld',
    metaDescription:
      'Print free unicorn, fairy castle, and magic garden coloring pages in 300 DPI US Letter & A4 PDFs or paint online with zero sign-up.',
    leadIntro:
      'Step into an enchanted world with free printable unicorn and fantasy coloring pages, including rainbow unicorns, storybook castles, sparkling stars, and whimsical magic gardens formatted for crisp home printing.',
    headerIntroParagraphs: [
      'Step into an enchanted world with free printable unicorn and fantasy coloring pages featuring rainbow unicorns, fairytale castles, sparkling clouds, and whimsical magic gardens. The collection spans bold, open outlines suited for preschoolers (ages 3–6) alongside storybook scenes with stars and floral borders for elementary kids and relaxing family craft time.',
      'Every fantasy sheet is prepared at 300 DPI with pure white backgrounds for clean, ink-friendly US Letter and A4 printing. Grab the complete collection in one click with our multi-page PDF booklet bundler, save individual favorites to your Print Set, or color digitally right in your browser.',
    ],
    extendedGuide: [
      'For magical results when printing unicorn and castle sheets, set your printer quality to Standard or High and keep scaling at "Fit to Page" so delicate star borders never clip along the edges. Regular printer paper is ideal for crayons and colored pencils, while smooth 28–32 lb presentation paper or white cardstock makes pastel markers, metallic gel pens, and glitter crayons really shine.',
      'Fantasy coloring sheets pair naturally with imaginative storytelling and early literacy practice. Parents and teachers love asking children to name their unicorn, invent a rainbow color key, or write two sentences about the castle kingdom on the back of the page. For unicorn birthday parties, sleepovers, or road trips, click "Download All Pages as 1 PDF" to print a cohesive booklet with a cover page in seconds.',
      'Prefer mess-free digital art on a tablet or laptop? Open any unicorn or castle sheet in Color Online to tap-fill manes, wings, and castle turrets cleanly without crossing the black outlines, then save the finished illustration as an image or print fresh copies anytime.',
    ],
    faqs: [
      {
        q: 'Do unicorn coloring pages include both easy and detailed designs?',
        a: 'Yes. Each sheet displays its difficulty level (Easy, Medium, or Detailed) and suggested age range so you can pick the right complexity in seconds.',
      },
      {
        q: 'Can I download all unicorn and fantasy sheets in a single PDF?',
        a: 'Yes. Click "Download All Pages as 1 PDF" at the top of the page to bundle every sheet in this collection into one printable booklet with a cover page.',
      },
      {
        q: 'What art supplies work best on printed fantasy coloring pages?',
        a: 'Crayons and colored pencils shine on standard printer paper, while glitter gel pens and markers look especially vivid when printed on 28–32 lb paper or cardstock.',
      },
      {
        q: 'Are these fantasy coloring sheets free for birthday parties and classrooms?',
        a: 'Yes! Print as many copies as you need for personal, party, homeschool, and classroom use with zero account registration or watermarks.',
      },
    ],
  },
  holidays: {
    metaTitle: 'Free Printable Holiday Coloring Pages – Christmas, Thanksgiving & More | ColorWorld',
    metaDescription:
      'Celebrate every season with free printable holiday coloring pages for Thanksgiving, Christmas, Easter, Halloween, Diwali, and New Year in 300 DPI PDF.',
    leadIntro:
      'Celebrate every season with free printable holiday coloring pages—from Thanksgiving turkeys and cozy Christmas scenes to spring Easter eggs, Halloween pumpkins, and festive family celebrations ready in 300 DPI PDF.',
    headerIntroParagraphs: [
      'Celebrate every season with free printable holiday coloring pages—from cheerful Thanksgiving turkeys and cozy Christmas trees to spring Easter baskets, Halloween pumpkins, and festive family traditions. Parents, grandparents, and teachers will find age-friendly sheets ranging from bold toddler outlines to lively seasonal scenes for elementary classrooms.',
      'All holiday printables export cleanly at 300 DPI for both US Letter and A4 paper so you can print one sheet for the kids’ table or download the entire seasonal pack as a single combined PDF booklet in seconds with zero sign-up required.',
    ],
    extendedGuide: [
      'Holiday crafting is easiest when every sheet prints crisp and ink-friendly on the first try. Select US Letter or A4 in the header above, keep your printer on "Fit to Printable Area," and print on 20 lb copy paper for quick classroom photocopies or 65–80 lb cardstock if children will cut out their finished turkeys, ornaments, or Easter eggs to turn into table placemats and greeting cards.',
      'Busy parents and teachers can assemble a custom holiday activity packet in under a minute: use "Download All Pages as 1 PDF" to build a complete cover-paged booklet for Thanksgiving dinner, winter break travel binders, or school holiday parties, or use the + buttons to mix holiday sheets with puzzles and worksheets inside your Print Set.',
      'Looking for screen-based holiday fun on an iPad or Chromebook? Tap Color Online on any seasonal sheet to experiment with festive palettes, save digital holiday artwork to share with family, or print fresh blank copies whenever you need extras.',
    ],
    faqs: [
      {
        q: 'Can I print these holiday coloring pages for a classroom party?',
        a: 'Absolutely. All ColorWorld seasonal sheets are free for personal, family, community, and classroom printing with no watermark and no sign-up required.',
      },
      {
        q: 'How do I print an entire holiday pack at once?',
        a: 'Click "Download All Pages as 1 PDF" in the category header to bundle every sheet into one multi-page booklet, or click "+ Add All" on a sub-category to mix sheets in your Print Set.',
      },
      {
        q: 'Do the holiday sheets work on both US Letter and A4 printers?',
        a: 'Yes. Switch between US Letter and A4 right in the header or top navigation bar and every PDF automatically matches your printer paper size.',
      },
      {
        q: 'Can finished holiday coloring sheets be turned into cards or crafts?',
        a: 'Yes! Printing at 50% scale (2 pages per sheet) on cardstock turns any ColorWorld holiday printable into a fold-over greeting card or party favor.',
      },
    ],
  },
  animals: {
    metaTitle: 'Free Printable Animal Coloring Pages – Ocean, Pets & Wildlife PDFs | ColorWorld',
    metaDescription:
      'Download free printable animal coloring pages including adorable cats, ocean sea creatures, and woodland wildlife in crisp 300 DPI US Letter & A4 PDF.',
    leadIntro:
      'Discover free printable animal coloring pages featuring playful kittens, friendly ocean whales, woodland creatures, and wildlife habitats designed for effortless home printing and interactive online coloring.',
    headerIntroParagraphs: [
      'Discover free printable animal coloring pages featuring adorable kittens, friendly ocean whales, sea turtles, and charming woodland creatures tailored for toddlers, kids, and animal lovers. Each illustration uses clear, closed black lines suited for ages 3–10, making it simple to pick easy pet drawings or richer ocean habitats.',
      'Every animal sheet downloads in crisp 300 DPI resolution formatted for US Letter and A4 printers with zero background tint. Print one favorite immediately, merge the entire animal category into a single PDF coloring book in one click, or paint online right in your browser.',
    ],
    extendedGuide: [
      'To print crisp animal coloring sheets at home or school, choose your local paper size (US Letter or A4) and select "Fit to Printable Area" before printing. Ordinary copy paper works great for crayons and colored pencils, while heavier cardstock holds up cleanly for watercolors, brush pens, and cut-and-paste animal puppet crafts.',
      'Animal coloring pages support vocabulary growth, habitat lessons, and fine-motor practice from preschool through elementary science units. Teachers often combine ocean sea life and woodland wildlife sheets into themed unit folders, while parents download the full category PDF pack for road trips, waiting rooms, and quiet weekend afternoons.',
      'Children can also click Color Online on any animal page to test realistic fur and ocean palettes—or create rainbow kittens and neon whales—using touch-friendly bucket fill, brush strokes, and zoom on phones, tablets, or desktops.',
    ],
    faqs: [
      {
        q: 'What types of animals are included in this collection?',
        a: 'You will find ocean creatures, adorable pets and cats, and woodland wildlife, with new high-contrast printable sheets added regularly.',
      },
      {
        q: 'Are the animal sheets suitable for toddlers and preschoolers?',
        a: 'Yes. Use the Easy filter tab above to browse bold, thick-outline animal drawings crafted specifically for ages 3–6.',
      },
      {
        q: 'Can I download all animal coloring pages as a single PDF book?',
        a: 'Yes! Click "Download All Pages as 1 PDF" in the header above to automatically combine every sheet into one printable booklet with a cover page.',
      },
      {
        q: 'Can kids color the animals online without a printer?',
        a: 'Yes. Tap Color Online on any sheet to paint directly in your browser and save the finished artwork as an image.',
      },
    ],
  },
  space: {
    metaTitle: 'Free Printable Space Coloring Pages – Rockets, Astronauts & Planets | ColorWorld',
    metaDescription:
      'Launch into creativity with free printable outer space coloring pages featuring rockets, astronauts, and solar system planets in 300 DPI PDF.',
    leadIntro:
      'Blast off with free printable outer space coloring pages showcasing rockets, smiling astronauts, ringed planets, and starry galaxies—all formatted for sharp 300 DPI US Letter and A4 printing.',
    headerIntroParagraphs: [
      'Blast off into creativity with free printable outer space coloring pages showcasing roaring rockets, smiling astronauts, Saturn’s rings, and starry solar system scenes. Crafted for curious kids ages 4–12, parents, and STEM educators, the collection blends bold early-learner rockets with detailed cosmic explorations.',
      'Every space sheet prints at crisp 300 DPI on US Letter and A4 paper using clean black outlines on pure white backgrounds. Download individual sheets, bundle the entire space pack into one printable PDF booklet with one click, or color planets digitally in Color Online.',
    ],
    extendedGuide: [
      'For bold, clean space printables, choose US Letter or A4 in the header and print with "Fit to Page" enabled in black-and-white standard mode. Dark metallic markers, yellow and orange crayons for rocket flames, and white or silver gel pens look fantastic when sheets are printed on slightly heavier 28–32 lb paper or light cardstock.',
      'Elementary teachers and homeschool families love pairing our astronaut, rocket, and planet coloring sheets with solar system research units, STEM week displays, and space-themed reading logs. Click "Download All Pages as 1 PDF" to build a ready-to-staple Space Explorer activity book for birthday parties, long flights, or classroom science centers.',
      'Kids can also tap Color Online on any sheet to experiment with glowing neon galaxies or classic NASA spacesuit colors right on a Chromebook, iPad, or desktop screen with zero downloads or sign-ups.',
    ],
    faqs: [
      {
        q: 'Are these space coloring pages useful for STEM classroom lessons?',
        a: 'Yes. Teachers regularly pair our astronaut, rocket, and planet printables with solar system units and classroom bulletin boards.',
      },
      {
        q: 'Can I bundle all space sheets into one printable PDF?',
        a: 'Yes! Click "Download All Pages as 1 PDF" above to merge every sheet in the space collection—plus a cover page—into one downloadable PDF.',
      },
      {
        q: 'Do I need special software to open the space PDFs?',
        a: 'No. Every PDF opens immediately in any browser, phone, tablet, or standard PDF viewer ready for one-click printing.',
      },
      {
        q: 'Are both US Letter and A4 paper sizes supported?',
        a: 'Yes. Toggle between US Letter and A4 in the header and every individual sheet or bundled booklet adapts cleanly to your paper tray.',
      },
    ],
  },
  vehicles: {
    metaTitle: 'Free Printable Vehicle Coloring Pages – Race Cars, Fire Trucks & More | ColorWorld',
    metaDescription:
      'Print free vehicle coloring pages including fast race cars, rescue fire trucks, and big wheels in high-resolution 300 DPI US Letter & A4 PDF.',
    leadIntro:
      'Rev up creative playtime with free printable vehicle coloring pages featuring speedy race cars, heroic rescue fire trucks, and bold wheels designed for crisp 300 DPI home and classroom printing.',
    headerIntroParagraphs: [
      'Rev up creative playtime with free printable vehicle coloring pages featuring speedy race cars, heroic rescue fire trucks, big tires, and action-packed transportation scenes. Tailored for young builders and car fans ages 3–10, every illustration offers clean structural shapes that are fun for both preschoolers and elementary kids.',
      'Each vehicle sheet prints sharply at 300 DPI in US Letter and A4 formats with ink-saving black outlines. Download a single truck or car sheet, click once to merge all vehicle pages into one printable coloring book PDF, or design custom paint jobs in Color Online.',
    ],
    extendedGuide: [
      'Print vehicle coloring sheets cleanly at home by selecting US Letter or A4 and setting your printer to "Fit to Printable Area." Standard 20 lb copy paper is perfect for everyday crayon and colored-pencil sessions, while 65 lb cardstock holds up nicely if kids want to cut out their race cars and trucks for playroom tracks or bedroom wall art.',
      'Transportation themes are beloved in preschool and kindergarten classrooms for community-helper units, counting wheels, and color-sorting games. Parents can also hit "Download All Pages as 1 PDF" to pack a stapled car-and-truck coloring booklet into a travel backpack before road trips or restaurant outings.',
      'Want to test bold racing stripes or neon fire-engine liveries before printing? Open any vehicle sheet in Color Online to tap-fill wheels, doors, ladders, and spoilers right on a tablet or laptop.',
    ],
    faqs: [
      {
        q: 'What age range are the car and truck coloring pages made for?',
        a: 'Most vehicle pages are designed for ages 3–10, combining bold outlines for toddlers with exciting race-car and rescue details for older kids.',
      },
      {
        q: 'Can I download all vehicle sheets together as one PDF?',
        a: 'Yes. Use the "Download All Pages as 1 PDF" button in the header to create a single multi-page PDF booklet automatically.',
      },
      {
        q: 'Are these vehicle sheets free to photocopy for daycare or birthday parties?',
        a: 'Yes! You may print as many copies as you need for home, birthday party tables, daycare centers, and classrooms.',
      },
      {
        q: 'Do the PDFs print cleanly in black and white?',
        a: 'Yes. Every vehicle coloring sheet features crisp high-contrast black line art on a pure white background.',
      },
    ],
  },
  mandalas: {
    metaTitle: 'Free Printable Mandala Coloring Pages – Botanical & Geometric PDFs | ColorWorld',
    metaDescription:
      'Unwind with free printable mandala coloring pages featuring symmetrical floral, botanical, and geometric patterns in 300 DPI US Letter & A4 PDF.',
    leadIntro:
      'Find calm and creative focus with free printable mandala coloring pages featuring intricate botanical petals, symmetrical geometric rings, and soothing patterns crafted for older kids, teens, and adults.',
    headerIntroParagraphs: [
      'Find calm and creative focus with free printable mandala coloring pages featuring symmetrical botanical petals, floral medallions, and intricate geometric patterns. Thoughtfully balanced for older kids (ages 8+), teens, and adults, these pages invite mindful relaxation and color-harmony exploration.',
      'Each mandala is formatted at true 300 DPI so fine concentric petals and delicate line work print razor-sharp on US Letter and A4 paper. Download individual designs, bundle the entire mandala gallery into a single PDF mindfulness book, or test palettes online with tap-to-fill and zoom.',
    ],
    extendedGuide: [
      'Because mandalas feature fine geometric line work, print quality makes a big difference: choose US Letter or A4 above, enable "High Quality" or "Best" black-and-white printing, and select "Fit to Printable Area." Smooth 28–32 lb presentation paper or bright white cardstock prevents fine-liner markers (0.4 mm–0.8 mm) and gel pens from feathering or bleeding through.',
      'Mindful mandala coloring is an effortless screen-free ritual for evening wind-down, art-therapy sessions, and quiet classroom transitions. Try selecting a limited 3- or 4-color palette—such as warm sunset hues, cool coastal blues, or botanical greens—to make symmetrical patterns pop cleanly across every ring.',
      'Click "Download All Pages as 1 PDF" above to build a multi-page relaxation binder in one click, or open any mandala in Color Online and use pinch-to-zoom to preview color combinations before putting ink to paper.',
    ],
    faqs: [
      {
        q: 'Are these mandala coloring pages suitable for adults and teens?',
        a: 'Yes. Our botanical and geometric mandalas feature crisp symmetry and refined details crafted specifically for older kids, teens, and adult mindfulness.',
      },
      {
        q: 'What pens or pencils work best on printed mandalas?',
        a: 'Fine-tip markers (0.4 mm–0.8 mm), gel pens, and sharpened colored pencils offer the best precision inside delicate mandala petals.',
      },
      {
        q: 'Can I download all mandala sheets in one combined PDF booklet?',
        a: 'Yes! Click "Download All Pages as 1 PDF" in the category header to generate a printable multi-page mandala booklet complete with a cover page.',
      },
      {
        q: 'Can I zoom in while coloring mandalas online?',
        a: 'Yes. Color Online includes zoom controls on desktop and pinch-to-zoom on touch devices for effortless detail filling.',
      },
    ],
  },
  worksheets: {
    metaTitle: 'Free Printable Worksheets – Line Tracing, Alphabet & Matching PDFs | ColorWorld',
    metaDescription:
      'Download free preschool and kindergarten printable worksheets for line tracing, alphabet practice, letter mapping, and word tracking in 300 DPI PDF.',
    leadIntro:
      'Support early learning at home and in the classroom with free printable worksheets covering line tracing, alphabet letter practice, matching activities, and word tracking—ready to print or complete interactively online.',
    headerIntroParagraphs: [
      'Support early literacy and fine-motor confidence with free printable worksheets covering line tracing, alphabet practice, visual matching, and word tracking. Designed for preschool, pre-K, kindergarten, and early elementary learners (ages 4–8), every sheet uses roomy spacing and clean, kid-friendly visuals.',
      'Print single practice sheets at crisp 300 DPI on US Letter or A4 paper, merge the complete worksheet collection into one ready-to-staple homework packet in a single click, or let students trace and match answers digitally in Color Online.',
    ],
    extendedGuide: [
      'For crisp classroom photocopies and home practice folders, choose US Letter or A4 above and print at 100% or "Fit to Printable Area" in standard black-and-white mode. Slipping printed tracing and alphabet sheets inside clear dry-erase sleeves lets young learners practice letters and lines repeatedly with wipe-off markers while saving paper.',
      'Beyond paper printing, every ColorWorld worksheet works inside our interactive Color Online studio, complete with dedicated learning tools—straight tracing lines, mapping arrows, circle-the-answer loops, and translucent word-tracking highlighters in solid, dashed, or dotted strokes. Students on school Chromebooks or home tablets can complete matching and tracing exercises interactively.',
      'Click "Download All Pages as 1 PDF" to export a complete morning-work booklet with a cover page, or click "+ Add All" on any sub-category to combine worksheets with reward coloring pages inside your Print Set.',
    ],
    faqs: [
      {
        q: 'Can students trace lines and match answers digitally on a tablet?',
        a: 'Yes! Open any worksheet in Color Online and use the Line, Mapping Arrow, Circle, and Word-Track Highlighter tools right on screen.',
      },
      {
        q: 'What ages and grades are these worksheets designed for?',
        a: 'Our line-tracing, alphabet, and matching sheets are crafted primarily for preschool, kindergarten, and 1st-grade learners (ages 4–8).',
      },
      {
        q: 'Can teachers photocopy or bundle these worksheets into homework packets?',
        a: 'Yes. Free printing, photocopying, and PDF bundling for home, homeschool, and classroom teaching is expressly permitted with zero sign-up.',
      },
      {
        q: 'How do I download every worksheet together as one PDF?',
        a: 'Click "Download All Pages as 1 PDF" in the header above to automatically combine all worksheets into a single printable booklet.',
      },
    ],
  },
  calendars: {
    metaTitle: 'Free Printable Coloring Calendars – Monthly Planners & Charts PDFs | ColorWorld',
    metaDescription:
      'Download free printable coloring calendars and monthly planners in 300 DPI US Letter and A4 PDFs for kids, families, and classrooms.',
    leadIntro:
      'Stay organized creatively with free printable coloring calendars and monthly goal charts featuring decorative borders kids and families can personalize at 300 DPI in US Letter or A4 format.',
    headerIntroParagraphs: [
      'Stay organized creatively with free printable coloring calendars and monthly planning sheets surrounded by cheerful seasonal line art. Great for kids learning days of the week, family fridge schedules, and classroom weather or reading trackers, every layout leaves generous blank boxes for notes and stickers.',
      'All calendar sheets export at crisp 300 DPI for both US Letter and A4 paper. Print individual pages, download the full calendar set as one combined PDF booklet in one click, or color the decorative borders online before printing.',
    ],
    extendedGuide: [
      'To keep calendar date boxes aligned and spacious, select US Letter or A4 above and print with "Fit to Printable Area" turned on. Standard copy paper slides neatly into 3-ring student binders, while 65–80 lb bright white cardstock gives wall and refrigerator calendars extra durability for stickers, magnets, and daily checkmarks.',
      'Color-your-own calendars give children ownership over routines—whether tracking bedtime reading streaks, counting down to birthdays, or logging classroom weather patterns. Teachers can also add seasonal coloring sheets to their Print Set alongside calendar pages to send home an engaging monthly family packet.',
      'Use "Download All Pages as 1 PDF" in the header to export every calendar template in one click, or open any sheet in Color Online to customize headings and borders digitally.',
    ],
    faqs: [
      {
        q: 'What paper works best for printable coloring calendars?',
        a: 'Regular copy paper works great for student folders and binders, while 65–80 lb cardstock is ideal for hanging calendars on walls or fridges.',
      },
      {
        q: 'Are both A4 and US Letter calendar layouts supported?',
        a: 'Yes. Toggle between US Letter and A4 in the header to download properly proportioned 300 DPI PDFs for your printer.',
      },
      {
        q: 'Can I download all calendar pages in one combined PDF?',
        a: 'Yes! Click "Download All Pages as 1 PDF" above to merge every sheet in this collection into one printable PDF booklet.',
      },
    ],
  },
  teachers: {
    metaTitle: 'Free Printable Coloring Pages for Teachers – Classroom Packs & Awards | ColorWorld',
    metaDescription:
      'Free classroom-ready printable coloring pages, student award certificates, and no-prep activity packs in crisp 300 DPI US Letter & A4 PDF.',
    leadIntro:
      'Save prep time with free printable classroom coloring pages, student award certificates, and no-prep activity sheets formatted for clean 300 DPI photocopying in US Letter and A4.',
    headerIntroParagraphs: [
      'Save valuable prep time with free printable classroom coloring pages, student award certificates, and no-prep activity sheets built specifically for teachers, librarians, and homeschool educators. Every sheet features crisp, high-contrast black line art that photocopies cleanly for an entire class.',
      'There are never login walls, paywalls, or watermarks—choose US Letter or A4 above, click "Download All Pages as 1 PDF" to print an instant substitute-teacher or fast-finisher packet, or add favorite sheets into a custom Print Set.',
    ],
    extendedGuide: [
      'Every educator printable on ColorWorld is engineered for fast, economical school photocopying at 300 DPI on US Letter and A4 trays. For student award certificates and Friday celebration ribbons, printing on 65–80 lb white or pastel cardstock creates keepsakes students love taking home to share with families.',
      'Teachers use this collection to stock indoor-recess bins, substitute teacher folders, morning-work stations, and quiet early-finisher binders. Pair award certificates with seasonal holiday coloring pages or tracing worksheets by clicking "+ Add Entire Category to Print Set" and mixing pages from any theme on ColorWorld.',
      'Schools using Chromebooks or shared iPads can also open any sheet in Color Online for zero-paper digital art stations with no student account creation required.',
    ],
    faqs: [
      {
        q: 'Do teachers need an account to download classroom packs?',
        a: 'No. Every classroom coloring sheet, award template, and full-category PDF pack downloads in one click with zero sign-up.',
      },
      {
        q: 'Are these PDFs safe to photocopy for a full class or grade level?',
        a: 'Yes. Our clean 300 DPI black-line layouts are built for school copiers, and free classroom distribution is expressly permitted.',
      },
      {
        q: 'Can I merge an entire teacher pack into one PDF for a sub folder?',
        a: 'Yes! Click "Download All Pages as 1 PDF" in the header above to generate a complete cover-paged PDF booklet ready to print.',
      },
    ],
  },
};

export function getCategorySeoContent(
  categoryId: string,
  categoryLabel: string,
  sheetCount: number,
  subcategoryLabel?: string
): CategorySeoContent {
  const existing = CATEGORY_SEO_MAP[categoryId];
  const cleanLabel = categoryLabel || categoryId;
  const lower = cleanLabel.toLowerCase();

  if (existing && !subcategoryLabel) {
    return existing;
  }

  if (existing && subcategoryLabel) {
    const subLower = subcategoryLabel.toLowerCase();
    return {
      ...existing,
      metaTitle: `Free Printable ${subcategoryLabel} (${cleanLabel}) Coloring Pages | ColorWorld`,
      metaDescription: `Download and print ${sheetCount > 0 ? `${sheetCount} ` : ''}free ${subLower} ${lower} coloring pages in 300 DPI US Letter & A4 PDF, or color online instantly on ColorWorld.`,
      leadIntro: `Explore free printable ${subLower} coloring pages from our ${lower} collection—ready in crisp 300 DPI US Letter and A4 PDF formats or interactive online coloring.`,
      headerIntroParagraphs: [
        `Browse our curated ${subLower} coloring pages inside the ${cleanLabel} collection, thoughtfully drawn with clean black outlines suited for toddlers, elementary kids, parents, and teachers. Every sheet lists its difficulty level and age recommendation so you can find the perfect match quickly.`,
        `All ${subLower} sheets print sharply at 300 DPI on both US Letter and A4 paper with zero sign-up required. Download individual pages, merge all ${sheetCount} ${subLower} sheets into one printable PDF booklet in a single click, or color directly in your browser with Color Online.`,
      ],
    };
  }

  const scopeTitle = subcategoryLabel ? `${subcategoryLabel} ${cleanLabel}` : cleanLabel;
  const scopeLower = scopeTitle.toLowerCase();

  return {
    metaTitle: `Free Printable ${scopeTitle} Coloring Pages – 300 DPI PDFs | ColorWorld`,
    metaDescription: `Download and print ${sheetCount > 0 ? `${sheetCount} ` : ''}free ${scopeLower} coloring pages in crisp 300 DPI US Letter & A4 PDFs, or color online instantly on ColorWorld.`,
    leadIntro: `Browse our curated collection of free printable ${scopeLower} coloring pages, prepared with crisp 300 DPI black outlines ready for US Letter and A4 home printing or instant online coloring.`,
    headerIntroParagraphs: [
      `Explore our curated collection of free printable ${scopeLower} coloring pages designed for kids, parents, and teachers. Every sheet features clean, high-contrast black outlines on a crisp white background, with difficulty ratings and age ranges to help you pick designs suited for toddlers, elementary kids, or older artists.`,
      `Download individual sheets in 300 DPI US Letter or A4 PDF format, click once to bundle all ${sheetCount > 0 ? `${sheetCount} ` : ''}${scopeLower} pages into a single multi-page PDF coloring book, or launch Color Online to paint directly on any phone, tablet, or laptop with zero sign-up.`,
    ],
    extendedGuide: [
      `For sharp, ink-friendly ${scopeLower} printables at home or school, choose US Letter (8.5 × 11 inches) or A4 (210 × 297 mm) above and keep your printer set to "Fit to Printable Area." Standard 20 lb copy paper is ideal for crayons and colored pencils, while 65–80 lb white cardstock prevents bleed-through when coloring with washable markers or gel pens.`,
      `Whether you are planning a themed craft afternoon, assembling a travel activity binder, or preparing classroom enrichment centers, click "Download All Pages as 1 PDF" to build a ready-to-print booklet complete with a cover page. You can also use the + buttons to mix ${scopeLower} sheets with any other theme inside your custom Print Set.`,
      `Prefer mess-free digital coloring on an iPad, Chromebook, or desktop? Tap Color Online on any ${scopeLower} sheet to paint inside the lines with bucket fill, brush tools, zoom, and instant image export—always 100% free for personal, home, and classroom use.`,
    ],
    faqs: [
      {
        q: `Are these ${scopeLower} coloring pages free to download and print?`,
        a: `Yes. Every ${scopeLower} coloring sheet on ColorWorld is 100% free for personal, home, and classroom printing with no sign-up required.`,
      },
      {
        q: 'What print quality and paper sizes are included?',
        a: 'All coloring pages are optimized for crisp 300 DPI printing on both US Letter (8.5 × 11 in) and international A4 (210 × 297 mm) paper.',
      },
      {
        q: `Can I download all ${scopeLower} pages together as one PDF?`,
        a: 'Yes! Click "Download All Pages as 1 PDF" in the header above to automatically combine all sheets in this view—with a clean cover page—into one downloadable PDF.',
      },
      {
        q: `Can I color these ${scopeLower} pages online without a printer?`,
        a: 'Yes! Click Color Online on any card to paint directly in your browser on desktop, tablet, or smartphone.',
      },
    ],
  };
}
