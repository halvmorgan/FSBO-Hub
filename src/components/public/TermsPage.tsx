import React from 'react';
import { ArrowLeft, Shield, FileText, Scale, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TermsPageProps {
  onBack: () => void;
  onOpenAuth?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack, onOpenAuth }) => {
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
            <Scale className="w-3.5 h-3.5 text-[#FF6B5A]" />
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F2A44] tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-stone-600 text-sm">
            Please read these terms carefully before using {saasConfig.brandName}.
          </p>
        </div>

        {/* Prominent Legal Disclaimer Callout */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-2xl mb-8 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                Important Consumer Disclaimer
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                <strong>{saasConfig.brandName} is not a licensed real estate broker, attorney, tax consultant, or financial advisor.</strong> We provide self-help marketing software, educational milestones, and document organization tools. All information and calculators are for informational purposes only. You are advised to consult a licensed real estate attorney, title company, or certified appraiser for contract drafting and closing transactions in your state.
              </p>
            </div>
          </div>
        </div>

        {/* Fair Housing Notice */}
        <div className="bg-emerald-50 border-l-4 border-[#1FA67A] p-5 rounded-r-2xl mb-8 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-[#1FA67A] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                Fair Housing & Civil Rights Commitment
              </h3>
              <p className="text-xs sm:text-sm text-emerald-900 mt-1 leading-relaxed">
                All property listings, descriptions, and advertisements must comply with Title VIII of the Civil Rights Act of 1968 (Federal Fair Housing Act). Sellers may never discriminate or express preferences based on race, color, religion, sex, disability, familial status, or national origin. Users are solely responsible for ensuring listing texts and showing interactions comply with fair housing laws.
              </p>
            </div>
          </div>
        </div>

        {/* Full Terms Text Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-stone-200">
          <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed text-sm whitespace-pre-line font-sans">
            {saasConfig.termsOfService}
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
