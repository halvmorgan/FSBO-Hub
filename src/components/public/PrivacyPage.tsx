import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PrivacyPageProps {
  onBack: () => void;
  onOpenAuth?: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack, onOpenAuth }) => {
  const { saasConfig } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#0F2A44] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F2A44] hover:text-[#FF6B5A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-lg text-[#0F2A44]">
              {saasConfig.brandName}
            </span>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#FF6B5A] hover:bg-[#e85a4a] rounded-xl shadow-sm transition-all"
            >
              Start Free
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Title */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full text-xs font-semibold uppercase tracking-wider text-stone-600 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1FA67A]" />
            Data Protection
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F2A44] tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-stone-600 text-sm">
            How {saasConfig.brandName} handles your personal data, property files, and private documents.
          </p>
        </div>

        {/* Private Document Guarantee Callout */}
        <div className="bg-sky-50 border-l-4 border-sky-600 p-5 rounded-r-2xl mb-8 shadow-sm">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-sky-950 uppercase tracking-wide">
                Private Document Isolation Guarantee
              </h3>
              <p className="text-xs sm:text-sm text-sky-900 mt-1 leading-relaxed">
                Your private seller documents, purchase offers, tax assessments, buyer qualification letters, and financial negotiation notes are strictly restricted to your authenticated user account. <strong>They are never published to public property websites or exposed to web search crawlers.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Full Privacy Policy Text Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-stone-200">
          <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed text-sm whitespace-pre-line font-sans">
            {saasConfig.privacyPolicy}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 mt-12 text-center text-xs text-stone-500">
        <p>&copy; {new Date().getFullYear()} {saasConfig.brandName}. All rights reserved.</p>
      </footer>
    </div>
  );
};
