import React, { useState, useEffect, useRef } from 'react';
import {
  PropertyProfile,
  PhotoItem,
  Settings,
  CompSale,
  PriceHistoryRecord,
  ListingCopyData,
  ListingSiteItem,
  ShowingItem,
  OpenHouseItem,
  VisitorLogItem,
  InquiryItem,
  DocumentItem,
  OfferItem,
  ClosingTeamInfo,
  PromoteGroup,
  ActiveTab,
} from './types';
import {
  DEFAULT_PROPERTY,
  DEFAULT_SETTINGS,
  DEFAULT_COMPS,
  DEFAULT_SITES,
  DEFAULT_DOCUMENTS,
  DEFAULT_PROMOTE_GROUPS,
} from './lib/defaults';
import { getAllPhotosFromDB, savePhotoToDB, clearAllDB } from './lib/indexedDb';
import { sanitizeListingCopy } from './lib/formatAiCopy';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';

// SaaS Public Pages
import { LandingPage } from './components/public/LandingPage';
import { PricingPage } from './components/public/PricingPage';
import { TermsPage } from './components/public/TermsPage';
import { PrivacyPage } from './components/public/PrivacyPage';
import { PublicPropertyView } from './components/public/PublicPropertyView';
import { PublicListingView } from './components/public/PublicListingView';
import { AuthModal } from './components/auth/AuthModal';

// SaaS Core Features
import { SectionMyListing } from './components/sections/SectionMyListing';
import { SectionAccount } from './components/account/SectionAccount';
import { AdminPanel } from './components/admin/AdminPanel';
import { HelpModal } from './components/common/HelpModal';
import { NotificationBell } from './components/common/NotificationBell';
import { uploadListingPhoto } from './lib/photoStorage';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

// 13 Original Sections
import { SectionDashboard } from './components/sections/SectionDashboard';
import { SectionProfile } from './components/sections/SectionProfile';
import { SectionAiFinder } from './components/sections/SectionAiFinder';
import { SectionPhotos } from './components/sections/SectionPhotos';
import { SectionPricing } from './components/sections/SectionPricing';
import { SectionListing } from './components/sections/SectionListing';
import { SectionSites } from './components/sections/SectionSites';
import { SectionWebsite } from './components/sections/SectionWebsite';
import { SectionShowings } from './components/sections/SectionShowings';
import { SectionInbox } from './components/sections/SectionInbox';
import { SectionPromote } from './components/sections/SectionPromote';
import { SectionRefresh } from './components/sections/SectionRefresh';
import { SectionClosing } from './components/sections/SectionClosing';
import { SectionSettings } from './components/sections/SectionSettings';
import { SectionHelp } from './components/sections/SectionHelp';

import { CloudUpload, X, HelpCircle, Compass, AlertTriangle, User, LogOut, ChevronDown } from 'lucide-react';
import { PlanType } from './types/saas';

import houseExteriorFront from './assets/images/house_exterior_front_1794286496562.jpg';
import houseKitchenInterior from './assets/images/house_kitchen_interior_1794286509490.jpg';
import houseLivingRoom from './assets/images/house_living_room_1794286521686.jpg';
import houseBackyard from './assets/images/house_backyard_1794286533470.jpg';

// Sample architectural demo photos
const SAMPLE_PHOTOS: PhotoItem[] = [
  {
    id: 'sample-front',
    dataUrl: houseExteriorFront,
    caption: 'Front Exterior & Beautiful Landscaping',
    isCover: true,
    roomCategory: 'Exterior',
    order: 0,
    coachQuality: 'Great',
    coachTip: 'Superb daylight exposure and level wide shot highlighting curb appeal and architecture.',
    analyzed: true,
  },
  {
    id: 'sample-kitchen',
    dataUrl: houseKitchenInterior,
    caption: 'Chef Kitchen with Quartz Waterfall Island & Stainless Appliances',
    isCover: false,
    roomCategory: 'Kitchen',
    order: 1,
    coachQuality: 'Great',
    coachTip: 'Spotless quartz countertops and brilliant natural lighting throughout.',
    analyzed: true,
  },
  {
    id: 'sample-living',
    dataUrl: houseLivingRoom,
    caption: 'Spacious Living Room with Hardwood Floors & Stone Fireplace',
    isCover: false,
    roomCategory: 'Living Room',
    order: 2,
    coachQuality: 'Great',
    coachTip: 'Warm and inviting seating layout with excellent natural window lighting.',
    analyzed: true,
  },
  {
    id: 'sample-backyard',
    dataUrl: houseBackyard,
    caption: 'Private Backyard with Trex Deck & Mature Wooded Boundary',
    isCover: false,
    roomCategory: 'Outdoor',
    order: 3,
    coachQuality: 'Great',
    coachTip: 'Sunny deck shot emphasizing generous lawn space and private green perimeter.',
    analyzed: true,
  },
];

