import {
  PropertyProfile,
  PhotoItem,
  Settings,
  CompSale,
  PriceHistoryRecord,
  DocumentItem,
  ClosingTeamInfo,
  PromoteGroup,
  ShowingItem,
  InquiryItem,
} from '../types';

import houseExteriorFront from '../assets/images/house_exterior_front_1794286496562.jpg';
import houseKitchenInterior from '../assets/images/house_kitchen_interior_1794286509490.jpg';
import houseLivingRoom from '../assets/images/house_living_room_1794286521686.jpg';
import houseBackyard from '../assets/images/house_backyard_1794286533470.jpg';

export const DEMO_SETTINGS: Settings = {
  sellerName: 'Demo Homeowner',
  sellerPhone: '(555) 010-2480',
  sellerEmail: 'demo.seller@fsbocompass.com',
  state: 'Michigan',
  webhookUrl: '',
  homeValueWorksheetUrl: 'https://ecenturyappraisal.com/home-value-worksheet',
  appraisalOrderUrl: 'https://ecenturyappraisal.com/contact',
  requirePreApproval: true,
  refreshIntervalDays: 7,
  darkMode: false,
};

export const DEMO_PROPERTY: PropertyProfile = {
  address: '4288 Maple Grove Ct (Demo)',
  city: 'Troy',
  state: 'Michigan',
  zip: '48084',
  price: 435000,
  originalPrice: 445000,
  targetListDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  listDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
  beds: 4,
  bathsFull: 2,
  bathsHalf: 1,
  sqft: 2450,
  lotSize: '0.34 acres',
  yearBuilt: 1998,
  taxes: 4620,
  schoolDistrict: 'Troy School District',
  utilities: {
    gas: 95,
    electric: 120,
    water: 50,
  },
  hoa: {
    hasHoa: true,
    monthlyFee: 35,
    name: 'Maple Grove Community HOA',
  },
  heating: 'Forced Air (Natural Gas)',
  cooling: 'Central Air (New 2021)',
  garage: '2-Car Attached with epoxy floor',
  basement: 'Finished daylight basement with wet bar',
  roof: 'Dimensional Asphalt Shingles',
  upgrades: [
    { id: 'u1', item: 'Architectural Shingle Roof', year: '2022', cost: 12500 },
    { id: 'u2', item: 'High-Efficiency Furnace & Central A/C', year: '2021', cost: 8900 },
    { id: 'u3', item: 'Full Kitchen Remodel (Quartz & Cabinets)', year: '2023', cost: 24000 },
    { id: 'u4', item: 'Composite Backyard Trex Deck', year: '2020', cost: 9500 },
  ],
  specialNotes: [
    'Private wooded lot backing up to township green space with no rear neighbors',
    'Fully remodeled kitchen with quartz waterfall counters and custom soft-close cabinetry',
    'Walking distance to neighborhood park and elementary school',
  ],
  features: [
    'Quartz Countertops',
    'Stainless Steel Appliances',
    'Kitchen Island',
    'Subway Tile Backsplash',
    'Solid Hardwood Floors',
    'Finished Basement',
    'Gas Fireplace',
    'Composite Deck',
    'Fenced Backyard',
    'Smart Thermostat',
    'Video Doorbell',
    'Main Floor Laundry',
  ],
  walkthroughVideoUrl: '',
  setupComplete: true,
};

export const DEMO_PHOTOS: PhotoItem[] = [
  {
    id: 'sample-front',
    dataUrl: houseExteriorFront,
    caption: 'Front Exterior & Landscaping',
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
    caption: 'Private Backyard with Trex Deck & Mature Trees',
    isCover: false,
    roomCategory: 'Outdoor',
    order: 3,
    coachQuality: 'Great',
    coachTip: 'Sunny deck shot emphasizing generous lawn space and private perimeter.',
    analyzed: true,
  },
];

