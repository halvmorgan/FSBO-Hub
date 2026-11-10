# FSBO Command Center - Multi-Customer SaaS

**FSBO Command Center** is an all-in-one software-as-a-service (SaaS) platform that empowers residential homeowners to market, show, negotiate, and close the sale of their home without paying traditional 5–6% real estate agent commissions.

---

## 🚀 Key SaaS Features

### 1. Public Marketing Site
- **Landing Page (`/`)**: High-converting marketing hero (*"Sell your home yourself. We'll guide every step."*), 3-step walk-through, 13-feature interactive matrix, homeowner FAQ, and responsive footer.
- **Dynamic Pricing Table (`/pricing`)**: 3 tiered plans with the middle tier highlighted as **"Most Popular"**:
  - **Free Trial (7 Days)**: Property facts, photo uploads (up to 15), listing writer (3 generations), checklist, and comp worksheet in draft mode.
  - **Per Listing ($49 One-Time)**: 6 months full access for 1 property, published `/p/slug` website, direct buyer showing forms, 300 AI credits, print yard flyers, and sign QR codes.
  - **Pro Monthly ($19/mo)**: Up to 3 active properties, 1,000 monthly AI credits, priority support, cancel anytime.
- **Legal Compliance Pages**:
  - **Terms of Service (`/terms`)**: Clear notices that the app provides general information (not legal, tax, or brokerage advice) and details homeowner liability for disclosures.
  - **Privacy Policy (`/privacy`)**: Document isolation guarantee stating private purchase offers and buyer financial records are never made public.
  - **Fair Housing Guardrail**: Built-in AI audit verifying listing copy complies with Title VIII of the Civil Rights Act of 1968.

### 2. Multi-Property Accounts & Authentication
- **Firebase Authentication**: Email/Password and Google OAuth sign-in.
- **Property Switcher**: Fast switcher at the top of the left sidebar allowing sellers to manage multiple properties according to their plan limits.
- **Legacy Browser Migration**: Seamless one-click migration banner allowing sellers with pre-existing local storage data to import directly into Firestore.
- **Account & Billing (`/account`)**: Seller profile details, current plan status and renewal dates, AI credit meter, Stripe Customer Portal link, one-click offline `.zip` data export (JSON + high-res photos), and account deletion.

### 3. Hosted Property Websites (`/p/:slug`)
- Single-page hosted listing showcasing high-resolution photos, core specs, recent capital upgrades, interactive Google Maps embed, and open house schedules.
- **Tour Booking Form**: Direct showing requests with bot-trapping honeypot anti-spam protection. Submissions immediately dispatch real-time in-app notifications to the seller.

### 4. Admin Super Panel (`/admin`)
- **Restricted Access**: Auto-bootstrapped for `halvmorgan@gmail.com` or users with `role: 'admin'`.
- **Metrics Dashboard**: Total customers, estimated MRR, per-listing revenue, and active trial counts.
- **Customer Management**: Searchable user table with instant plan upgrades/extensions and AI credit resets.
- **Live Plan & Pricing Editor**: Edit plan names, prices, property limits, and features directly in Firestore `saasConfig/global`.
- **Public Site Moderation & Support Inbox**: Enable/disable public property sites and answer customer support tickets.

### 5. Secure Server-Side AI
- All Gemini API calls (`@google/genai`) are executed server-side in `/server.ts` with strict credit enforcement:
  - AI Photo Feature Extractor (`/api/gemini/photo-features`)
  - Real Estate Photo Coach (`/api/gemini/photo-coach`)
  - Public Records Extractor (`/api/gemini/public-info`)
  - Listing Copy Generator & Fair Housing Scanner (`/api/gemini/listing-copy`)
  - Municipal & FSBO Rule Advisor (`/api/gemini/site-rules`)
  - Video Walkthrough Script Writer (`/api/gemini/walkthrough-script`)
  - Buyer Inquiry Smart Responder (`/api/gemini/inquiry-reply`)

---

## 🛠️ Environment Variables

Create or configure `.env` based on `.env.example`:

```bash
# Gemini AI (injected automatically in Google AI Studio)
GEMINI_API_KEY="AIzaSy..."

# Public URL
APP_URL="http://localhost:3000"

# Stripe Payments (Optional - runs in simulated test mode if omitted)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PER_LISTING="price_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."
```

---

## 📦 Running & Building

```bash
# Install dependencies
npm install

# Run full-stack dev server (Express + Vite on Port 3000)
npm run dev

# Build client production assets
npm run build

# Start production server
npm run start
```

---

## 🔒 Security & Firestore Rules

Database rules enforce:
1. `users/{userId}`: Only accessible by the authenticated user or an administrator.
2. `users/{userId}/properties/{propId}`: Private documents, offers, and seller files are strictly isolated to the property owner.
3. `publicSites/{slug}`: World-readable for prospective home buyers. Write/update permissions are limited to the property owner or administrator.
4. `publicSites/{slug}/requests/{requestId}`: Create-only for buyers; read/manage permissions restricted to the seller and admin.
5. `saasConfig/global`: Readable by all users; writable only by administrators.