function AppContent() {
  const {
    currentUser,
    userProfile,
    loading: authLoading,
    loadError,
    retryLoad,
    markOnboardingComplete,
    saasConfig,
    activeProperty,
    updateCurrentProperty,
    hasLocalDataToImport,
    importLocalDataToCloud,
    dismissLocalImportPrompt,
    grantUserPlan,
    logout,
  } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-listing');
  const [currentView, setCurrentView] = useState<'app' | 'landing' | 'pricing' | 'terms' | 'privacy' | 'property' | 'listing'>('app');
  const [publicPropertySlug, setPublicPropertySlug] = useState<string>('');
  const [publicListingId, setPublicListingId] = useState<string>('');

  // Modals & Menus
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(() => {
    return (localStorage.getItem('fsbo_pending_plan') as PlanType) || null;
  });
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [skippedWizard, setSkippedWizard] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [loggedOutMessage, setLoggedOutMessage] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // 1. Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('fsbo_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Clean empty property template for real users (demo data only loaded in Demo Preview)
  const BLANK_PROPERTY: PropertyProfile = {
    ...DEFAULT_PROPERTY,
    address: '',
    city: '',
    state: 'Michigan',
    zip: '',
    price: 0,
    originalPrice: 0,
    beds: 0,
    bathsFull: 0,
    bathsHalf: 0,
    sqft: 0,
    lotSize: '',
    yearBuilt: 0,
    taxes: 0,
    schoolDistrict: '',
    heating: '',
    cooling: '',
    garage: '',
    basement: '',
    roof: '',
    upgrades: [],
    specialNotes: ['', '', ''],
    features: [],
    walkthroughVideoUrl: '',
    photos: [],
    description: '',
    setupComplete: false,
  };

  // 2. Property Profile
  const [property, setProperty] = useState<PropertyProfile>(() => {
    const saved = localStorage.getItem('fsbo_property');
    return saved ? JSON.parse(saved) : BLANK_PROPERTY;
  });

  // 3. Photos (IndexedDB + fallback state)
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // 4. Comps
  const [comps, setComps] = useState<CompSale[]>(() => {
    const saved = localStorage.getItem('fsbo_comps');
    return saved ? JSON.parse(saved) : DEFAULT_COMPS;
  });

  // 5. Price History
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>(() => {
    const saved = localStorage.getItem('fsbo_price_history');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'ph-orig',
            date: '2026-11-01',
            oldPrice: 445000,
            newPrice: 435000,
            reason: 'Positioned aggressively for quick sale',
          },
        ];
  });

  // 6. Listing Copy
  const [listingCopy, setListingCopy] = useState<ListingCopyData | null>(() => {
    try {
      const saved = localStorage.getItem('fsbo_listing_copy');
      if (saved) {
        return sanitizeListingCopy(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load saved listing copy:', e);
    }
    return null;
  });

  // 7. Sites
  const [sites, setSites] = useState<ListingSiteItem[]>(() => {
    const saved = localStorage.getItem('fsbo_sites');
    return saved ? JSON.parse(saved) : DEFAULT_SITES;
  });

  // 8. Showings (clean empty array for real users; demo data loaded only in Demo Preview)
  const [showings, setShowings] = useState<ShowingItem[]>(() => {
    try {
      const saved = localStorage.getItem('fsbo_showings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((s: ShowingItem) => s.id !== 'show-demo-1' && s.id !== 'show-demo-2')
          : [];
      }
    } catch {}
    return [];
  });

  // 9. Open Houses
  const [openHouses, setOpenHouses] = useState<OpenHouseItem[]>(() => {
    try {
      const saved = localStorage.getItem('fsbo_open_houses');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((oh: OpenHouseItem) => oh.id !== 'oh-demo-1')
          : [];
      }
    } catch {}
    return [];
  });

  // 10. Visitor Log
  const [visitorLog, setVisitorLog] = useState<VisitorLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('fsbo_visitor_log');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((v: VisitorLogItem) => v.id !== 'vis-1')
          : [];
      }
    } catch {}
    return [];
  });

  // 11. Inquiries (clean empty array for real users; synced with Firestore /listings/{listingId}/inquiries)
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem('fsbo_inquiries');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((i: InquiryItem) => i.id !== 'inq-1' && i.id !== 'inq-2')
          : [];
      }
    } catch {}
    return [];
  });

  // 12. Documents
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('fsbo_documents');
    return saved ? JSON.parse(saved) : DEFAULT_DOCUMENTS;
  });

  // 13. Offers
  const [offers, setOffers] = useState<OfferItem[]>(() => {
    try {
      const saved = localStorage.getItem('fsbo_offers');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((o: OfferItem) => o.id !== 'offer-1')
          : [];
      }
    } catch {}
    return [];
  });

  // 14. Closing Team
  const [closingTeam, setClosingTeam] = useState<ClosingTeamInfo>(() => {
    const saved = localStorage.getItem('fsbo_closing_team');
    return saved
      ? JSON.parse(saved)
      : {
          attorneyOrTitle: 'Transnation Title Agency (Rochester Branch)',
          contactPerson: 'Kelly Thompson (Senior Escrow Officer)',
          phone: '(248) 555-8820',
          email: 'kthompson@transnationtitle.com',
          flatFeeQuoted: 750,
          notes: 'Will draft standard state purchase agreement, hold earnest money in escrow, and coordinate closing.',
        };
  });

  // 15. Promote Groups
  const [promoteGroups, setPromoteGroups] = useState<PromoteGroup[]>(() => {
    const saved = localStorage.getItem('fsbo_promote_groups');
    return saved ? JSON.parse(saved) : DEFAULT_PROMOTE_GROUPS;
  });

  // 16. Refresh Tracker
  const [lastRefreshDate, setLastRefreshDate] = useState<string>(() => {
    return localStorage.getItem('fsbo_last_refresh') || new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
  });

  // Close top-right profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial URL Routing & Protected Route Back-Button Guard
  useEffect(() => {
    const handleUrlRouting = (popEvent?: PopStateEvent) => {
      const path = window.location.pathname;
      if (path.startsWith('/listing/')) {
        const lid = path.replace(/^\/listing\//, '').split('/')[0];
        setPublicListingId(lid);
        setCurrentView('listing');
        return;
      }
      if (path.startsWith('/p/')) {
        const slug = path.replace(/^\/p\//, '').split('/')[0];
        setPublicPropertySlug(slug);
        setCurrentView('property');
        return;
      }
      if (path === '/terms') {
        setCurrentView('terms');
        return;
      }
      if (path === '/privacy') {
        setCurrentView('privacy');
        return;
      }
      if (path === '/pricing') {
        setCurrentView('pricing');
        return;
      }

      const isProtectedPath =
        path === '/admin' ||
        path === '/account' ||
        path === '/dashboard' ||
        path === '/my-listing' ||
        path === '/profile';

      if (!currentUser && !demoMode) {
        setCurrentView('landing');
        // If user navigated to a protected path or pressed Back onto a protected history entry while logged out, send to Sign In
        if (isProtectedPath || popEvent?.state?.protected) {
          window.history.replaceState({ loggedOut: true }, '', '/');
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }
        return;
      }

      // Signed-in user or demo preview
      if (path === '/admin') {
        setActiveTab('admin');
        setCurrentView('app');
      } else if (path === '/account') {
        setActiveTab('account');
        setCurrentView('app');
      } else if (path === '/dashboard') {
        setActiveTab('dashboard');
        setCurrentView('app');
      } else {
        setCurrentView('app');
        setActiveTab('my-listing');
      }
    };

    handleUrlRouting();
    const onPopState = (e: PopStateEvent) => handleUrlRouting(e);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [currentUser, demoMode]);

  // Prevent browser bfcache from displaying stale protected screens after logout
  useEffect(() => {
    const onPageShow = () => {
      const path = window.location.pathname;
      const isPublic =
        path.startsWith('/listing/') ||
        path.startsWith('/p/') ||
        path === '/pricing' ||
        path === '/terms' ||
        path === '/privacy';
      if (!currentUser && !demoMode && !isPublic && currentView === 'app') {
        setCurrentView('landing');
        setAuthModalMode('login');
        setAuthModalOpen(true);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [currentUser, demoMode, currentView]);

  // Check whether signed-in user has filled in their personalized home details / onboarding info
  const hasFilledInfo = Boolean(
    userProfile?.setupComplete ||
    userProfile?.hasCompletedOnboarding ||
    localStorage.getItem('fsbo_setup_complete') === 'true' ||
    property.setupComplete ||
    (property.address && property.address !== '4288 Meadowview Drive' && property.price > 0)
  );

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    setLoggedOutMessage(null);
    setSkippedWizard(false);
    window.history.pushState({ protected: true }, '', '/');
    setCurrentView('app');
    setActiveTab('my-listing');
  };

  // Record protected history state whenever navigating inside authenticated app
  const handleSelectAuthenticatedTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (currentUser && currentView === 'app') {
      window.history.replaceState({ protected: true, tab }, '', window.location.pathname);
    }
  };

  // If a signed-in user hasn't completed setup yet (once userProfile finishes loading), open the setup form
  useEffect(() => {
    if (currentUser && !authLoading && userProfile && !hasFilledInfo && !skippedWizard) {
      setShowWizard(true);
    }
  }, [currentUser, authLoading, userProfile, hasFilledInfo, skippedWizard]);

  // Sync activeProperty from Cloud into state
  useEffect(() => {
    if (activeProperty) {
      setProperty((prev) => ({
        ...prev,
        ...activeProperty,
      }));
      if (Array.isArray(activeProperty.photos) && activeProperty.photos.length > 0) {
        setPhotos(activeProperty.photos);
      }
    }
  }, [activeProperty]);

  // Helper to sync public listing document (/listings/{listingId}) for buyer view
  const syncPublicListing = async (
    propToSync: PropertyProfile,
    photosToSync: PhotoItem[],
    openHousesToSync: OpenHouseItem[]
  ) => {
    if (!currentUser) return;
    const listingId = propToSync.id || activeProperty?.id || propToSync.publishedSlug || currentUser.uid;
    if (!listingId) return;

    try {
      const publicPayload = {
        id: listingId,
        ownerUid: currentUser.uid,
        address: propToSync.address || '',
        city: propToSync.city || '',
        state: propToSync.state || 'Michigan',
        zip: propToSync.zip || '',
        price: propToSync.price || 0,
        beds: propToSync.beds || 0,
        bathsFull: propToSync.bathsFull || 0,
        bathsHalf: propToSync.bathsHalf || 0,
        sqft: propToSync.sqft || 0,
        lotSize: propToSync.lotSize || '',
        yearBuilt: propToSync.yearBuilt || 0,
        propertyType: 'Single Family',
        garage: propToSync.garage || '',
        heating: propToSync.heating || '',
        cooling: propToSync.cooling || '',
        basement: propToSync.basement || '',
        roof: propToSync.roof || '',
        taxes: propToSync.taxes || 0,
        hoa: propToSync.hoa || { hasHoa: false, monthlyFee: 0, name: '' },
        schoolDistrict: propToSync.schoolDistrict || '',
        description: propToSync.description || listingCopy?.fullDescription || '',
        features: propToSync.features || [],
        upgrades: propToSync.upgrades || [],
        photos: photosToSync.map((p, idx) => ({
          id: p.id,
          dataUrl: p.dataUrl,
          caption: p.caption || '',
          isCover: Boolean(p.isCover || idx === 0),
          roomCategory: p.roomCategory || 'Exterior',
          order: idx,
        })),
        openHouses: (openHousesToSync || []).map((oh) => ({
          id: oh.id,
          date: oh.date,
          startTime: oh.startTime,
          endTime: oh.endTime,
          notes: oh.notes || '',
        })),
        published: Boolean(propToSync.published ?? true),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'listings', listingId), publicPayload, { merge: true });
    } catch (err) {
      console.warn('Could not sync public listing document:', err);
    }
  };

  // Load real buyer leads/inquiries submitted to /listings/{listingId}/inquiries (1 read per load)
  useEffect(() => {
    const listingId = property.id || activeProperty?.id;
    if (!currentUser || !listingId || demoMode) return;

    async function loadBuyerInquiries() {
      try {
        const snap = await getDocs(collection(db, 'listings', listingId as string, 'inquiries'));
        const cloudInquiries: InquiryItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          cloudInquiries.push({
            id: data.id || d.id,
            name: data.buyerName || 'Buyer',
            email: data.buyerEmail || '',
            phone: data.buyerPhone || '',
            source: 'FSBO Listing Page',
            dateReceived: data.createdAt || new Date().toISOString(),
            message: data.message || '',
            replied: Boolean(data.replied),
            notes: data.interestType ? `Interest: ${data.interestType}` : '',
          });
        });

        if (cloudInquiries.length > 0) {
          setInquiries((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const merged = [...cloudInquiries.filter((c) => !existingIds.has(c.id)), ...prev];
            return merged.sort(
              (a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime()
            );
          });
        }
      } catch (err) {
        console.warn('Could not load listing inquiries:', err);
      }
    }

    loadBuyerInquiries();
  }, [currentUser, property.id, activeProperty?.id, demoMode]);

  // Clean up Stripe checkout callback parameters from the address bar (no client-side plan grants)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('payment_success') || params.has('session_id') || params.has('canceled') || params.has('upgraded')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Load photos from IndexedDB on startup (no sample photos forced onto real users)
  useEffect(() => {
    const loadPhotos = async () => {
      if (!currentUser && !demoMode) return;
      try {
        const dbPhotos = await getAllPhotosFromDB();
        const hasLegacyUnsplash = dbPhotos && dbPhotos.some((p: any) => p.dataUrl?.includes('unsplash'));
        if (dbPhotos && dbPhotos.length > 0 && !hasLegacyUnsplash) {
          setPhotos(dbPhotos);
        } else if (demoMode) {
          for (const sp of SAMPLE_PHOTOS) {
            await savePhotoToDB(sp.id, sp.dataUrl, { caption: sp.caption, isCover: sp.isCover });
          }
          setPhotos(SAMPLE_PHOTOS);
        }
      } catch (err) {
        console.warn('Could not read IndexedDB photos:', err);
      }
    };
    loadPhotos();
  }, [currentUser, demoMode]);

  // Sync to LocalStorage ONLY when authenticated or in demo mode (never re-write after logout)
  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_settings', JSON.stringify(settings));
  }, [settings, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_property', JSON.stringify(property));
  }, [property, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_comps', JSON.stringify(comps));
  }, [comps, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_price_history', JSON.stringify(priceHistory));
  }, [priceHistory, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    if (listingCopy) {
      localStorage.setItem('fsbo_listing_copy', JSON.stringify(listingCopy));
    }
  }, [listingCopy, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_sites', JSON.stringify(sites));
  }, [sites, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_showings', JSON.stringify(showings));
  }, [showings, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_open_houses', JSON.stringify(openHouses));
  }, [openHouses, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_visitor_log', JSON.stringify(visitorLog));
  }, [visitorLog, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_inquiries', JSON.stringify(inquiries));
  }, [inquiries, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_documents', JSON.stringify(documents));
  }, [documents, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_offers', JSON.stringify(offers));
  }, [offers, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_closing_team', JSON.stringify(closingTeam));
  }, [closingTeam, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_promote_groups', JSON.stringify(promoteGroups));
  }, [promoteGroups, currentUser, demoMode]);

  useEffect(() => {
    if (!currentUser && !demoMode) return;
    localStorage.setItem('fsbo_last_refresh', lastRefreshDate);
  }, [lastRefreshDate, currentUser, demoMode]);

  // Dark mode class sync
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Dynamic Ready to List Score calculation
  const calculateReadyScore = () => {
    let score = 0;
    if (property.address && property.price > 0 && property.beds > 0 && property.sqft > 0) score += 15;
    if (property.features.length >= 8) score += 10;
    else if (property.features.length >= 4) score += 5;
    if (photos.length >= 10) score += 15;
    else if (photos.length >= 5) score += 10;
    else if (photos.length >= 1) score += 5;
    if (photos.some((p) => p.isCover)) score += 5;
    if (comps.length >= 3) score += 10;
    else if (comps.length >= 1) score += 5;
    if (listingCopy?.headline && listingCopy?.fullDescription) score += 15;
    const liveSites = sites.filter((s) => s.status === 'Live').length;
    if (liveSites >= 3) score += 10;
    else if (liveSites >= 1) score += 5;
    score += 10;
    const uploadedDocs = documents.filter((d) => d.status === 'Uploaded').length;
    if (uploadedDocs >= 2) score += 10;
    else if (uploadedDocs >= 1) score += 5;
    return Math.min(100, score);
  };

  const readyScore = calculateReadyScore();
  const openInquiriesCount = inquiries.filter((i) => !i.replied).length;

  const handleToggleDarkMode = () => {
    setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handlePerformRefresh = () => {
    const today = new Date().toISOString().split('T')[0];
    setLastRefreshDate(today);
  };

  const handleRestoreAllData = (backup: any) => {
    if (backup.settings) setSettings(backup.settings);
    if (backup.property) setProperty(backup.property);
    if (backup.comps) setComps(backup.comps);
    if (backup.priceHistory) setPriceHistory(backup.priceHistory);
    if (backup.listingCopy) setListingCopy(sanitizeListingCopy(backup.listingCopy));
    if (backup.sites) setSites(backup.sites);
    if (backup.showings) setShowings(backup.showings);
    if (backup.openHouses) setOpenHouses(backup.openHouses);
    if (backup.visitorLog) setVisitorLog(backup.visitorLog);
    if (backup.inquiries) setInquiries(backup.inquiries);
    if (backup.documents) setDocuments(backup.documents);
    if (backup.offers) setOffers(backup.offers);
    if (backup.closingTeam) setClosingTeam(backup.closingTeam);
    if (backup.promoteGroups) setPromoteGroups(backup.promoteGroups);
    if (backup.photos) setPhotos(backup.photos);
  };

  const handleResetDefaults = async () => {
    await clearAllDB();
    localStorage.clear();
    setSettings(DEFAULT_SETTINGS);
    setProperty(DEFAULT_PROPERTY);
    setComps(DEFAULT_COMPS);
    setSites(DEFAULT_SITES);
    setDocuments(DEFAULT_DOCUMENTS);
    setPromoteGroups(DEFAULT_PROMOTE_GROUPS);
    setPhotos(SAMPLE_PHOTOS);
    for (const sp of SAMPLE_PHOTOS) {
      await savePhotoToDB(sp.id, sp.dataUrl, { caption: sp.caption, isCover: sp.isCover });
    }
    setActiveTab('dashboard');
  };

  const handleUpdateProperty = async (newProp: PropertyProfile) => {
    setProperty(newProp);
    if (currentUser) {
      await updateCurrentProperty(newProp);
      await syncPublicListing(newProp, photos, openHouses);
    }
  };

  const handleUpdatePhotos = async (newPhotos: PhotoItem[]) => {
    let processedPhotos = newPhotos;
    if (currentUser) {
      processedPhotos = await Promise.all(
        newPhotos.map(async (p) => {
          if (p.dataUrl && !p.dataUrl.startsWith('http') && !p.dataUrl.startsWith('/')) {
            const url = await uploadListingPhoto(currentUser.uid, p.id, p.dataUrl);
            return { ...p, dataUrl: url };
          }
          return p;
        })
      );
    }
    setPhotos(processedPhotos);
    const updatedProp: PropertyProfile = {
      ...property,
      photos: processedPhotos,
    };
    setProperty(updatedProp);
    if (currentUser) {
      await updateCurrentProperty(updatedProp);
      await syncPublicListing(updatedProp, processedPhotos, openHouses);
    }
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    setShowWizard(false);
    setAuthModalOpen(false);
    setHelpModalOpen(false);
    setDemoMode(false);
    setSkippedWizard(false);

    try {
      await logout();
    } catch (err) {
      console.error('Error during logout:', err);
    }

    // Clear saved user & listing state from memory
    setSettings(DEFAULT_SETTINGS);
    setProperty(BLANK_PROPERTY);
    setPhotos([]);
    setListingCopy(null);
    setShowings([]);
    setOpenHouses([]);
    setVisitorLog([]);
    setInquiries([]);
    setOffers([]);
    setActiveTab('my-listing');
    setLoggedOutMessage("You've been logged out.");

    // Replace current history state so Back button cannot return to protected pages while signed out
    window.history.replaceState({ loggedOut: true }, '', '/');
    setCurrentView('landing');
  };

  const handleStartDemoPreview = async () => {
    setLoggedOutMessage(null);
    setProperty(DEFAULT_PROPERTY);
    setPhotos(SAMPLE_PHOTOS);
    for (const sp of SAMPLE_PHOTOS) {
      await savePhotoToDB(sp.id, sp.dataUrl, { caption: sp.caption, isCover: sp.isCover });
    }
    setShowings([
      {
        id: 'show-demo-1',
        date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        time: '2:00 PM',
        buyerName: 'Marcus & Elena Vance',
        buyerPhone: '(248) 555-0192',
        buyerEmail: 'vance.family@example.com',
        hasPreApproval: true,
        status: 'Confirmed',
        notes: 'Pre-approved via Rocket Mortgage. Excited about backyard and new kitchen.',
        createdAt: new Date().toISOString(),
      },
    ]);
    setInquiries([
      {
        id: 'inq-1',
        name: 'Sarah Jenkins',
        email: 'sjenkins@example.com',
        phone: '(586) 555-0144',
        source: 'Zillow FSBO',
        dateReceived: new Date().toISOString().split('T')[0],
        message: 'Hi! Is the home still available? Can we schedule a private tour this Saturday?',
        replied: false,
        notes: 'Demo buyer inquiry',
      },
    ]);
    setDemoMode(true);
    setActiveTab('my-listing');
    setCurrentView('app');
  };

  // Plan Checkout Initiation
  const handleSelectPlan = async (planId: PlanType) => {
    if (!currentUser) {
      setPendingPlan(planId);
      localStorage.setItem('fsbo_pending_plan', planId);
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      return;
    }

    if (planId === 'trial') {
      await grantUserPlan(currentUser.uid, 'trial', 'trialing');
      setCurrentView('app');
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          planId,
          propertyId: (property as any).id || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout initiation failed');
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Could not start checkout.');
    }
  };

  // Continue checkout/trial activation once guest authenticates
  useEffect(() => {
    if (currentUser && pendingPlan) {
      const target = pendingPlan;
      setPendingPlan(null);
      localStorage.removeItem('fsbo_pending_plan');
      handleSelectPlan(target);
    }
  }, [currentUser, pendingPlan]);

  // 0. Render Public Buyer Property Landing Page (/listing/:listingId)
  if (currentView === 'listing' && publicListingId) {
    return (
      <PublicListingView
        listingId={publicListingId}
        onGoHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentView(currentUser ? 'app' : 'landing');
        }}
      />
    );
  }

  // 1. Render Hosted Property Website (/p/:slug)
  if (currentView === 'property' && publicPropertySlug) {
    return (
      <PublicPropertyView
        slug={publicPropertySlug}
        onNavigateHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentView(currentUser ? 'app' : 'landing');
        }}
      />
    );
  }

  // 2. Render Terms Page
  if (currentView === 'terms') {
    return (
      <>
        <TermsPage
          onBack={() => {
            window.history.pushState({}, '', '/');
            setCurrentView(currentUser ? 'app' : 'landing');
          }}
          onOpenAuth={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // 3. Render Privacy Page
  if (currentView === 'privacy') {
    return (
      <>
        <PrivacyPage
          onBack={() => {
            window.history.pushState({}, '', '/');
            setCurrentView(currentUser ? 'app' : 'landing');
          }}
          onOpenAuth={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // 4. Render Dynamic Pricing Page
  if (currentView === 'pricing') {
    return (
      <>
        <PricingPage
          saasConfig={saasConfig}
          currentPlan={userProfile?.plan}
          onSelectPlan={handleSelectPlan}
          onBackToHome={() => {
            window.history.pushState({}, '', '/');
            setCurrentView(currentUser ? 'app' : 'landing');
          }}
          onLogin={() => {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // 5. Loading State: While Firebase Auth or Firestore user is initializing, show clean spinner (never flash marketing page)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B5A] to-[#F2B544] flex items-center justify-center text-white shadow-lg shadow-[#FF6B5A]/20 mb-4 animate-pulse">
          <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
          Loading your property...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          FSBO Compass
        </p>
      </div>
    );
  }

  // 6. Error State: If loading user information from Firestore failed, show friendly error with Try Again button
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white mb-1">
          Couldn't load your property information
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => retryLoad()}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] shadow-sm transition-all"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-3 text-xs font-semibold text-slate-500 hover:text-[#FF6B5A] underline"
        >
          Log Out
        </button>
      </div>
    );
  }

  // 7. Render Public Marketing Landing Page (if guest & not demo mode)
  if (!currentUser && !demoMode) {
    return (
      <>
        <LandingPage
          saasConfig={saasConfig}
          loggedOutMessage={loggedOutMessage}
          onDismissLoggedOut={() => setLoggedOutMessage(null)}
          onStartFree={() => {
            setLoggedOutMessage(null);
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          onLogin={() => {
            setLoggedOutMessage(null);
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }}
          onViewPricing={() => {
            window.history.pushState({}, '', '/pricing');
            setCurrentView('pricing');
          }}
          onViewTerms={() => {
            window.history.pushState({}, '', '/terms');
            setCurrentView('terms');
          }}
          onViewPrivacy={() => {
            window.history.pushState({}, '', '/privacy');
            setCurrentView('privacy');
          }}
          onDemoPreview={handleStartDemoPreview}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  const profileDisplayName =
    userProfile?.displayName ||
    currentUser?.displayName ||
    settings.sellerName ||
    currentUser?.email?.split('@')[0] ||
    'Seller';
  const profileEmail = userProfile?.email || currentUser?.email || '';
  const profileInitial = (profileDisplayName.trim().charAt(0) || 'S').toUpperCase();

  // 6. Authenticated FSBO Compass Workspace
  return (
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-stone-950 text-[#0F2A44] dark:text-stone-100 flex flex-col lg:flex-row antialiased selection:bg-[#FF6B5A] selection:text-white font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectAuthenticatedTab}
        readyScore={readyScore}
        openInquiriesCount={openInquiriesCount}
        settings={settings}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenHelp={() => {
          handleSelectAuthenticatedTab('help');
          setCurrentView('app');
        }}
        onOpenPricing={() => {
          window.history.pushState({}, '', '/pricing');
          setCurrentView('pricing');
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-12 overflow-y-auto">
        {/* Top App Bar */}
        <header className="sticky top-12 lg:top-0 z-20 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({ protected: true }, '', '/');
                handleSelectAuthenticatedTab('my-listing');
                setCurrentView('app');
              }}
              className="text-left flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
              title="Go to My Listing"
            >
              <span className="font-heading font-extrabold text-sm text-[#0F2A44] dark:text-white hidden sm:inline-block">
                {property.address || 'My FSBO Listing'}
              </span>
            </button>
            {userProfile?.plan === 'trial' && (
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/pricing');
                  setCurrentView('pricing');
                }}
                className="text-[10px] font-bold px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-full transition-colors uppercase tracking-wider"
              >
                7-Day Trial &bull; Upgrade to Publish
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setHelpModalOpen(true)}
              className="p-2 text-stone-500 hover:text-[#0F2A44] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-[#F2B544]" />
              <span className="hidden md:inline">Support</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell onSelectTab={(tab) => handleSelectAuthenticatedTab(tab as ActiveTab)} />

            {/* Top-Right Profile Avatar & Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0F2A44] to-[#1E6F80] text-white font-heading font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-[#FF6B5A]/30">
                  {profileInitial}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 hidden sm:block" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800">
                    <div className="text-xs font-bold text-[#0F2A44] dark:text-white truncate">
                      {profileDisplayName}
                    </div>
                    {profileEmail && (
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {profileEmail}
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleSelectAuthenticatedTab('account');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#0F2A44] dark:text-stone-400" />
                      <span>Account &amp; Billing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setHelpModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-[#F2B544]" />
                      <span>Help &amp; Support</span>
                    </button>
                  </div>

                  <div className="pt-1 mt-1 border-t border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Local Data Migration Banner */}
        {hasLocalDataToImport && currentUser && (
          <div className="bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-800 p-3.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-sky-900 dark:text-sky-200">
            <div className="flex items-center gap-2.5">
              <CloudUpload className="w-5 h-5 text-sky-600 shrink-0" />
              <span>
                <strong>Saved Listing Found:</strong> We detected property photos and checklist data from your earlier offline session.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={importLocalDataToCloud}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm transition-colors text-xs"
              >
                Import to Cloud
              </button>
              <button
                onClick={dismissLocalImportPrompt}
                className="p-1 text-sky-600 hover:text-sky-900"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'my-listing' ? (
          <SectionMyListing
            property={property}
            photos={photos}
            openHouses={openHouses}
            inquiriesCount={inquiries.length}
            isSellerView={true}
            isTrial={userProfile?.plan === 'trial'}
            onEditListing={() => setShowWizard(true)}
            onNavigate={handleSelectAuthenticatedTab}
            onAddInquiry={(inq) => setInquiries((prev) => [inq, ...prev])}
            onOpenPricing={() => {
              window.history.pushState({}, '', '/pricing');
              setCurrentView('pricing');
            }}
            onAddPhotos={() => handleSelectAuthenticatedTab('photos')}
          />
        ) : (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <SectionDashboard
              property={property}
              photos={photos}
              sites={sites}
              showings={showings}
              openHouses={openHouses}
              inquiries={inquiries}
              readyScore={readyScore}
              lastRefreshDate={lastRefreshDate}
              onNavigate={handleSelectAuthenticatedTab}
            />
          )}

          {activeTab === 'profile' && (
            <SectionProfile
              property={property}
              onChange={handleUpdateProperty}
              onNavigate={handleSelectAuthenticatedTab}
            />
          )}

          {activeTab === 'ai-finder' && (
            <SectionAiFinder
              property={property}
              photos={photos}
              onUpdateProperty={handleUpdateProperty}
              onNavigate={handleSelectAuthenticatedTab}
            />
          )}

          {activeTab === 'photos' && (
            <SectionPhotos
              property={property}
              photos={photos}
              onUpdatePhotos={handleUpdatePhotos}
              onUpdateProperty={handleUpdateProperty}
              onNavigate={handleSelectAuthenticatedTab}
            />
          )}

          {activeTab === 'pricing' && (
            <SectionPricing
              property={property}
              comps={comps}
              priceHistory={priceHistory}
              settings={settings}
              onUpdateComps={setComps}
              onUpdatePriceHistory={setPriceHistory}
              onUpdateProperty={handleUpdateProperty}
              onNavigate={handleSelectAuthenticatedTab}
            />
          )}

          {activeTab === 'listing' && (
            <SectionListing
              property={property}
              listingCopy={listingCopy}
              onUpdateListingCopy={setListingCopy}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'sites' && (
            <SectionSites
              sites={sites}
              listingCopy={listingCopy}
              property={property}
              onUpdateSites={setSites}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'website' && (
            <SectionWebsite
              property={property}
              photos={photos}
              settings={settings}
              openHouses={openHouses}
              documents={documents}
              onNavigate={setActiveTab}
              onOpenPricing={() => {
                window.history.pushState({}, '', '/pricing');
                setCurrentView('pricing');
              }}
            />
          )}

          {activeTab === 'showings' && (
            <SectionShowings
              property={property}
              showings={showings}
              openHouses={openHouses}
              visitorLog={visitorLog}
              settings={settings}
              onUpdateShowings={setShowings}
              onUpdateOpenHouses={(nextOpenHouses) => {
                setOpenHouses(nextOpenHouses);
                if (currentUser) {
                  syncPublicListing(property, photos, nextOpenHouses);
                }
              }}
              onUpdateVisitorLog={setVisitorLog}
              onUpdateSettings={setSettings}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'inbox' && (
            <SectionInbox
              inquiries={inquiries}
              property={property}
              settings={settings}
              onUpdateInquiries={setInquiries}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'promote' && (
            <SectionPromote
              property={property}
              settings={settings}
              groups={promoteGroups}
              openHouses={openHouses}
              onUpdateGroups={setPromoteGroups}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'refresh' && (
            <SectionRefresh
              property={property}
              settings={settings}
              sites={sites}
              priceHistory={priceHistory}
              lastRefreshDate={lastRefreshDate}
              onUpdateProperty={handleUpdateProperty}
              onUpdateSettings={setSettings}
              onUpdatePriceHistory={setPriceHistory}
              onPerformRefresh={handlePerformRefresh}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'closing' && (
            <SectionClosing
              property={property}
              settings={settings}
              documents={documents}
              offers={offers}
              closingTeam={closingTeam}
              onUpdateDocuments={setDocuments}
              onUpdateOffers={setOffers}
              onUpdateClosingTeam={setClosingTeam}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'account' && (
            <SectionAccount
              onOpenPricing={() => {
                window.history.pushState({}, '', '/pricing');
                setCurrentView('pricing');
              }}
              onOpenCompare={() => {
                window.history.pushState({}, '', '/pricing#compare');
                setCurrentView('pricing');
              }}
            />
          )}

          {activeTab === 'help' && (
            <SectionHelp
              onNavigate={setActiveTab}
              onViewTerms={() => {
                window.history.pushState({}, '', '/terms');
                setCurrentView('terms');
              }}
              onViewPrivacy={() => {
                window.history.pushState({}, '', '/privacy');
                setCurrentView('privacy');
              }}
            />
          )}

          {activeTab === 'admin' && <AdminPanel />}

          {activeTab === 'settings' && (
            <SectionSettings
              settings={settings}
              property={property}
              photos={photos}
              allAppData={{
                settings,
                property,
                comps,
                priceHistory,
                listingCopy,
                sites,
                showings,
                openHouses,
                visitorLog,
                inquiries,
                documents,
                offers,
                closingTeam,
                promoteGroups,
                lastRefreshDate,
              }}
              onUpdateSettings={setSettings}
              onUpdateProperty={handleUpdateProperty}
              onRestoreAllData={handleRestoreAllData}
              onRelaunchWizard={() => setShowWizard(true)}
              onResetDefaults={handleResetDefaults}
              onNavigate={setActiveTab}
            />
          )}
        </div>
        )}
      </main>

      {/* Onboarding / Edit Listing Wizard Modal */}
      {showWizard && (
        <OnboardingWizard
          property={property}
          photos={photos}
          isEditing={hasFilledInfo}
          onComplete={async (updatedProp, updatedPhotos) => {
            // Upload photos to Firebase Storage if signed in
            let uploadedPhotos = updatedPhotos;
            if (currentUser) {
              uploadedPhotos = await Promise.all(
                updatedPhotos.map(async (p) => {
                  if (p.dataUrl && !p.dataUrl.startsWith('http')) {
                    const url = await uploadListingPhoto(currentUser.uid, p.id, p.dataUrl);
                    return { ...p, dataUrl: url };
                  }
                  return p;
                })
              );
            }

            const listingId = updatedProp.id || activeProperty?.id || currentUser?.uid || 'my-home';
            const finalProp: PropertyProfile = {
              ...updatedProp,
              id: listingId,
              published: updatedProp.published ?? true,
              setupComplete: true,
              photos: uploadedPhotos,
            };

            setPhotos(uploadedPhotos);
            setProperty(finalProp);
            setShowWizard(false);
            setSkippedWizard(false);

            if (currentUser) {
              await updateCurrentProperty(finalProp);
              await syncPublicListing(finalProp, uploadedPhotos, openHouses);
              await markOnboardingComplete();
            }

            handleSelectAuthenticatedTab('my-listing');
            setCurrentView('app');
          }}
          onClose={() => {
            setShowWizard(false);
            setSkippedWizard(true);
          }}
        />
      )}

      {/* Support / Help Modal */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
