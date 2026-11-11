import React, { useState } from 'react';
import { PropertyProfile, PhotoItem, ActiveTab } from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import {
  Sparkles,
  Search,
  Camera,
  Check,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAiWaitTimer } from '../../lib/useAiWaitTimer';
import { AiWaitNotice } from '../common/AiWaitNotice';

interface SectionAiFinderProps {
  property: PropertyProfile;
  photos: PhotoItem[];
  onUpdateProperty: (updated: PropertyProfile) => void;
  onNavigate: (tab: ActiveTab) => void;
}

interface PhotoDetectedFeature {
  photoId: string;
  name: string;
  category: string;
  confidence: string;
  description?: string;
  status: 'pending' | 'added' | 'ignored';
}

interface PublicPropertyFact {
  key: string;
  label: string;
  userValue: any;
  publicValue: any;
  isDifferent: boolean;
}

interface MissingFeatureQuestion {
  id: string;
  question: string;
  featureName: string;
  category: string;
  whyItMatters: string;
  answered?: 'yes' | 'no';
}

export const SectionAiFinder: React.FC<SectionAiFinderProps> = ({
  property,
  photos,
  onUpdateProperty,
  onNavigate,
}) => {
  // 1. Photo Scanner State
  const [isScanningPhotos, setIsScanningPhotos] = useState(false);
  const [photoFeatures, setPhotoFeatures] = useState<PhotoDetectedFeature[]>([]);
  const [photoScanError, setPhotoScanError] = useState<string | null>(null);

  // 2. Public Info State
  const [isCheckingPublic, setIsCheckingPublic] = useState(false);
  const [publicData, setPublicData] = useState<any | null>(null);
  const [publicSources, setPublicSources] = useState<Array<{ title: string; url: string }>>([]);
  const [publicError, setPublicError] = useState<string | null>(null);

  // 3. "What am I missing?" State
  const [isCheckingGaps, setIsCheckingGaps] = useState(false);
  const [gapQuestions, setGapQuestions] = useState<MissingFeatureQuestion[]>([]);
  const [gapError, setGapError] = useState<string | null>(null);

  // 15s wait / 90s timeout handlers
  const { waitMessage: photoWaitMsg } = useAiWaitTimer(isScanningPhotos, () => {
    setIsScanningPhotos(false);
    setPhotoScanError('AI is busy, please try again');
  });

  const { waitMessage: publicWaitMsg } = useAiWaitTimer(isCheckingPublic, () => {
    setIsCheckingPublic(false);
    setPublicError('AI is busy, please try again');
  });

  const { waitMessage: gapWaitMsg } = useAiWaitTimer(isCheckingGaps, () => {
    setIsCheckingGaps(false);
    setGapError('AI is busy, please try again');
  });

  // Action 1: Scan Photos
  const handleScanPhotos = async () => {
    if (photos.length === 0) {
      setPhotoScanError('Please upload at least 1 photo in the Photos tab before scanning.');
      return;
    }
    setIsScanningPhotos(true);
    setPhotoScanError(null);

    const detectedList: PhotoDetectedFeature[] = [...photoFeatures];
    const photosToScan = photos.slice(0, 4);
    let successCount = 0;
    let failedCount = 0;
    let lastErrorDetail = '';

    for (let i = 0; i < photosToScan.length; i++) {
      const p = photosToScan[i];

      // Pause 2 seconds between photos (not all at once) to protect RPM quota
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      try {
        let base64ToSend = p.dataUrl;
        if (base64ToSend && (base64ToSend.startsWith('/') || base64ToSend.startsWith('http'))) {
          try {
            const blobRes = await fetch(base64ToSend);
            const blob = await blobRes.blob();
            base64ToSend = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn('Could not convert photo to base64 in client, sending path:', e);
          }
        }

        const res = await fetch('/api/gemini/photo-features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64ToSend,
            roomHint: p.caption || p.roomCategory,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error('[Gemini Server Diagnostic for Photo Scan]:', {
            photoId: p.id,
            status: res.status,
            rawGeminiError: errData.rawGeminiError || errData.message,
            geminiStatus: errData.geminiStatus,
            modelTried: errData.modelTried,
            isAiBusy: errData.isAiBusy,
            isAiKeyMissing: errData.isAiKeyMissing,
          });
          failedCount++;
          lastErrorDetail = errData.error || errData.message || (res.status === 401 ? 'AI key not configured' : `HTTP ${res.status}`);
          continue; // Keep prior successes, do not wipe progress
        }

        const data = await res.json();
        console.log(`[Gemini Server Diagnostic] Photo ${i + 1}/${photosToScan.length} scanned successfully. Model answered: ${data.modelUsed || 'gemini-3.8-flash'}`);
        successCount++;
        if (data.features && Array.isArray(data.features)) {
          data.features.forEach((feat: any) => {
            // avoid duplicates
            if (!detectedList.some((d) => d.name.toLowerCase() === feat.name.toLowerCase())) {
              detectedList.push({
                photoId: p.id,
                name: feat.name,
                category: feat.category || 'General',
                confidence: feat.confidence || 'high',
                description: feat.description,
                status: property.features.includes(feat.name) ? 'added' : 'pending',
              });
            }
          });
          // Update photoFeatures state immediately so user sees good results in real time!
          setPhotoFeatures([...detectedList]);
        }
      } catch (err: any) {
        console.error('[Photo Scan Network Error]:', err);
        failedCount++;
        lastErrorDetail = err.message || 'Network error';
      }
    }

    if (failedCount > 0) {
      if (successCount > 0) {
        setPhotoScanError(`Scanned ${successCount} of ${photosToScan.length} photos, try again for the rest.`);
      } else {
        setPhotoScanError('AI is busy, please try again in a few minutes');
      }
    } else {
      setPhotoScanError(null);
    }
    setIsScanningPhotos(false);
  };

  const handleAddFeature = (featName: string) => {
    if (!property.features.includes(featName)) {
      onUpdateProperty({
        ...property,
        features: [...property.features, featName],
      });
    }
    setPhotoFeatures((prev) =>
      prev.map((f) => (f.name === featName ? { ...f, status: 'added' } : f))
    );
  };

  const handleIgnoreFeature = (featName: string) => {
    setPhotoFeatures((prev) =>
      prev.map((f) => (f.name === featName ? { ...f, status: 'ignored' } : f))
    );
  };

  // Action 2: Check Public Records
  const handleCheckPublicInfo = async () => {
    if (!property.address) {
      setPublicError('Please specify an address in the Property Profile first.');
      return;
    }
    setIsCheckingPublic(true);
    setPublicError(null);

    try {
      const res = await fetch('/api/gemini/public-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: `${property.address}, ${property.city}`,
          state: property.state || 'Michigan',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[Gemini Server Diagnostic for Public Info]:', {
          status: res.status,
          rawGeminiError: errData.rawGeminiError || errData.message,
          geminiStatus: errData.geminiStatus,
          modelTried: errData.modelTried,
          isAiBusy: errData.isAiBusy,
          isAiKeyMissing: errData.isAiKeyMissing,
        });
        const isBusy = errData.isAiBusy || res.status === 503;
        const msg = isBusy ? 'AI is busy, please try again in a few minutes' : (errData.error || errData.message || (res.status === 401 ? 'AI key not configured' : `HTTP ${res.status}`));
        throw new Error(msg);
      }

      const data = await res.json();
      console.log(`[Gemini Server Diagnostic] Public info answered by model: ${data.modelUsed || 'gemini-3.8-flash'}`);
      setPublicData(data.propertyData || {});
      setPublicSources(data.sources || []);
    } catch (err: any) {
      console.error(err);
      setPublicError(err.message || 'AI is busy, please try again in a few minutes');
    } finally {
      setIsCheckingPublic(false);
    }
  };

  const handleApplyPublicField = (fieldKey: keyof PropertyProfile, publicVal: any) => {
    onUpdateProperty({
      ...property,
      [fieldKey]: publicVal,
    });
  };

  // Action 3: Gap Analysis
  const handleCheckMissingFeatures = async () => {
    setIsCheckingGaps(true);
    setGapError(null);

    try {
      const res = await fetch('/api/gemini/missing-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          state: property.state || 'Michigan',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[Gemini Server Diagnostic for Missing Features]:', {
          status: res.status,
          rawGeminiError: errData.rawGeminiError || errData.message,
          geminiStatus: errData.geminiStatus,
          modelTried: errData.modelTried,
          isAiBusy: errData.isAiBusy,
          isAiKeyMissing: errData.isAiKeyMissing,
        });
        const isBusy = errData.isAiBusy || res.status === 503;
        const msg = isBusy ? 'AI is busy, please try again in a few minutes' : (errData.error || errData.message || (res.status === 401 ? 'AI key not configured' : `HTTP ${res.status}`));
        throw new Error(msg);
      }

      const data = await res.json();
      console.log(`[Gemini Server Diagnostic] Missing features answered by model: ${data.modelUsed || 'gemini-3.8-flash'}`);
      setGapQuestions(data.suggestions || []);
    } catch (err: any) {
      console.error(err);
      setGapError(err.message || 'AI is busy, please try again in a few minutes');
    } finally {
      setIsCheckingGaps(false);
    }
  };

  const handleAnswerGapQuestion = (qId: string, featureName: string, answer: 'yes' | 'no') => {
    setGapQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, answered: answer } : q))
    );

    if (answer === 'yes' && !property.features.includes(featureName)) {
      onUpdateProperty({
        ...property,
        features: [...property.features, featureName],
      });
    }
  };

  // Build comparison rows
  const comparisonRows: PublicPropertyFact[] = publicData
    ? [
        {
          key: 'beds',
          label: 'Bedrooms',
          userValue: property.beds,
          publicValue: publicData.beds,
          isDifferent: publicData.beds != null && publicData.beds !== property.beds,
        },
        {
          key: 'bathsFull',
          label: 'Full Baths',
          userValue: property.bathsFull,
          publicValue: publicData.baths,
          isDifferent: publicData.baths != null && publicData.baths !== property.bathsFull,
        },
        {
          key: 'sqft',
          label: 'Square Footage',
          userValue: property.sqft,
          publicValue: publicData.sqft,
          isDifferent: publicData.sqft != null && publicData.sqft !== property.sqft,
        },
        {
          key: 'lotSize',
          label: 'Lot Size',
          userValue: property.lotSize,
          publicValue: publicData.lotSize,
          isDifferent: publicData.lotSize != null && publicData.lotSize !== property.lotSize,
        },
        {
          key: 'yearBuilt',
          label: 'Year Built',
          userValue: property.yearBuilt,
          publicValue: publicData.yearBuilt,
          isDifferent: publicData.yearBuilt != null && publicData.yearBuilt !== property.yearBuilt,
        },
        {
          key: 'schoolDistrict',
          label: 'School District',
          userValue: property.schoolDistrict,
          publicValue: publicData.schoolDistrict,
          isDifferent:
            publicData.schoolDistrict != null &&
            publicData.schoolDistrict.toLowerCase() !== property.schoolDistrict.toLowerCase(),
        },
        {
          key: 'taxes',
          label: 'Annual Taxes ($)',
          userValue: property.taxes,
          publicValue: publicData.annualTaxes,
          isDifferent:
            publicData.annualTaxes != null && publicData.annualTaxes !== property.taxes,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="AI-assisted verification catches hidden discrepancies before buyers hire appraisers or inspectors. AI never overwrites your data automatically—you always maintain full control."
        nextLabel="Photos & Studio"
        onNext={() => onNavigate('photos')}
      />

      {/* TOOL 1: Scan Photos with Gemini Vision */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-slate-800 text-[#FF6B5A] flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
                Scan My Photos for Features
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F2B544] text-[#0F2A44]">
                  Gemini Vision
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Gemini analyzes finishes, appliances, materials, and architectural elements in your photos.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isScanningPhotos}
              onClick={handleScanPhotos}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] dark:hover:bg-[#fa5644] transition-all disabled:opacity-50 shadow-md shrink-0"
            >
              {isScanningPhotos ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning Photos...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F2B544]" />
                  Scan My Photos
                </>
              )}
            </button>
            <AiWaitNotice message={photoWaitMsg} className="mt-1" />
            {photoScanError && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-red-500 font-medium text-right max-w-xs">
                  {photoScanError}
                </span>
                <button
                  type="button"
                  onClick={handleScanPhotos}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-sm shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {photoScanError && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{photoScanError}</span>
            </div>
            <button
              type="button"
              onClick={handleScanPhotos}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              Try Again
            </button>
          </div>
        )}

        {isScanningPhotos && (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B5A] mx-auto" />
            <p className="text-sm font-semibold text-[#0F2A44] dark:text-white">
              Inspecting materials, countertops, flooring, and appliances...
            </p>
            <p className="text-xs text-slate-400">This takes just a few seconds.</p>
          </div>
        )}

        {!isScanningPhotos && photoFeatures.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Found {photoFeatures.length} visible feature(s). Add the ones you'd like highlighted:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {photoFeatures.map((feat) => (
                <div
                  key={feat.name}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B5A]">
                        {feat.category}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {feat.confidence} confidence
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#0F2A44] dark:text-white">{feat.name}</h4>
                    {feat.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {feat.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-2">
                    {feat.status === 'added' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Added to Profile
                      </span>
                    ) : feat.status === 'ignored' ? (
                      <span className="text-xs text-slate-400">Ignored</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleIgnoreFeature(feat.name)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Ignore
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddFeature(feat.name)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Add
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isScanningPhotos && photoFeatures.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            Click "Scan My Photos" above. Gemini will visually inspect your rooms and extract key buyer-appeal items.
          </div>
        )}
      </div>

      {/* TOOL 2: Check Public Property Records */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
                Check Public Info & Records
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500 text-white">
                  Google Search Grounding
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pulls publicly recorded facts from county records, Redfin, Zillow, and tax assessor databases.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isCheckingPublic}
              onClick={handleCheckPublicInfo}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-blue-600 dark:hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shrink-0"
            >
              {isCheckingPublic ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching Assessor Records...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check Public Info
                </>
              )}
            </button>
            <AiWaitNotice message={publicWaitMsg} className="mt-1" />
            {publicError && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-red-500 font-medium text-right max-w-xs">
                  {publicError}
                </span>
                <button
                  type="button"
                  onClick={handleCheckPublicInfo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {publicError && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{publicError}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckPublicInfo}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-all shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              Try Again
            </button>
          </div>
        )}

        {isCheckingPublic && (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-[#0F2A44] dark:text-white">
              Searching municipal records and MLS historical data for {property.address}...
            </p>
            <p className="text-xs text-slate-400">Grounding findings with active web sources.</p>
          </div>
        )}

        {!isCheckingPublic && publicData && (
          <div className="space-y-4">
            {publicData.summary && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                <strong>Public Record Summary:</strong> {publicData.summary}
              </div>
            )}

            {/* Side by side comparison table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Property Field</th>
                    <th className="p-3">What You Entered</th>
                    <th className="p-3">Public Search Record</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {comparisonRows.map((row) => (
                    <tr
                      key={row.key}
                      className={
                        row.isDifferent
                          ? 'bg-amber-50/60 dark:bg-amber-950/20'
                          : ''
                      }
                    >
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">
                        {row.label}
                      </td>
                      <td className="p-3 text-slate-900 dark:text-white font-bold">
                        {row.userValue !== undefined && row.userValue !== null
                          ? String(row.userValue)
                          : '—'}
                      </td>
                      <td className="p-3">
                        {row.publicValue !== undefined && row.publicValue !== null ? (
                          <span
                            className={
                              row.isDifferent
                                ? 'font-bold text-amber-600 dark:text-amber-400'
                                : 'text-slate-600 dark:text-slate-300'
                            }
                          >
                            {String(row.publicValue)}
                            {row.isDifferent && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                                Discrepancy
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not found</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {row.isDifferent && row.publicValue !== null ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleApplyPublicField(
                                row.key as keyof PropertyProfile,
                                row.publicValue
                              )
                            }
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
                          >
                            Use Public Value
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Match</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sources grounding citation list */}
            {publicSources.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Sources Verified:
                </span>
                <div className="flex flex-wrap gap-2">
                  {publicSources.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isCheckingPublic && !publicData && (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            Click "Check Public Info" to cross-reference your entries with public municipal deeds and assessor records.
          </div>
        )}
      </div>

      {/* TOOL 3: "What am I missing?" */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-slate-800 text-purple-600 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
                What Am I Missing?
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white">
                  Buyer Search Gap Analysis
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Gemini compares your property to common buyer search filters in your market.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isCheckingGaps}
              onClick={handleCheckMissingFeatures}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-purple-600 dark:hover:bg-purple-700 transition-all disabled:opacity-50 shadow-md shrink-0"
            >
              {isCheckingGaps ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Buyer Gaps...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F2B544]" />
                  What Am I Missing?
                </>
              )}
            </button>
            <AiWaitNotice message={gapWaitMsg} className="mt-1" />
            {gapError && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-red-500 font-medium text-right max-w-xs">
                  {gapError}
                </span>
                <button
                  type="button"
                  onClick={handleCheckMissingFeatures}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-sm shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {gapError && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{gapError}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckMissingFeatures}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 transition-all shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              Try Again
            </button>
          </div>
        )}

        {isCheckingGaps && (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-sm font-semibold text-[#0F2A44] dark:text-white">
              Checking high-demand buyer filters for {property.city || 'your area'}...
            </p>
          </div>
        )}

        {!isCheckingGaps && gapQuestions.length > 0 && (
          <div className="space-y-3">
            {gapQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                      {q.category}
                    </span>
                    <span className="text-sm font-bold text-[#0F2A44] dark:text-white">
                      {q.question}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-300">Why buyers search:</strong> {q.whyItMatters}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {q.answered === 'yes' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Check className="w-3.5 h-3.5" /> Added: {q.featureName}
                    </span>
                  ) : q.answered === 'no' ? (
                    <span className="text-xs text-slate-400 px-3 py-1.5">Marked No</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAnswerGapQuestion(q.id, q.featureName, 'no')}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnswerGapQuestion(q.id, q.featureName, 'yes')}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-purple-600 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Yes, Add
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isCheckingGaps && gapQuestions.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            Click "What Am I Missing?" to see questions customized to your house's style, age, and location.
          </div>
        )}
      </div>
    </div>
  );
};
