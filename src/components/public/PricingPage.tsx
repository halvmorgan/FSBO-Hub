import React, { useEffect } from 'react';
import { SaasConfig, PlanType } from '../../types/saas';
import {
  Check,
  X,
  Home,
  Compass,
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

  useEffect(() => {
    const scrollToCompare = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#compare') {
        const el = document.getElementById('compare');
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      }
    };

    scrollToCompare();
    window.addEventListener('hashchange', scrollToCompare);
    return () => window.removeEventListener('hashchange', scrollToCompare);
  }, []);

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
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm text-white">
                FSBO <span className="text-[#FF6B5A]">Compass</span>
              </span>
              <span className="block text-[10px] text-slate-300">Your step-by-step guide to selling your home without an agent.</span>
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

        {/* Compare Plans Section */}
        <section id="compare" className="pt-10 scroll-mt-12 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#0F2A44] dark:text-white">
              Compare Plans
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              See exactly what's included in each plan.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-xs">
                  <th scope="col" className="p-4 sm:p-5 font-bold uppercase tracking-wider text-stone-500 sticky left-0 z-20 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[200px]">
                    Feature
                  </th>
                  <th scope="col" className="p-4 sm:p-5 font-bold text-center text-[#0F2A44] dark:text-white w-1/4">
                    <span className="block text-base font-extrabold">{plans.per_listing?.name || 'Per Listing'}</span>
                    <span className="text-[11px] font-medium text-stone-500">
                      {plans.per_listing?.priceDisplay || '$149'} one time
                    </span>
                  </th>
                  <th scope="col" className="p-4 sm:p-5 font-bold text-center text-[#0F2A44] dark:text-white w-1/4 bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50 relative">
                    <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full mb-1">
                      <Sparkles className="w-2.5 h-2.5" /> Best Value
                    </div>
                    <span className="block text-base font-extrabold">{plans.bundle?.name || 'Bundle'}</span>
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                      {plans.bundle?.priceDisplay || '$197'} one time
                    </span>
                  </th>
                  <th scope="col" className="p-4 sm:p-5 font-bold text-center text-[#0F2A44] dark:text-white w-1/4">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full mb-1">
                      Up to 3 homes
                    </span>
                    <span className="block text-base font-extrabold">{plans.pro?.name || 'Pro Monthly'}</span>
                    <span className="text-[11px] font-medium text-stone-500">
                      ${plans.pro?.priceAmount || 29} a month
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs sm:text-sm">
                {/* Row 1: Price */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#0F2A44] dark:text-white sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    Price
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-700 dark:text-stone-300">
                    {plans.per_listing?.priceDisplay || '$149'} one time
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-900 dark:text-stone-100 bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    {plans.bundle?.priceDisplay || '$197'} one time
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-700 dark:text-stone-300">
                    ${plans.pro?.priceAmount || 29} a month
                  </td>
                </tr>

                {/* Row 2: How long */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#0F2A44] dark:text-white sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    How long
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-700 dark:text-stone-300">
                    {plans.per_listing?.billingPeriod || '6 months'}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-900 dark:text-stone-100 bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    {plans.bundle?.billingPeriod || '6 months'}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-700 dark:text-stone-300">
                    As long as you're subscribed
                  </td>
                </tr>

                {/* Row 3: Properties */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#0F2A44] dark:text-white sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    Properties
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-700 dark:text-stone-300">
                    {plans.per_listing?.propertyLimit || 1}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-900 dark:text-stone-100 bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    {plans.bundle?.propertyLimit || 1}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-purple-700 dark:text-purple-400 font-extrabold">
                    Up to {plans.pro?.propertyLimit || 3}
                  </td>
                </tr>

                {/* Row 4: AI credits */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#0F2A44] dark:text-white sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    AI credits
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-700 dark:text-stone-300">
                    {plans.per_listing?.aiCreditsMonthly || 300} total
                  </td>
                  <td className="p-4 sm:p-5 text-center text-stone-900 dark:text-stone-100 bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    {plans.bundle?.aiCreditsMonthly || 600} total
                  </td>
                  <td className="p-4 sm:p-5 text-center text-purple-700 dark:text-purple-400 font-extrabold">
                    {plans.pro?.aiCreditsMonthly ? plans.pro.aiCreditsMonthly.toLocaleString() : '1,000'} every month
                  </td>
                </tr>

                {/* Row 5: Website, showings & offers tools */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#0F2A44] dark:text-white sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    Website, showings & offers tools
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Included</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Included</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Included</span>
                  </td>
                </tr>

                {/* Row 6: Home Value Worksheet + appraisal guide */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#0F2A44] dark:text-white sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    Home Value Worksheet + appraisal guide
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Not included</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500/20">
                      <Check className="w-4 h-4 font-bold" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Included</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Not included</span>
                  </td>
                </tr>

                {/* Row 7: Open house sign-in sheets */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#0F2A44] dark:text-white sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    Open house sign-in sheets
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Not included</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500/20">
                      <Check className="w-4 h-4 font-bold" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Included</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Not included</span>
                  </td>
                </tr>

                {/* Row 8: Unlimited listing rewrites */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#0F2A44] dark:text-white sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    Unlimited listing rewrites
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Not included</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Not included</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500/20">
                      <Check className="w-4 h-4 font-bold" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Included</span>
                  </td>
                </tr>

                {/* Row 9: Choose Buttons */}
                <tr className="bg-stone-50/40 dark:bg-stone-800/20">
                  <td className="p-4 sm:p-5 sticky left-0 z-10 bg-white dark:bg-stone-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] font-semibold text-xs text-stone-400">
                    Get Started
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectPlan('per_listing')}
                      className={`w-full max-w-[140px] mx-auto py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        currentPlan === 'per_listing'
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-[#FF6B5A] hover:bg-[#fa5644] text-white'
                      }`}
                    >
                      {currentPlan === 'per_listing' ? 'Active' : 'Choose'}
                    </button>
                  </td>
                  <td className="p-4 sm:p-5 text-center bg-amber-50/60 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-800/50">
                    <button
                      type="button"
                      onClick={() => onSelectPlan('bundle')}
                      className={`w-full max-w-[140px] mx-auto py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        currentPlan === 'bundle'
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                      }`}
                    >
                      {currentPlan === 'bundle' ? 'Active' : 'Choose'}
                    </button>
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectPlan('pro')}
                      className={`w-full max-w-[140px] mx-auto py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        currentPlan === 'pro'
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-purple-600 dark:hover:bg-purple-500 text-white'
                      }`}
                    >
                      {currentPlan === 'pro' ? 'Active' : 'Choose'}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};
