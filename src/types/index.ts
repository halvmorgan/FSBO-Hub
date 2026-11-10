export interface PropertyProfile {
  id?: string;
  ownerUid?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  originalPrice?: number;
  targetListDate: string;
  listDate?: string;
  beds: number;
  bathsFull: number;
  bathsHalf: number;
  sqft: number;
  lotSize: string;
  yearBuilt: number;
  taxes: number;
  schoolDistrict: string;
  utilities: {
    gas: number;
    electric: number;
    water: number;
  };
  hoa: {
    hasHoa: boolean;
    monthlyFee: number;
    name: string;
  };
  heating: string;
  cooling: string;
  garage: string;
  basement: string;
  roof: string;
  upgrades: Array<{
    id: string;
    item: string;
    year: string;
    cost?: number;
  }>;
  specialNotes: [string, string, string];
  features: string[];
  walkthroughVideoUrl: string;
  floorPlanImageId?: string;
  published?: boolean;
  publishedSlug?: string;
}

export interface PhotoItem {
  id: string;
  dataUrl: string;
  caption: string;
  isCover: boolean;
  roomCategory: string;
  order: number;
  coachTip?: string;
  coachQuality?: 'Great' | 'Good' | 'Retake';
  detectedFeatures?: string[];
  analyzed?: boolean;
}

export interface Settings {
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  state: string;
  webhookUrl: string;
  homeValueWorksheetUrl: string;
  appraisalOrderUrl: string;
  requirePreApproval: boolean;
  refreshIntervalDays: number;
  darkMode: boolean;
}

export interface CompSale {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  sqft: number;
  beds: number;
  baths: number;
  distance: string;
  condition: 'Superior' | 'Similar' | 'Inferior';
  adjustments: number;
  adjustedPrice: number;
  pricePerSqFt: number;
  notes: string;
}

export interface PriceHistoryRecord {
  id: string;
  date: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
}

export interface ListingCopyData {
  tone: 'Warm' | 'Professional' | 'Luxury' | 'Investor';
  headline: string;
  fullDescription: string;
  keyFactsBlock: string;
  upgradesListBlock: string;
  marketplaceVersion: string;
  craigslistVersion: string;
  socialPostVersion: string;
  flyerTeaser: string;
  fairHousingAudit: {
    isClean: boolean;
    flaggedPhrases: string[];
    complianceNote: string;
  };
  lastGenerated?: string;
}

export interface ListingSiteItem {
  id: string;
  name: string;
  logoLetter: string;
  logoColor: string;
  directUrl: string;
  status: 'Not started' | 'In progress' | 'Live' | 'Needs refresh';
  datePosted?: string;
  listingUrl?: string;
  directOwnerAllowed?: boolean;
  costSummary?: string;
  currentPolicySummary?: string;
  recommendedAction?: string;
  asOfDate?: string;
  sources?: Array<{ title: string; url: string }>;
  isChecking?: boolean;
}

export interface ShowingItem {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled' | 'Pending' | 'Awaiting Pre-Approval';
  hasPreApproval: boolean;
  preApprovalDocUrl?: string;
  notes: string;
  createdAt: string;
}

export interface OpenHouseItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  checklist: Record<string, boolean>;
}

export interface VisitorLogItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  preApproved: boolean;
  agentRepresented: boolean;
  interestLevel: 'Hot' | 'Warm' | 'Cold';
  followUpDate: string;
  notes: string;
}

export interface InquiryItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  dateReceived: string;
  message: string;
  replied: boolean;
  replyDate?: string;
  notes: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: 'Required' | 'Recommended' | 'Property Records';
  required: boolean;
  onlyBefore1978?: boolean;
  fileName?: string;
  fileData?: string;
  uploadDate?: string;
  status: 'Missing' | 'Uploaded' | 'Exempt';
  note: string;
}

export interface OfferItem {
  id: string;
  buyerName: string;
  offerPrice: number;
  financingType: 'Cash' | 'Conventional' | 'FHA' | 'VA' | 'Other';
  downPaymentPct: number;
  earnestMoney: number;
  contingencies: string[]; // Inspection, Financing, Appraisal, Home Sale
  closingDate: string;
  sellerConcessions: number;
  estimatedClosingCosts: number;
  netToSeller: number;
  notes: string;
  status: 'Reviewing' | 'Accepted' | 'Countered' | 'Declined';
}

export interface ClosingTeamInfo {
  attorneyOrTitle: string;
  contactPerson: string;
  phone: string;
  email: string;
  flatFeeQuoted: number;
  notes: string;
}

export interface PromoteGroup {
  id: string;
  name: string;
  platform: 'Facebook Group' | 'Nextdoor' | 'Craigslist' | 'Community Forum';
  url: string;
  posted: boolean;
  lastPostedDate?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'profile'
  | 'ai-finder'
  | 'photos'
  | 'pricing'
  | 'listing'
  | 'sites'
  | 'website'
  | 'showings'
  | 'inbox'
  | 'promote'
  | 'refresh'
  | 'closing'
  | 'settings'
  | 'account'
  | 'admin';
