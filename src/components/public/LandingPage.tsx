import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Camera,
  DollarSign,
  FileText,
  Globe,
  Calendar,
  Inbox,
  HelpCircle,
  Home,
  Compass,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import { SaasConfig } from '../../types/saas';

interface LandingPageProps {
  saasConfig: SaasConfig;
  onStartFree: () => void;
  onLogin: () => void;
  onViewPricing: () => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
  onDemoPreview: () => void;
  loggedOutMessage?: string | null;
  onDismissLoggedOut?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  saasConfig,
  onStartFree,
  onLogin,
  onViewPricing,
  onViewTerms,
  onViewPrivacy,
  onDemoPreview,
  loggedOutMessage,
  onDismissLoggedOut,
}) => {
  const faqs = [
    {
      q: 'How much money can I actually save selling For Sale By Owner (FSBO)?',
      a: 'On a $400,000 home, the traditional 5% to 6% agent commission costs $20,000 to $24,000. By managing your listing yourself with our automated dashboard, you keep that equity in your pocket.',
    },
    {
      q: 'Do I need any real estate or tech experience to use this?',
      a: 'None at all. FSBO Compass was designed specifically for regular homeowners. Every section features a one-sentence "Why this matters" guide and plain-English tooltips for every contract term.',
    },
    {
      q: 'How do buyers find my home if I do not hire a listing agent?',
      a: 'Most buyers search online portals directly when looking for homes. Our platform helps you post to Zillow, Facebook Marketplace, and Craigslist, gives you a custom hosted website at /p/your-address, and generates yard sign QR codes.',
    },
    {
      q: 'What about legal contracts, disclosures, and closing?',
      a: 'We provide 50-state disclosure checklists (including statutory seller disclosures and federal lead-based paint requirements) and a closing tracker so you can work seamlessly with a local title company or real estate attorney to handle escrow and closing.',
    },
    {
      q: 'What is the Fair Housing guardrail?',
      a: 'Federal law strictly prohibits advertising that discriminates or specifies buyer demographics. Our built-in AI scan checks every word of your listing and flags any risky phrases before you post.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-slate-950 text-[#0F2A44] dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0F2A44] text-white border-b border-[#1E4268]/50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B5A] to-[#F2B544] flex items-center justify-center font-bold text-white shadow-lg shadow-[#FF6B5A]/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-base tracking-tight text-white">
                FSBO <span className="text-[#FF6B5A]">Compass</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest text-[#F2B544] px-1.5 py-0.5 rounded bg-white/10">
                SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={onViewPricing}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={onDemoPreview}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors hidden md:inline-block"
            >
              Demo Preview
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onStartFree}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-md shadow-[#FF6B5A]/25"
            >
              <span>Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Logged Out Banner */}
      {loggedOutMessage && (
        <div
          role="status"
          className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-xs text-emerald-900 dark:text-emerald-200"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{loggedOutMessage}</span>
            </div>
            {onDismissLoggedOut && (
              <button
                type="button"
                onClick={onDismissLoggedOut}
                className="p-1 rounded-lg hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0F2A44] via-[#143E5E] to-[#1E6F80] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/15">
            <Compass className="w-4 h-4 text-[#F2B544]" />
            <span>Your step-by-step guide to selling your home without an agent.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-heading tracking-tight leading-tight text-white">
            Sell your home yourself. <br />
            <span className="text-[#FF6B5A]">We'll point the way.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Agent commissions are usually 3% to 6%. FSBO Compass walks you through every step to price, list, show, and close. Save up to $15,000 or more with automated guidance, comps, and verified contract checklists.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              type="button"
              onClick={onStartFree}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-heading font-bold text-sm text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-xl shadow-[#FF6B5A]/30 transform hover:-translate-y-0.5"
            >
              <span>Start Free 7-Day Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDemoPreview}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-heading font-semibold text-sm text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all"
            >
              <span>Explore Interactive Dashboard</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required for trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fair Housing guardrail built in
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 50-state disclosure checklists
            </span>
          </div>
        </div>

        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF6B5A]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#F2B544]/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 3-Step "How It Works" */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B5A]">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#0F2A44] dark:text-white">
            How FSBO Compass Works
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A linear, confidence-building roadmap that turns an intimidating home sale into simple checkboxes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F2A44]/10 dark:bg-slate-800 text-[#0F2A44] dark:text-[#FF6B5A] flex items-center justify-center font-heading font-extrabold text-lg">
              1
            </div>
            <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white">
              Snap Photos & Find Features
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload photos from your phone. Gemini AI analyzes finishes, inspects public assessor records side-by-side, and highlights hidden features buyers filter for.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B5A]/15 text-[#FF6B5A] flex items-center justify-center font-heading font-extrabold text-lg">
              2
            </div>
            <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white">
              Price, Write & Publish
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Calculate accurate comps, generate Fair Housing-compliant listings for Zillow and Facebook, and launch a dedicated property website at /p/your-address with QR sign downloads.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-heading font-extrabold text-lg">
              3
            </div>
            <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white">
              Screen Showings & Close
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Receive showing requests with pre-approval verification, respond with AI templates, compare buyer offers side-by-side on Net Proceeds, and coordinate with a title company.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B5A]">
              13 Built-In Tools
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#0F2A44] dark:text-white">
              Everything an Agent Does, Powered by Software
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No complicated spreadsheets or scattered paperwork. Manage everything from one command center.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <Camera className="w-5 h-5 text-[#FF6B5A]" />
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">AI Photo Coach</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gemini reviews lighting and composition, assigns quality badges, and provides an interactive shot list.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">Comps Valuation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Worksheet adjusting for condition, square footage, and garages with clear low/likely/high ranges.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <FileText className="w-5 h-5 text-[#F2B544]" />
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">Fair Housing Guardrail</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Multi-tone listing writer with automated compliance scanning to prevent protected-class phrasing.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">Hosted Website (/p/slug)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Published single-page site with interactive gallery, showing request form, and yard sign QR code.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">Showing & Open House Log</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Schedule tours, mandate pre-approval letters, and track hot/warm/cold visitor interest levels.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <Inbox className="w-5 h-5 text-[#FF6B5A]" />
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">Inquiry Reply Clock</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                A 24-hour response clock ensures no buyer slips away, with 6 AI personalized reply scenarios.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">Disclosures Repository</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Official 50-state seller disclosures, Federal Lead-Based Paint (for pre-1978 homes), and warranty document slots.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <Sparkles className="w-5 h-5 text-[#F2B544]" />
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">Net to Seller Comparison</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Compare buyer offers side-by-side after accounting for seller concessions and transfer taxes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B5A]">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#0F2A44] dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2"
            >
              <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6B5A] shrink-0" />
                {f.q}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-[#0F2A44] to-[#1E6F80] text-white py-12 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading">
            Ready to sell your home and keep your equity?
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto">
            Try FSBO Compass free for 7 days. No credit card required.
          </p>
          <button
            type="button"
            onClick={onStartFree}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-lg shadow-[#FF6B5A]/25"
          >
            <span>Start Free Trial Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <a
              href="/pricing#compare"
              onClick={(e) => {
                if (onViewPricing) {
                  e.preventDefault();
                  window.history.pushState({}, '', '/pricing#compare');
                  onViewPricing();
                  setTimeout(() => {
                    const el = document.getElementById('compare');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 150);
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors underline decoration-slate-400 hover:decoration-white"
            >
              Compare plans &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0C2238] text-white py-12 px-4 sm:px-6 border-t border-[#1E4268]/40 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Compass className="w-4 h-4 text-[#FF6B5A]" />
              <span className="font-heading font-extrabold text-sm tracking-tight text-white">
                FSBO <span className="text-[#FF6B5A]">Compass</span>
              </span>
            </div>
            <p className="text-slate-400">
              © 2026 FSBO Compass. All rights reserved.
            </p>
            <p className="text-slate-500 text-[11px] max-w-md">
              General software tools only; not legal, tax, or real estate advice.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
            <button type="button" onClick={onViewPricing} className="hover:text-white">
              Pricing
            </button>
            <button type="button" onClick={onViewTerms} className="hover:text-white">
              Terms of Service
            </button>
            <button type="button" onClick={onViewPrivacy} className="hover:text-white">
              Privacy Policy
            </button>
            <a
              href="mailto:support@fsbocompass.com"
              className="hover:text-white flex items-center gap-1"
            >
              support@fsbocompass.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
