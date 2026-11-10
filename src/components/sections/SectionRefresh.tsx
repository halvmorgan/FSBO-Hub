import React, { useState } from 'react';
import {
  PropertyProfile,
  Settings,
  ListingSiteItem,
  PriceHistoryRecord,
  ActiveTab,
} from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import {
  RefreshCw,
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';

interface SectionRefreshProps {
  property: PropertyProfile;
  settings: Settings;
  sites: ListingSiteItem[];
  priceHistory: PriceHistoryRecord[];
  lastRefreshDate?: string;
  onUpdateProperty: (prop: PropertyProfile) => void;
  onUpdateSettings: (settings: Settings) => void;
  onUpdatePriceHistory: (history: PriceHistoryRecord[]) => void;
  onPerformRefresh: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionRefresh: React.FC<SectionRefreshProps> = ({
  property,
  settings,
  sites,
  priceHistory,
  lastRefreshDate,
  onUpdateProperty,
  onUpdateSettings,
  onUpdatePriceHistory,
  onPerformRefresh,
  onNavigate,
}) => {
  const [newPriceInput, setNewPriceInput] = useState(property.price.toString());
  const [priceReason, setPriceReason] = useState('Market adjustment to attract new wave of buyers');
  const [copiedPost, setCopiedPost] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(settings.refreshIntervalDays || 7);

  // Per site refresh checklist state
  const [siteChecklist, setSiteChecklist] = useState<Record<string, boolean>>({
    'Swap cover photo to kitchen or backyard view': false,
    'Renew / repost listing on Facebook Marketplace': false,
    'Renew listing on Craigslist Housing': false,
    'Tweak headline with seasonal or highlight upgrade': false,
    'Bump / post new open house date to Zillow': false,
    'Share price drop or open house to town Facebook groups': false,
  });

  const toggleCheck = (item: string) => {
    setSiteChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const daysSinceRefresh = lastRefreshDate
    ? Math.floor((Date.now() - new Date(lastRefreshDate).getTime()) / (1000 * 3600 * 24))
    : 0;
  const isDue = daysSinceRefresh >= refreshInterval;

  const handlePriceDropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const np = parseInt(newPriceInput);
    if (!np || np === property.price) return;

    const record: PriceHistoryRecord = {
      id: 'pr-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      oldPrice: property.price,
      newPrice: np,
      reason: priceReason,
    };

    onUpdatePriceHistory([record, ...priceHistory]);
    onUpdateProperty({
      ...property,
      price: np,
      originalPrice: property.originalPrice || property.price,
    });
  };

  const priceDropPost = `🚨 PRICE IMPROVED! Now offered at $${property.price.toLocaleString()} (was $${(
    property.originalPrice || property.price + 10000
  ).toLocaleString()})!\n\n📍 ${property.address}, ${property.city}\n🛏️ ${property.beds} Bedrooms • 🛁 ${property.bathsFull}.${property.bathsHalf} Baths • 📐 ${property.sqft.toLocaleString()} SqFt\n\nDirect from owner, move-in ready with upgraded kitchen and roof. Book your private walkthrough or view full photo gallery:\nhttps://${property.address.replace(/\s+/g, '').toLowerCase()}.com\n\nCall/text owner: ${settings.sellerPhone}`;

  const handleCopyPriceDropPost = () => {
    navigator.clipboard.writeText(priceDropPost);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2000);
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Real estate algorithms prioritize recently updated listings. Rotating your primary photo and updating copy every 7–14 days triggers new email alerts to saved buyers on Zillow and Redfin."
        nextLabel="Documents, Offers & Closing"
        onNext={() => onNavigate('closing')}
      />

      {/* Refresh Status & Cadence Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#FF6B5A]" />
              Listing Refresh Cadence
            </h3>
            <p className="text-xs text-slate-500">
              Keep your home at the top of buyer search feeds without paying agent marketing fees.
            </p>
          </div>

          <button
            type="button"
            onClick={onPerformRefresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Listing Refreshed Today
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Days Since Last Refresh</span>
            <div className="text-2xl font-bold font-heading text-[#0F2A44] dark:text-white">
              {daysSinceRefresh} Days Ago
            </div>
            <span className="text-[11px] text-slate-400">
              {lastRefreshDate ? `Recorded on ${lastRefreshDate}` : 'No refresh recorded yet'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Your Reminder Cadence</span>
            <select
              value={refreshInterval}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setRefreshInterval(val);
                onUpdateSettings({ ...settings, refreshIntervalDays: val });
              }}
              className="text-sm font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 mt-1 focus:outline-none"
            >
              <option value={7}>Every 7 Days (Recommended)</option>
              <option value={10}>Every 10 Days</option>
              <option value={14}>Every 14 Days</option>
            </select>
            <span className="text-[11px] text-slate-400 block">Alerts appear on Home dashboard</span>
          </div>

          <div
            className={`p-4 rounded-2xl border space-y-1 flex flex-col justify-center ${
              isDue
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider">Freshness Status</span>
            <div className="text-base font-bold">
              {isDue ? '⚠️ Refresh Recommended' : '✅ Active & Fresh'}
            </div>
            <span className="text-[11px] opacity-80">
              {isDue ? 'Algorithm reach is cooling off' : 'Strong algorithm positioning'}
            </span>
          </div>
        </div>
      </div>

      {/* Routine Refresh Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Routine 7-Day Refresh Checklist
            </h3>
            <p className="text-xs text-slate-500">
              Complete these 6 simple steps to simulate a "new listing" bump.
            </p>
          </div>
          <span className="text-xs font-bold text-[#FF6B5A]">
            {Object.values(siteChecklist).filter(Boolean).length} of {Object.keys(siteChecklist).length} Completed
          </span>
        </div>

        <div className="space-y-2">
          {Object.entries(siteChecklist).map(([step, done]) => (
            <div
              key={step}
              onClick={() => toggleCheck(step)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                done
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 line-through text-slate-400'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{step}</span>
              </div>
              {done && <span className="text-[10px] font-bold text-emerald-600">Done</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Price Change Workflow & Auto "Price Reduced" Posts */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-slate-800 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                Price Adjustment Workflow & Announcement
              </h3>
              <p className="text-xs text-slate-500">
                Updating your price here auto-creates a "Price Reduced" ribbon across your website and generates announcement posts.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePriceDropSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">New Adjusted Price ($)</label>
            <input
              type="number"
              value={newPriceInput}
              onChange={(e) => setNewPriceInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-[#0F2A44] dark:text-white focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1">Reason for Adjustment</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#FF6B5A] hover:bg-[#fa5644] shrink-0"
              >
                Apply New Price
              </button>
            </div>
          </div>
        </form>

        {/* Auto-generated Price Improved Announcement Post */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F2B544]" />
              Auto-Generated "Price Improved!" Social Announcement:
            </span>
            <button
              type="button"
              onClick={handleCopyPriceDropPost}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A]"
            >
              {copiedPost ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPost ? 'Copied!' : 'Copy Announcement'}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono text-[11px]">
            {priceDropPost}
          </div>
        </div>
      </div>
    </div>
  );
};
