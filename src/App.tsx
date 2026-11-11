import React, { useState, useEffect } from 'react';
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
import { doc, setDoc } from 'firebase/firestore';
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

import { CloudUpload, X, HelpCircle, Compass, AlertTriangle } from 'lucide-react';
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
  } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentView, setCurrentView] = useState<'app' | 'landing' | 'pricing' | 'terms' | 'privacy' | 'property'>('app');
  const [publicPropertySlug, setPublicPropertySlug] = useState<string>('');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(() => {
    return (localStorage.getItem('fsbo_pending_plan') as PlanType) || null;
  });
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // 1. Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('fsbo_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // 2. Property Profile
  const [property, setProperty] = useState<PropertyProfile>(() => {
    const saved = localStorage.getItem('fsbo_property');
    return saved ? JSON.parse(saved) : DEFAULT_PROPERTY;
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
    return {
          tone: 'Warm',
          headline: 'Custom Executive Home on Private Wooded Lot in Rochester Hills',
          fullDescription: `Welcome home to 4288 Meadowview Drive, a meticulously maintained 4-bedroom executive residence nestled on a private wooded lot backing up to township green space.\n\nThe heart of the home is a remodeled chef's kitchen featuring quartz waterfall countertops, soft-close custom cabinetry, and premium stainless steel appliances. Solid hardwood floors run throughout the main living areas, complemented by abundant natural sunlight and an inviting gas fireplace.\n\nUpstairs, the expansive primary suite boasts a walk-in tile shower and dual vanity. The fully finished daylight basement offers an expansive recreation space, wet bar, and workshop. Outside, relax on the composite Trex deck overlooking the tranquil, fully fenced backyard. Located in the award-winning Rochester Community School district.`,
          keyFactsBlock: `Price: $435,000\nBeds: 4 | Baths: 2 Full / 1 Half\nSq Ft: 2,450 Finished\nYear Built: 1998\nTaxes: $4,620/yr\nSchool District: Rochester Community Schools\nBasement: Finished Daylight with Wet Bar\nGarage: 2-Car Attached`,
          upgradesListBlock: `• 2023: Full Kitchen Remodel with Quartz Waterfall Island\n• 2022: Architectural Dimensional Shingle Roof\n• 2021: High-Efficiency Furnace & Central Air Conditioning\n• 2020: Composite Trex Backyard Deck`,
          marketplaceVersion: `🏡 FOR SALE BY OWNER: 4 Bed / 2.5 Bath in Rochester Hills!\n💰 $435,000 | 2,450 SqFt | Private Wooded Lot 🌳\n\n✨ Quartz Kitchen Remodel (2023)\n✨ Finished Daylight Basement with Bar\n✨ New Roof (2022) & HVAC (2021)\n✨ Rochester Community Schools\n\nPrivate tours available by appointment! Direct message for photos, video tour link, and pre-approval instructions.`,
          craigslistVersion: `FOR SALE BY OWNER: 4288 MEADOWVIEW DR, ROCHESTER HILLS, MI\n\n- Asking Price: $435,000\n- 4 Bedrooms / 2.5 Bathrooms\n- 2,450 Finished Square Feet\n- Lot Size: 0.34 Acres (Wooded rear boundary)\n- Upgrades: New Roof (2022), New HVAC (2021), Remodeled Kitchen (2023)\n- Schools: Rochester Community Schools\n\nDirect contact with owners. Pre-approval letter required for private showings. Call or text (248) 555-0192 for appointment.`,
          socialPostVersion: `We're officially listing our home for sale by owner! 🏡 4288 Meadowview Drive in Rochester Hills: 4 beds, 2.5 baths, gorgeous new kitchen, finished basement, and a quiet wooded lot. Check out our photo tour and please share with anyone looking to move to the area! ❤️`,
          flyerTeaser: `Stunning 4-bedroom Rochester Hills home featuring a remodeled quartz kitchen and finished daylight basement on a private wooded lot. Offered directly by owner for $435,000 with transferable roof and HVAC warranties.`,
          fairHousingAudit: {
            isClean: true,
            flaggedPhrases: [],
            complianceNote: '100% Compliant. Focuses exclusively on physical home features and amenities.',
          },
          lastGenerated: '2026-11-09',
        };
  });

  // 7. Sites
  const [sites, setSites] = useState<ListingSiteItem[]>(() => {
    const saved = localStorage.getItem('fsbo_sites');
    return saved ? JSON.parse(saved) : DEFAULT_SITES;
  });

  // 8. Showings
  const [showings, setShowings] = useState<ShowingItem[]>(() => {
    const saved = localStorage.getItem('fsbo_showings');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'show-demo-1',
            buyerName: 'Marcus & Elena Vance',
            buyerPhone: '(248) 555-0142',
            buyerEmail: 'elena.vance@gmail.com',
            date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
            time: '14:00',
            status: 'Confirmed',
            hasPreApproval: true,
            notes: 'Prequalified conventional $500k with Chase. Looking to move before winter.',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'show-demo-2',
            buyerName: 'Brian Kowalski',
            buyerPhone: '(586) 555-0198',
            buyerEmail: 'bkowalski@outlook.com',
            date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            time: '17:30',
            status: 'Awaiting Pre-Approval',
            hasPreApproval: false,
            notes: 'Requested tour via website. Sent lender pre-approval reminder.',
            createdAt: new Date().toISOString(),
          },
        ];
  });

  // 9. Open Houses
  const [openHouses, setOpenHouses] = useState<OpenHouseItem[]>(() => {
    const saved = localStorage.getItem('fsbo_open_houses');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'oh-demo-1',
            date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            startTime: '13:00',
            endTime: '16:00',
            notes: 'First public weekend open house. Directional signs ready.',
            checklist: {
              'Place directional A-frame signs at neighborhood street corners': true,
              'Print 20 copies of the full-color yard flyer': true,
              'Set up sign-in sheet on kitchen island with pens': true,
              'Turn on every interior light and open all window blinds': true,
              'Play soft instrumental background music (lo-fi/jazz)': false,
              'Set out bottled water and light pre-packaged refreshments': true,
              'Lock away jewelry, prescription medications, and financial files': true,
              'Turn on exterior porch lights': true,
            },
          },
        ];
  });

  // 10. Visitor Log
  const [visitorLog, setVisitorLog] = useState<VisitorLogItem[]>(() => {
    const saved = localStorage.getItem('fsbo_visitor_log');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'vis-1',
            name: 'Derek & Amanda Chen',
            phone: '(248) 555-0131',
            email: 'derek.chen@tech.com',
            preApproved: true,
            agentRepresented: false,
            interestLevel: 'Hot',
            followUpDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
            notes: 'Loved the kitchen island and private backyard. Inquired about closing timeline.',
          },
        ];
  });

  // 11. Inquiries
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    const saved = localStorage.getItem('fsbo_inquiries');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'inq-1',
            name: 'Sarah Jenkins',
            phone: '(248) 555-0129',
            email: 'sarah.jenkins@gmail.com',
            source: 'Zillow',
            dateReceived: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            message: 'Hi, we are pre-approved conventional and would love to see the house this Saturday afternoon. Is the basement finished?',
            replied: false,
            notes: '',
          },
          {
            id: 'inq-2',
            name: 'Mike Peterson',
            phone: '(586) 555-0177',
            email: 'mpeterson@live.com',
            source: 'Facebook Marketplace',
            dateReceived: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
            message: 'Is this house still available? Are you open to working with buyer agents at 2.5%?',
            replied: false,
            notes: '',
          },
        ];
  });

  // 12. Documents
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('fsbo_documents');
    return saved ? JSON.parse(saved) : DEFAULT_DOCUMENTS;
  });

  // 13. Offers
  const [offers, setOffers] = useState<OfferItem[]>(() => {
    const saved = localStorage.getItem('fsbo_offers');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'offer-1',
            buyerName: 'Derek & Amanda Chen',
            offerPrice: 438000,
            financingType: 'Conventional',
            downPaymentPct: 20,
            earnestMoney: 10000,
            contingencies: ['Inspection (7 days)', 'Financing (21 days)', 'Appraisal'],
            closingDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
            sellerConcessions: 2000,
            estimatedClosingCosts: 6570,
            netToSeller: 429430,
            notes: 'Strong 20% down conventional pre-approval. Clean inspection request.',
            status: 'Reviewing',
          },
        ];
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

  // Initial URL Routing Check
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      if (path.startsWith('/p/')) {
        const slug = path.replace(/^\/p\//, '').split('/')[0];
        setPublicPropertySlug(slug);
        setCurrentView('property');
      } else if (path === '/terms') {
        setCurrentView('terms');
      } else if (path === '/privacy') {
        setCurrentView('privacy');
      } else if (path === '/pricing') {
        setCurrentView('pricing');
      } else if (path === '/admin') {
        setActiveTab('admin');
        setCurrentView('app');
      } else if (path === '/account') {
        setActiveTab('account');
        setCurrentView('app');
      } else {
        if (!currentUser && !demoMode) {
          setCurrentView('landing');
        } else {
          setCurrentView('app');
          setActiveTab('dashboard');
        }
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, [currentUser, demoMode]);

  // Check whether signed-in user has filled in their personalized home details / onboarding info
  const hasFilledInfo = Boolean(
    userProfile?.hasCompletedOnboarding ||
    (property.address && property.address !== '4288 Meadowview Drive' && property.price > 0)
  );

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    window.history.pushState({}, '', '/');
    setCurrentView('app');
    setActiveTab('dashboard');
    if (!hasFilledInfo) {
      setShowWizard(true);
    }
  };

  // If a signed-in user hasn't filled in their info yet, prompt the onboarding wizard immediately
  useEffect(() => {
    if (currentUser && !authLoading && !hasFilledInfo) {
      setShowWizard(true);
    }
  }, [currentUser, authLoading, hasFilledInfo]);

  // Sync activeProperty from Cloud into state
  useEffect(() => {
    if (activeProperty) {
      setProperty((prev) => ({
        ...prev,
        ...activeProperty,
      }));
    }
  }, [activeProperty]);

  // Clean up Stripe checkout callback parameters from the address bar (no client-side plan grants)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('payment_success') || params.has('session_id') || params.has('canceled') || params.has('upgraded')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Load photos from IndexedDB on startup
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const dbPhotos = await getAllPhotosFromDB();
        const hasLegacyUnsplash = dbPhotos && dbPhotos.some((p: any) => p.dataUrl?.includes('unsplash'));
        if (dbPhotos && dbPhotos.length > 0 && !hasLegacyUnsplash) {
          setPhotos(dbPhotos);
        } else {
          for (const sp of SAMPLE_PHOTOS) {
            await savePhotoToDB(sp.id, sp.dataUrl, { caption: sp.caption, isCover: sp.isCover });
          }
          setPhotos(SAMPLE_PHOTOS);
        }
      } catch (err) {
        console.warn('Could not read IndexedDB photos:', err);
        setPhotos(SAMPLE_PHOTOS);
      }
    };
    loadPhotos();
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('fsbo_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('fsbo_property', JSON.stringify(property));
  }, [property]);

  useEffect(() => {
    localStorage.setItem('fsbo_comps', JSON.stringify(comps));
  }, [comps]);

  useEffect(() => {
    localStorage.setItem('fsbo_price_history', JSON.stringify(priceHistory));
  }, [priceHistory]);

  useEffect(() => {
    if (listingCopy) {
      localStorage.setItem('fsbo_listing_copy', JSON.stringify(listingCopy));
    }
  }, [listingCopy]);

  useEffect(() => {
    localStorage.setItem('fsbo_sites', JSON.stringify(sites));
  }, [sites]);

  useEffect(() => {
    localStorage.setItem('fsbo_showings', JSON.stringify(showings));
  }, [showings]);

  useEffect(() => {
    localStorage.setItem('fsbo_open_houses', JSON.stringify(openHouses));
  }, [openHouses]);

  useEffect(() => {
    localStorage.setItem('fsbo_visitor_log', JSON.stringify(visitorLog));
  }, [visitorLog]);

  useEffect(() => {
    localStorage.setItem('fsbo_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem('fsbo_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('fsbo_offers', JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem('fsbo_closing_team', JSON.stringify(closingTeam));
  }, [closingTeam]);

  useEffect(() => {
    localStorage.setItem('fsbo_promote_groups', JSON.stringify(promoteGroups));
  }, [promoteGroups]);

  useEffect(() => {
    localStorage.setItem('fsbo_last_refresh', lastRefreshDate);
  }, [lastRefreshDate]);

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
    }
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
      </div>
    );
  }

  // 7. Render Public Marketing Landing Page (if guest & not demo mode)
  if (!currentUser && !demoMode) {
    return (
      <>
        <LandingPage
          saasConfig={saasConfig}
          onStartFree={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          onLogin={() => {
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
          onDemoPreview={() => setDemoMode(true)}
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

  // 6. Authenticated FSBO Compass Dashboard
  return (
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-stone-950 text-[#0F2A44] dark:text-stone-100 flex flex-col lg:flex-row antialiased selection:bg-[#FF6B5A] selection:text-white font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        readyScore={readyScore}
        openInquiriesCount={openInquiriesCount}
        settings={settings}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenHelp={() => {
          setActiveTab('help');
          setCurrentView('app');
        }}
        onOpenPricing={() => {
          window.history.pushState({}, '', '/pricing');
          setCurrentView('pricing');
        }}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-12 overflow-y-auto">
        {/* Top App Bar */}
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/');
                setActiveTab('dashboard');
                setCurrentView('app');
              }}
              className="text-left flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
              title="Go to Home Dashboard"
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHelpModalOpen(true)}
              className="p-2 text-stone-500 hover:text-[#0F2A44] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-[#F2B544]" />
              <span className="hidden md:inline">Support</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell onSelectTab={(tab) => setActiveTab(tab as ActiveTab)} />
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
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'profile' && (
            <SectionProfile
              property={property}
              onChange={handleUpdateProperty}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'ai-finder' && (
            <SectionAiFinder
              property={property}
              photos={photos}
              onUpdateProperty={handleUpdateProperty}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'photos' && (
            <SectionPhotos
              property={property}
              photos={photos}
              onUpdatePhotos={setPhotos}
              onUpdateProperty={handleUpdateProperty}
              onNavigate={setActiveTab}
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
              onNavigate={setActiveTab}
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
              onUpdateOpenHouses={setOpenHouses}
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
      </main>

      {/* Onboarding Wizard Modal if open */}
      {showWizard && (
        <OnboardingWizard
          property={property}
          photos={photos}
          onComplete={async (updatedProp, updatedPhotos) => {
            await handleUpdateProperty(updatedProp);
            setPhotos(updatedPhotos);
            setShowWizard(false);
            await markOnboardingComplete();
            setActiveTab('dashboard');
            setCurrentView('app');
          }}
          onClose={() => setShowWizard(false)}
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
