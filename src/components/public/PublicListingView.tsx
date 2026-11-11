import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PropertyProfile, PhotoItem, OpenHouseItem } from '../../types';
import { DEFAULT_PROPERTY } from '../../lib/defaults';
import { SectionMyListing } from '../sections/SectionMyListing';
import { Compass, AlertCircle, ArrowLeft } from 'lucide-react';

interface PublicListingViewProps {
  listingId: string;
  onGoHome: () => void;
}

export const PublicListingView: React.FC<PublicListingViewProps> = ({
  listingId,
  onGoHome,
}) => {
  const [property, setProperty] = useState<PropertyProfile | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [openHouses, setOpenHouses] = useState<OpenHouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicListing() {
      if (!listingId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        // Read single document from /listings/{listingId} (1 read)
        const listingRef = doc(db, 'listings', listingId);
        const snap = await getDoc(listingRef);

        if (snap.exists() && isMounted) {
          const data = snap.data() as any;
          const loadedProp: PropertyProfile = {
            ...DEFAULT_PROPERTY,
            ...data,
            id: snap.id,
          };
          setProperty(loadedProp);

          if (Array.isArray(data.photos)) {
            setPhotos(data.photos);
          }
          if (Array.isArray(data.openHouses)) {
            setOpenHouses(data.openHouses);
          }

          // Dynamically set OpenGraph and Title for social share cards
          const displayPrice = loadedProp.price > 0 ? `$${loadedProp.price.toLocaleString()}` : 'For Sale';
          const title = `${displayPrice} · ${loadedProp.address || 'Home For Sale By Owner'} | FSBO Compass`;
          const description = `${loadedProp.beds || 0} Beds · ${loadedProp.bathsFull || 0} Baths · ${
            loadedProp.sqft ? `${loadedProp.sqft.toLocaleString()} Sq Ft` : ''
          }. For sale directly by owner. No buyer agent commissions. View full details and tour schedule.`;

          document.title = title;

          const setMetaTag = (property: string, content: string) => {
            let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
            if (!meta) {
              meta = document.createElement('meta');
              meta.setAttribute('property', property);
              document.head.appendChild(meta);
            }
            meta.content = content;
          };

          setMetaTag('og:title', title);
          setMetaTag('og:description', description);
          setMetaTag('og:url', window.location.href);
          setMetaTag('og:type', 'website');
          if (data.photos?.[0]?.dataUrl) {
            setMetaTag('og:image', data.photos[0].dataUrl);
          }
        } else if (isMounted) {
          // If not in cloud listings yet, check localStorage for offline preview
          const localProp = localStorage.getItem('fsbo_property');
          if (localProp) {
            const parsed = JSON.parse(localProp);
            if (parsed.id === listingId || listingId === 'my-home') {
              setProperty(parsed);
              setLoading(false);
              return;
            }
          }
          setNotFound(true);
        }
      } catch (err: any) {
        console.error('Error loading public listing:', err);
        // Fallback to local property if viewing own home
        const localProp = localStorage.getItem('fsbo_property');
        if (localProp && isMounted) {
          setProperty(JSON.parse(localProp));
        } else if (isMounted) {
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
  }, [listingId]);

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
          Gathering photos, specs, and schedule directly from the owner.
        </p>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black font-heading text-[#0F2A44] dark:text-white mb-2">
          Listing Not Found
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mb-6 leading-relaxed">
          This property listing is either unavailable, has been sold, or the address URL was typed incorrectly.
        </p>
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F2A44] hover:bg-[#1A3D60] text-white text-xs font-bold transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to FSBO Compass</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-stone-950">
      {/* Top Buyer Header Bar with Logo */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
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

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          For Sale By Owner
        </span>
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
