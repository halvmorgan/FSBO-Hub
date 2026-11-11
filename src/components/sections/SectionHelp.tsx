import React, { useState } from 'react';
import {
  HelpCircle,
  Mail,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface SectionHelpProps {
  onNavigate: (tab: ActiveTab) => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
}

const FAQS = [
  {
    question: 'How do I safely host showings without an agent?',
    answer:
      'Always require prospective buyers to provide full contact details and proof of mortgage pre-approval before booking a private tour. During showings, keep valuables, firearms, prescription medications, and financial documents locked away. Greet buyers at the front door, let them lead the walk through each room, and maintain open communication about terms.',
  },
  {
    question: 'Do I have to pay a buyer agent fee?',
    answer:
      'No. Real estate commission rates are never fixed by law and are entirely negotiable. While offering 2% to 2.5% to a buyer agent can expand your buyer pool on the MLS, you are under no legal obligation to pay buyer agents. In the Inquiries tab, we provide clear script templates for handling buyer agent inquiries.',
  },
  {
    question: 'What happens when I receive an offer?',
    answer:
      'When an offer is submitted, enter the key figures into the Offers & Net Sheet tool in the Documents & Closing tab. Review the purchase price, earnest money deposit (typically 1% to 3%), financing contingencies, inspection deadlines (usually 7 to 10 days), and requested closing date before signing or countering.',
  },
  {
    question: 'What closing team members do I need in my state?',
    answer:
      'A licensed title company or real estate attorney will act as the neutral escrow agent. They conduct title searches, draft the deed, hold earnest money in an insured escrow account, prepare the HUD-1 / ALTA settlement statement, and coordinate the final signing and recording of the deed.',
  },
  {
    question: 'How does the AI Listing Writer work?',
    answer:
      'Our AI analyzes your property profile specs, architectural features, and upgrades to draft persuasive, Fair-Housing-compliant descriptions tailored for Zillow, Facebook Marketplace, Craigslist, and full flyers. You can regenerate copy anytime with different tones.',
  },
  {
    question: 'How do I upgrade or change my subscription plan?',
    answer:
      'You can upgrade from the 7-day Free Trial to the $149 Per Listing plan or $29/mo Pro Monthly plan at any time from your Account & Billing tab or the Pricing page. Stripe securely processes all payments and invoices.',
  },
];

export const SectionHelp: React.FC<SectionHelpProps> = ({
  onNavigate,
  onViewTerms,
  onViewPrivacy,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2A44] to-[#1E6F80] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <HelpCircle className="w-3.5 h-3.5 text-[#F2B544]" />
            Seller Support Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
            We're Here to Help You Sell with Confidence
          </h1>
          <p className="text-slate-200 text-sm leading-relaxed">
            Get fast answers to your for-sale-by-owner questions, contact our support team, and learn how to navigate your home sale from list to close.
          </p>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Support Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6B5A] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white">
                Contact Customer Support
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Have a question about your account, listing tools, or property website? Our team is standing by to help.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                Response within 24 business hours
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF6B5A]" />
                Direct human assistance
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href="mailto:support@fsbocompass.com?subject=FSBO%20Compass%20Support%20Request"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-md shadow-[#FF6B5A]/25"
            >
              <Mail className="w-4 h-4" />
              <span>Email Support Team</span>
            </a>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center sm:text-left">
              support@fsbocompass.com
            </span>
          </div>
        </div>

        {/* Legal & Policies Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-[#0F2A44] dark:text-blue-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Legal & Disclaimers
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              FSBO Compass provides self-service software, educational checklists, and tools. We are not a licensed real estate broker, attorney, or certified appraiser.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onViewTerms}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Terms of Service
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={onViewPrivacy}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                Privacy Policy
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <HelpCircle className="w-5 h-5 text-[#FF6B5A]" />
          <h2 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-2 pt-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-heading font-bold text-sm text-[#0F2A44] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
