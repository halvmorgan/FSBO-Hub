export type UserRole = 'user' | 'admin';
export type PlanType = 'trial' | 'per_listing' | 'bundle' | 'pro';
export type PlanStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export interface PlanConfig {
  id: PlanType;
  name: string;
  priceDisplay: string;
  priceAmount: number; // in cents or dollars
  billingPeriod: '7 days' | '6 months' | 'month';
  stripePriceId?: string;
  propertyLimit: number;
  photoLimit: number;
  listingCopyLimit: number;
  aiCreditsMonthly: number;
  canPublishWebsite: boolean;
  canExportZip: boolean;
  features: string[];
  isPopular?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  plan: PlanType;
  planStatus: PlanStatus;
  trialEndsAt?: string;
  planExpiresAt?: string;
  aiCreditsUsed: number;
  stripeCustomerId?: string;
  activePropertyId?: string;
  hasCompletedOnboarding?: boolean;
  setupComplete?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaasConfig {
  brandName: string;
  supportEmail: string;
  homeValueWorksheetUrl: string;
  appraisalOrderUrl: string;
  plans: Record<PlanType, PlanConfig>;
  termsOfService: string;
  privacyPolicy: string;
  updatedAt?: string;
}

export interface PublicSiteDoc {
  slug: string;
  ownerUid: string;
  propertyId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  originalPrice?: number;
  beds: number;
  bathsFull: number;
  bathsHalf: number;
  sqft: number;
  lotSize: string;
  yearBuilt: number;
  taxes: number;
  schoolDistrict: string;
  specialNotes: string[];
  features: string[];
  upgrades: Array<{ id: string; item: string; year: string; cost?: number }>;
  coverPhotoUrl: string;
  photos: Array<{ id: string; url: string; caption: string; isCover: boolean }>;
  walkthroughVideoUrl?: string;
  theme: 'Modern' | 'Classic' | 'Bold';
  openHouses: Array<{ date: string; startTime: string; endTime: string; notes?: string }>;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  status: 'active' | 'inactive' | 'suspended';
  publishedAt: string;
  updatedAt: string;
}

export interface PublicShowingRequest {
  id: string;
  slug: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  preferredDate?: string;
  hasPreApproval: boolean;
  message?: string;
  honeypot?: string; // spam protection
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  uid: string;
  title: string;
  message: string;
  type: 'showing' | 'inquiry' | 'billing' | 'refresh' | 'system';
  read: boolean;
  createdAt: string;
  linkTab?: string;
}

export interface SupportTicket {
  id: string;
  uid: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export const DEFAULT_SAAS_CONFIG: SaasConfig = {
  brandName: 'FSBO Compass',
  supportEmail: 'support@fsbocompass.com',
  homeValueWorksheetUrl: 'https://ecenturyappraisal.com',
  appraisalOrderUrl: 'https://ecenturyappraisal.com',
  plans: {
    trial: {
      id: 'trial',
      name: 'Free Trial',
      priceDisplay: 'Free',
      priceAmount: 0,
      billingPeriod: '7 days',
      propertyLimit: 1,
      photoLimit: 15,
      listingCopyLimit: 3,
      aiCreditsMonthly: 25,
      canPublishWebsite: false,
      canExportZip: true,
      features: [
        'Complete property profile & facts',
        'Photo upload (up to 15 photos)',
        'AI Photo Coach & Feature Scanner',
        'Listing Writer (3 generations)',
        'Home value & comps worksheet',
        'FSBO milestone checklist',
      ],
      isPopular: false,
    },
    per_listing: {
      id: 'per_listing',
      name: 'Per Listing',
      priceDisplay: '$149',
      priceAmount: 149,
      billingPeriod: '6 months',
      propertyLimit: 1,
      photoLimit: 50,
      listingCopyLimit: 100,
      aiCreditsMonthly: 300,
      canPublishWebsite: true,
      canExportZip: true,
      features: [
        'Everything in Free Trial',
        'Published website at /p/your-address',
        'Direct tour requests & visitor inbox',
        '6 months full access for 1 property',
        '300 AI credits (photos, copy, rules)',
        'Printable yard flyers & sign QR code',
        'Offer comparison & net-to-seller tool',
        'Email support',
      ],
      isPopular: true,
    },
    bundle: {
      id: 'bundle',
      name: 'Seller Pro + Home Value Worksheet',
      priceDisplay: '$197',
      priceAmount: 197,
      billingPeriod: '6 months',
      propertyLimit: 1,
      photoLimit: 75,
      listingCopyLimit: 250,
      aiCreditsMonthly: 600,
      canPublishWebsite: true,
      canExportZip: true,
      features: [
        'Everything in Per Listing ($149 plan)',
        'Complete Home Value & Comps Worksheet',
        'Appraisal Order & Valuation Review Guide',
        '600 AI credits for listings and photos',
        'Printable open house sign-in sheets',
        'Email support',
      ],
      isPopular: false,
    },
    pro: {
      id: 'pro',
      name: 'Pro Monthly',
      priceDisplay: '$29/mo',
      priceAmount: 29,
      billingPeriod: 'month',
      propertyLimit: 3,
      photoLimit: 100,
      listingCopyLimit: 999,
      aiCreditsMonthly: 1000,
      canPublishWebsite: true,
      canExportZip: true,
      features: [
        'Everything in Per Listing',
        'Up to 3 properties active at once',
        '1,000 priority AI credits/month',
        'Unlimited listing copy variations',
        'Email support',
        'Cancel anytime with 1 click',
      ],
      isPopular: false,
    },
  },
  termsOfService: `TERMS OF SERVICE - FSBO COMPASS\n\nLast Updated: November 2026\n\n1. GENERAL INFORMATION ONLY (NOT LEGAL, TAX, OR REAL ESTATE ADVICE)\nFSBO Compass provides self-service software tools, document templates, calculators, and informational resources designed to assist homeowners in marketing their own residential properties. FSBO Compass is NOT a licensed real estate brokerage, attorney, tax advisor, or escrow agency. Any valuation ranges, pricing calculators, or suggested templates are estimates provided for informational reference only. Users must engage a licensed real estate attorney, title company, or certified appraiser for legal agreements and closing transactions in their respective states.\n\n2. USER RESPONSIBILITY FOR LISTINGS AND DISCLOSURES\nHomeowners using FSBO Compass are solely and exclusively responsible for the truthfulness, completeness, and accuracy of all property details, pricing, structural condition representations, and statutory disclosures (such as the Michigan Seller's Disclosure Statement and Federal Lead-Based Paint Disclosure).\n\n3. FAIR HOUSING ACT COMPLIANCE\nUsers must strictly adhere to the Federal Fair Housing Act (42 U.S.C. 3601 et seq.) and local civil rights regulations. You agree NEVER to publish listings, descriptions, or advertisements that discriminate or indicate preference based on race, color, religion, sex, handicap, familial status, or national origin. Users are strictly liable for any discriminatory phrasing published in their listings.\n\n4. SUBSCRIPTIONS AND CANCELLATIONS\nPaid plans are billed in advance according to the selected tier. You may cancel recurring subscriptions at any time via the billing portal. Upon plan expiration, accounts enter read-only mode and public websites are archived after a grace period.`,
  privacyPolicy: `PRIVACY POLICY - FSBO COMPASS\n\nLast Updated: November 2026\n\n1. INFORMATION WE COLLECT\nWe collect account information (name, email address), property details (address, specifications, photos, and documents), and visitor showing inquiries submitted through published property websites.\n\n2. HOW WE USE YOUR INFORMATION\nWe use your data to power your property website, generate listings and marketing materials, coordinate tour requests, process payments via Stripe, and communicate important account updates.\n\n3. PRIVATE DOCUMENT ISOLATION\nPrivate seller documents, offers, buyer financial records, and pre-approval letters uploaded to your account are protected under strict security rules and are NEVER published on public-facing property websites.\n\n4. DATA RETENTION AND DELETION\nYou may export your complete data (JSON + photos) at any time from your Account page. You may also request permanent deletion of your account and all associated property records.`,
};