export const DEMO_COMPS: CompSale[] = [
  {
    id: 'comp-demo-1',
    address: '4312 Maple Grove Ct',
    salePrice: 442000,
    saleDate: '2026-09-14',
    sqft: 2510,
    beds: 4,
    baths: 2.5,
    distance: '0.1 miles',
    condition: 'Similar',
    adjustments: -3000,
    adjustedPrice: 439000,
    pricePerSqFt: 176,
    notes: 'Same subdivision, slightly larger lot, older roof.',
  },
  {
    id: 'comp-demo-2',
    address: '1890 Timberline Ridge',
    salePrice: 429000,
    saleDate: '2026-10-02',
    sqft: 2380,
    beds: 4,
    baths: 2.5,
    distance: '0.4 miles',
    condition: 'Inferior',
    adjustments: 12000,
    adjustedPrice: 441000,
    pricePerSqFt: 180,
    notes: 'Unfinished basement and older laminate kitchen counters.',
  },
  {
    id: 'comp-demo-3',
    address: '4155 Whispering Pines Ct',
    salePrice: 455000,
    saleDate: '2026-08-28',
    sqft: 2600,
    beds: 4,
    baths: 3,
    distance: '0.6 miles',
    condition: 'Superior',
    adjustments: -18000,
    adjustedPrice: 437000,
    pricePerSqFt: 175,
    notes: '3 full baths and in-ground pool; pool value adjusted down.',
  },
];

export const DEMO_PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    id: 'ph-demo-orig',
    date: '2026-11-01',
    oldPrice: 445000,
    newPrice: 435000,
    reason: 'Positioned competitively for active buyer search tiers',
  },
];

export const DEMO_SHOWINGS: ShowingItem[] = [
  {
    id: 'show-demo-1',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    time: '2:00 PM',
    buyerName: 'Demo Buyer',
    buyerPhone: '(555) 010-2411',
    buyerEmail: 'buyer.demo@example.com',
    hasPreApproval: true,
    status: 'Confirmed',
    notes: 'Pre-approved buyer excited to see the kitchen and deck.',
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_INQUIRIES: InquiryItem[] = [
  {
    id: 'inq-demo-1',
    name: 'Sample Inquiry (Demo)',
    email: 'sample.buyer@example.com',
    phone: '(555) 010-2444',
    source: 'Zillow FSBO',
    dateReceived: new Date().toISOString().split('T')[0],
    message: 'Hi! Is the home still available? Can we schedule a private tour this Saturday?',
    replied: false,
    notes: 'Demo buyer inquiry',
  },
];

export const DEMO_CLOSING_TEAM: ClosingTeamInfo = {
  attorneyOrTitle: 'Sample Title & Escrow Co.',
  contactPerson: 'Escrow Coordinator (Demo)',
  phone: '(555) 010-8820',
  email: 'escrow@example.com',
  flatFeeQuoted: 750,
  notes: 'Coordinates title commitment, earnest money escrow, and closing documents.',
};

export const DEMO_DOCUMENTS: DocumentItem[] = [
  {
    id: 'state-seller-disclosure',
    name: "State Statutory Seller's Property Disclosure",
    category: 'Required',
    required: true,
    status: 'Missing',
    note: 'Mandatory or standard seller property disclosure document for your property state.',
  },
  {
    id: 'recent-tax-bills',
    name: 'Summer & Winter Property Tax Bills',
    category: 'Property Records',
    required: false,
    status: 'Uploaded',
    fileName: 'Property_Tax_Assessment_Demo.pdf',
    uploadDate: '2026-11-01',
    note: 'Shows verified taxable value and millage rates.',
  },
];

export const DEMO_PROMOTE_GROUPS: PromoteGroup[] = [
  {
    id: 'demo-g1',
    name: 'Local Area Buy/Sell/Trade',
    platform: 'Facebook Group',
    url: 'https://facebook.com/groups',
    posted: true,
    lastPostedDate: '2026-11-05',
  },
  {
    id: 'demo-g2',
    name: 'Regional Homes For Sale By Owner (FSBO)',
    platform: 'Facebook Group',
    url: 'https://facebook.com/groups',
    posted: false,
  },
];
