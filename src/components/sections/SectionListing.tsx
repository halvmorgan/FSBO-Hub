import React, { useState } from 'react';
import { PropertyProfile, ListingCopyData, ActiveTab } from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import { ListingErrorBoundary } from '../common/ListingErrorBoundary';
import {
  formatKeyFacts,
  formatUpgradesList,
  formatAiText,
  sanitizeListingCopy,
} from '../../lib/formatAiCopy';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { useAiWaitTimer } from '../../lib/useAiWaitTimer';
import { AiWaitNotice } from '../common/AiWaitNotice';

interface SectionListingProps {
  property: PropertyProfile;
  listingCopy: ListingCopyData | null;
  onUpdateListingCopy: (copy: ListingCopyData) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionListing: React.FC<SectionListingProps> = ({
  property,
  listingCopy,
  onUpdateListingCopy,
  onNavigate,
}) => {
  const [tone, setTone] = useState<'Warm' | 'Professional' | 'Luxury' | 'Investor'>('Warm');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { waitMessage } = useAiWaitTimer(isGenerating, () => {
    setIsGenerating(false);
    setErrorMsg('AI is busy, please try again');
  });

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateCopy = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/listing-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          tone,
          state: property.state || 'Michigan',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[Gemini Server Diagnostic for Listing Copy]:', {
          status: res.status,
          rawGeminiError: errData.rawGeminiError || errData.message,
          geminiStatus: errData.geminiStatus,
          modelTried: errData.modelTried,
          isAiBusy: errData.isAiBusy,
          isAiKeyMissing: errData.isAiKeyMissing,
        });
        const isBusy = errData.isAiBusy || res.status === 503;
        const msg = isBusy ? 'AI is busy, please try again in a few minutes' : (errData.error || errData.message || (res.status === 401 ? 'AI key not configured' : `Generation failed (${res.status})`));
        throw new Error(msg);
      }

      const data = await res.json();
      console.log(`[Gemini Server Diagnostic] Listing Copy answered by model: ${data.modelUsed || 'gemini-3.8-flash'}`);
      
      const defaultHeadline = `${property.address} - Move-In Ready Home`;
      const updatedCopy = sanitizeListingCopy(data, defaultHeadline, tone);

      onUpdateListingCopy(updatedCopy);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'AI is busy, please try again in a few minutes');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Compelling copy tells an emotional story about the house while adhering strictly to Fair Housing rules. Tailored lengths for Facebook, Craigslist, and flyers ensure maximum engagement on each platform."
        nextLabel="Listing Sites Tracker"
        onNext={() => onNavigate('sites')}
      />

      {/* Generation Bar with Tone Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF6B5A]" />
              AI Listing Writer & Fair Housing Guardrail
            </h3>
            <p className="text-xs text-slate-500">
              Select your preferred tone. Gemini formats your property profile and upgrades into multi-platform listings.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] dark:hover:bg-[#fa5644] transition-all disabled:opacity-50 shadow-md shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Crafting Compliant Copy...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F2B544]" />
                  {listingCopy ? 'Regenerate All Versions' : 'Generate Complete Listing'}
                </>
              )}
            </button>
            <AiWaitNotice message={waitMessage} className="mt-1" />
            {errorMsg && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-red-500 font-medium text-right max-w-xs">
                  {errorMsg}
                </span>
                <button
                  type="button"
                  onClick={handleGenerateCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-sm shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tone Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-2">Listing Tone:</span>
          {(['Warm', 'Professional', 'Luxury', 'Investor'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                tone === t
                  ? 'bg-[#FF6B5A] text-white shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t === 'Warm' && '🏡 Warm & Welcoming'}
              {t === 'Professional' && '👔 Clean & Professional'}
              {t === 'Luxury' && '✨ Luxury & High-End'}
              {t === 'Investor' && '📊 Investor & Cap Rate'}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Fair Housing Guardrail Banner */}
      {listingCopy && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
            listingCopy.fairHousingAudit?.isClean
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm flex items-center gap-2">
              <span>Fair Housing Guardrail: 100% Verified</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100">
                Safe to Publish
              </span>
            </div>
            <p>
              {formatAiText(
                listingCopy.fairHousingAudit?.complianceNote,
                'This copy strictly describes the physical features and amenities of the house, without using demographic terms or protected-class descriptors.'
              )}
            </p>
            {Array.isArray(listingCopy.fairHousingAudit?.flaggedPhrases) &&
              listingCopy.fairHousingAudit.flaggedPhrases.length > 0 && (
                <div className="mt-2 text-amber-800 font-medium">
                  Phrases avoided / adjusted:{' '}
                  {listingCopy.fairHousingAudit.flaggedPhrases.map((p) => String(p)).join(', ')}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Output Versions Wrapped in Error Boundary */}
      <ListingErrorBoundary onReset={() => setErrorMsg(null)}>
        {listingCopy ? (
          <div className="space-y-6">
            {/* 1. Full MLS & Website Description */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B5A]">
                    Primary Version (Zillow, FSBO Portals, Property Website)
                  </span>
                  <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                    {formatAiText(listingCopy.headline, `${property.address} - Move-In Ready Home`)}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'full',
                      `${formatAiText(listingCopy.headline)}\n\n${formatAiText(listingCopy.fullDescription)}\n\nKEY FACTS:\n${formatKeyFacts(listingCopy.keyFactsBlock)}\n\nRECENT UPGRADES:\n${formatUpgradesList(listingCopy.upgradesListBlock)}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] transition-all"
                >
                  {copiedKey === 'full' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Full Listing
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                {formatAiText(listingCopy.fullDescription)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <span className="font-bold text-[#0F2A44] dark:text-white block mb-1">
                    Key Facts Block:
                  </span>
                  <div className="text-slate-600 dark:text-slate-400 whitespace-pre-line font-mono text-[11px]">
                    {formatKeyFacts(listingCopy.keyFactsBlock)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <span className="font-bold text-[#0F2A44] dark:text-white block mb-1">
                    Upgrades Summary:
                  </span>
                  <div className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {formatUpgradesList(listingCopy.upgradesListBlock)}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Platform Formats (Facebook Marketplace & Craigslist) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Facebook Marketplace */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Facebook Marketplace Format
                    </span>
                    <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">
                      Optimized for Mobile Feed
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('fb', formatAiText(listingCopy.marketplaceVersion))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                  >
                    {copiedKey === 'fb' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy FB Post
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl max-h-60 overflow-y-auto">
                  {formatAiText(listingCopy.marketplaceVersion)}
                </div>
              </div>

              {/* Craigslist Version */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                      Craigslist Format
                    </span>
                    <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">
                      Scannable Itemized Format
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('cl', formatAiText(listingCopy.craigslistVersion))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-all"
                  >
                    {copiedKey === 'cl' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Craigslist
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl max-h-60 overflow-y-auto font-mono text-[11px]">
                  {formatAiText(listingCopy.craigslistVersion)}
                </div>
              </div>
            </div>

            {/* 3. Social Post & Yard Flyer Teaser */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Social Post */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B5A]">
                    Social Announcement (Nextdoor / Instagram)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('social', formatAiText(listingCopy.socialPostVersion))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {copiedKey === 'social' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                  {formatAiText(listingCopy.socialPostVersion)}
                </div>
              </div>

              {/* 2-Sentence Flyer Teaser */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2B544]">
                    Yard Flyer Teaser (Exact 2 Sentences)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('flyer', formatAiText(listingCopy.flyerTeaser))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {copiedKey === 'flyer' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold italic bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/60">
                  "{formatAiText(listingCopy.flyerTeaser)}"
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#0F2A44] dark:text-white">
              No listing copy generated yet
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Click "Generate Complete Listing" above to instantly craft 5 compliant formats for Zillow, Facebook Marketplace, Craigslist, and your yard flyer.
            </p>
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#FF6B5A] hover:bg-[#fa5644] shadow-md shadow-[#FF6B5A]/25"
            >
              <Sparkles className="w-4 h-4 text-[#F2B544]" />
              Generate Complete Listing
            </button>
          </div>
        )}
      </ListingErrorBoundary>
    </div>
  );
};
