import React, { useState } from 'react';
import {
  PropertyProfile,
  PhotoItem,
  InquiryItem,
  OpenHouseItem,
  ActiveTab,
} from '../../types';
import {
  MapPin,
  Calendar,
  Clock,
  Bed,
  Bath,
  Maximize2,
  Home,
  CheckCircle2,
  Share2,
  ExternalLink,
  Edit3,
  Inbox,
  LayoutDashboard,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Flame,
  Wind,
  ShieldAlert,
  Sparkles,
  Phone,
  Mail,
  User,
  Send,
  Building,
  Layers,
  Car,
  Compass,
} from 'lucide-react';
import { doc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getAppUrl } from '../../lib/appUrl';

interface SectionMyListingProps {
  property: PropertyProfile;
  photos: PhotoItem[];
  openHouses?: OpenHouseItem[];
  inquiriesCount?: number;
  isSellerView?: boolean;
  isTrial?: boolean;
  onEditListing?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  onAddInquiry?: (inq: InquiryItem) => void;
  onOpenPricing?: () => void;
  onAddPhotos?: () => void;
}

export const SectionMyListing: React.FC<SectionMyListingProps> = ({
  property,
  photos,
  openHouses = [],
  inquiriesCount = 0,
  isSellerView = true,
  isTrial = false,
  onEditListing,
  onNavigate,
  onAddInquiry,
  onOpenPricing,
  onAddPhotos,
}) => {
  // Gallery Lightbox Modal
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Copy Link State
  const [copiedLink, setCopiedLink] = useState(false);

  // Contact Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [interestType, setInterestType] = useState<
    'Scheduling a showing' | 'Asking a question' | 'Making an offer'
  >('Scheduling a showing');
  const [message, setMessage] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showingDate, setShowingDate] = useState('');
  const [showingTime, setShowingTime] = useState('14:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Listing ID determination
  const listingId = property.id || property.publishedSlug || 'my-home';
  const publicShareUrl = `${getAppUrl()}/listing/${listingId}`;

  // Photos handling
  const validPhotos = photos.length > 0 ? photos : [];
  const mainPhoto = validPhotos[0]?.dataUrl;
  const secondaryPhotos = validPhotos.slice(1, 5);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenGallery = (idx = 0) => {
    setActivePhotoIdx(idx);
    setGalleryOpen(true);
  };

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % validPhotos.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + validPhotos.length) % validPhotos.length);
  };

  // Contact / Showing Form Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerEmail.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const fullMessage =
      interestType === 'Scheduling a showing' && showingDate
        ? `[Tour Request: ${showingDate} at ${showingTime}] ${message.trim()}`
        : message.trim() || `Interested in ${interestType.toLowerCase()} for this home.`;

    const newInquiry: InquiryItem = {
      id: 'inq-' + Date.now(),
      name: buyerName.trim(),
      email: buyerEmail.trim(),
      phone: buyerPhone.trim(),
      source: 'FSBO Listing Page',
      dateReceived: new Date().toISOString(),
      message: fullMessage,
      replied: false,
      notes: `Requested via public listing page. Interest: ${interestType}`,
    };

    try {
      // 1. Save to Firestore under /listings/{listingId}/inquiries if database exists
      if (listingId) {
        const inquiriesCol = collection(db, 'listings', listingId, 'inquiries');
        await addDoc(inquiriesCol, {
          id: newInquiry.id,
          listingId,
          buyerName: newInquiry.name,
          buyerEmail: newInquiry.email,
          buyerPhone: newInquiry.phone || '',
          interestType,
          message: fullMessage,
          preferredDate: showingDate || null,
          preferredTime: showingTime || null,
          createdAt: new Date().toISOString(),
        }).catch((err) => {
          console.warn('Could not save lead to /listings/inquiries (fallback local):', err);
        });
      }

      // 2. Notify local handler so seller immediately sees inquiry in their state
      if (onAddInquiry) {
        onAddInquiry(newInquiry);
      }

      setSubmittedSuccess(true);
      setBuyerName('');
      setBuyerEmail('');
      setBuyerPhone('');
      setMessage('');
      setShowingDate('');
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setSubmitError('Unable to send message right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const price = property.price || 0;
  const sqft = property.sqft || 0;
  const pricePerSqFt = price > 0 && sqft > 0 ? Math.round(price / sqft) : null;
  const fullAddress = `${property.address || ''}${property.city ? `, ${property.city}` : ''}${
    property.state ? `, ${property.state}` : ''
  } ${property.zip || ''}`.trim();

  // Status Badge
  const isPublished = Boolean(property.published);
  const statusLabel = isPublished ? 'FOR SALE BY OWNER' : 'COMING SOON';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-stone-950 text-[#0F2A44] dark:text-stone-100 font-sans pb-16">
      {/* 1. SELLER BAR (Only visible to the signed-in seller) */}
      {isSellerView && (
        <aside aria-label="Seller Controls" className="sticky top-0 z-30 bg-[#0F2A44] text-white px-4 py-2.5 shadow-md border-b border-white/10">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-wide uppercase text-white/90">
                Seller Control Bar
              </span>
              {isTrial && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F2B544]/20 text-[#F2B544] text-[11px] font-semibold border border-[#F2B544]/30">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Preview only. Upgrade to publish your listing.</span>
                  {onOpenPricing && (
                    <button
                      onClick={onOpenPricing}
                      className="underline font-bold hover:text-white ml-1 cursor-pointer"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              {onEditListing && (
                <button
                  type="button"
                  onClick={onEditListing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#F2B544]" />
                  <span>Edit Listing</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                title={publicShareUrl}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#FF6B5A]" />
                    <span>Copy Share Link</span>
                  </>
                )}
              </button>

              <a
                href={publicShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span>View as Buyer</span>
              </a>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('inbox')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                  <Inbox className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buyer Leads ({inquiriesCount})</span>
                </button>
              )}

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B5A] hover:bg-[#fa5644] text-white font-bold transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Go to Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* 2. PHOTO AREA (Zillow style: 1 large on left, 2x2 grid on right) */}
        <section aria-label="Photo Gallery" className="relative rounded-3xl overflow-hidden shadow-xl bg-stone-900 border border-stone-200 dark:border-stone-800">
          {validPhotos.length === 0 ? (
            // No photos placeholder
            <div className="w-full h-80 sm:h-96 bg-gradient-to-tr from-[#0F2A44] to-[#1E6F80] flex flex-col items-center justify-center text-center p-6 text-white relative">
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#FF6B5A] text-white shadow-md">
                  {statusLabel}
                </span>
              </div>
              <Camera className="w-16 h-16 text-white/50 mb-3" />
              <h3 className="text-xl font-bold font-heading">No Photos Added Yet</h3>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-sm">
                Add quality photos of your exterior, kitchen, and living room to make your home stand out to buyers.
              </p>
              {isSellerView && (
                <button
                  type="button"
                  onClick={() => (onAddPhotos ? onAddPhotos() : onNavigate?.('photos'))}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B5A] hover:bg-[#fa5644] text-white font-bold text-xs shadow-lg transition-transform hover:scale-105"
                >
                  <Camera className="w-4 h-4" />
                  <span>Add Photos Now</span>
                </button>
              )}
            </div>
          ) : validPhotos.length === 1 ? (
            // Single photo full-width
            <div
              className="relative w-full h-[400px] sm:h-[500px] cursor-pointer group"
              onClick={() => handleOpenGallery(0)}
            >
              <img
                src={mainPhoto}
                alt={property.address || 'Property Photo'}
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
              <div className="absolute top-4 left-4 z-10">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg ${
                    isPublished ? 'bg-emerald-600 text-white' : 'bg-[#FF6B5A] text-white'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenGallery(0);
                }}
                className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>View Fullscreen</span>
              </button>
            </div>
          ) : (
            // Multi-photo Zillow-style grid: 1 large left, 2x2 right
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 h-[360px] sm:h-[480px] relative">
              {/* Status Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg ${
                    isPublished ? 'bg-emerald-600 text-white' : 'bg-[#FF6B5A] text-white'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Main large photo (7 cols on desktop) */}
              <div
                className="md:col-span-7 h-full relative cursor-pointer overflow-hidden group"
                onClick={() => handleOpenGallery(0)}
              >
                <img
                  src={mainPhoto}
                  alt={validPhotos[0]?.caption || property.address}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>

              {/* 2x2 Subgrid (5 cols on desktop) */}
              <div className="hidden md:grid md:col-span-5 grid-cols-2 grid-rows-2 gap-1.5 h-full">
                {secondaryPhotos.map((photo, sIdx) => (
                  <div
                    key={photo.id}
                    className="relative h-full cursor-pointer overflow-hidden group"
                    onClick={() => handleOpenGallery(sIdx + 1)}
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || `Photo ${sIdx + 2}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                  </div>
                ))}

                {/* If fewer than 4 secondary photos, fill with dark styling or fallback */}
                {secondaryPhotos.length < 4 &&
                  Array.from({ length: 4 - secondaryPhotos.length }).map((_, emptyIdx) => (
                    <div
                      key={`empty-${emptyIdx}`}
                      className="h-full bg-stone-800 flex items-center justify-center text-stone-600 text-xs font-semibold"
                    >
                      <Camera className="w-6 h-6 opacity-40" />
                    </div>
                  ))}
              </div>

              {/* "See all X photos" button */}
              <button
                type="button"
                onClick={() => handleOpenGallery(0)}
                className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold backdrop-blur-md transition-all shadow-md cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#F2B544]" />
                <span>See all {validPhotos.length} photos</span>
              </button>
            </div>
          )}
        </section>

        {/* 3. MAIN CONTENT GRID (Left: Facts & Details, Right: Sticky Contact Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Price, Facts, Details, About, Map, Open Houses */}
          <div className="lg:col-span-8 space-y-8">
            {/* PRICE + ADDRESS + KEY SPECS ROW */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-6">
                <div>
                  <div className="text-3xl sm:text-4xl font-black font-heading text-[#0F2A44] dark:text-white tracking-tight">
                    {price > 0 ? `$${price.toLocaleString()}` : 'Price coming soon'}
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300 text-sm sm:text-base font-medium mt-1">
                    <MapPin className="w-4 h-4 text-[#FF6B5A] shrink-0" />
                    <span>{fullAddress || 'Address coming soon'}</span>
                  </div>
                </div>

                {/* Large Bed | Bath | Sq Ft Counters */}
                <div className="flex items-center gap-4 sm:gap-6 bg-stone-50 dark:bg-stone-800/80 px-5 py-3 rounded-2xl border border-stone-200/70 dark:border-stone-700/60 self-start sm:self-auto">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-black text-[#0F2A44] dark:text-white">
                      {property.beds || 0}
                    </div>
                    <div className="text-[11px] font-bold uppercase text-stone-500">Beds</div>
                  </div>
                  <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-black text-[#0F2A44] dark:text-white">
                      {property.bathsFull || 0}
                      {property.bathsHalf ? `.${property.bathsHalf}` : ''}
                    </div>
                    <div className="text-[11px] font-bold uppercase text-stone-500">Baths</div>
                  </div>
                  <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-black text-[#0F2A44] dark:text-white">
                      {sqft > 0 ? sqft.toLocaleString() : '—'}
                    </div>
                    <div className="text-[11px] font-bold uppercase text-stone-500">Sq Ft</div>
                  </div>
                </div>
              </div>

              {/* FACT CHIPS: Rounded gray boxes with icons */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2.5">
                  Home Highlights & Specs
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Property Type */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0F2A44]/10 dark:bg-white/10 text-[#0F2A44] dark:text-[#F2B544] flex items-center justify-center shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-stone-500 font-semibold uppercase">Property Type</div>
                      <div className="text-xs sm:text-sm font-bold text-[#0F2A44] dark:text-white">
                        Single Family
                      </div>
                    </div>
                  </div>

                  {/* Year Built */}
                  {property.yearBuilt ? (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0F2A44]/10 dark:bg-white/10 text-[#0F2A44] dark:text-[#F2B544] flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-500 font-semibold uppercase">Year Built</div>
                        <div className="text-xs sm:text-sm font-bold text-[#0F2A44] dark:text-white">
                          {property.yearBuilt}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Lot Size */}
                  {property.lotSize ? (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0F2A44]/10 dark:bg-white/10 text-[#0F2A44] dark:text-[#F2B544] flex items-center justify-center shrink-0">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-500 font-semibold uppercase">Lot Size</div>
                        <div className="text-xs sm:text-sm font-bold text-[#0F2A44] dark:text-white truncate">
                          {property.lotSize}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Price Per Sq Ft */}
                  {pricePerSqFt ? (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0F2A44]/10 dark:bg-white/10 text-[#0F2A44] dark:text-[#F2B544] flex items-center justify-center shrink-0">
                        <span className="text-xs font-black">$</span>
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-500 font-semibold uppercase">Price / Sq Ft</div>
                        <div className="text-xs sm:text-sm font-bold text-[#0F2A44] dark:text-white">
                          ${pricePerSqFt} / sq ft
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Garage */}
                  {property.garage ? (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0F2A44]/10 dark:bg-white/10 text-[#0F2A44] dark:text-[#F2B544] flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-500 font-semibold uppercase">Garage</div>
                        <div className="text-xs sm:text-sm font-bold text-[#0F2A44] dark:text-white truncate">
                          {property.garage}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Heating / Cooling */}
                  {property.heating || property.cooling ? (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0F2A44]/10 dark:bg-white/10 text-[#0F2A44] dark:text-[#F2B544] flex items-center justify-center shrink-0">
                        <Flame className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-500 font-semibold uppercase">HVAC</div>
                        <div className="text-xs sm:text-sm font-bold text-[#0F2A44] dark:text-white truncate">
                          {property.heating || property.cooling}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ABOUT THIS HOME */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
              <h3 className="text-xl font-bold font-heading text-[#0F2A44] dark:text-white">
                About This Home
              </h3>

              <div className="prose dark:prose-invert max-w-none text-stone-700 dark:text-stone-300 text-sm leading-relaxed whitespace-pre-line">
                {property.description ||
                  property.specialNotes?.filter(Boolean).join('\n\n') ||
                  'Welcome to this beautiful home for sale by owner. Turnkey condition with spacious living areas, great natural daylight, and a welcoming neighborhood setting. Contact the owner today to schedule your private tour or ask any questions.'}
              </div>

              {/* Key Features Tags */}
              {property.features && property.features.length > 0 && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-3">
                    Features & Amenities
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-[#0F2A44] dark:text-stone-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{feature}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Upgrades */}
              {property.upgrades && property.upgrades.length > 0 && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-3">
                    Recent Improvements & Upgrades
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {property.upgrades.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          {u.item}
                        </span>
                        <span className="font-bold text-[#FF6B5A] bg-[#FF6B5A]/10 px-2 py-0.5 rounded">
                          {u.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PROPERTY DETAILS: Interior, Exterior, Other */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <h3 className="text-xl font-bold font-heading text-[#0F2A44] dark:text-white">
                Property Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
                {/* Interior Column */}
                <div className="space-y-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60">
                  <h4 className="font-bold text-[#0F2A44] dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 pb-2 border-b border-stone-200 dark:border-stone-700">
                    <Bed className="w-4 h-4 text-[#FF6B5A]" />
                    <span>Interior</span>
                  </h4>
                  <ul className="space-y-2 text-stone-600 dark:text-stone-300">
                    <li className="flex justify-between">
                      <span className="text-stone-400">Bedrooms:</span>
                      <strong className="text-stone-800 dark:text-white">{property.beds || 0}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Full Bathrooms:</span>
                      <strong className="text-stone-800 dark:text-white">{property.bathsFull || 0}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Half Bathrooms:</span>
                      <strong className="text-stone-800 dark:text-white">{property.bathsHalf || 0}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Finished Sq Ft:</span>
                      <strong className="text-stone-800 dark:text-white">
                        {property.sqft ? `${property.sqft.toLocaleString()} sq ft` : '—'}
                      </strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Basement:</span>
                      <strong className="text-stone-800 dark:text-white truncate max-w-[120px]">
                        {property.basement || 'Standard'}
                      </strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Heating:</span>
                      <strong className="text-stone-800 dark:text-white truncate max-w-[120px]">
                        {property.heating || 'Forced Air'}
                      </strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Cooling:</span>
                      <strong className="text-stone-800 dark:text-white truncate max-w-[120px]">
                        {property.cooling || 'Central Air'}
                      </strong>
                    </li>
                  </ul>
                </div>

                {/* Exterior Column */}
                <div className="space-y-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60">
                  <h4 className="font-bold text-[#0F2A44] dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 pb-2 border-b border-stone-200 dark:border-stone-700">
                    <Building className="w-4 h-4 text-[#F2B544]" />
                    <span>Exterior & Lot</span>
                  </h4>
                  <ul className="space-y-2 text-stone-600 dark:text-stone-300">
                    <li className="flex justify-between">
                      <span className="text-stone-400">Property Type:</span>
                      <strong className="text-stone-800 dark:text-white">Single Family</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Lot Size:</span>
                      <strong className="text-stone-800 dark:text-white">{property.lotSize || 'Standard'}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Garage:</span>
                      <strong className="text-stone-800 dark:text-white truncate max-w-[120px]">
                        {property.garage || 'Attached'}
                      </strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Roof:</span>
                      <strong className="text-stone-800 dark:text-white truncate max-w-[120px]">
                        {property.roof || 'Asphalt Shingle'}
                      </strong>
                    </li>
                  </ul>
                </div>

                {/* Other Column */}
                <div className="space-y-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60">
                  <h4 className="font-bold text-[#0F2A44] dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 pb-2 border-b border-stone-200 dark:border-stone-700">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>Other & Financial</span>
                  </h4>
                  <ul className="space-y-2 text-stone-600 dark:text-stone-300">
                    <li className="flex justify-between">
                      <span className="text-stone-400">Year Built:</span>
                      <strong className="text-stone-800 dark:text-white">{property.yearBuilt || '—'}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">Annual Taxes:</span>
                      <strong className="text-stone-800 dark:text-white">
                        {property.taxes ? `$${property.taxes.toLocaleString()}/yr` : '—'}
                      </strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">HOA Fee:</span>
                      <strong className="text-stone-800 dark:text-white">
                        {property.hoa?.hasHoa ? `$${property.hoa.monthlyFee}/mo` : 'No HOA'}
                      </strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-stone-400">School District:</span>
                      <strong className="text-stone-800 dark:text-white truncate max-w-[120px]">
                        {property.schoolDistrict || 'Local Public'}
                      </strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* UPCOMING OPEN HOUSES */}
            {openHouses && openHouses.length > 0 && (
              <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F2B544]/20 text-[#D99B26] dark:text-[#F2B544] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-[#0F2A44] dark:text-white">
                    Upcoming Public Open Houses
                  </h3>
                </div>

                <div className="space-y-3">
                  {openHouses.map((oh) => (
                    <div
                      key={oh.id}
                      className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F2B544] text-[#0F2A44]">
                            Public Welcome
                          </span>
                          <span className="font-bold text-sm text-[#0F2A44] dark:text-white">
                            {oh.date}
                          </span>
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-300 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {oh.startTime} – {oh.endTime}
                          </span>
                          {oh.notes && <span className="text-stone-400">· {oh.notes}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#0F2A44] dark:text-[#F2B544]">
                        Walk-ins invited
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAP SECTION */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FF6B5A]/15 text-[#FF6B5A] flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-[#0F2A44] dark:text-white">
                    Neighborhood Location
                  </h3>
                </div>
                <span className="text-xs text-stone-500 font-medium">{property.city}, {property.state}</span>
              </div>

              {/* Google Map Embed */}
              <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner relative">
                <iframe
                  title="Property Location Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    fullAddress || 'Rochester Hills, Michigan'
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
              <p className="text-xs text-stone-400 text-center">
                Pin indicates approximate location for privacy. Private showings scheduled by owner appointment.
              </p>
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Contact Owner Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-16 space-y-4">
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xl space-y-5">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  Direct From Homeowner
                </span>
                <h3 className="text-xl font-extrabold font-heading text-[#0F2A44] dark:text-white">
                  Contact the Owner
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Connect directly with the homeowner. No middleman agent.
                </p>
              </div>

              {submittedSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-base text-[#0F2A44] dark:text-white">
                    Thanks! Message Sent.
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    The owner has received your request and will contact you soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedSuccess(false)}
                    className="text-xs font-bold text-[#FF6B5A] hover:underline pt-2 block mx-auto"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-700 dark:text-red-300">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="e.g. Amanda Chen"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none text-[#0F2A44] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none text-[#0F2A44] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="(248) 555-0192"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none text-[#0F2A44] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      I'm interested in...
                    </label>
                    <select
                      value={interestType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setInterestType(val);
                        if (val === 'Scheduling a showing') {
                          setShowSchedulePicker(true);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none text-[#0F2A44] dark:text-white"
                    >
                      <option value="Scheduling a showing">Scheduling a showing</option>
                      <option value="Asking a question">Asking a question</option>
                      <option value="Making an offer">Making an offer</option>
                    </select>
                  </div>

                  {/* Showing Date Picker (if toggled or showing selected) */}
                  {showSchedulePicker && (
                    <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-slate-800 border border-[#FF6B5A]/30 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F2A44] dark:text-white">
                        <span>Preferred Tour Time</span>
                        <button
                          type="button"
                          onClick={() => setShowSchedulePicker(false)}
                          className="text-[11px] text-stone-400 hover:text-stone-600"
                        >
                          Hide
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Date
                          </label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={showingDate}
                            onChange={(e) => setShowingDate(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs bg-white dark:bg-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                            Time
                          </label>
                          <select
                            value={showingTime}
                            onChange={(e) => setShowingTime(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs bg-white dark:bg-stone-900"
                          >
                            <option value="10:00">10:00 AM</option>
                            <option value="12:00">12:00 PM</option>
                            <option value="14:00">2:00 PM</option>
                            <option value="16:00">4:00 PM</option>
                            <option value="18:00">6:00 PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Hi, I am interested in this home. Are you available for a showing this weekend?"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none text-[#0F2A44] dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-[#FF6B5A] hover:bg-[#fa5644] text-white font-bold text-sm shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending...' : 'Contact Owner'}</span>
                  </button>

                  {!showSchedulePicker && (
                    <button
                      type="button"
                      onClick={() => {
                        setInterestType('Scheduling a showing');
                        setShowSchedulePicker(true);
                      }}
                      className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[#0F2A44] dark:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#FF6B5A]" />
                      <span>Schedule a Showing</span>
                    </button>
                  )}
                </form>
              )}

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-center">
                <span className="text-[11px] text-stone-400 font-medium">
                  Sold by owner. No agent commissions.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400 space-y-2">
        <p className="font-semibold text-stone-600 dark:text-stone-300">
          Listed by owner · Powered by FSBO Compass
        </p>
        <p className="text-[11px]">
          FSBO Compass is an independent homeowner technology platform. All listings are for sale directly by owner.
        </p>
      </footer>

      {/* 5. FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {galleryOpen && validPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-10">
            <span className="text-xs sm:text-sm font-semibold text-stone-300">
              Photo {activePhotoIdx + 1} of {validPhotos.length}
            </span>
            <button
              onClick={() => setGalleryOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close Gallery"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Center Image with Nav Buttons */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/20"
              aria-label="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={validPhotos[activePhotoIdx]?.dataUrl}
              alt={validPhotos[activePhotoIdx]?.caption || 'Property view'}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
            />

            <button
              onClick={handleNextPhoto}
              className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/20"
              aria-label="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Caption & Thumbnail Strip */}
          <div className="text-center text-white space-y-2 z-10">
            {validPhotos[activePhotoIdx]?.caption && (
              <p className="text-sm font-medium text-stone-200">
                {validPhotos[activePhotoIdx].caption}
              </p>
            )}

            {/* Thumbnail Strip */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar max-w-2xl mx-auto">
              {validPhotos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    activePhotoIdx === idx
                      ? 'border-[#FF6B5A] scale-110'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
