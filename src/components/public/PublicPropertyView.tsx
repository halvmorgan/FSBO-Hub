import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  Building,
  GraduationCap,
  Hammer,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PublicSiteDoc } from '../../types/saas';
import { incrementFirestoreReadCount } from '../../lib/firestoreTracker';

interface PublicPropertyViewProps {
  slug: string;
  onNavigateHome?: () => void;
}

export const PublicPropertyView: React.FC<PublicPropertyViewProps> = ({
  slug,
  onNavigateHome,
}) => {
  const [property, setProperty] = useState<PublicSiteDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Showing request form state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [hasPreApproval, setHasPreApproval] = useState(false);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [cachedBanner, setCachedBanner] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!slug) return;
      const cacheKey = `fsbo_public_site_${slug}`;
      const cacheTimeKey = `fsbo_public_site_ts_${slug}`;
      const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute cache prevents quota exhaustion on public visits

      let cachedData: PublicSiteDoc | null = null;
      let isFresh = false;
      try {
        const raw = localStorage.getItem(cacheKey);
        const timeStr = localStorage.getItem(cacheTimeKey);
        if (raw) {
          cachedData = JSON.parse(raw);
          if (timeStr && Date.now() - parseInt(timeStr, 10) < CACHE_TTL_MS) {
            isFresh = true;
          }
        }
      } catch (e) {}

      // 1. If cached listing is fresh, render immediately with 0 Firestore reads!
      if (isFresh && cachedData) {
        setProperty(cachedData);
        setCachedBanner(false);
        setLoading(false);
        return;
      }

      // 2. Fetch from Firestore only if cache is absent or expired (>15 mins)
      try {
        setLoading(true);
        setError(null);
        const ref = doc(db, 'publicSites', slug);
        incrementFirestoreReadCount(`publicSites/${slug}`, 1);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          if (cachedData) {
            setProperty(cachedData);
            setCachedBanner(true);
            return;
          }
          setError('This listing could not be found or may have been unlisted.');
          return;
        }

        const data = snap.data() as PublicSiteDoc;
        if (data.status !== 'active') {
          setError('This property listing is currently inactive or under contract.');
          return;
        }

        setProperty(data);
        setCachedBanner(false);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch (e) {}
      } catch (err: any) {
        console.warn('Error loading public site (falling back to cache):', err);
        if (cachedData) {
          setProperty(cachedData);
          setCachedBanner(true);
        } else {
          setError('Property details are momentarily unavailable. Please check back shortly.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [slug]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!buyerName || !buyerPhone || !buyerEmail) {
      setFormError('Please fill in your name, phone number, and email.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public-sites/${slug}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName,
          buyerPhone,
          buyerEmail,
          preferredDate,
          hasPreApproval,
          message,
          honeypot,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit showing request.');
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setFormError(err.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#FF6B5A] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-heading font-bold text-[#0F2A44]">Loading Property Showcase...</h2>
        <p className="text-sm text-stone-500 mt-1">Direct from the homeowner</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-stone-200 text-stone-600 rounded-3xl flex items-center justify-center mb-4">
          <Building className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-[#0F2A44]">Property Details Momentarily Unavailable</h2>
        <p className="text-stone-600 max-w-md mt-2 text-sm">{error || 'This property showcase is momentarily unavailable. Please check back in a few moments.'}</p>
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="mt-6 px-6 py-2.5 bg-[#0F2A44] text-white font-semibold text-sm rounded-xl hover:bg-[#1A3D60] transition-colors"
          >
            Go to Homepage
          </button>
        )}
      </div>
    );
  }

  const allPhotos = property.photos && property.photos.length > 0
    ? property.photos
    : property.coverPhotoUrl
    ? [{ id: 'cover', url: property.coverPhotoUrl, caption: 'Front Exterior', isCover: true }]
    : [];

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#0F2A44] font-sans">
      {cachedBanner && (
        <div className="bg-amber-50 text-amber-900 border-b border-amber-200 px-4 py-2 text-xs text-center font-medium">
          Viewing cached listing details. Live updates will refresh shortly.
        </div>
      )}
      {/* Top Floating Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
              For Sale By Owner
            </span>
            <div className="truncate hidden sm:block">
              <span className="font-heading font-bold text-sm text-[#0F2A44]">{property.address}</span>
              <span className="text-xs text-stone-500 ml-1">
                {property.city}, {property.state}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg sm:text-xl font-heading font-extrabold text-[#0F2A44]">
                ${property.price.toLocaleString()}
              </div>
            </div>
            <a
              href="#schedule-showing"
              className="px-4 py-2 bg-[#FF6B5A] hover:bg-[#e85a4a] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all"
            >
              Schedule Tour
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Open House Banner if available */}
        {property.openHouses && property.openHouses.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
                  Upcoming Open House
                </span>
                <h4 className="text-base sm:text-lg font-heading font-extrabold">
                  {property.openHouses[0].date} &bull; {property.openHouses[0].startTime} - {property.openHouses[0].endTime}
                </h4>
                {property.openHouses[0].notes && (
                  <p className="text-xs text-amber-100">{property.openHouses[0].notes}</p>
                )}
              </div>
            </div>
            <a
              href="#schedule-showing"
              className="px-5 py-2.5 bg-white text-[#0F2A44] font-bold text-xs sm:text-sm rounded-xl shadow hover:bg-stone-50 transition-all shrink-0"
            >
              RSVP / Tour Request
            </a>
          </div>
        )}

        {/* Photo Gallery Grid */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-stone-200 mb-8">
          {allPhotos.length > 0 ? (
            <div>
              {/* Featured Main Photo */}
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-900 shadow-inner group">
                <img
                  src={allPhotos[activePhotoIdx]?.url}
                  alt={allPhotos[activePhotoIdx]?.caption || property.address}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                {/* Overlay Badge */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                  {allPhotos[activePhotoIdx]?.caption || `Photo ${activePhotoIdx + 1} of ${allPhotos.length}`}
                </div>

                {/* Arrows */}
                {allPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActivePhotoIdx((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1))
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActivePhotoIdx((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {allPhotos.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto mt-4 pb-2 scrollbar-thin">
                  {allPhotos.map((photo, idx) => (
                    <button
                      key={photo.id || idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        activePhotoIdx === idx
                          ? 'border-[#FF6B5A] scale-105 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[16/9] bg-stone-100 rounded-2xl flex flex-col items-center justify-center text-stone-400">
              <Building className="w-12 h-12 mb-2" />
              <p className="text-sm">No photos uploaded yet</p>
            </div>
          )}
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details (2 spans) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Key Specs */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 pb-6 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F2A44]">
                    {property.address}
                  </h1>
                  <p className="text-stone-500 text-sm mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#FF6B5A]" />
                    {property.city}, {property.state} {property.zip}
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-heading font-black text-[#0F2A44]">
                    ${property.price.toLocaleString()}
                  </div>
                  {property.originalPrice && property.originalPrice > property.price && (
                    <div className="text-xs text-stone-400 line-through text-right">
                      Original: ${property.originalPrice.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#0F2A44]">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#0F2A44]">{property.beds}</div>
                    <div className="text-xs text-stone-500">Bedrooms</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#0F2A44]">
                    <Bath className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#0F2A44]">
                      {property.bathsFull + property.bathsHalf * 0.5}
                    </div>
                    <div className="text-xs text-stone-500">Bathrooms</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#0F2A44]">
                    <Square className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#0F2A44]">{property.sqft.toLocaleString()}</div>
                    <div className="text-xs text-stone-500">Square Feet</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#0F2A44]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#0F2A44]">{property.yearBuilt}</div>
                    <div className="text-xs text-stone-500">Year Built</div>
                  </div>
                </div>
              </div>

              {/* Additional facts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-100 text-xs text-stone-600">
                <div>
                  <span className="font-semibold text-[#0F2A44]">Lot Size:</span> {property.lotSize || 'Standard'}
                </div>
                <div>
                  <span className="font-semibold text-[#0F2A44]">Annual Taxes:</span> ${property.taxes?.toLocaleString() || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-[#0F2A44]">School District:</span> {property.schoolDistrict || 'Local district'}
                </div>
              </div>
            </div>

            {/* Features & Highlights */}
            {property.features && property.features.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
                <h3 className="text-lg font-heading font-bold text-[#0F2A44] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF6B5A]" />
                  Property Highlights & Amenities
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {property.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 bg-stone-100 text-[#0F2A44] rounded-xl text-xs font-medium"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Upgrades */}
            {property.upgrades && property.upgrades.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
                <h3 className="text-lg font-heading font-bold text-[#0F2A44] mb-4 flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-[#FF6B5A]" />
                  Recent Upgrades & Improvements
                </h3>
                <div className="divide-y divide-stone-100">
                  {property.upgrades.map((upg) => (
                    <div key={upg.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-[#0F2A44]">{upg.item}</span>
                      <span className="text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                        {upg.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Walkthrough Video Link if present */}
            {property.walkthroughVideoUrl && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
                <h3 className="text-lg font-heading font-bold text-[#0F2A44] mb-3">
                  Video Walkthrough
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Watch a guided video walkthrough provided by the homeowner.
                </p>
                <a
                  href={property.walkthroughVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2A44] text-white rounded-xl text-xs font-semibold hover:bg-[#1A3D60] transition-colors"
                >
                  Watch Tour Video &rarr;
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Tour Request Form & Seller Card */}
          <div className="space-y-6">
            {/* Tour Request Form */}
            <div id="schedule-showing" className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-stone-200 scroll-mt-24">
              <h3 className="text-xl font-heading font-extrabold text-[#0F2A44]">
                Schedule a Private Tour
              </h3>
              <p className="text-xs text-stone-500 mt-1 mb-6">
                Connect directly with the homeowner. No middleman broker fee.
              </p>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-[#1FA67A] mx-auto mb-3" />
                  <h4 className="text-base font-bold text-[#0F2A44]">Request Sent!</h4>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    The homeowner has been notified via their command center and will reach out to confirm your showing time.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setBuyerName('');
                      setBuyerPhone('');
                      setBuyerEmail('');
                      setMessage('');
                    }}
                    className="mt-6 text-xs text-[#FF6B5A] font-bold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Honeypot field for bot protection */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="preferred_broker_affiliation"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Michael Miller"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B5A]/40 text-[#0F2A44]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B5A]/40 text-[#0F2A44]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="buyer@example.com"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B5A]/40 text-[#0F2A44]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Preferred Date / Time
                    </label>
                    <input
                      type="text"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      placeholder="e.g. Saturday afternoon around 2 PM"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B5A]/40 text-[#0F2A44]"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="preapproval-check"
                      checked={hasPreApproval}
                      onChange={(e) => setHasPreApproval(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#FF6B5A] focus:ring-[#FF6B5A]"
                    />
                    <label htmlFor="preapproval-check" className="text-xs text-stone-600 leading-tight">
                      I have a mortgage pre-approval or proof of funds ready.
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Message / Questions for Seller
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Any specific questions about the home or neighborhood?"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B5A]/40 text-[#0F2A44] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#FF6B5A] hover:bg-[#e85a4a] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Sending Request...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Request Private Showing</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Direct Seller Contact Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                Homeowner Contact
              </h4>
              <div className="font-heading font-bold text-base text-[#0F2A44]">
                {property.sellerName || 'Private Owner'}
              </div>

              <div className="mt-4 space-y-2.5 text-xs text-stone-600">
                {property.sellerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <a href={`tel:${property.sellerPhone}`} className="hover:text-[#FF6B5A]">
                      {property.sellerPhone}
                    </a>
                  </div>
                )}
                {property.sellerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-stone-400" />
                    <a href={`mailto:${property.sellerEmail}`} className="hover:text-[#FF6B5A]">
                      {property.sellerEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Protection / Disclosures Note */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-[#0F2A44] mb-1">
                <ShieldCheck className="w-4 h-4 text-[#1FA67A]" />
                Direct-From-Seller Transaction
              </div>
              Buyer and seller coordinate directly. Both parties are encouraged to utilize licensed title companies and real estate attorneys for closing. Equal Housing Opportunity.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-stone-200 py-8 text-center text-xs text-stone-500">
        <p>Equal Housing Opportunity. Powered by FSBO Compass.</p>
        <p className="mt-1">
          Information deemed reliable but not guaranteed. Buyers should verify all measurements and specifications.
        </p>
      </footer>
    </div>
  );
};
