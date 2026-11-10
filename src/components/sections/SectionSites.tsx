import React, { useState } from 'react';
import {
  ListingSiteItem,
  ListingCopyData,
  ActiveTab,
  PropertyProfile,
} from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import { Tooltip } from '../common/Tooltip';
import {
  Share2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Plus,
  AlertCircle,
  HelpCircle,
  Calendar,
  Globe,
  RefreshCw,
} from 'lucide-react';

interface SectionSitesProps {
  sites: ListingSiteItem[];
  listingCopy: ListingCopyData | null;
  property: PropertyProfile;
  onUpdateSites: (sites: ListingSiteItem[]) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionSites: React.FC<SectionSitesProps> = ({
  sites,
  listingCopy,
  property,
  onUpdateSites,
  onNavigate,
}) => {
  const [copiedSiteId, setCopiedSiteId] = useState<string | null>(null);
  const [checkingSiteId, setCheckingSiteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  const liveCount = sites.filter((s) => s.status === 'Live').length;
  const progressPct = Math.round((liveCount / sites.length) * 100);

  const handleStatusChange = (siteId: string, newStatus: ListingSiteItem['status']) => {
    const updated = sites.map((s) => {
      if (s.id === siteId) {
        return {
          ...s,
          status: newStatus,
          datePosted:
            newStatus === 'Live' && !s.datePosted
              ? new Date().toISOString().split('T')[0]
              : s.datePosted,
        };
      }
      return s;
    });
    onUpdateSites(updated);
  };

  const handleUrlChange = (siteId: string, listingUrl: string) => {
    onUpdateSites(
      sites.map((s) => (s.id === siteId ? { ...s, listingUrl } : s))
    );
  };

  const handleCopyListingForSite = (site: ListingSiteItem) => {
    let copyText = '';
    const siteKey = site.id.toLowerCase();

    if (siteKey.includes('facebook')) {
      copyText = listingCopy?.marketplaceVersion || `${property.address} - For Sale By Owner`;
    } else if (siteKey.includes('craigslist')) {
      copyText = listingCopy?.craigslistVersion || `${property.address} - For Sale By Owner`;
    } else {
      copyText = listingCopy
        ? `${listingCopy.headline}\n\n${listingCopy.fullDescription}\n\nKEY FACTS:\n${listingCopy.keyFactsBlock}\n\nUPGRADES:\n${listingCopy.upgradesListBlock}`
        : `${property.address} - For Sale By Owner: $${property.price.toLocaleString()}, ${property.beds} Beds, ${property.bathsFull} Baths, ${property.sqft} SqFt.`;
    }

    navigator.clipboard.writeText(copyText);
    setCopiedSiteId(site.id);
    setTimeout(() => setCopiedSiteId(null), 2000);
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [siteErrors, setSiteErrors] = useState<Record<string, string>>({});

  // Gemini + Google Search Grounding: Check Current Rules
  const handleCheckRules = async (site: ListingSiteItem) => {
    setCheckingSiteId(site.id);
    setErrorMessage(null);
    setSiteErrors((prev) => {
      const copy = { ...prev };
      delete copy[site.id];
      return copy;
    });

    try {
      const res = await fetch('/api/gemini/site-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName: site.name }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error('[Gemini Server Diagnostic for Site Rules]:', {
          status: res.status,
          rawGeminiError: errJson.rawGeminiError || errJson.message,
          geminiStatus: errJson.geminiStatus,
          modelTried: errJson.modelTried,
          isAiBusy: errJson.isAiBusy,
        });
        const isBusy = errJson.isAiBusy || res.status === 503;
        throw new Error(isBusy ? 'AI is busy, please try again in a few minutes' : (errJson.error || errJson.message || (res.status === 401 ? 'AI key not configured' : `HTTP ${res.status}`)));
      }
      const data = await res.json();
      console.log(`[Gemini Server Diagnostic] Site Rules answered by model: ${data.modelUsed || 'gemini-3.8-flash'}`);

      const ruleData = data.ruleData || {};
      const sources = data.sources || [];
      const asOfDate = data.asOfDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const updated = sites.map((s) => {
        if (s.id === site.id) {
          return {
            ...s,
            directOwnerAllowed: ruleData.directOwnerAllowed ?? s.directOwnerAllowed,
            costSummary: ruleData.costSummary || s.costSummary,
            currentPolicySummary: ruleData.currentPolicySummary || s.currentPolicySummary,
            recommendedAction: ruleData.recommendedAction || s.recommendedAction,
            asOfDate,
            sources,
          };
        }
        return s;
      });
      onUpdateSites(updated);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Rule check failed. Please try again.';
      setErrorMessage(msg);
      setSiteErrors((prev) => ({ ...prev, [site.id]: msg }));
      setTimeout(() => setErrorMessage(null), 8000);
    } finally {
      setCheckingSiteId(null);
    }
  };

  const handleAddCustomSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) return;

