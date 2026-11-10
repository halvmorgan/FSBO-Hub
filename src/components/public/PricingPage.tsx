import React from 'react';
import { SaasConfig, PlanType } from '../../types/saas';
import {
  Check,
  Home,
  Lock,
  Sparkles,
} from 'lucide-react';

interface PricingPageProps {
  saasConfig: SaasConfig;
  currentPlan?: PlanType;
  onSelectPlan: (planId: PlanType) => void;
  onBackToHome: () => void;
  onLogin: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  saasConfig,
  currentPlan,
  onSelectPlan,
  onBackToHome,
  onLogin,
}) => {
  const plans = saasConfig.plans;

  return (
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-stone-950 text-[#0F2A44] dark:text-stone-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-[#0F2A44] text-white py-4 px-6 border-b border-[#1E4268]/50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B5A] to-[#F2B544] flex items-center justify-center font-bold text-white shadow-md">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm text-white">
                FSBO <span className="text-[#FF6B5A]">Command Center</span>
              </span>
              <span className="block text-[10px] text-slate-300">Simple, Transparent Pricing</span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs text-slate-300 hover:text-white"
            >
              &larr; Back to Overview
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12 flex-1 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B5A]">
            Keep 100% of Your Equity
          </span>
          <h1 className="text-3xl sm:text-5xl font-black font-heading text-[#0F2A44] dark:text-white">
            Choose Your Sale Plan
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Start with our 7-day free trial. Upgrade only when you're ready to publish your website and receive showings.
          </p>
        </div>

        {/* 4 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* 1. FREE TRIAL */}
          {plans.trial && (
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Risk-Free
                  </span>
                  <h3 className="font-heading font-bold text-xl text-[#0F2A44] dark:text-white">
                    {plans.trial.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#0F2A44] dark:text-white font-heading">
                      {plans.trial.priceDisplay}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">/ 7 days</span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Perfect to get organized, upload your photos, and calculate your target price before going live.
                </p>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Included Features:
                  </span>
                  {plans.trial.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 text-xs text-stone-400">
                    <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0 mt-0.5" />
                    <span>No published website (Draft mode)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlan('trial')}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-sm ${
                  currentPlan === 'trial'
                    ? 'bg-stone-200 text-stone-600 cursor-default'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200'
                }`}
              >
                {currentPlan === 'trial' ? 'Current Plan' : 'Start 7-Day Free Trial'}
              </button>
            </div>
          )}

          {/* 2. PER LISTING ($149) */}
          {plans.per_listing && (
            <div className="relative p-6 rounded-3xl bg-white dark:bg-stone-900 border-2 border-[#FF6B5A] shadow-xl flex flex-col justify-between space-y-6 ring-4 ring-[#FF6B5A]/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FF6B5A] text-white shadow-md">
                ⭐ Most Popular
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B5A] block mb-1">
                    Complete Sale Package
                  </span>
                  <h3 className="font-heading font-bold text-xl text-[#0F2A44] dark:text-white">
                    {plans.per_listing.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#0F2A44] dark:text-white font-heading">
                      {plans.per_listing.priceDisplay}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">one-time / 6 mos</span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Everything you need to list, market, show, and close your home. No recurring subscription fees.
                </p>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B5A] block mb-1">
                    Everything in Free Trial, Plus:
                  </span>
                  {plans.per_listing.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlan('per_listing')}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-md shadow-[#FF6B5A]/30 ${
                  currentPlan === 'per_listing'
                    ? 'bg-emerald-600 cursor-default'
                    : 'bg-[#FF6B5A] hover:bg-[#fa5644] active:scale-[0.99]'
                }`}
              >
                {currentPlan === 'per_listing' ? '✓ Active Plan' : `Get Per Listing (${plans.per_listing.priceDisplay})`}
              </button>
            </div>
          )}

          {/* 3. BUNDLE CARD: Seller Pro + Home Value Worksheet ($197) */}
          {plans.bundle && (
            <div className="relative p-6 rounded-3xl bg-white dark:bg-stone-900 border-2 border-amber-400 shadow-xl flex flex-col justify-between space-y-6 ring-4 ring-amber-400/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Best Value Bundle
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
                    Value Pack
                  </span>
                  <h3 className="font-heading font-bold text-xl text-[#0F2A44] dark:text-white">
                    {plans.bundle.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#0F2A44] dark:text-white font-heading">
                      {plans.bundle.priceDisplay}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">one-time / 6 mos</span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Full Per Listing platform plus certified appraiser home value worksheet and guidance.
                </p>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                    Bundle Inclusions:
                  </span>
                  {plans.bundle.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlan('bundle')}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-md ${
                  currentPlan === 'bundle'
                    ? 'bg-emerald-600 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-[#FF6B5A] hover:opacity-95'
                }`}
              >
                {currentPlan === 'bundle' ? '✓ Active Plan' : `Get Bundle (${plans.bundle.priceDisplay})`}
              </button>
            </div>
          )}

          {/* 4. PRO MONTHLY ($29/mo) */}
          {plans.pro && (
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">
                    Multi-Property
                  </span>
                  <h3 className="font-heading font-bold text-xl text-[#0F2A44] dark:text-white">
                    {plans.pro.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#0F2A44] dark:text-white font-heading">
                      {plans.pro.priceDisplay}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">/ month</span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  For sellers managing up to 3 properties, flippers, or those who want priority AI limits. Cancel anytime.
                </p>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Pro Advantages:
                  </span>
                  {plans.pro.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlan('pro')}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-sm ${
                  currentPlan === 'pro'
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-purple-600 text-white'
                }`}
              >
                {currentPlan === 'pro' ? '✓ Active Plan' : `Subscribe (${plans.pro.priceDisplay})`}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
