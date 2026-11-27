/**
 * High-contrast, closed-region black-and-white SVG coloring sheets (800x1000).
 * Every shape is cleanly closed with crisp #111111 outlines and #FFFFFF fills
 * so both HTML5 Canvas scanline flood-fill and vector PDF export render flawlessly.
 */

export interface LineArtDefinition {
  id: string;
  viewBox: string;
  svgInner: string;
}

const STROKE = '#111111';

export const LINE_ART_LIBRARY: Record<string, LineArtDefinition> = {
  'dino-trex': {
    id: 'dino-trex',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Sun & rays -->
      <circle cx="150" cy="145" r="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="150,62 162,84 138,84" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="150,228 162,206 138,206" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="67,145 89,133 89,157" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="233,145 211,133 211,157" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="92,88 112,98 100,112" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="208,202 188,192 200,178" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="208,88 200,112 188,98" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="92,202 100,178 112,192" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Clouds -->
      <path d="M470,150 C450,150 440,130 455,115 C460,92 495,88 515,102 C535,84 575,92 582,115 C602,118 606,150 582,150 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M625,235 C610,235 602,220 612,208 C618,192 645,190 658,200 C672,188 702,196 706,212 C720,214 722,235 704,235 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Background Volcano & Hills -->
      <path d="M24,780 Q210,660 400,745 Q600,660 776,770 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M510,720 L585,430 L645,430 L725,735 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M578,455 Q600,480 615,458 Q630,482 652,455 L645,430 L585,430 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Volcano Puff -->
      <path d="M585,410 C560,390 572,352 602,355 C615,325 658,330 662,360 C686,368 680,404 652,408 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Palm / Fern Bush Left -->
      <ellipse cx="115" cy="795" rx="58" ry="38" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="165" cy="820" rx="52" ry="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Friendly T-Rex Tail & Body -->
      <path d="M165,610 C120,640 85,685 75,718 C135,730 215,720 280,692 C330,725 430,715 470,650 C505,592 500,485 455,440 C410,395 335,415 315,470 C295,525 255,565 165,610 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Belly Patch -->
      <path d="M352,475 C418,475 462,535 456,612 C448,668 395,695 340,688 C365,642 368,530 352,475 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Belly Stripes -->
      <path d="M362,530 Q410,535 452,526" fill="none" stroke="${STROKE}" stroke-width="5"/>
      <path d="M364,580 Q412,585 456,576" fill="none" stroke="${STROKE}" stroke-width="5"/>
      <path d="M358,632 Q404,638 446,626" fill="none" stroke="${STROKE}" stroke-width="5"/>
      <!-- Back Spikes -->
      <polygon points="315,475 280,440 330,432" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="282,530 245,505 298,492" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="240,572 206,550 258,542" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="188,602 158,582 208,580" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- T-Rex Head -->
      <path d="M335,442 C315,375 340,285 435,275 C515,265 588,300 588,358 C588,395 545,412 490,415 L490,430 C520,438 545,450 538,475 C530,502 475,505 430,488 C390,474 352,472 335,442 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Smile & Teeth -->
      <polygon points="485,415 498,434 510,414" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <polygon points="518,412 530,431 542,408" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <polygon points="548,406 558,422 568,400" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Eye & Nostril -->
      <circle cx="435" cy="342" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="442" cy="342" r="10" fill="${STROKE}"/>
      <circle cx="545" cy="332" r="7" fill="${STROKE}"/>
      <!-- Spot on Cheek -->
      <circle cx="385" cy="390" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="290" cy="605" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="240" cy="645" r="15" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Little Arms -->
      <path d="M460,520 C495,512 528,522 530,542 C532,556 502,558 465,552 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Strong Legs -->
      <path d="M265,685 C245,745 255,830 265,868 L225,868 C205,868 205,905 235,905 L335,905 C355,905 352,870 335,868 L328,708 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <path d="M375,695 C370,750 385,830 398,868 L365,868 C345,868 345,905 375,905 L475,905 C495,905 492,870 472,868 L450,675 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Eggs in Nest -->
      <ellipse cx="645" cy="860" rx="34" ry="44" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="705" cy="868" rx="30" ry="38" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M595,882 Q675,925 752,882 L742,922 Q675,952 605,922 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
    `,
  },

  'dino-stego': {
    id: 'dino-stego',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Rainbow Arches -->
      <path d="M90,460 A310,310 0 0,1 710,460 L660,460 A260,260 0 0,0 140,460 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M140,460 A260,260 0 0,1 660,460 L610,460 A210,210 0 0,0 190,460 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M190,460 A210,210 0 0,1 610,460 L560,460 A160,160 0 0,0 240,460 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Clouds at Rainbow Ends -->
      <path d="M75,495 C52,495 45,465 65,452 C72,425 110,420 130,438 C152,418 195,428 202,455 C224,462 222,495 198,495 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M585,495 C562,495 556,465 576,452 C584,425 622,420 642,438 C664,418 708,428 714,455 C736,462 734,495 710,495 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Meadow Ground -->
      <path d="M24,785 Q240,730 430,775 Q620,730 776,780 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Back Plates -->
      <polygon points="275,555 295,465 340,515" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="342,515 395,435 438,500" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="438,500 505,440 532,520" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="532,525 595,480 605,565" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Tail Spikes -->
      <polygon points="650,655 715,610 680,675" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="675,680 742,665 692,705" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Stegosaurus Body -->
      <path d="M210,635 C225,535 330,495 435,498 C535,500 600,562 630,635 C655,665 690,680 712,695 C650,715 592,718 555,700 C460,725 320,725 235,690 C212,678 202,658 210,635 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Head -->
      <path d="M220,630 C180,618 118,622 98,660 C84,688 106,725 160,722 C196,720 220,702 238,685 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <circle cx="148" cy="662" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="145" cy="662" r="6" fill="${STROKE}"/>
      <path d="M108,694 Q140,710 172,695" fill="none" stroke="${STROKE}" stroke-width="5"/>
      <!-- Decorative Spots -->
      <circle cx="345" cy="590" r="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="445" cy="575" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="530" cy="605" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- 4 Legs -->
      <rect x="255" y="688" width="64" height="162" rx="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="338" y="702" width="58" height="142" rx="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="468" y="692" width="66" height="158" rx="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="546" y="698" width="56" height="145" rx="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Flowers on Ground -->
      <circle cx="135" cy="885" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="135" cy="852" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="135" cy="918" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="102" cy="885" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="168" cy="885" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="675" cy="885" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="675" cy="852" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="675" cy="918" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="642" cy="885" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="708" cy="885" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
    `,
  },

  'unicorn-castle': {
    id: 'unicorn-castle',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Stars -->
      <polygon points="120,105 133,135 165,138 140,158 148,190 120,172 92,190 100,158 75,138 107,135" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="675,115 688,145 720,148 695,168 703,200 675,182 647,200 655,168 630,148 662,145" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="240,190 248,210 270,212 253,225 258,246 240,235 222,246 227,225 210,212 232,210" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Rainbow Behind Castle -->
      <path d="M80,530 A320,320 0 0,1 720,530 L678,530 A278,278 0 0,0 122,530 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M122,530 A278,278 0 0,1 678,530 L636,530 A236,236 0 0,0 164,530 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Fairytale Castle -->
      <rect x="280" y="340" width="240" height="230" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="220" y="290" width="75" height="280" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="505" y="290" width="75" height="280" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="355" y="210" width="90" height="130" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Castle Roofs -->
      <polygon points="205,290 257,185 310,290" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="490,290 542,185 595,290" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="340,210 400,100 460,210" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Flags -->
      <polygon points="400,100 400,58 455,75 400,90" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="257,185 257,150 298,164 257,178" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="542,185 542,150 584,164 542,178" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Castle Arch Door & Windows -->
      <path d="M360,570 L360,475 A40,40 0 0,1 440,475 L440,570 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M242,390 L242,350 A15,15 0 0,1 272,350 L272,390 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M527,390 L527,350 A15,15 0 0,1 557,350 L557,390 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="400" cy="275" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Hills -->
      <path d="M24,625 Q220,550 400,605 Q590,545 776,625 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Unicorn Tail -->
      <path d="M220,705 C145,690 112,755 135,815 C155,860 120,890 148,900 C188,912 228,855 218,795 C238,765 242,728 220,705 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Unicorn Body -->
      <path d="M225,705 C265,670 395,668 452,692 C482,708 492,762 475,805 C425,832 285,835 228,798 C202,775 202,725 225,705 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Unicorn Wing -->
      <path d="M312,705 C270,630 335,580 395,625 C430,652 428,712 375,738 C345,750 322,732 312,705 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Unicorn Neck & Head -->
      <path d="M428,698 C448,630 468,570 508,552 C552,535 612,562 630,605 C644,638 618,668 572,662 C542,658 518,672 492,735 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Unicorn Horn -->
      <polygon points="540,548 618,448 568,566" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="560" y1="522" x2="584" y2="536" stroke="${STROKE}" stroke-width="4"/>
      <line x1="578" y1="498" x2="598" y2="510" stroke="${STROKE}" stroke-width="4"/>
      <!-- Unicorn Ear & Mane -->
      <polygon points="498,556 508,505 538,546" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M498,556 C452,555 426,605 446,645 C420,660 416,695 448,705 C466,660 480,610 510,582 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Eye & Heart Mark -->
      <circle cx="556" cy="598" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="560" cy="598" r="6" fill="${STROKE}"/>
      <path d="M275,745 C275,732 292,728 296,740 C300,728 317,732 317,745 C317,762 296,776 296,776 C296,776 275,762 275,745 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Legs -->
      <rect x="236" y="792" width="44" height="130" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="294" y="802" width="42" height="118" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="405" y="800" width="44" height="122" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="458" y="788" width="44" height="134" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
    `,
  },

  'unicorn-garden': {
    id: 'unicorn-garden',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Crescent Moon -->
      <path d="M645,105 A78,78 0 1,0 710,222 A60,60 0 1,1 645,105 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Butterflies -->
      <ellipse cx="170" cy="185" rx="34" ry="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="238" cy="185" rx="34" ry="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="178" cy="224" rx="24" ry="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="230" cy="224" rx="24" ry="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="196" y="165" width="16" height="78" rx="8" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Big Enchanted Flowers -->
      <rect x="132" y="595" width="16" height="245" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="102" cy="720" rx="38" ry="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="140" cy="520" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="140" cy="610" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="95" cy="565" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="185" cy="565" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="140" cy="565" r="28" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Flower Right -->
      <rect x="642" y="565" width="16" height="275" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="688" cy="705" rx="38" ry="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="650" cy="490" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="650" cy="580" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="605" cy="535" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="695" cy="535" r="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="650" cy="535" r="28" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Garden Hill -->
      <path d="M24,815 Q400,725 776,815 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Center Portrait Unicorn Bust -->
      <circle cx="400" cy="545" r="195" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M315,720 C320,610 342,500 382,445 C428,395 512,420 538,480 C556,522 528,572 478,568 C450,566 435,615 445,732 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <polygon points="432,422 502,300 470,435" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="382,438 386,372 426,422" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M380,445 C312,455 280,520 310,575 C275,602 275,665 322,682 C345,625 360,525 398,478 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="458" cy="488" r="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="462" cy="488" r="7" fill="${STROKE}"/>
      <!-- Decorative Gem on Collar -->
      <polygon points="400,660 426,690 400,720 374,690" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'space-rocket': {
    id: 'space-rocket',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Saturn Planet Top Left -->
      <circle cx="170" cy="210" r="68" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="170" cy="210" rx="125" ry="28" fill="none" stroke="${STROKE}" stroke-width="6"/>
      <!-- Cratered Moon Top Right -->
      <circle cx="645" cy="185" r="74" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="620" cy="160" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="672" cy="195" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="628" cy="218" r="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Stars -->
      <polygon points="145,515 158,545 190,548 165,568 173,600 145,582 117,600 125,568 100,548 132,545" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="665,525 678,555 710,558 685,578 693,610 665,592 637,610 645,578 620,558 652,555" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="165,815 174,835 196,837 179,851 184,872 165,860 146,872 151,851 134,837 156,835" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="650,795 660,818 685,820 666,836 672,860 650,846 628,860 634,836 615,820 640,818" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Rocket Fins -->
      <path d="M292,515 C220,550 185,635 192,718 L298,668 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <path d="M508,515 C580,550 615,635 608,718 L502,668 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Rocket Thruster & Flames -->
      <polygon points="335,688 465,688 485,738 315,738" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M335,738 C312,815 352,892 400,942 C448,892 488,815 465,738 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M366,738 C355,795 375,845 400,875 C425,845 445,795 434,738 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Rocket Main Hull -->
      <path d="M400,115 C485,205 522,355 512,565 L482,688 L318,688 L288,565 C278,355 315,205 400,115 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Nose Cone Stripe -->
      <path d="M326,270 Q400,295 474,270" fill="none" stroke="${STROKE}" stroke-width="6"/>
      <path d="M294,580 Q400,602 506,580" fill="none" stroke="${STROKE}" stroke-width="6"/>
      <!-- Porthole Window -->
      <circle cx="400" cy="425" r="76" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <circle cx="400" cy="425" r="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Little Center Fin -->
      <rect x="386" y="555" width="28" height="150" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
    `,
  },

  'space-astronaut': {
    id: 'space-astronaut',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- UFO Top Left -->
      <path d="M120,170 A52,48 0 0,1 224,170 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="172" cy="182" rx="95" ry="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="122" cy="182" r="10" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="172" cy="186" r="10" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="222" cy="182" r="10" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Planet Surface -->
      <path d="M24,780 Q400,685 776,780 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="165" cy="875" rx="68" ry="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="640" cy="865" rx="75" ry="28" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Flag -->
      <rect x="572" y="340" width="16" height="420" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M588,350 L725,350 L702,405 L725,460 L588,460 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="648,378 656,396 676,398 661,410 666,430 648,419 630,430 635,410 620,398 640,396" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Backpack -->
      <rect x="242" y="425" width="266" height="210" rx="34" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Astronaut Suit Torso -->
      <rect x="280" y="438" width="190" height="220" rx="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Chest Control Panel -->
      <rect x="320" y="486" width="110" height="78" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="348" cy="516" r="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="384" cy="516" r="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <rect x="338" y="540" width="74" height="12" rx="6" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Belt -->
      <rect x="280" y="608" width="190" height="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Arms -->
      <path d="M280,468 C210,485 168,530 165,582 L212,592 C222,552 248,528 280,520 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <circle cx="185" cy="602" r="28" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M470,468 C525,472 560,445 588,412 L620,442 C584,492 532,522 470,520 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <circle cx="606" cy="422" r="28" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Legs & Boots -->
      <rect x="292" y="655" width="70" height="145" rx="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="388" y="655" width="70" height="145" rx="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="276" y="775" width="96" height="48" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="378" y="775" width="96" height="48" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Helmet -->
      <circle cx="375" cy="315" r="126" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="284" y="246" width="182" height="126" rx="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Smiley Inside Visor -->
      <circle cx="342" cy="300" r="10" fill="${STROKE}"/>
      <circle cx="408" cy="300" r="10" fill="${STROKE}"/>
      <path d="M348,332 Q375,356 402,332" fill="none" stroke="${STROKE}" stroke-width="6"/>
    `,
  },

  'holiday-santa': {
    id: 'holiday-santa',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Snow Ground -->
      <path d="M24,810 Q400,760 776,810 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Pine Tree Right -->
      <rect x="576" y="720" width="52" height="105" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="602,430 470,730 734,730" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="602,320 492,570 712,570" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="602,225 516,425 688,425" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Tree Star -->
      <polygon points="602,135 618,172 658,176 627,202 636,240 602,218 568,240 577,202 546,176 586,172" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Ornaments -->
      <circle cx="572" cy="365" r="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="635" cy="490" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="556" cy="520" r="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="602" cy="645" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="672" cy="672" r="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="530" cy="676" r="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Gift Box -->
      <rect x="442" y="758" width="118" height="106" rx="8" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="489" y="758" width="24" height="106" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="442" y="799" width="118" height="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="482" cy="742" rx="22" ry="15" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="520" cy="742" rx="22" ry="15" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Santa Coat Body -->
      <path d="M128,768 C128,605 178,510 270,510 C362,510 412,605 412,768 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="128" y="650" width="284" height="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="242" y="642" width="56" height="58" rx="8" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="118" y="754" width="304" height="36" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Boots -->
      <rect x="172" y="790" width="76" height="68" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="292" y="790" width="76" height="68" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Santa Face & Beard -->
      <circle cx="270" cy="390" r="88" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <path d="M180,410 C175,495 215,565 270,565 C325,565 365,495 360,410 C330,432 302,438 270,438 C238,438 210,432 180,410 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Nose & Eyes -->
      <circle cx="270" cy="402" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="236" cy="368" r="9" fill="${STROKE}"/>
      <circle cx="304" cy="368" r="9" fill="${STROKE}"/>
      <!-- Santa Hat -->
      <path d="M174,344 C198,220 310,185 388,248 L366,344 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="164" y="318" width="212" height="42" rx="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="404" cy="256" r="28" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
    `,
  },

  'holiday-snowman': {
    id: 'holiday-snowman',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Snowflakes -->
      <circle cx="135" cy="145" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="655" cy="165" r="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="185" cy="340" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="635" cy="380" r="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Snowy Ground -->
      <path d="M24,815 Q400,745 776,815 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Background Pines -->
      <polygon points="135,540 55,785 215,785" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="665,525 585,785 745,785" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Snowman Bottom Ball -->
      <circle cx="400" cy="730" r="145" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Middle Ball -->
      <circle cx="400" cy="520" r="112" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Stick Arms & Mittens -->
      <path d="M292,510 L178,448 L192,424 L302,482 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="172" cy="428" r="28" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M508,510 L622,448 L608,424 L498,482 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="628" cy="428" r="28" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Buttons -->
      <circle cx="400" cy="500" r="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="400" cy="555" r="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="400" cy="665" r="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Head -->
      <circle cx="400" cy="340" r="88" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Scarf -->
      <rect x="310" y="405" width="180" height="44" rx="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M430,445 L485,445 L502,575 L446,575 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="438" y1="490" x2="492" y2="490" stroke="${STROKE}" stroke-width="5"/>
      <line x1="442" y1="534" x2="498" y2="534" stroke="${STROKE}" stroke-width="5"/>
      <!-- Carrot Nose & Eyes -->
      <polygon points="400,336 492,356 400,368" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="366" cy="316" r="10" fill="${STROKE}"/>
      <circle cx="430" cy="316" r="10" fill="${STROKE}"/>
      <!-- Top Hat -->
      <rect x="328" y="135" width="144" height="122" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="328" y="218" width="144" height="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="275" y="246" width="250" height="30" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
    `,
  },

  'holiday-easter-bunny': {
    id: 'holiday-easter-bunny',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Bunny Ears -->
      <ellipse cx="325" cy="210" rx="44" ry="132" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <ellipse cx="325" cy="216" rx="22" ry="92" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="475" cy="210" rx="44" ry="132" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <ellipse cx="475" cy="216" rx="22" ry="92" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Bunny Head -->
      <circle cx="400" cy="385" r="118" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <circle cx="355" cy="365" r="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="355" cy="365" r="7" fill="${STROKE}"/>
      <circle cx="445" cy="365" r="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="445" cy="365" r="7" fill="${STROKE}"/>
      <polygon points="384,395 416,395 400,418" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="322" cy="408" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="478" cy="408" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Bowtie -->
      <polygon points="400,515 335,480 335,550" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="400,515 465,480 465,550" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="400" cy="515" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Patterned Easter Eggs in Basket -->
      <ellipse cx="265" cy="610" rx="52" ry="72" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="216" y1="595" x2="314" y2="595" stroke="${STROKE}" stroke-width="5"/>
      <line x1="216" y1="628" x2="314" y2="628" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="400" cy="595" rx="58" ry="80" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="382" cy="576" r="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="420" cy="586" r="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="400" cy="622" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <ellipse cx="535" cy="610" rx="52" ry="72" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M486,605 L510,582 L535,605 L560,582 L584,605" fill="none" stroke="${STROKE}" stroke-width="5"/>
      <!-- Woven Basket -->
      <path d="M168,645 L632,645 L584,878 C578,906 552,922 522,922 L278,922 C248,922 222,906 216,878 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="150" y="625" width="500" height="46" rx="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <line x1="194" y1="735" x2="606" y2="735" stroke="${STROKE}" stroke-width="5"/>
      <line x1="208" y1="825" x2="592" y2="825" stroke="${STROKE}" stroke-width="5"/>
      <line x1="305" y1="671" x2="322" y2="922" stroke="${STROKE}" stroke-width="5"/>
      <line x1="400" y1="671" x2="400" y2="922" stroke="${STROKE}" stroke-width="5"/>
      <line x1="495" y1="671" x2="478" y2="922" stroke="${STROKE}" stroke-width="5"/>
      <!-- Bunny Paws Holding Rim -->
      <ellipse cx="255" cy="648" rx="34" ry="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="545" cy="648" rx="34" ry="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
    `,
  },

  'holiday-halloween-pumpkin': {
    id: 'holiday-halloween-pumpkin',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Full Moon & Bats -->
      <circle cx="620" cy="175" r="82" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M120,175 Q155,140 185,172 Q215,140 250,175 Q215,195 185,188 Q155,195 120,175 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Friendly Ghost Left -->
      <path d="M98,485 C98,405 142,360 192,360 C242,360 286,405 286,485 L286,605 L252,580 L222,608 L192,580 L162,608 L132,580 L98,605 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="168" cy="442" r="12" fill="${STROKE}"/>
      <circle cx="216" cy="442" r="12" fill="${STROKE}"/>
      <ellipse cx="192" cy="482" rx="16" ry="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Pumpkin Ribs -->
      <ellipse cx="275" cy="695" rx="108" ry="175" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <ellipse cx="545" cy="695" rx="108" ry="175" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <ellipse cx="345" cy="705" rx="115" ry="188" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <ellipse cx="475" cy="705" rx="115" ry="188" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <ellipse cx="410" cy="712" rx="106" ry="195" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Jack-o-Lantern Face -->
      <polygon points="318,655 372,655 345,595" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="448,655 502,655 475,595" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="392,705 428,705 410,672" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M298,748 Q410,835 522,748 L492,772 L470,750 L446,784 L410,762 L374,784 L350,750 L328,772 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Witch Hat on Top -->
      <ellipse cx="410" cy="518" rx="198" ry="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <path d="M295,512 L392,235 L465,305 L525,512 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <path d="M312,462 L508,462 L522,508 L298,508 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="382" y="454" width="56" height="58" rx="8" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Candy Corn Right -->
      <polygon points="690,770 638,895 742,895" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="670" y1="818" x2="710" y2="818" stroke="${STROKE}" stroke-width="5"/>
      <line x1="654" y1="858" x2="726" y2="858" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'vehicle-racecar': {
    id: 'vehicle-racecar',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Checkered Flags -->
      <line x1="255" y1="125" x2="360" y2="295" stroke="${STROKE}" stroke-width="8"/>
      <rect x="135" y="135" width="132" height="86" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="179" y1="135" x2="179" y2="221" stroke="${STROKE}" stroke-width="4"/>
      <line x1="223" y1="135" x2="223" y2="221" stroke="${STROKE}" stroke-width="4"/>
      <line x1="135" y1="178" x2="267" y2="178" stroke="${STROKE}" stroke-width="4"/>
      <line x1="545" y1="125" x2="440" y2="295" stroke="${STROKE}" stroke-width="8"/>
      <rect x="533" y="135" width="132" height="86" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="577" y1="135" x2="577" y2="221" stroke="${STROKE}" stroke-width="4"/>
      <line x1="621" y1="135" x2="621" y2="221" stroke="${STROKE}" stroke-width="4"/>
      <line x1="533" y1="178" x2="665" y2="178" stroke="${STROKE}" stroke-width="4"/>
      <!-- Trophy Badge -->
      <circle cx="400" cy="210" r="56" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="400,172 411,196 438,199 418,216 424,242 400,228 376,242 382,216 362,199 389,196" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Racetrack Road -->
      <path d="M24,740 L776,740 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="92" y="845" width="135" height="28" rx="8" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="332" y="845" width="135" height="28" rx="8" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="572" y="845" width="135" height="28" rx="8" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Rear Spoiler -->
      <polygon points="88,485 168,485 190,565 118,565" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Driver Helmet -->
      <circle cx="372" cy="512" r="58" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <path d="M368,485 L428,485 C432,512 426,528 386,528 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Car Chassis -->
      <path d="M108,568 L295,552 C335,512 442,512 486,558 L698,605 C725,612 732,672 706,695 L108,695 C88,695 82,590 108,568 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Racing Number Circle -->
      <circle cx="408" cy="632" r="44" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Racing Stripe -->
      <polygon points="512,592 678,628 672,658 504,634" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Wheels -->
      <circle cx="222" cy="705" r="78" fill="#FFFFFF" stroke="${STROKE}" stroke-width="8"/>
      <circle cx="222" cy="705" r="44" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="222" cy="705" r="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="592" cy="705" r="78" fill="#FFFFFF" stroke="${STROKE}" stroke-width="8"/>
      <circle cx="592" cy="705" r="44" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="592" cy="705" r="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'vehicle-firetruck': {
    id: 'vehicle-firetruck',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Clouds -->
      <path d="M115,180 C95,180 88,160 102,146 C108,125 142,122 158,136 C178,120 218,128 224,150 C242,154 242,180 220,180 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M525,165 C505,165 498,145 512,131 C518,110 552,107 568,121 C588,105 628,113 634,135 C652,139 652,165 630,165 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Street -->
      <rect x="24" y="780" width="752" height="196" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Siren Light -->
      <rect x="528" y="370" width="58" height="45" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Extension Ladder -->
      <polygon points="102,438 455,270 478,318 125,486" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="175" y1="404" x2="198" y2="452" stroke="${STROKE}" stroke-width="5"/>
      <line x1="245" y1="370" x2="268" y2="418" stroke="${STROKE}" stroke-width="5"/>
      <line x1="315" y1="336" x2="338" y2="384" stroke="${STROKE}" stroke-width="5"/>
      <line x1="385" y1="302" x2="408" y2="350" stroke="${STROKE}" stroke-width="5"/>
      <!-- Truck Rear Body -->
      <rect x="108" y="472" width="352" height="248" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="148" y="512" width="128" height="132" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="302" y="512" width="128" height="132" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Truck Cab -->
      <path d="M460,415 L615,415 C648,415 676,445 685,495 L702,575 L702,720 L460,720 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Cab Window -->
      <path d="M495,455 L605,455 C626,455 644,480 652,555 L495,555 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Stripe & Bumper -->
      <rect x="108" y="662" width="594" height="30" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Wheels -->
      <circle cx="222" cy="730" r="70" fill="#FFFFFF" stroke="${STROKE}" stroke-width="8"/>
      <circle cx="222" cy="730" r="36" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="578" cy="730" r="70" fill="#FFFFFF" stroke="${STROKE}" stroke-width="8"/>
      <circle cx="578" cy="730" r="36" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Fire Hydrant -->
      <rect x="662" y="838" width="54" height="84" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M662,838 A27,26 0 0,1 716,838 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="646" y="858" width="16" height="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="716" y="858" width="16" height="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'ocean-whale': {
    id: 'ocean-whale',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Water Spout Drops -->
      <path d="M365,250 C340,175 268,140 220,175 C262,188 308,215 335,270 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M395,250 C420,175 492,140 540,175 C498,188 452,215 425,270 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Bubbles -->
      <circle cx="155" cy="315" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="640" cy="310" r="30" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="680" cy="395" r="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Whale Tail -->
      <path d="M565,530 C642,498 692,415 660,375 C625,365 595,420 582,472 C628,448 708,452 722,508 C710,552 632,578 565,575 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Whale Body -->
      <path d="M115,492 C115,355 245,285 385,295 C525,305 602,422 595,542 C588,632 482,665 348,665 C195,665 115,602 115,492 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Whale Belly -->
      <path d="M132,555 C235,555 318,572 385,662 C255,668 158,625 132,555 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="176" y1="566" x2="205" y2="632" stroke="${STROKE}" stroke-width="5"/>
      <line x1="232" y1="572" x2="262" y2="652" stroke="${STROKE}" stroke-width="5"/>
      <line x1="292" y1="586" x2="322" y2="660" stroke="${STROKE}" stroke-width="5"/>
      <!-- Fin & Eye -->
      <path d="M352,555 C382,595 435,622 478,608 C456,568 422,535 372,535 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="222" cy="465" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="218" cy="465" r="9" fill="${STROKE}"/>
      <!-- Sea Floor & Coral -->
      <path d="M24,785 Q200,740 400,785 Q600,740 776,785 L776,958 Q776,976 758,976 L42,976 Q24,976 24,958 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Starfish -->
      <polygon points="180,820 198,864 245,868 210,898 220,944 180,918 140,944 150,898 115,868 162,864" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Smiling Little Fish -->
      <ellipse cx="565" cy="872" rx="64" ry="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="626,872 678,832 678,912" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="534" cy="862" r="8" fill="${STROKE}"/>
      <line x1="565" y1="830" x2="565" y2="914" stroke="${STROKE}" stroke-width="5"/>
      <line x1="595" y1="838" x2="595" y2="906" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'animal-cat-yarn': {
    id: 'animal-cat-yarn',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Window Frame Background -->
      <rect x="92" y="88" width="230" height="230" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="207" y1="88" x2="207" y2="318" stroke="${STROKE}" stroke-width="5"/>
      <line x1="92" y1="203" x2="322" y2="203" stroke="${STROKE}" stroke-width="5"/>
      <!-- Floor Line -->
      <rect x="24" y="780" width="752" height="196" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Cat Tail -->
      <path d="M510,730 C618,730 688,650 662,555 C644,492 586,508 602,566 C616,618 575,672 505,675 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Cat Body -->
      <ellipse cx="385" cy="642" rx="145" ry="162" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <ellipse cx="385" cy="665" rx="82" ry="105" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Cat Ears -->
      <polygon points="262,368 250,210 362,292" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <polygon points="274,332 268,248 332,296" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="508,368 520,210 408,292" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <polygon points="496,332 502,248 438,296" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Cat Head -->
      <circle cx="385" cy="395" r="132" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Forehead Stripes -->
      <polygon points="374,264 396,264 385,318" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="336,274 358,268 355,314" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="434,274 412,268 415,314" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Eyes, Nose, Whiskers -->
      <circle cx="332" cy="385" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="336" cy="385" r="10" fill="${STROKE}"/>
      <circle cx="438" cy="385" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="434" cy="385" r="10" fill="${STROKE}"/>
      <polygon points="366,422 404,422 385,445" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <line x1="220" y1="415" x2="296" y2="425" stroke="${STROKE}" stroke-width="5"/>
      <line x1="220" y1="452" x2="296" y2="446" stroke="${STROKE}" stroke-width="5"/>
      <line x1="474" y1="425" x2="550" y2="415" stroke="${STROKE}" stroke-width="5"/>
      <line x1="474" y1="446" x2="550" y2="452" stroke="${STROKE}" stroke-width="5"/>
      <!-- Collar & Bell -->
      <rect x="292" y="502" width="186" height="32" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="385" cy="542" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Paws -->
      <ellipse cx="322" cy="792" rx="46" ry="30" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <ellipse cx="448" cy="792" rx="46" ry="30" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <!-- Yarn Ball -->
      <circle cx="615" cy="838" r="76" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <path d="M552,796 Q615,832 686,812" fill="none" stroke="${STROKE}" stroke-width="5"/>
      <path d="M542,848 Q615,872 688,852" fill="none" stroke="${STROKE}" stroke-width="5"/>
      <path d="M585,766 Q615,835 588,908" fill="none" stroke="${STROKE}" stroke-width="5"/>
      <path d="M635,766 Q662,835 632,908" fill="none" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'mandala-botanical': {
    id: 'mandala-botanical',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Outer Ring -->
      <circle cx="400" cy="500" r="330" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="400" cy="500" r="295" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- 8 Outer Petals -->
      <ellipse cx="400" cy="245" rx="44" ry="82" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="400" cy="755" rx="44" ry="82" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="145" cy="500" rx="82" ry="44" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="655" cy="500" rx="82" ry="44" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="220" cy="320" r="56" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="580" cy="320" r="56" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="220" cy="680" r="56" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="580" cy="680" r="56" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Mid Octagon Star -->
      <polygon points="400,255 462,380 595,380 495,468 532,605 400,528 268,605 305,468 205,380 338,380" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="400" cy="500" r="198" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Inner Lotus Petals -->
      <ellipse cx="400" cy="368" rx="36" ry="68" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="400" cy="632" rx="36" ry="68" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="268" cy="500" rx="68" ry="36" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <ellipse cx="532" cy="500" rx="68" ry="36" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="308" cy="408" r="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="492" cy="408" r="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="308" cy="592" r="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="492" cy="592" r="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Center Gem -->
      <circle cx="400" cy="500" r="96" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="400,420 480,500 400,580 320,500" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="400" cy="500" r="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Corner Medallions -->
      <circle cx="115" cy="115" r="54" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="115" cy="115" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="685" cy="115" r="54" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="685" cy="115" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="115" cy="885" r="54" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="115" cy="885" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="685" cy="885" r="54" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="685" cy="885" r="24" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'worksheet-alphabet': {
    id: 'worksheet-alphabet',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Header Banner -->
      <rect x="64" y="64" width="672" height="92" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="118" cy="110" r="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="682" cy="110" r="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="172" y="88" width="456" height="44" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Row 1: Giant Bubble A + Apple -->
      <rect x="64" y="192" width="672" height="225" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="188,218 242,218 308,392 258,392 242,348 188,348 172,392 122,392" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <polygon points="215,264 198,314 232,314" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Apple to Color -->
      <circle cx="535" cy="322" r="58" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="585" cy="322" r="58" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="552" y="222" width="16" height="46" rx="6" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="602" cy="242" rx="34" ry="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Row 2: Giant Bubble B + Bee -->
      <rect x="64" y="446" width="672" height="225" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="138" y="472" width="142" height="174" rx="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <rect x="184" y="498" width="64" height="48" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="184" y="572" width="68" height="48" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Bee to Color -->
      <ellipse cx="556" cy="512" rx="32" ry="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="602" cy="512" rx="32" ry="42" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="576" cy="575" rx="82" ry="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="548" y1="526" x2="548" y2="624" stroke="${STROKE}" stroke-width="6"/>
      <line x1="584" y1="524" x2="584" y2="626" stroke="${STROKE}" stroke-width="6"/>
      <line x1="620" y1="532" x2="620" y2="618" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="518" cy="566" r="9" fill="${STROKE}"/>
      <!-- Row 3: Tracing Boxes & Stars -->
      <rect x="64" y="700" width="672" height="236" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="98" y="736" width="180" height="164" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="310" y="736" width="180" height="164" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="522" y="736" width="180" height="164" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="188,762 204,800 245,804 214,830 223,870 188,848 153,870 162,830 131,804 172,800" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="400,762 416,800 457,804 426,830 435,870 400,848 365,870 374,830 343,804 384,800" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="612,762 628,800 669,804 638,830 647,870 612,848 577,870 586,830 555,804 596,800" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'calendar-monthly': {
    id: 'calendar-monthly',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Decorative Header Banner -->
      <rect x="58" y="64" width="684" height="130" rx="20" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="128" cy="129" r="36" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="672" cy="129" r="36" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="210" y="96" width="380" height="66" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- 7 Day Header Cells -->
      <rect x="58" y="224" width="96" height="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="156" y="224" width="96" height="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="254" y="224" width="96" height="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="352" y="224" width="96" height="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="450" y="224" width="96" height="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="548" y="224" width="96" height="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="646" y="224" width="96" height="52" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Calendar Grid (5 Rows x 7 Columns) -->
      <rect x="58" y="276" width="684" height="500" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="156" y1="276" x2="156" y2="776" stroke="${STROKE}" stroke-width="4"/>
      <line x1="254" y1="276" x2="254" y2="776" stroke="${STROKE}" stroke-width="4"/>
      <line x1="352" y1="276" x2="352" y2="776" stroke="${STROKE}" stroke-width="4"/>
      <line x1="450" y1="276" x2="450" y2="776" stroke="${STROKE}" stroke-width="4"/>
      <line x1="548" y1="276" x2="548" y2="776" stroke="${STROKE}" stroke-width="4"/>
      <line x1="646" y1="276" x2="646" y2="776" stroke="${STROKE}" stroke-width="4"/>
      <line x1="58" y1="376" x2="742" y2="376" stroke="${STROKE}" stroke-width="4"/>
      <line x1="58" y1="476" x2="742" y2="476" stroke="${STROKE}" stroke-width="4"/>
      <line x1="58" y1="576" x2="742" y2="576" stroke="${STROKE}" stroke-width="4"/>
      <line x1="58" y1="676" x2="742" y2="676" stroke="${STROKE}" stroke-width="4"/>
      <!-- Notes & Goals Box -->
      <rect x="58" y="806" width="445" height="132" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <line x1="88" y1="854" x2="472" y2="854" stroke="${STROKE}" stroke-width="4"/>
      <line x1="88" y1="896" x2="472" y2="896" stroke="${STROKE}" stroke-width="4"/>
      <!-- Star Goal Sticker Box -->
      <rect x="526" y="806" width="216" height="132" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="634,824 648,856 684,860 656,882 664,918 634,898 604,918 612,882 584,860 620,856" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'teacher-classroom': {
    id: 'teacher-classroom',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Giant Star Student Award Medal -->
      <polygon points="318,470 250,680 330,636 392,702 415,495" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="482,470 550,680 470,636 408,702 385,495" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="400" cy="310" r="192" fill="#FFFFFF" stroke="${STROKE}" stroke-width="7"/>
      <circle cx="400" cy="310" r="154" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="400,185 436,265 524,274 458,332 478,418 400,372 322,418 342,332 276,274 364,265" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Giant Crayon Left -->
      <rect x="92" y="655" width="90" height="245" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <polygon points="92,655 137,565 182,655" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="92" y="710" width="90" height="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="92" y="818" width="90" height="32" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Open Book Center -->
      <path d="M235,768 Q318,735 400,772 L400,918 Q318,885 235,918 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <path d="M565,768 Q482,735 400,772 L400,918 Q482,885 565,918 Z" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Apple Right -->
      <circle cx="655" cy="832" r="56" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="702" cy="832" r="56" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <rect x="670" y="735" width="16" height="44" rx="6" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <ellipse cx="718" cy="752" rx="32" ry="15" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
    `,
  },

  'worksheet-matching-trace': {
    id: 'worksheet-matching-trace',
    viewBox: '0 0 800 1000',
    svgInner: `
      <rect x="24" y="24" width="752" height="952" rx="18" fill="#FFFFFF" stroke="${STROKE}" stroke-width="6"/>
      <!-- Section 1: Image to Letter Mapping -->
      <rect x="52" y="54" width="696" height="350" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Row 1 Left: Apple -->
      <circle cx="132" cy="128" r="30" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="158" cy="128" r="30" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="140" y="78" width="10" height="24" rx="4" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <ellipse cx="168" cy="88" rx="18" ry="9" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="235" cy="124" r="10" fill="${STROKE}"/>
      <!-- Row 2 Left: Star -->
      <polygon points="145,190 156,216 184,218 162,236 169,264 145,248 121,264 128,236 106,218 134,216" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="235" cy="230" r="10" fill="${STROKE}"/>
      <!-- Row 3 Left: Fish -->
      <ellipse cx="136" cy="336" rx="42" ry="26" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="176,336 206,312 206,360" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <circle cx="114" cy="330" r="5" fill="${STROKE}"/>
      <circle cx="235" cy="336" r="10" fill="${STROKE}"/>
      <!-- Right Column Targets (Scrambled: S, F, A) -->
      <circle cx="545" cy="124" r="10" fill="${STROKE}"/>
      <rect x="572" y="92" width="145" height="64" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M664,110 C664,102 630,102 630,114 C630,126 664,124 664,136 C664,148 630,148 630,138" fill="none" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="545" cy="230" r="10" fill="${STROKE}"/>
      <rect x="572" y="198" width="145" height="64" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <line x1="634" y1="208" x2="634" y2="252" stroke="${STROKE}" stroke-width="6"/>
      <line x1="634" y1="208" x2="664" y2="208" stroke="${STROKE}" stroke-width="6"/>
      <line x1="634" y1="229" x2="658" y2="229" stroke="${STROKE}" stroke-width="6"/>
      <circle cx="545" cy="336" r="10" fill="${STROKE}"/>
      <rect x="572" y="304" width="145" height="64" rx="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <line x1="628" y1="356" x2="646" y2="314" stroke="${STROKE}" stroke-width="6"/>
      <line x1="664" y1="356" x2="646" y2="314" stroke="${STROKE}" stroke-width="6"/>
      <line x1="634" y1="342" x2="658" y2="342" stroke="${STROKE}" stroke-width="6"/>

      <!-- Section 2: Line Tracing Paths -->
      <rect x="52" y="432" width="696" height="252" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Path 1: Straight Line Guide -->
      <circle cx="102" cy="488" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <line x1="132" y1="488" x2="178" y2="488" stroke="${STROKE}" stroke-width="4"/>
      <line x1="202" y1="488" x2="248" y2="488" stroke="${STROKE}" stroke-width="4"/>
      <line x1="272" y1="488" x2="318" y2="488" stroke="${STROKE}" stroke-width="4"/>
      <line x1="342" y1="488" x2="388" y2="488" stroke="${STROKE}" stroke-width="4"/>
      <line x1="412" y1="488" x2="458" y2="488" stroke="${STROKE}" stroke-width="4"/>
      <line x1="482" y1="488" x2="528" y2="488" stroke="${STROKE}" stroke-width="4"/>
      <line x1="552" y1="488" x2="598" y2="488" stroke="${STROKE}" stroke-width="4"/>
      <line x1="622" y1="488" x2="664" y2="488" stroke="${STROKE}" stroke-width="4"/>
      <polygon points="696,466 703,482 720,484 707,495 711,512 696,502 681,512 685,495 672,484 689,482" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Path 2: Zigzag Trace -->
      <circle cx="102" cy="564" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M132,564 L196,532 L260,596 L324,532 L388,596 L452,532 L516,596 L580,532 L652,564" fill="none" stroke="${STROKE}" stroke-width="4"/>
      <polygon points="696,542 703,558 720,560 707,571 711,588 696,578 681,588 685,571 672,560 689,558" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <!-- Path 3: Wave Trace -->
      <circle cx="102" cy="640" r="14" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <path d="M132,640 Q192,600 252,640 Q312,680 372,640 Q432,600 492,640 Q552,680 612,640 L656,640" fill="none" stroke="${STROKE}" stroke-width="4"/>
      <polygon points="696,618 703,634 720,636 707,647 711,664 696,654 681,664 685,647 672,636 689,634" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>

      <!-- Section 3: Word & Shape Tracking Grid (Highlight / Circle Practice) -->
      <rect x="52" y="712" width="696" height="236" rx="16" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="80" y="740" width="144" height="78" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="246" y="740" width="144" height="78" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="412" y="740" width="144" height="78" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="578" y="740" width="144" height="78" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="80" y="840" width="144" height="78" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="246" y="840" width="144" height="78" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="412" y="840" width="144" height="78" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="578" y="840" width="144" height="78" rx="12" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <!-- Tracking Icons Inside Grid Cells -->
      <circle cx="152" cy="779" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="318,756 342,802 294,802" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="462" y="757" width="44" height="44" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="650,754 657,771 676,773 662,785 666,803 650,793 634,803 638,785 624,773 643,771" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <polygon points="152,854 159,871 178,873 164,885 168,903 152,893 136,903 140,885 126,873 145,871" fill="#FFFFFF" stroke="${STROKE}" stroke-width="4"/>
      <circle cx="318" cy="879" r="22" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <polygon points="484,856 508,902 460,902" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
      <rect x="628" y="857" width="44" height="44" fill="#FFFFFF" stroke="${STROKE}" stroke-width="5"/>
    `,
  },
};

export function getLineArtSvg(sheetId: string): string {
  const art = LINE_ART_LIBRARY[sheetId] || LINE_ART_LIBRARY['dino-trex'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${art.viewBox}" width="800" height="1000" style="background:#FFFFFF">${art.svgInner}</svg>`;
}

export function getLineArtDataUri(sheetId: string): string {
  const svg = getLineArtSvg(sheetId);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
