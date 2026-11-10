import React, { useState, useEffect } from 'react';
import {
  PropertyProfile,
  PhotoItem,
  Settings,
  OpenHouseItem,
  DocumentItem,
  ActiveTab,
} from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import { Tooltip } from '../common/Tooltip';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import {
  Globe,
  Download,
  QrCode,
  Printer,
  Sparkles,
  ExternalLink,
  MapPin,
  Calendar,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  Home,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
  Send,
  Eye,
  Check,
  HelpCircle,
  Lock,
  Copy,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { PublicSiteDoc } from '../../types/saas';

interface SectionWebsiteProps {
  property: PropertyProfile;
  photos: PhotoItem[];
  settings: Settings;
  openHouses: OpenHouseItem[];
  documents: DocumentItem[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenPricing?: () => void;
}

type WebsiteTheme = 'Modern' | 'Classic' | 'Bold';

export const SectionWebsite: React.FC<SectionWebsiteProps> = ({
  property,
  photos,
  settings,
  openHouses,
  documents,
  onNavigate,
  onOpenPricing,
}) => {
  const { userProfile, saasConfig, currentUser } = useAuth();
  const [theme, setTheme] = useState<WebsiteTheme>('Modern');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<PhotoItem | null>(null);

  // Cloud Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedDoc, setPublishedDoc] = useState<PublicSiteDoc | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Showing request form state in preview
  const [showingName, setShowingName] = useState('');
  const [showingPhone, setShowingPhone] = useState('');
  const [showingEmail, setShowingEmail] = useState('');
  const [showingDate, setShowingDate] = useState('');
  const [hasPreApproval, setHasPreApproval] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const planType = userProfile?.plan || 'trial';
  const planConfig = saasConfig.plans[planType] || saasConfig.plans.trial;
  const canPublish = planConfig.canPublishWebsite;

  // Generate safe slug for property
  const slug = property.address
    ? property.address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'my-home';

  const hostedSiteUrl = `${window.location.origin}/p/${slug}`;

  // Check if already published in Firestore
  useEffect(() => {
    async function checkPublished() {
      if (!slug) return;
      try {
        const snap = await getDoc(doc(db, 'publicSites', slug));
        if (snap.exists()) {
          setPublishedDoc(snap.data() as PublicSiteDoc);
        } else {
          setPublishedDoc(null);
        }
      } catch (e) {
        console.warn('Could not read public site status:', e);
      }
    }
    checkPublished();
  }, [slug]);

  // Generate QR Code pointing to hosted URL (or preview URL fallback)
  useEffect(() => {
    const targetUrl = publishedDoc?.status === 'active' ? hostedSiteUrl : `${window.location.origin}/#tour-${slug}`;
    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0F2A44',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR error', err));
  }, [hostedSiteUrl, publishedDoc, slug]);

  const coverPhoto = photos.find((p) => p.isCover) || photos[0];
  const isPriceReduced = property.originalPrice && property.price < property.originalPrice;

  // Handle Cloud Publishing
  const handlePublishToCloud = async () => {
    if (!canPublish) {
      if (onOpenPricing) onOpenPricing();
      return;
    }
    if (!currentUser) return;

    try {
      setIsPublishing(true);
      setPublishError(null);

      const siteData: PublicSiteDoc = {
        slug,
        ownerUid: currentUser.uid,
        propertyId: (property as any).id || 'current',
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        price: property.price,
        originalPrice: property.originalPrice,
        beds: property.beds,
        bathsFull: property.bathsFull,
        bathsHalf: property.bathsHalf,
        sqft: property.sqft,
        lotSize: property.lotSize,
        yearBuilt: property.yearBuilt,
        taxes: property.taxes,
        schoolDistrict: property.schoolDistrict,
        specialNotes: property.specialNotes || [],
        features: property.features || [],
        upgrades: property.upgrades || [],
        coverPhotoUrl: coverPhoto?.dataUrl || '',
        photos: photos.map((p) => ({
          id: p.id,
          url: p.dataUrl,
          caption: p.caption || '',
          isCover: !!p.isCover,
        })),
        walkthroughVideoUrl: property.walkthroughVideoUrl || '',
        theme,
        openHouses: openHouses.map((o) => ({
          date: o.date,
          startTime: o.startTime,
          endTime: o.endTime,
          notes: o.notes,
        })),
        sellerName: settings.sellerName,
        sellerPhone: settings.sellerPhone,
        sellerEmail: settings.sellerEmail,
        status: 'active',
        publishedAt: publishedDoc?.publishedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'publicSites', slug), siteData);
      setPublishedDoc(siteData);
    } catch (err: any) {
      console.error('Publish error:', err);
      setPublishError(err.message || 'Failed to publish website to cloud.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async () => {
    if (!publishedDoc) return;
    try {
      const newStatus = publishedDoc.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'publicSites', slug), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setPublishedDoc({ ...publishedDoc, status: newStatus });
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(hostedSiteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Handle Showing Submission in preview
  const handleShowingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showingName || !showingEmail) return;

    const payload = {
      propertyAddress: property.address,
      buyerName: showingName,
      buyerPhone: showingPhone,
      buyerEmail: showingEmail,
      preferredDate: showingDate,
      hasPreApproval,
      submittedAt: new Date().toISOString(),
    };

    if (settings.webhookUrl) {
      try {
        await fetch(settings.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
        });
      } catch (err) {
        console.warn('Webhook error:', err);
      }
    }

    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  // Download QR Code PNG
  const handleDownloadQrPng = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `FSBO-Yard-Sign-QR-${property.address.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    a.click();
  };

  // Print Flyer Letter Size
  const handlePrintFlyer = () => {
    window.print();
  };

  // Export Complete Website as Zip / HTML
  const handleDownloadWebsiteZip = async () => {
    const zip = new JSZip();

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${property.address} | For Sale By Owner</title>
  <meta name="description" content="${property.beds} bed, ${property.bathsFull} bath home for sale in ${property.city}, ${property.state}.">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F8F6F2] text-[#0F2A44] antialiased">
  <header class="bg-[#0F2A44] text-white py-4 px-6 sticky top-0 z-50 shadow-md">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="font-extrabold text-lg tracking-tight">${property.address}</div>
      <a href="#showings" class="bg-[#FF6B5A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#fa5644]">Request Tour</a>
    </div>
  </header>
  <section class="bg-gradient-to-r from-[#0F2A44] to-[#1E6F80] text-white py-16 px-6">
    <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div class="space-y-4">
        <h1 class="text-3xl md:text-5xl font-extrabold">${property.address}</h1>
        <p class="text-slate-200 text-lg">${property.city}, ${property.state} ${property.zip}</p>
        <div class="text-4xl font-black text-[#F2B544]">$${property.price.toLocaleString()}</div>
      </div>
      <div>
        ${coverPhoto ? `<img src="${coverPhoto.dataUrl}" class="rounded-3xl shadow-2xl border-4 border-white/20 w-full aspect-video object-cover" />` : ''}
      </div>
    </div>
  </section>
</body>
</html>`;

    zip.file('index.html', htmlContent);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FSBO-Property-Website-${property.address.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans">
      <WhyThisMatters
        tip="A dedicated property website makes your home look like a multimillion-dollar listing. You can put the QR code directly on your front yard sign so drive-by buyers view photos and request showings on their phone."
        nextLabel="Showings & Open Houses"
        onNext={() => onNavigate('showings')}
      />

      {/* Cloud Publishing Gating & Action Box */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#FF6B5A]/10 text-[#FF6B5A]">
                <Globe className="w-5 h-5" />
              </span>
              <h3 className="font-heading font-extrabold text-lg text-[#0F2A44] dark:text-white">
                Hosted Property Website (/p/{slug})
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Publish your listing directly to the web with real-time buyer notifications, spam-protected tour forms, and mobile QR integration.
            </p>
          </div>

          <div>
            {canPublish ? (
              <button
                type="button"
                onClick={handlePublishToCloud}
                disabled={isPublishing}
                className="px-5 py-2.5 bg-[#FF6B5A] hover:bg-[#e85a4a] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? (
                  <span>Publishing to Cloud...</span>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>{publishedDoc ? 'Update Live Website' : 'Publish Website to Web'}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Plan Upgrade Required
                </span>
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#FF6B5A] text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Unlock Website with {saasConfig.plans?.per_listing?.priceDisplay || '$149'} Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {publishError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{publishError}</span>
          </div>
        )}

        {/* Live Published Status Indicator */}
        {publishedDoc && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  Live on the Web:
                </span>
                <a
                  href={`/p/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs font-mono font-bold text-sky-700 dark:text-sky-300 hover:underline"
                >
                  {hostedSiteUrl}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg text-xs font-semibold shadow-sm border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 hover:bg-stone-50"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <a
                href={`/p/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>View Live Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleToggleStatus}
                className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                {publishedDoc.status === 'active' ? 'Disable Site' : 'Enable Site'}
              </button>
            </div>
          </div>
        )}

        {/* Action Row: Print flyer, download QR, download zip */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">Theme:</span>
            {(['Modern', 'Classic', 'Bold'] as WebsiteTheme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  theme === t
                    ? 'bg-[#FF6B5A] text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintFlyer}
              className="px-3 py-1.5 rounded-lg text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Flyer</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQrPng}
              className="px-3 py-1.5 rounded-lg text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-colors flex items-center gap-1.5 font-semibold"
            >
              <QrCode className="w-3.5 h-3.5 text-[#F2B544]" />
              <span>Download Sign QR</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWebsiteZip}
              className="px-3 py-1.5 rounded-lg text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML (Zip)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LIVE PREVIEW CONTAINER */}
      {/* ============================================================ */}
      <div className="rounded-3xl border border-stone-300 dark:border-stone-700 overflow-hidden shadow-2xl bg-[#F8F6F2] dark:bg-stone-950 text-[#0F2A44] dark:text-stone-100">
        {/* Preview Chrome Bar */}
        <div className="bg-[#0F2A44] text-white px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-2 font-mono text-[11px] text-slate-300 truncate">
              {hostedSiteUrl}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-200">
            {theme} Preview
          </span>
        </div>

        {/* 1. Website Hero */}
        <div
          className={`relative p-6 sm:p-12 text-white ${
            theme === 'Bold'
              ? 'bg-gradient-to-r from-[#0F2A44] to-[#FF6B5A]'
              : theme === 'Classic'
              ? 'bg-[#0F2A44]'
              : 'bg-gradient-to-r from-[#0F2A44] via-[#143E5E] to-[#1E6F80]'
          }`}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {isPriceReduced ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF6B5A] text-white shadow-lg animate-pulse">
                    Price Improved!
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F2B544] text-[#0F2A44]">
                    For Sale By Owner
                  </span>
                )}
                <span className="text-xs text-slate-200 font-medium">
                  {property.state || 'Michigan'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight leading-none text-white">
                {property.address}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 font-medium">
                {property.city}, {property.state} {property.zip}
              </p>

              <div className="text-3xl sm:text-4xl font-black text-[#F2B544] font-heading pt-1">
                ${property.price.toLocaleString()}
              </div>

              <div className="flex flex-wrap gap-4 pt-3 text-xs sm:text-sm font-semibold text-slate-100">
                <span className="flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-[#FF6B5A]" /> {property.beds} Bedrooms
                </span>
                <span className="flex items-center gap-1.5">
                  <Bath className="w-4 h-4 text-[#FF6B5A]" /> {property.bathsFull} Full / {property.bathsHalf} Half Baths
                </span>
                <span className="flex items-center gap-1.5">
                  <Maximize className="w-4 h-4 text-[#FF6B5A]" /> {property.sqft.toLocaleString()} Sq Ft
                </span>
              </div>
            </div>

            {/* Hero Cover Image & Sign QR */}
            <div className="relative">
              {coverPhoto ? (
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <img
                    src={coverPhoto.dataUrl}
                    alt={property.address}
                    className="w-full h-full object-cover"
                  />
                  {qrCodeDataUrl && (
                    <div className="absolute bottom-3 right-3 bg-white p-2 rounded-2xl shadow-xl flex items-center gap-2 text-slate-900 border border-slate-200">
                      <img src={qrCodeDataUrl} alt="QR" className="w-12 h-12" />
                      <div className="text-[10px] font-bold leading-tight pr-1">
                        <span>Scan for</span>
                        <br />
                        <span className="text-[#FF6B5A]">Mobile Tour</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-black/20 rounded-3xl flex items-center justify-center">
                  <span className="text-xs text-white/60">Upload photo in Studio</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Photo Gallery Grid */}
        <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white">
              Photo Showcase ({photos.length} Photos)
            </h3>
            <span className="text-xs text-stone-500">Click any photo to enlarge</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.slice(0, 8).map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedGalleryPhoto(photo)}
                className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-stone-200 dark:border-stone-800"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                  <Eye className="w-4 h-4 mr-1" /> View
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Specs and Features */}
        <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
          <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white">
            Core Facts & Specifications
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <span className="text-xs text-stone-500 block">Year Built</span>
              <span className="text-base font-bold text-[#0F2A44] dark:text-white">{property.yearBuilt}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <span className="text-xs text-stone-500 block">Annual Taxes</span>
              <span className="text-base font-bold text-[#0F2A44] dark:text-white">${property.taxes.toLocaleString()}/yr</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <span className="text-xs text-stone-500 block">School District</span>
              <span className="text-sm font-bold text-[#0F2A44] dark:text-white">{property.schoolDistrict}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <span className="text-xs text-stone-500 block">Basement</span>
              <span className="text-sm font-bold text-[#0F2A44] dark:text-white">{property.basement}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white">Highlights & Features</h4>
            <div className="flex flex-wrap gap-2">
              {property.features.map((feat) => (
                <span
                  key={feat}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#0F2A44] text-white dark:bg-[#FF6B5A]"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Location Map */}
        <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-4">
          <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#FF6B5A]" />
            Neighborhood & Location Map
          </h3>
          <div className="rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 aspect-[21/9] bg-stone-200 dark:bg-stone-800">
            <iframe
              title="Property Location"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                `${property.address}, ${property.city}, ${property.state}`
              )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#0F2A44] text-white py-8 px-6 text-center text-xs space-y-2 border-t border-white/10">
          <p className="font-bold text-sm">{property.address}, {property.city}, {property.state}</p>
          <p className="text-slate-400">
            For Sale By Owner &bull; Contact Seller: {settings.sellerName} &bull; {settings.sellerPhone} &bull; {settings.sellerEmail}
          </p>
        </footer>
      </div>

      {/* Lightbox Modal */}
      {selectedGalleryPhoto && (
        <div
          onClick={() => setSelectedGalleryPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={selectedGalleryPhoto.dataUrl}
              alt={selectedGalleryPhoto.caption}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* PRINT-ONLY YARD FLYER */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-50">
        <div className="border-4 border-[#0F2A44] p-6 rounded-3xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#0F2A44] pb-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B5A]">
                  FOR SALE BY OWNER
                </span>
                <h1 className="text-3xl font-extrabold text-[#0F2A44]">{property.address}</h1>
                <p className="text-sm font-semibold text-stone-600">
                  {property.city}, {property.state} {property.zip}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 block">Offered At:</span>
                <span className="text-3xl font-black text-[#0F2A44]">${property.price.toLocaleString()}</span>
              </div>
            </div>

            {coverPhoto && (
              <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4 border border-stone-300">
                <img src={coverPhoto.dataUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 text-center mb-4">
              <div className="p-3 bg-stone-100 rounded-xl">
                <span className="text-xs text-stone-500 block">Bedrooms</span>
                <span className="text-xl font-bold">{property.beds}</span>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl">
                <span className="text-xs text-stone-500 block">Bathrooms</span>
                <span className="text-xl font-bold">{property.bathsFull}.{property.bathsHalf}</span>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl">
                <span className="text-xs text-stone-500 block">Sq Footage</span>
                <span className="text-xl font-bold">{property.sqft.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl">
                <span className="text-xs text-stone-500 block">Year Built</span>
                <span className="text-xl font-bold">{property.yearBuilt}</span>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-[#0F2A44] pt-4 flex items-center justify-between">
            <div>
              <div className="text-base font-bold text-[#0F2A44]">
                Direct Contact: {settings.sellerName}
              </div>
              <div className="text-sm font-extrabold text-[#FF6B5A]">
                Call / Text: {settings.sellerPhone}
              </div>
              <div className="text-xs text-stone-500">{settings.sellerEmail}</div>
            </div>

            {qrCodeDataUrl && (
              <div className="flex items-center gap-2">
                <div className="text-right text-[10px] font-bold">
                  SCAN FOR FULL
                  <br />
                  PHOTO TOUR
                </div>
                <img src={qrCodeDataUrl} alt="QR" className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