    const newSite: ListingSiteItem = {
      id: 'custom-' + Date.now(),
      name: newSiteName.trim(),
      logoLetter: newSiteName.trim().charAt(0).toUpperCase(),
      logoColor: '#1E6F80',
      directUrl: newSiteUrl.trim() || 'https://google.com',
      status: 'Not started',
      directOwnerAllowed: true,
      costSummary: 'Verify on site',
      currentPolicySummary: '',
    };

    onUpdateSites([...sites, newSite]);
    setNewSiteName('');
    setNewSiteUrl('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Listing across multiple portals gives your home broad reach. Buyers search portals like Zillow, Redfin, and Facebook Marketplace directly to find local homes."
        nextLabel="Property Website Builder"
        onNext={() => onNavigate('website')}
      />

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-700 hover:text-amber-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#FF6B5A]" />
              Listing Sites Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Track status, URLs, and real-time owner listing policies across major real estate channels.
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-[#FF6B5A]">
              Listed on {liveCount} of {sites.length} sites ({progressPct}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B5A] to-[#F2B544] transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
          * Note: Policies on owner listings change frequently. Check rules with Google Search grounding before paying any third party.
        </div>
      </div>

      {/* Grid of Site Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site) => (
          <div
            key={site.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            {/* Header: Logo + Name + Status */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 font-heading text-lg"
                    style={{ backgroundColor: site.logoColor || '#0F2A44' }}
                  >
                    {site.logoLetter || site.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white flex items-center gap-1.5">
                      {site.name}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {site.costSummary || 'Tap Check Rules for pricing'}
                    </span>
                  </div>
                </div>

                {/* Status Dropdown */}
                <select
                  value={site.status}
                  onChange={(e) => handleStatusChange(site.id, e.target.value as any)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none ${
                    site.status === 'Live'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : site.status === 'In progress'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                      : site.status === 'Needs refresh'
                      ? 'bg-orange-50 text-orange-700 border-orange-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <option value="Not started">Not started</option>
                  <option value="In progress">In progress</option>
                  <option value="Live">Live ✅</option>
                  <option value="Needs refresh">Needs refresh ⚠️</option>
                </select>
              </div>

              {/* Policy summary banner or invitation to check */}
              {site.currentPolicySummary ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>
                      {site.directOwnerAllowed
                        ? '✅ Direct Owner Allowed'
                        : 'ℹ️ Requires Flat-Fee MLS'}
                    </span>
                    {site.asOfDate && <span className="text-[#0F2A44] dark:text-amber-300 font-semibold">Verified {site.asOfDate}</span>}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {site.currentPolicySummary}
                  </p>
                  {site.recommendedAction && (
                    <div className="text-[11px] font-semibold text-[#0F2A44] dark:text-[#F2B544]">
                      Advice: {site.recommendedAction}
                    </div>
                  )}

                  {site.sources && site.sources.length > 0 && (
                    <div className="pt-1.5 flex flex-wrap items-center gap-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400">Sources:</span>
                      {site.sources.slice(0, 3).map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {src.title && src.title.length > 25 ? `${src.title.slice(0, 25)}...` : (src.title || 'Source')}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 my-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] italic">
                    Tap 'Check Current Rules' to see this site's latest owner-listing policy
                  </span>
                </div>
              )}

              {/* Listing URL once live */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Active Listing URL on {site.name}:
                </label>
                <input
                  type="url"
                  value={site.listingUrl || ''}
                  onChange={(e) => handleUrlChange(site.id, e.target.value)}
                  placeholder={`Paste link to your live ${site.name} page`}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-[#FF6B5A] focus:outline-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                <button
                  type="button"
                  disabled={checkingSiteId === site.id}
                  onClick={() => handleCheckRules(site)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0F2A44] dark:hover:text-amber-300 transition-colors disabled:opacity-50"
                >
                  {checkingSiteId === site.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Checking Rules...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#F2B544]" />
                      Check Current Rules
                    </>
                  )}
                </button>
                {siteErrors[site.id] && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-red-500 font-medium">
                      {siteErrors[site.id]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCheckRules(site)}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#FF6B5A] hover:underline shrink-0"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyListingForSite(site)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                >
                  {copiedSiteId === site.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Listing
                    </>
                  )}
                </button>

                <a
                  href={site.directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] transition-all"
                >
                  <span>Open Site</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Another Site Button */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[#FF6B5A] hover:text-[#FF6B5A] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Another Site or Portal</span>
        </button>
      </div>

      {/* Modal to add custom site */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Add Custom Listing Site
            </h4>
            <form onSubmit={handleAddCustomSite} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  required
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g. Local Neighborhood MLS or Fizber"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#0F2A44] dark:bg-[#FF6B5A]"
                >
                  Add Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
