import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PropertyProfile, PhotoItem, OpenHouseItem } from '../../types';
import { SectionMyListing } from '../sections/SectionMyListing';
import { Compass, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  sanitizeSavedDescription,
  sanitizeSpecialNotes,
  hasLegacySampleText,
  isStockPhotoUrl,
} from '../../lib/sampleScrub';
import { StripeBillingNotice } from '../common/StripeBillingNotice';

interface PublicListingViewProps {
  listingId: string;
  onGoHome: () => void;
  onGoToDashboard?: () => void;
  onNavigatePricing?: () => void;
  onLogout?: () => void;
}

function isPaidPlanActive(profile?: { plan?: string; planStatus?: string } | null): boolean {
  if (!profile) return false;
  return (
    ['per_listing', 'bundle', 'pro'].includes(profile.plan || '') &&
    profile.planStatus === 'active'
  );
}

export const PublicListingView: React.FC<PublicListingViewProps> = ({
  listingId,
  onGoHome,
  onGoToDashboard,
  onNavigatePricing,
  onLogout,
}) => {
  const { currentUser, userProfile, authReady, loading: authLoading, logout } = useAuth();
  const [property, setProperty] = useState<PropertyProfile | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [openHouses, setOpenHouses] = useState<OpenHouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lockedAsOwner, setLockedAsOwner] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicListing() {
      if (!listingId) {
        if (isMounted) {
          setProperty(null);
          setPhotos([]);
          setOpenHouses([]);
          setLockedAsOwner(false);
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      // Wait until auth & signed-in user profile are resolved so we never flicker locked/unlocked state
      if (!authReady || authLoading) {
        if (isMounted) {
          setLoading(true);
        }
        return;
      }

      setLoading(true);
      setNotFound(false);
      setLockedAsOwner(false);

      try {
        const listingRef = doc(db, 'listings', listingId);
        const snap = await getDoc(listingRef);

        if (!isMounted) return;

        if (!snap.exists()) {
          setProperty(null);
          setPhotos([]);
          setOpenHouses([]);
          setLockedAsOwner(false);
          setNotFound(true);
          return;
        }

        const data = snap.data() as any;
        const isOwnerViewer = Boolean(currentUser?.uid && data.ownerUid === currentUser.uid);
        const isAdminViewer = userProfile?.role === 'admin';

        // Enforce paid upgrade gate even when the listing owner views /listing/:id directly:
        // Free trial / canceled / unpaid accounts cannot expose /listing/:id.
        if (isOwnerViewer && !isAdminViewer && !isPaidPlanActive(userProfile)) {
          setProperty(null);
          setPhotos([]);
          setOpenHouses([]);
          setLockedAsOwner(true);
          setNotFound(true);
          return;
        }

        if (data.published === false && !isAdminViewer) {
          setProperty(null);
          setPhotos([]);
          setOpenHouses([]);
          setLockedAsOwner(isOwnerViewer);
          setNotFound(true);
          return;
        }

        const loadedProp: PropertyProfile = {
          address: '',
          city: '',
          state: '',
          zip: '',
          price: 0,
          beds: 0,
          bathsFull: 0,
          bathsHalf: 0,
          sqft: 0,
          lotSize: '',
          yearBuilt: 0,
          taxes: 0,
          hoa: { hasHoa: false, monthlyFee: 0, name: '' },
          schoolDistrict: '',
          heating: '',
          cooling: '',
          garage: '',
          basement: '',
          roof: '',
          ...data,
          description: sanitizeSavedDescription(data.description),
          specialNotes: (() => {
            const cleaned = sanitizeSpecialNotes(data.specialNotes);
            return [cleaned[0] || '', cleaned[1] || '', cleaned[2] || ''] as [string, string, string];
          })(),
          features: Array.isArray(data.features)
            ? data.features.filter((f: any) => !hasLegacySampleText(String(f)))
            : [],
          upgrades: Array.isArray(data.upgrades)
            ? data.upgrades.filter((u: any) => !hasLegacySampleText(String(u?.item || '')))
            : [],
          id: snap.id,
        };

        setProperty(loadedProp);
        setPhotos(
          Array.isArray(data.photos)
            ? data.photos.filter((p: any) => p?.dataUrl && !isStockPhotoUrl(p.dataUrl))
            : []
        );
        setOpenHouses(Array.isArray(data.openHouses) ? data.openHouses : []);

        const displayPrice = loadedProp.price > 0 ? `$${loadedProp.price.toLocaleString()}` : 'For Sale';
        const title = `${displayPrice} · ${loadedProp.address || 'Home For Sale By Owner'} | FSBO Compass`;
        const description = `${loadedProp.beds || 0} Beds · ${loadedProp.bathsFull || 0} Baths · ${
          loadedProp.sqft ? `${loadedProp.sqft.toLocaleString()} Sq Ft` : ''
        }. For sale directly by owner. No buyer agent commissions. View full details and tour schedule.`;

        document.title = title;

        const setMetaTag = (propName: string, content: string) => {
          let meta = document.querySelector(`meta[property="${propName}"]`) as HTMLMetaElement;
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', propName);
            document.head.appendChild(meta);
          }
          meta.content = content;
        };

        setMetaTag('og:title', title);
        setMetaTag('og:description', description);
        setMetaTag('og:url', window.location.href);
        setMetaTag('og:type', 'website');
        if (data.photos?.[0]?.dataUrl && !isStockPhotoUrl(data.photos[0].dataUrl)) {
          setMetaTag('og:image', data.photos[0].dataUrl);
        }
      } catch (err: any) {
        // Firestore returns permission-denied when the listing owner has not upgraded to an active paid plan.
        if (err?.code !== 'permission-denied') {
          console.warn('Error loading public listing:', err);
        }
        if (isMounted) {
          setProperty(null);
          setPhotos([]);
          setOpenHouses([]);
          setLockedAsOwner(false);
          setNotFound(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPublicListing();

    return () => {
      isMounted = false;
      document.title = 'FSBO Compass | Sell Your Home By Owner';
    };
  }, [listingId, currentUser?.uid, authReady, authLoading, userProfile?.plan, userProfile?.planStatus, userProfile?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B5A] to-[#F2B544] flex items-center justify-center text-white shadow-lg shadow-[#FF6B5A]/20 mb-4 animate-pulse">
          <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="text-base font-bold text-[#0F2A44] dark:text-white font-heading">
          Loading Property Details...
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Checking listing publication status...
        </p>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          {lockedAsOwner ? <Lock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
        </div>
        <h2 className="text-2xl font-black font-heading text-[#0F2A44] dark:text-white mb-2">
          This listing is not published yet
        </h2>
        {lockedAsOwner ? (
          <>
            <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mb-5 leading-relaxed">
              Public buyer links are locked while you are on the free trial. Upgrade to publish your listing and share this link with buyers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {onNavigatePricing && (
                <button
                  type="button"
                  onClick={onNavigatePricing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B5A] hover:bg-[#e85a4a] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Upgrade to Publish</span>
                </button>
              )}
              <button
                type="button"
                onClick={onGoToDashboard || onGoHome}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F2A44] hover:bg-[#1A3D60] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Preview</span>
              </button>
            </div>
            {onNavigatePricing && <StripeBillingNotice className="max-w-md mt-4" />}
          </>
        ) : (
          <button
            type="button"
            onClick={onGoHome}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F2A44] hover:bg-[#1A3D60] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to FSBO Compass</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-stone-950">
      {/* Top Buyer Header Bar with Logo */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B5A] to-[#F2B544] flex items-center justify-center text-white shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-heading font-extrabold text-base text-[#0F2A44] dark:text-white tracking-tight">
            FSBO Compass
          </span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            For Sale By Owner
          </span>
          {authReady && currentUser && (
            <>
              <button
                type="button"
                onClick={onGoToDashboard || onGoHome}
                className="px-3 py-1.5 rounded-xl bg-[#0F2A44] hover:bg-[#1A3D60] text-white text-xs font-bold transition-colors"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => (onLogout ? onLogout() : logout())}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:text-red-600 hover:border-red-300 text-xs font-semibold transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Listing without seller controls */}
      <SectionMyListing
        property={property}
        photos={photos}
        openHouses={openHouses}
        isSellerView={false}
      />
    </div>
  );
};
