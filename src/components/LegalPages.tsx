import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Scale,
  Mail,
  Send,
  Check,
  Palette,
  Printer,
  GraduationCap,
} from 'lucide-react';
import { Locale } from '../types';

export type LegalPageSlug =
  | 'privacy-policy'
  | 'terms-of-use'
  | 'dmca'
  | 'about'
  | 'contact';

interface LegalPageViewProps {
  page: LegalPageSlug;
  locale: Locale;
  onNavigate: (path: string) => void;
  onOpenCookieSettings: () => void;
}

const LAST_UPDATED = 'November 2026';

export const LegalPageView: React.FC<LegalPageViewProps> = ({
  page,
  locale,
  onNavigate,
  onOpenCookieSettings,
}) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTopic, setContactTopic] = useState('General Question');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSubmitted(true);
  };

  const navItems: { slug: LegalPageSlug; label: string }[] = [
    { slug: 'about', label: 'About Us' },
    { slug: 'contact', label: 'Contact' },
    { slug: 'privacy-policy', label: 'Privacy Policy' },
    { slug: 'terms-of-use', label: 'Terms of Use' },
    { slug: 'dmca', label: 'DMCA & Copyright' },
  ];

  return (
    <main className="flex-1 max-w-[1040px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb + Trust Nav */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate(`/${locale}/`)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0F1E36] dark:text-slate-200 hover:text-[#E63946] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ColorWorld</span>
        </button>

        <nav aria-label="Legal and trust pages" className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-bold">
          {navItems.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => onNavigate(`/${item.slug}`)}
              className={`transition-colors cursor-pointer whitespace-nowrap ${
                page === item.slug
                  ? 'text-[#E63946] underline underline-offset-4'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F1E36] dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* PRIVACY POLICY */}
      {page === 'privacy-policy' && (
        <article className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-10 space-y-6">
          <header className="border-b border-[#E2E8F0] dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2A9D8F]">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy &amp; Data Protection · Updated {LAST_UPDATED}</span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed max-w-3xl">
              ColorWorld is built to be a safe, frictionless printable coloring library for families, parents, and teachers. We believe downloading a coloring sheet should never require creating an account or handing over personal information.
            </p>
          </header>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              1. No User Accounts or Personal Data Collection
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              ColorWorld does not require user registration, logins, email addresses, or profiles to browse, color online, or download PDF coloring pages. We do not knowingly collect, store, or sell personal information from adults or children under the age of 13 (COPPA / GDPR-K compliant).
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              2. Browser-Only LocalStorage Preferences
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              Convenience features—including your selected <strong>Print Set</strong> pages, preferred paper size (US Letter or A4), light/dark display theme, and cookie consent preference—are stored strictly inside your own browser&apos;s <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">localStorage</code>. This data never leaves your device and is never transmitted to our servers. You can clear it anytime by clicking &ldquo;clear&rdquo; on your Print Set or clearing your browser site data.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              3. Advertising &amp; Third-Party Cookies (Google AdSense)
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              To keep all coloring pages 100% free to download and print, ColorWorld displays advertisements served by third-party ad networks, including <strong>Google AdSense</strong>. Third-party vendors, including Google, use cookies or similar identifiers to serve ads based on a visitor&apos;s prior visits to this website or other websites on the internet.
            </p>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              Google&apos;s use of advertising cookies enables it and its partners to serve relevant ads to our users. You may opt out of personalized advertising at any time by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E63946] font-semibold hover:underline"
              >
                Google Ads Settings
              </a>{' '}
              or{' '}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E63946] font-semibold hover:underline"
              >
                www.aboutads.info
              </a>
              . Visitors in the European Economic Area (EEA), UK, and eligible US states can also manage their consent preference anytime using our{' '}
              <button
                type="button"
                onClick={onOpenCookieSettings}
                className="text-[#2A9D8F] font-bold hover:underline cursor-pointer"
              >
                Cookie Consent Preferences
              </button>
              .
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              4. Edge Hosting &amp; Security Logs
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              ColorWorld is served statically via Cloudflare Pages and Cloudflare R2 content delivery infrastructure. Like standard web hosting providers, Cloudflare may process transient network metadata (such as IP addresses and HTTP request headers) solely to prevent abuse, mitigate DDoS traffic, and deliver fast page loads.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              5. Contact Us Regarding Privacy
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              If you have any questions about this Privacy Policy or how browser data is handled, please reach out via our{' '}
              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="text-[#E63946] font-bold hover:underline cursor-pointer"
              >
                Contact Page
              </button>{' '}
              or email <a href="mailto:privacy@colorworld.app" className="font-mono text-xs text-[#0F1E36] dark:text-white underline">privacy@colorworld.app</a>.
            </p>
          </section>
        </article>
      )}

      {/* TERMS OF USE */}
      {page === 'terms-of-use' && (
        <article className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-10 space-y-6">
          <header className="border-b border-[#E2E8F0] dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2A9D8F]">
              <FileText className="w-4 h-4" />
              <span>Licensing &amp; Usage Guidelines · Updated {LAST_UPDATED}</span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              Terms of Use
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed max-w-3xl">
              By accessing or downloading printable PDFs and coloring sheets from ColorWorld, you agree to the clear, family-friendly usage terms below.
            </p>
          </header>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              1. Permitted Personal, Home &amp; Classroom Use
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              All coloring pages, worksheets, calendars, and activity packs published on ColorWorld are free for <strong>non-commercial personal, family, home, homeschool, library, daycare, and classroom educational use</strong>. Parents, teachers, and educators are welcome to download, print, and photocopy multiple copies for students and family activities at no cost.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              2. Prohibited Commercial Redistribution
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              You may <strong>not</strong> sell, resell, license, bundle into commercial coloring books (including Amazon KDP, Etsy, or Teachers Pay Teachers digital downloads), mirror on competing websites, or redistribute ColorWorld PDFs or line-art images for commercial gain without prior written permission.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              3. Sharing &amp; Linking Policy
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              Teachers, bloggers, and parents are welcome to share links directly to ColorWorld category or coloring pack pages. Please do not hotlink directly to raw PDF or image asset URLs or re-upload our files onto third-party file hosts.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              4. Availability &amp; Disclaimer
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              ColorWorld provides all printable PDFs and browser-based coloring tools &ldquo;as is&rdquo; without warranties of any kind. We continuously review our print formatting for crisp 300 DPI output on US Letter and A4 printers, and reserve the right to update or remove sheets at any time.
            </p>
          </section>
        </article>
      )}

      {/* DMCA & COPYRIGHT */}
      {page === 'dmca' && (
        <article className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-10 space-y-6">
          <header className="border-b border-[#E2E8F0] dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#E63946]">
              <Scale className="w-4 h-4" />
              <span>Copyright &amp; Intellectual Property · Updated {LAST_UPDATED}</span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              DMCA Copyright &amp; Takedown Policy
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed max-w-3xl">
              ColorWorld respects the intellectual property rights of artists, illustrators, and copyright owners. We respond promptly to valid takedown notices submitted under the Digital Millennium Copyright Act (17 U.S.C. § 512).
            </p>
          </header>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              How to Submit a DMCA Takedown Notice
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              If you believe that any coloring page, preview image, or printable PDF hosted on ColorWorld infringes your copyright, please email our designated Copyright Agent at{' '}
              <a
                href="mailto:dmca@colorworld.app"
                className="font-mono font-bold text-[#E63946] hover:underline"
              >
                dmca@colorworld.app
              </a>{' '}
              with the following required information:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>The exact ColorWorld URL(s) of the page or printable PDF you request removed.</li>
              <li>Your full name, organization (if applicable), mailing address, telephone number, and email address.</li>
              <li>
                A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                A statement made under penalty of perjury that the information in your notice is accurate and that you are the copyright owner or authorized to act on the owner&apos;s behalf.
              </li>
              <li>Your physical or electronic signature.</li>
            </ol>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              Response Timeline
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              Upon receiving a complete and valid notice, we review and remove or disable access to the identified material within 24–72 business hours and send written confirmation to the reporting party.
            </p>
          </section>
        </article>
      )}

      {/* ABOUT PAGE */}
      {page === 'about' && (
        <article className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-10 space-y-8">
          <header className="border-b border-[#E2E8F0] dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#E63946]">
              <Palette className="w-4 h-4" />
              <span>About ColorWorld</span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              Crisp, Free Printable Coloring Pages for Every Home &amp; Classroom
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed max-w-3xl">
              ColorWorld was created to solve a simple frustration every parent and teacher knows: trying to print a quick coloring page only to hit login walls, blurry low-resolution images, or broken page margins.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#0F1E36] text-[#FFB703] flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold text-[#0F1E36] dark:text-white">
                Print-Ready 300 DPI PDFs
              </h2>
              <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                Every sheet is prepared with clean black outlines on pure white paper, tailored for both US Letter (8.5 × 11 in) and international A4 printers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#2A9D8F] text-white flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold text-[#0F1E36] dark:text-white">
                Instant Color Online Studio
              </h2>
              <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                No printer nearby? Kids and adults can color any sheet right in the browser with flood-fill, brushes, worksheet tracing lines, and touch zoom.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E63946] text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold text-[#0F1E36] dark:text-white">
                Built for Families &amp; Educators
              </h2>
              <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                Bundle multiple sheets into a single combined Print Set PDF in seconds—always 100% free for personal and classroom use, with zero accounts needed.
              </p>
            </div>
          </div>

          <section className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 space-y-2.5">
            <h2 className="text-lg font-extrabold text-[#0F1E36] dark:text-white">
              Have a Theme Request?
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              We regularly expand our library based on parent and teacher requests—from seasonal holiday packets to preschool tracing worksheets. Reach out anytime through our{' '}
              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="text-[#E63946] font-bold hover:underline cursor-pointer"
              >
                Contact page
              </button>
              .
            </p>
          </section>
        </article>
      )}

      {/* CONTACT PAGE */}
      {page === 'contact' && (
        <article className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-10 space-y-8">
          <header className="border-b border-[#E2E8F0] dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2A9D8F]">
              <Mail className="w-4 h-4" />
              <span>Get in Touch</span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              Contact ColorWorld
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed max-w-2xl">
              Have a request for a new coloring theme, a classroom pack suggestion, a printing question, or a copyright inquiry? Send us a note below.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              {contactSubmitted ? (
                <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-3">
                  <div className="flex items-center gap-2 text-base font-extrabold text-[#15803D] dark:text-emerald-300">
                    <Check className="w-5 h-5" />
                    <span>Message Prepared</span>
                  </div>
                  <p className="text-sm text-[#334155] dark:text-slate-300 leading-relaxed">
                    Thank you, <strong>{contactName}</strong>. You can also send your message directly via your email client to{' '}
                    <a
                      href={`mailto:hello@colorworld.app?subject=${encodeURIComponent(
                        `[ColorWorld] ${contactTopic}`
                      )}&body=${encodeURIComponent(
                        `From: ${contactName} (${contactEmail})\n\n${contactMessage}`
                      )}`}
                      className="font-bold text-[#E63946] underline"
                    >
                      hello@colorworld.app
                    </a>{' '}
                    for fastest email delivery.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactName('');
                      setContactEmail('');
                      setContactMessage('');
                    }}
                    className="h-9 px-4 rounded-xl bg-[#0F1E36] text-white text-xs font-bold cursor-pointer"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                      Topic
                    </label>
                    <select
                      value={contactTopic}
                      onChange={(e) => setContactTopic(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white"
                    >
                      <option value="General Question">General Question</option>
                      <option value="Coloring Page Request">Coloring Page Request</option>
                      <option value="Teacher / Classroom Feedback">Teacher / Classroom Feedback</option>
                      <option value="Privacy Inquiry">Privacy Inquiry</option>
                      <option value="Copyright / DMCA Notice">Copyright / DMCA Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Tell us how we can help..."
                      className="w-full p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 text-sm text-[#0F1E36] dark:text-white resize-none focus:outline-none focus:border-[#0F1E36] dark:focus:border-[#FFB703]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="h-11 px-6 rounded-xl bg-[#E63946] hover:bg-[#D62839] text-white text-sm font-extrabold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-5 space-y-5 lg:border-l lg:border-[#E2E8F0] dark:lg:border-slate-800 lg:pl-8">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F1E36] dark:text-white">
                  Direct Email Contacts
                </h2>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  We typically respond within 1–2 business days.
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                    General Support &amp; Requests
                  </div>
                  <a
                    href="mailto:hello@colorworld.app"
                    className="font-mono text-xs font-bold text-[#0F1E36] dark:text-white hover:text-[#E63946]"
                  >
                    hello@colorworld.app
                  </a>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                    Educators &amp; Schools
                  </div>
                  <a
                    href="mailto:teachers@colorworld.app"
                    className="font-mono text-xs font-bold text-[#0F1E36] dark:text-white hover:text-[#E63946]"
                  >
                    teachers@colorworld.app
                  </a>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                    Copyright &amp; DMCA Agent
                  </div>
                  <a
                    href="mailto:dmca@colorworld.app"
                    className="font-mono text-xs font-bold text-[#0F1E36] dark:text-white hover:text-[#E63946]"
                  >
                    dmca@colorworld.app
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>
      )}
    </main>
  );
};
