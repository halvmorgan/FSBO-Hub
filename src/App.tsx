import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
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
import { getAllPhotosFromDB, clearAllDB } from './lib/indexedDb';
import { sanitizeListingCopy } from './lib/formatAiCopy';
import {
  sanitizeSavedDescription,
  sanitizeSpecialNotes,
  hasLegacySampleText,
  isStockPhotoUrl,
} from './lib/sampleScrub';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/public/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { NotificationBell } from './components/common/NotificationBell';
import { uploadListingPhoto } from './lib/photoStorage';
import { doc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';
import { CloudUpload, X, HelpCircle, Compass, AlertTriangle, User, LogOut, ChevronDown } from 'lucide-react';
import { PlanType } from './types/saas';

// Route-level & tab-level code splitting for fast initial bundle load
const PricingPage = lazy(() =>
  import('./components/public/PricingPage').then((m) => ({ default: m.PricingPage }))
);
const TermsPage = lazy(() =>
  import('./components/public/TermsPage').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazy(() =>
  import('./components/public/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const PublicPropertyView = lazy(() =>
  import('./components/public/PublicPropertyView').then((m) => ({ default: m.PublicPropertyView }))
);
const PublicListingView = lazy(() =>
  import('./components/public/PublicListingView').then((m) => ({ default: m.PublicListingView }))
);

const OnboardingWizard = lazy(() =>
  import('./components/onboarding/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard }))
);
const HelpModal = lazy(() =>
  import('./components/common/HelpModal').then((m) => ({ default: m.HelpModal }))
);
const AdminPanel = lazy(() =>
  import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);

const SectionMyListing = lazy(() =>
  import('./components/sections/SectionMyListing').then((m) => ({ default: m.SectionMyListing }))
);
const SectionAccount = lazy(() =>
  import('./components/account/SectionAccount').then((m) => ({ default: m.SectionAccount }))
);
const SectionDashboard = lazy(() =>
  import('./components/sections/SectionDashboard').then((m) => ({ default: m.SectionDashboard }))
);
const SectionProfile = lazy(() =>
  import('./components/sections/SectionProfile').then((m) => ({ default: m.SectionProfile }))
);
const SectionAiFinder = lazy(() =>
  import('./components/sections/SectionAiFinder').then((m) => ({ default: m.SectionAiFinder }))
);
const SectionPhotos = lazy(() =>
  import('./components/sections/SectionPhotos').then((m) => ({ default: m.SectionPhotos }))
);
const SectionPricing = lazy(() =>
  import('./components/sections/SectionPricing').then((m) => ({ default: m.SectionPricing }))
);
const SectionListing = lazy(() =>
  import('./components/sections/SectionListing').then((m) => ({ default: m.SectionListing }))
);
const SectionSites = lazy(() =>
  import('./components/sections/SectionSites').then((m) => ({ default: m.SectionSites }))
);
const SectionWebsite = lazy(() =>
  import('./components/sections/SectionWebsite').then((m) => ({ default: m.SectionWebsite }))
);
const SectionShowings = lazy(() =>
  import('./components/sections/SectionShowings').then((m) => ({ default: m.SectionShowings }))
);
const SectionInbox = lazy(() =>
  import('./components/sections/SectionInbox').then((m) => ({ default: m.SectionInbox }))
);
const SectionPromote = lazy(() =>
  import('./components/sections/SectionPromote').then((m) => ({ default: m.SectionPromote }))
);
const SectionRefresh = lazy(() =>
  import('./components/sections/SectionRefresh').then((m) => ({ default: m.SectionRefresh }))
);
const SectionClosing = lazy(() =>
  import('./components/sections/SectionClosing').then((m) => ({ default: m.SectionClosing }))
);
const SectionSettings = lazy(() =>
  import('./components/sections/SectionSettings').then((m) => ({ default: m.SectionSettings }))
);
const SectionHelp = lazy(() =>
  import('./components/sections/SectionHelp').then((m) => ({ default: m.SectionHelp }))
);

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

const EMPTY_CLOSING_TEAM: ClosingTeamInfo = {
  attorneyOrTitle: '',
  contactPerson: '',
  phone: '',
  email: '',
  flatFeeQuoted: 0,
  notes: '',
};

function readUserKey<T>(uid: string, key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`fsbo_u_${uid}_${key}`);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // ignore parse errors
  }
  return fallback;
}

function writeUserKey(uid: string, key: string, value: any) {
  try {
    localStorage.setItem(`fsbo_u_${uid}_${key}`, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

type AppView =
  | 'app'
  | 'landing'
  | 'pricing'
  | 'terms'
  | 'privacy'
  | 'property'
  | 'listing'
  | 'signup'
  | 'login';

function getInitialRouteState(): {
  view: AppView;
  listingId: string;
  propertySlug: string;
} {
  if (typeof window === 'undefined') {
    return { view: 'app', listingId: '', propertySlug: '' };
  }
  const path = window.location.pathname;
  if (path.startsWith('/listing/')) {
    return {
      view: 'listing',
      listingId: path.replace(/^\/listing\//, '').split('/')[0] || '',
      propertySlug: '',
    };
  }
  if (path.startsWith('/p/')) {
    return {
      view: 'property',
      listingId: '',
      propertySlug: path.replace(/^\/p\//, '').split('/')[0] || '',
    };
  }
  if (path === '/terms') return { view: 'terms', listingId: '', propertySlug: '' };
  if (path === '/privacy') return { view: 'privacy', listingId: '', propertySlug: '' };
  if (path === '/pricing') return { view: 'pricing', listingId: '', propertySlug: '' };
  if (path === '/signup') return { view: 'signup', listingId: '', propertySlug: '' };
  if (path === '/login') return { view: 'login', listingId: '', propertySlug: '' };
  return { view: 'app', listingId: '', propertySlug: '' };
}

function scrubPropertyData(prop: PropertyProfile): {
  cleaned: PropertyProfile;
  hadLegacySample: boolean;
} {
  const rawDesc = prop.description || '';
  const cleanedDesc = sanitizeSavedDescription(rawDesc);
  const hadDescSample = Boolean(rawDesc && !cleanedDesc && hasLegacySampleText(rawDesc));

  const rawNotes = Array.isArray(prop.specialNotes) ? prop.specialNotes : [];
  const hadNoteSample = rawNotes.some((n) => hasLegacySampleText(n));
  const cleanedNotesList = sanitizeSpecialNotes(rawNotes);
  const cleanedNotesTuple: [string, string, string] = [
    cleanedNotesList[0] || '',
    cleanedNotesList[1] || '',
    cleanedNotesList[2] || '',
  ];

  const rawFeatures = Array.isArray(prop.features) ? prop.features : [];
  const hadFeatureSample = rawFeatures.some((f) => hasLegacySampleText(f));
  const cleanedFeatures = rawFeatures.filter((f) => !hasLegacySampleText(f));

  const rawUpgrades = Array.isArray(prop.upgrades) ? prop.upgrades : [];
  const hadUpgradeSample = rawUpgrades.some((u) => hasLegacySampleText(u?.item));
  const cleanedUpgrades = rawUpgrades.filter((u) => !hasLegacySampleText(u?.item));

  const rawPhotos = Array.isArray(prop.photos) ? prop.photos : [];
  const cleanedPhotos = rawPhotos.filter((p) => p?.dataUrl && !isStockPhotoUrl(p.dataUrl));
  const hadStockPhoto = cleanedPhotos.length !== rawPhotos.length;

  const hadLegacySample =
    hadDescSample || hadNoteSample || hadFeatureSample || hadUpgradeSample || hadStockPhoto;

  return {
    hadLegacySample,
    cleaned: {
      ...prop,
      description: cleanedDesc,
      specialNotes: cleanedNotesTuple,
      features: cleanedFeatures,
      upgrades: cleanedUpgrades,
      photos: cleanedPhotos,
    },
  };
}

function PageLoader() {
  return (
    <div className="min-h-[45vh] flex flex-col items-center justify-center p-8 text-center font-sans">
      <div className="w-10 h-10 border-4 border-[#FF6B5A] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  );
}

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

  const initialRoute = getInitialRouteState();

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-listing');
  const [currentView, setCurrentView] = useState<AppView>(initialRoute.view);
  const [publicPropertySlug, setPublicPropertySlug] = useState<string>(initialRoute.propertySlug);
  const [publicListingId, setPublicListingId] = useState<string>(initialRoute.listingId);

  // Modals & Menus (pendingPlan is strictly in-memory, never persisted across refreshes)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [skippedWizard, setSkippedWizard] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [loggedOutMessage, setLoggedOutMessage] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('payment_success') === 'true';
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const hydratedUidRef = useRef<string | null>(null);
  const scrubbedCloudPropIdsRef = useRef<Set<string>>(new Set());
  const syncedPublicListingKeysRef = useRef<Set<string>>(new Set());

  // Clean empty initial state (no sample/other-user localStorage leaked before auth resolves)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [property, setProperty] = useState<PropertyProfile>(BLANK_PROPERTY);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [comps, setComps] = useState<CompSale[]>(DEFAULT_COMPS);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [listingCopy, setListingCopy] = useState<ListingCopyData | null>(null);
  const [sites, setSites] = useState<ListingSiteItem[]>(DEFAULT_SITES);
  const [showings, setShowings] = useState<ShowingItem[]>([]);
  const [openHouses, setOpenHouses] = useState<OpenHouseItem[]>([]);
  const [visitorLog, setVisitorLog] = useState<VisitorLogItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>(DEFAULT_DOCUMENTS);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [closingTeam, setClosingTeam] = useState<ClosingTeamInfo>(EMPTY_CLOSING_TEAM);
  const [promoteGroups, setPromoteGroups] = useState<PromoteGroup[]>(DEFAULT_PROMOTE_GROUPS);
  const [lastRefreshDate, setLastRefreshDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );

  // Reset all workspace state helper
  const resetStateToEmpty = () => {
    setSettings(DEFAULT_SETTINGS);
    setProperty(BLANK_PROPERTY);
    setPhotos([]);
    setComps(DEFAULT_COMPS);
    setPriceHistory([]);
    setListingCopy(null);
    setSites(DEFAULT_SITES);
    setShowings([]);
    setOpenHouses([]);
    setVisitorLog([]);
    setInquiries([]);
    setDocuments(DEFAULT_DOCUMENTS);
    setOffers([]);
    setClosingTeam(EMPTY_CLOSING_TEAM);
    setPromoteGroups(DEFAULT_PROMOTE_GROUPS);
    setLastRefreshDate(new Date().toISOString().split('T')[0]);
  };

  // Hydrate strictly per-user state whenever authenticated user changes
  useEffect(() => {
    if (demoMode) return;

    const uid = currentUser?.uid || null;
    if (!uid) {
      if (hydratedUidRef.current !== null) {
        hydratedUidRef.current = null;
        resetStateToEmpty();
      }
      return;
    }

    if (hydratedUidRef.current !== uid) {
      hydratedUidRef.current = uid;
      const loadedSettings = readUserKey<Settings>(uid, 'settings', DEFAULT_SETTINGS);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...loadedSettings,
        sellerName:
          loadedSettings.sellerName ||
          userProfile?.displayName ||
          currentUser?.displayName ||
          '',
        sellerEmail:
          loadedSettings.sellerEmail ||
          userProfile?.email ||
          currentUser?.email ||
          '',
      });
      const loadedProp = readUserKey<PropertyProfile>(uid, 'property', BLANK_PROPERTY);
      const { cleaned: cleanedLocalProp } = scrubPropertyData(loadedProp);
      setProperty(cleanedLocalProp);
      setComps(readUserKey<CompSale[]>(uid, 'comps', DEFAULT_COMPS));
      setPriceHistory(readUserKey<PriceHistoryRecord[]>(uid, 'price_history', []));
      const savedCopy = readUserKey<ListingCopyData | null>(uid, 'listing_copy', null);
      const sanitizedCopy = savedCopy ? sanitizeListingCopy(savedCopy) : null;
      setListingCopy(
        sanitizedCopy &&
          !hasLegacySampleText(sanitizedCopy.fullDescription) &&
          !hasLegacySampleText(sanitizedCopy.headline)
          ? sanitizedCopy
          : null
      );
      setSites(readUserKey<ListingSiteItem[]>(uid, 'sites', DEFAULT_SITES));
      setShowings(readUserKey<ShowingItem[]>(uid, 'showings', []));
      setOpenHouses(readUserKey<OpenHouseItem[]>(uid, 'open_houses', []));
      setVisitorLog(readUserKey<VisitorLogItem[]>(uid, 'visitor_log', []));
      setInquiries(readUserKey<InquiryItem[]>(uid, 'inquiries', []));
      setDocuments(readUserKey<DocumentItem[]>(uid, 'documents', DEFAULT_DOCUMENTS));
      setOffers(readUserKey<OfferItem[]>(uid, 'offers', []));
      setClosingTeam(readUserKey<ClosingTeamInfo>(uid, 'closing_team', EMPTY_CLOSING_TEAM));
      setPromoteGroups(readUserKey<PromoteGroup[]>(uid, 'promote_groups', DEFAULT_PROMOTE_GROUPS));
      const savedRefresh = localStorage.getItem(`fsbo_u_${uid}_last_refresh`);
      setLastRefreshDate(savedRefresh || new Date().toISOString().split('T')[0]);
    }
  }, [currentUser?.uid, demoMode, userProfile?.displayName, userProfile?.email]);

  // Auto-populate sellerName / sellerEmail once userProfile finishes loading if still blank
  useEffect(() => {
    if (!currentUser || demoMode || !userProfile) return;
    setSettings((prev) => {
      const nextName = prev.sellerName || userProfile.displayName || currentUser.displayName || '';
      const nextEmail = prev.sellerEmail || userProfile.email || currentUser.email || '';
      if (nextName === prev.sellerName && nextEmail === prev.sellerEmail) return prev;
      return {
        ...prev,
        sellerName: nextName,
        sellerEmail: nextEmail,
      };
    });
  }, [currentUser, userProfile, demoMode]);

  // Never keep Login/Welcome Back modal open once a user is signed in
  useEffect(() => {
    if (currentUser && authModalOpen) {
      setAuthModalOpen(false);
    }
  }, [currentUser, authModalOpen]);

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

  // Initial URL Routing & Protected Route Back-Button Guard (waits until auth resolves!)
  useEffect(() => {
    if (authLoading) return;

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

      if (path === '/signup' || path === '/login') {
        if (currentUser) {
          window.history.replaceState({ protected: true }, '', '/');
          setAuthModalOpen(false);
          setCurrentView('app');
          setActiveTab('my-listing');
        } else {
          setPendingPlan(null);
          setAuthModalOpen(false);
          setCurrentView(path === '/signup' ? 'signup' : 'login');
        }
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
        if (isProtectedPath || popEvent?.state?.protected) {
          window.history.replaceState({ loggedOut: true }, '', '/');
          setPendingPlan(null);
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
  }, [currentUser, demoMode, authLoading]);

  // Prevent browser bfcache from displaying stale protected screens after logout
  useEffect(() => {
    const onPageShow = () => {
      if (authLoading) return;
      const path = window.location.pathname;
      const isPublic =
        path.startsWith('/listing/') ||
        path.startsWith('/p/') ||
        path === '/pricing' ||
        path === '/terms' ||
        path === '/privacy' ||
        path === '/signup' ||
        path === '/login';
      if (!currentUser && !demoMode && !isPublic && currentView === 'app') {
        setCurrentView('landing');
        setPendingPlan(null);
        setAuthModalMode('login');
        setAuthModalOpen(true);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [currentUser, demoMode, currentView, authLoading]);

  // Check whether signed-in user has filled in their personalized home details / onboarding info
  const hasFilledInfo = Boolean(
    userProfile?.setupComplete ||
    userProfile?.hasCompletedOnboarding ||
    property.setupComplete ||
    (property.address && property.price > 0)
  );

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
    setPendingPlan(null);
    if (window.location.pathname === '/signup' || window.location.pathname === '/login') {
      window.history.replaceState({}, '', '/');
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    setLoggedOutMessage(null);
    setSkippedWizard(false);
    window.history.replaceState({ protected: true }, '', '/');
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

  // Sync activeProperty from Cloud into state, scrub legacy sample values, and keep /listings/{id} current
  useEffect(() => {
    if (!activeProperty || demoMode) return;

    const { cleaned, hadLegacySample } = scrubPropertyData(activeProperty);
    setProperty((prev) => ({
      ...prev,
      ...cleaned,
    }));

    const cleanedPhotos = (Array.isArray(cleaned.photos) ? cleaned.photos : []).filter(
      (p) => p?.dataUrl && !isStockPhotoUrl(p.dataUrl)
    );
    if (cleanedPhotos.length > 0) {
      setPhotos(cleanedPhotos);
    } else if (
      Array.isArray(activeProperty.photos) &&
      activeProperty.photos.some((p) => isStockPhotoUrl(p?.dataUrl))
    ) {
      setPhotos([]);
    }

    if (hadLegacySample && activeProperty.id && !scrubbedCloudPropIdsRef.current.has(activeProperty.id)) {
      scrubbedCloudPropIdsRef.current.add(activeProperty.id);
      updateCurrentProperty(cleaned).catch((err) =>
        console.warn('Could not scrub legacy sample fields on property:', err)
      );
    }

    if (currentUser && activeProperty.id) {
      const syncKey = `${activeProperty.id}:${(activeProperty as any).updatedAt || ''}:${hadLegacySample ? 'scrub' : 'clean'}`;
      if (hadLegacySample || !syncedPublicListingKeysRef.current.has(syncKey)) {
        syncedPublicListingKeysRef.current.add(syncKey);
        syncPublicListing(cleaned, cleanedPhotos, openHouses).catch(() => {});
      }
    }
  }, [activeProperty, demoMode, currentUser?.uid]);

  // Helper to sync public listing document (/listings/{listingId}) for buyer view
  const syncPublicListing = async (
    propToSync: PropertyProfile,
    photosToSync: PhotoItem[],
    openHousesToSync: OpenHouseItem[]
  ) => {
    if (!currentUser || demoMode) return;
    const listingId = propToSync.id || activeProperty?.id || propToSync.publishedSlug || currentUser.uid;
    if (!listingId) return;

    const cleanPhotos = (photosToSync || []).filter((p) => p?.dataUrl && !isStockPhotoUrl(p.dataUrl));
    const cleanFeatures = (propToSync.features || []).filter((f) => !hasLegacySampleText(f));
    const cleanUpgrades = (propToSync.upgrades || []).filter((u) => !hasLegacySampleText(u?.item));
    const cleanDescription = sanitizeSavedDescription(propToSync.description);

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
        propertyType: propToSync.propertyType || 'Single Family',
        garage: propToSync.garage || '',
        heating: propToSync.heating || '',
        cooling: propToSync.cooling || '',
        basement: propToSync.basement || '',
        roof: propToSync.roof || '',
        taxes: propToSync.taxes || 0,
        hoa: propToSync.hoa || { hasHoa: false, monthlyFee: 0, name: '' },
        schoolDistrict: propToSync.schoolDistrict || '',
        description: cleanDescription,
        features: cleanFeatures,
        upgrades: cleanUpgrades,
        photos: cleanPhotos.map((p, idx) => ({
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

  // Load real buyer leads/inquiries submitted to /listings/{listingId}/inquiries
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

  // Clean up Stripe checkout callback parameters from the address bar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('payment_success') || params.has('session_id') || params.has('canceled') || params.has('upgraded')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Load photos from IndexedDB ONLY when strictly owned by currentUser and never stock images
  useEffect(() => {
    const loadPhotos = async () => {
      if (!currentUser || demoMode) return;
      try {
        const dbPhotos = await getAllPhotosFromDB();
        const ownedPhotos = (dbPhotos || []).filter(
          (p: any) => p && p.ownerUid === currentUser.uid && p.dataUrl && !isStockPhotoUrl(p.dataUrl)
        );
        if (ownedPhotos.length > 0) {
          setPhotos((prev) => (prev.length > 0 ? prev : ownedPhotos));
        }
      } catch (err) {
        console.warn('Could not read IndexedDB photos:', err);
      }
    };
    loadPhotos();
  }, [currentUser, demoMode]);

  // Persist to per-user namespaced localStorage ONLY when authenticated and NOT in demoMode
  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'settings', settings);
  }, [settings, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'property', property);
  }, [property, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'comps', comps);
  }, [comps, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'price_history', priceHistory);
  }, [priceHistory, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    if (listingCopy) {
      writeUserKey(currentUser.uid, 'listing_copy', listingCopy);
    }
  }, [listingCopy, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'sites', sites);
  }, [sites, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'showings', showings);
  }, [showings, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'open_houses', openHouses);
  }, [openHouses, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'visitor_log', visitorLog);
  }, [visitorLog, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'inquiries', inquiries);
  }, [inquiries, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'documents', documents);
  }, [documents, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'offers', offers);
  }, [offers, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'closing_team', closingTeam);
  }, [closingTeam, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    writeUserKey(currentUser.uid, 'promote_groups', promoteGroups);
  }, [promoteGroups, currentUser?.uid, demoMode]);

  useEffect(() => {
    if (!currentUser?.uid || demoMode) return;
    localStorage.setItem(`fsbo_u_${currentUser.uid}_last_refresh`, lastRefreshDate);
  }, [lastRefreshDate, currentUser?.uid, demoMode]);

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
    if (currentUser?.uid) {
      const prefix = `fsbo_u_${currentUser.uid}_`;
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(prefix)) localStorage.removeItem(k);
      });
    }
    resetStateToEmpty();
    setActiveTab('my-listing');
  };

  const handleUpdateProperty = async (newProp: PropertyProfile) => {
    setProperty(newProp);
    if (currentUser && !demoMode) {
      await updateCurrentProperty(newProp);
      await syncPublicListing(newProp, photos, openHouses);

      const siteSlug =
        newProp.publishedSlug ||
        (newProp.address
          ? newProp.address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          : '');
      if (siteSlug) {
        const cleanDesc = sanitizeSavedDescription(newProp.description);
        await updateDoc(doc(db, 'publicSites', siteSlug), {
          description: cleanDesc,
          propertyType: newProp.propertyType || 'Single Family',
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
        try {
          sessionStorage.removeItem(`fsbo_site_published_${siteSlug}`);
          localStorage.removeItem(`fsbo_public_site_${siteSlug}`);
          localStorage.removeItem(`fsbo_public_site_ts_${siteSlug}`);
        } catch {}
      }
    }
  };

  const handleUpdatePhotos = async (newPhotos: PhotoItem[]) => {
    let processedPhotos = newPhotos;
    if (currentUser && !demoMode) {
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
    if (currentUser && !demoMode) {
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
    setPendingPlan(null);
    hydratedUidRef.current = null;
    scrubbedCloudPropIdsRef.current.clear();
    syncedPublicListingKeysRef.current.clear();

    try {
      await logout();
    } catch (err) {
      console.error('Error during logout:', err);
    }

    resetStateToEmpty();
    setActiveTab('my-listing');
    setLoggedOutMessage("You've been logged out.");

    window.history.replaceState({ loggedOut: true }, '', '/');
    setCurrentView('landing');
  };

  const handleStartDemoPreview = async () => {
    setLoggedOutMessage(null);
    const demo = await import('./lib/demoData');
    setSettings(demo.DEMO_SETTINGS);
    setProperty(demo.DEMO_PROPERTY);
    setPhotos(demo.DEMO_PHOTOS);
    setComps(demo.DEMO_COMPS);
    setPriceHistory(demo.DEMO_PRICE_HISTORY);
    setShowings(demo.DEMO_SHOWINGS);
    setInquiries(demo.DEMO_INQUIRIES);
    setDocuments(demo.DEMO_DOCUMENTS);
    setClosingTeam(demo.DEMO_CLOSING_TEAM);
    setPromoteGroups(demo.DEMO_PROMOTE_GROUPS);
    setDemoMode(true);
    setActiveTab('my-listing');
    setCurrentView('app');
  };

  // Plan Checkout Initiation (trial NEVER redirects to paid checkout)
  const handleSelectPlan = async (planId: PlanType) => {
    if (!currentUser) {
      setPendingPlan(planId === 'trial' ? null : planId);
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

  // Continue paid checkout once guest explicitly picked a paid plan before authenticating
  useEffect(() => {
    if (currentUser && pendingPlan) {
      const target = pendingPlan;
      setPendingPlan(null);
      if (target !== 'trial') {
        handleSelectPlan(target);
      }
    }
  }, [currentUser, pendingPlan]);

  const navigateToDashboard = () => {
    window.history.pushState({ protected: true }, '', '/');
    setCurrentView('app');
    setActiveTab('my-listing');
  };

  // 0. Render Public Buyer Property Landing Page (/listing/:listingId)
  if (currentView === 'listing' && publicListingId) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicListingView
          listingId={publicListingId}
          onGoHome={() => {
            window.history.pushState({}, '', '/');
            setCurrentView(currentUser ? 'app' : 'landing');
          }}
          onGoToDashboard={navigateToDashboard}
          onNavigatePricing={() => {
            window.history.pushState({}, '', '/pricing');
            setCurrentView('pricing');
          }}
          onLogout={handleLogout}
        />
      </Suspense>
    );
  }

  // 1. Render Hosted Property Website (/p/:slug)
  if (currentView === 'property' && publicPropertySlug) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicPropertyView
          slug={publicPropertySlug}
          onNavigateHome={() => {
            window.history.pushState({}, '', '/');
            setCurrentView(currentUser ? 'app' : 'landing');
          }}
          onNavigatePricing={() => {
            window.history.pushState({}, '', '/pricing');
            setCurrentView('pricing');
          }}
          onGoToDashboard={navigateToDashboard}
          onLogout={handleLogout}
        />
      </Suspense>
    );
  }

  // 2. Render Terms Page
  if (currentView === 'terms') {
    return (
      <Suspense fallback={<PageLoader />}>
        <TermsPage
          onBack={() => {
            window.history.pushState({}, '', '/');
            setCurrentView(currentUser ? 'app' : 'landing');
          }}
          onOpenAuth={() => {
            setPendingPlan(null);
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          onGoToDashboard={navigateToDashboard}
          onLogout={handleLogout}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={handleCloseAuthModal}
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
        />
      </Suspense>
    );
  }

  // 3. Render Privacy Page
  if (currentView === 'privacy') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PrivacyPage
          onBack={() => {
            window.history.pushState({}, '', '/');
            setCurrentView(currentUser ? 'app' : 'landing');
          }}
          onOpenAuth={() => {
            setPendingPlan(null);
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          onGoToDashboard={navigateToDashboard}
          onLogout={handleLogout}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={handleCloseAuthModal}
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
        />
      </Suspense>
    );
  }

  // 4. Render Dynamic Pricing Page
  if (currentView === 'pricing') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PricingPage
          saasConfig={saasConfig}
          currentPlan={userProfile?.plan}
          onSelectPlan={handleSelectPlan}
          onBackToHome={() => {
            window.history.pushState({}, '', '/');
            setCurrentView(currentUser ? 'app' : 'landing');
          }}
          onLogin={() => {
            setPendingPlan(null);
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }}
          onGoToDashboard={navigateToDashboard}
          onLogout={handleLogout}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={handleCloseAuthModal}
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
        />
      </Suspense>
    );
  }

  // 4b. Dedicated Standalone Sign Up / Log In Routes (/signup and /login)
  if ((currentView === 'signup' || currentView === 'login') && !currentUser) {
    return (
      <AuthModal
        isOpen={true}
        standalone={true}
        initialMode={currentView === 'signup' ? 'signup' : 'login'}
        onSwitchMode={(nextMode) => {
          const nextPath = nextMode === 'signup' ? '/signup' : '/login';
          window.history.replaceState({}, '', nextPath);
          setCurrentView(nextMode);
        }}
        onClose={() => {
          setPendingPlan(null);
          window.history.pushState({}, '', '/');
          setCurrentView('landing');
        }}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // 5. Loading State: While Firebase Auth or Firestore user is initializing
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

  // 6. Error State: If loading user information from Firestore failed
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
            setPendingPlan(null);
            window.history.pushState({}, '', '/signup');
            setCurrentView('signup');
          }}
          onLogin={() => {
            setLoggedOutMessage(null);
            setPendingPlan(null);
            window.history.pushState({}, '', '/login');
            setCurrentView('login');
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
          onGoToDashboard={navigateToDashboard}
          onLogout={handleLogout}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={handleCloseAuthModal}
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

  // 8. Authenticated FSBO Compass Workspace
  return (
    <div className="min-h-screen print:min-h-0 bg-[#F8F6F2] print:bg-white dark:bg-stone-950 text-[#0F2A44] dark:text-stone-100 flex flex-col lg:flex-row print:block antialiased selection:bg-[#FF6B5A] selection:text-white font-sans">
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
      <main className="flex-1 min-w-0 pb-20 lg:pb-12 print:pb-0 overflow-y-auto print:overflow-visible">
        {/* Top App Bar */}
        <header className="sticky top-12 lg:top-0 z-20 print:hidden bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
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
        {hasLocalDataToImport && currentUser && !demoMode && (
          <div className="print:hidden bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-800 p-3.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-sky-900 dark:text-sky-200">
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

        <Suspense fallback={<PageLoader />}>
          {activeTab === 'my-listing' ? (
            <SectionMyListing
              property={property}
              photos={photos}
              ownerUid={currentUser?.uid}
              openHouses={openHouses}
              inquiriesCount={inquiries.length}
              isSellerView={true}
              isTrial={!(userProfile && ['per_listing', 'bundle', 'pro'].includes(userProfile.plan) && userProfile.planStatus === 'active')}
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
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none">
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
                  onOpenPricing={() => {
                    window.history.pushState({}, '', '/pricing');
                    setCurrentView('pricing');
                  }}
                />
              )}

              {activeTab === 'photos' && (
                <SectionPhotos
                  property={property}
                  photos={photos}
                  onUpdatePhotos={handleUpdatePhotos}
                  onUpdateProperty={handleUpdateProperty}
                  onNavigate={handleSelectAuthenticatedTab}
                  onOpenPricing={() => {
                    window.history.pushState({}, '', '/pricing');
                    setCurrentView('pricing');
                  }}
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
                  onUpdateProperty={handleUpdateProperty}
                  onNavigate={setActiveTab}
                  onOpenPricing={() => {
                    window.history.pushState({}, '', '/pricing');
                    setCurrentView('pricing');
                  }}
                />
              )}

              {activeTab === 'sites' && (
                <SectionSites
                  sites={sites}
                  listingCopy={listingCopy}
                  property={property}
                  onUpdateSites={setSites}
                  onNavigate={setActiveTab}
                  onOpenPricing={() => {
                    window.history.pushState({}, '', '/pricing');
                    setCurrentView('pricing');
                  }}
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
                  onOpenPricing={() => {
                    window.history.pushState({}, '', '/pricing');
                    setCurrentView('pricing');
                  }}
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
                  paymentSuccess={showPaymentSuccess}
                  onDismissPaymentSuccess={() => setShowPaymentSuccess(false)}
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
        </Suspense>
      </main>

      {/* Onboarding / Edit Listing Wizard Modal */}
      {showWizard && (
        <Suspense fallback={null}>
          <OnboardingWizard
            property={property}
            photos={photos}
            ownerUid={currentUser?.uid}
            isEditing={hasFilledInfo}
            onComplete={async (updatedProp, updatedPhotos) => {
              let uploadedPhotos = (updatedPhotos || []).filter(
                (p) => p?.dataUrl && !isStockPhotoUrl(p.dataUrl)
              );
              if (currentUser && !demoMode) {
                uploadedPhotos = await Promise.all(
                  uploadedPhotos.map(async (p) => {
                    if (p.dataUrl && !p.dataUrl.startsWith('http')) {
                      const url = await uploadListingPhoto(currentUser.uid, p.id, p.dataUrl);
                      return { ...p, dataUrl: url };
                    }
                    return p;
                  })
                );
              }

              const listingId = updatedProp.id || activeProperty?.id || currentUser?.uid || 'my-home';
              const { cleaned } = scrubPropertyData({
                ...updatedProp,
                id: listingId,
                published: updatedProp.published ?? true,
                setupComplete: true,
                photos: uploadedPhotos,
              });
              const finalProp: PropertyProfile = cleaned;

              setPhotos(uploadedPhotos);
              setProperty(finalProp);
              setShowWizard(false);
              setSkippedWizard(false);

              if (currentUser && !demoMode) {
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
        </Suspense>
      )}

      {/* Support / Help Modal */}
      {helpModalOpen && (
        <Suspense fallback={null}>
          <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
        </Suspense>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuthModal}
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
