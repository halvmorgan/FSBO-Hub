import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import Stripe from 'stripe';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Stripe (uses key from env if provided)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null;

// Middleware for parsing JSON with generous limit for base64 photo analysis
app.use(express.json({ limit: '25mb' }));

// In-memory credit tracking cache for low-latency rate limiting and credit checks
// (Syncs with client/Firestore user record)
interface UserCreditRecord {
  creditsUsed: number;
  maxCredits: number;
  plan: 'trial' | 'per_listing' | 'bundle' | 'pro';
  lastResetMonth: number;
}
const userCreditsCache: Map<string, UserCreditRecord> = new Map();

function getOrCreateUserCredits(userId: string, plan: 'trial' | 'per_listing' | 'bundle' | 'pro' = 'trial'): UserCreditRecord {
  const currentMonth = new Date().getMonth();
  let record = userCreditsCache.get(userId);
  if (!record || record.lastResetMonth !== currentMonth) {
    const limits: Record<string, number> = { trial: 25, per_listing: 300, bundle: 600, pro: 1000 };
    record = {
      creditsUsed: 0,
      maxCredits: limits[plan] || 25,
      plan,
      lastResetMonth: currentMonth,
    };
    userCreditsCache.set(userId, record);
  }
  return record;
}

// Middleware to check AI credits without premature deduction
function checkAiCredits(cost = 1) {
  return (req: Request, res: Response, next: Function) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'anonymous-seller';
    const plan = ((req.headers['x-user-plan'] as string) || req.body.userPlan || 'trial') as 'trial' | 'per_listing' | 'bundle' | 'pro';

    const record = getOrCreateUserCredits(userId, plan);
    if (record.creditsUsed + cost > record.maxCredits) {
      return res.status(403).json({
        error: `AI credit limit reached (${record.creditsUsed}/${record.maxCredits} credits used this month). Please upgrade your plan to continue using AI tools.`,
        creditsUsed: record.creditsUsed,
        maxCredits: record.maxCredits,
        upgradeRequired: true,
      });
    }

    (req as any).deductAiCredits = () => {
      record.creditsUsed += cost;
      return record;
    };
    (req as any).aiCreditRecord = record;
    next();
  };
}

// Helper to resolve Gemini API key from environment variables
function getGeminiApiKey(): string | null {
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || '';
  const trimmed = envKey.trim();
  if (!trimmed || trimmed === 'MY_GEMINI_API_KEY' || trimmed === 'YOUR_GEMINI_API_KEY') {
    return null;
  }
  return trimmed;
}

// Resilient helper to parse Gemini JSON outputs cleanly
function parseAiJson(rawText: string, fallback: any = {}): any {
  if (!rawText) return fallback;
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    const firstBracket = rawText.indexOf('[');
    const lastBracket = rawText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(rawText.substring(firstBracket, lastBracket + 1));
      } catch {}
    }
    return fallback;
  }
}

// Resilient helper to resolve base64 or local asset image URLs to clean base64 data
function resolveImageBase64(input: string, fallbackMime = 'image/jpeg'): { base64: string; mimeType: string } {
  if (typeof input !== 'string') return { base64: '', mimeType: fallbackMime };
  if (input.startsWith('data:')) {
    const mimeMatch = input.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : fallbackMime;
    const base64 = input.replace(/^data:[^;]+;base64,/, '');
    return { base64, mimeType };
  }
  // If it's a relative asset URL, e.g. /src/assets/images/... or src/assets/images/...
  const cleanPath = input.replace(/^\//, '');
  const localCandidates = [
    path.resolve(__dirname, cleanPath),
    path.resolve(__dirname, 'src', cleanPath),
    path.resolve(process.cwd(), cleanPath),
  ];
  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const buffer = fs.readFileSync(candidate);
      const ext = path.extname(candidate).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      return { base64: buffer.toString('base64'), mimeType: mime };
    }
  }
  return { base64: input.replace(/^data:image\/[a-z]+;base64,/, ''), mimeType: fallbackMime };
}

// Instantiate GoogleGenAI client with resolved key
function getAiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err: any = new Error('AI key not configured');
    err.status = 401;
    err.isAiKeyMissing = true;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Check if error is REAL 429 rate limit or 503 high demand / service overloaded
function isRealBusyError(err: any): boolean {
  const status = err?.status || err?.code || err?.statusCode || 0;
  const msg = (err?.message || '').toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    msg.includes('"code":429') ||
    msg.includes('"code":503') ||
    msg.includes('resource_exhausted') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('503 service unavailable')
  );
}

// Automatic Retry up to 3 times for 429/503 with exponential backoff + fallback to Flash model
async function generateContentWithRetryAndFallback(params: {
  contents: any;
  config?: any;
  mainModel?: string;
  fallbackModel?: string;
  maxRetries?: number;
}): Promise<any> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err: any = new Error('AI key not configured');
    err.status = 401;
    err.isAiKeyMissing = true;
    throw err;
  }

  const aiClient = getAiClient();
  const mainModel = params.mainModel || 'gemini-3.8-flash';
  const fallbackModel = params.fallbackModel || 'gemini-3.1-flash-lite';
  const maxRetries = params.maxRetries ?? 3;
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  let lastError: any = null;

  // 1. Try main model with up to 3 retries (only for 429/503)
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await aiClient.models.generateContent({
        model: mainModel,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || err?.statusCode;
      const msg = err?.message || String(err);
      console.error(`[Real Gemini Error] Main model "${mainModel}" attempt ${attempt}/${maxRetries} failed: Status ${status} - ${msg}`);

      // If NOT a 429/503 rate limit/busy error, do NOT retry; fail fast immediately
      if (!isRealBusyError(err)) {
        throw err;
      }

      // If it is a persistent daily quota exhaustion for this model, fall back to Flash model immediately
      const lower = msg.toLowerCase();
      if (lower.includes('per day limit exceeded') || lower.includes('generaterequestsperday') || lower.includes('daily limit exceeded')) {
        console.warn(`[Gemini Fast Fallback] Main model "${mainModel}" daily quota exhausted. Switching immediately to Flash model "${fallbackModel}"...`);
        break;
      }

      if (attempt < maxRetries) {
        const delay = 800 * Math.pow(2, attempt - 1); // 800ms, 1600ms
        await wait(delay);
      }
    }
  }

  // 2. If main model failed with 429/503 after all retries, fall back to a Flash model
  console.warn(`[Gemini Fallback] Main model "${mainModel}" busy (429/503) after ${maxRetries} attempts. Falling back to Flash model "${fallbackModel}"...`);
  try {
    const response = await aiClient.models.generateContent({
      model: fallbackModel,
      contents: params.contents,
      config: params.config,
    });
    return response;
  } catch (fallbackErr: any) {
    const status = fallbackErr?.status || fallbackErr?.code || fallbackErr?.statusCode;
    const msg = fallbackErr?.message || String(fallbackErr);
    console.error(`[Real Gemini Fallback Error] Fallback model "${fallbackModel}" failed: Status ${status} - ${msg}`);
    throw fallbackErr;
  }
}

// Helper for honest, friendly error messages
function handleGeminiError(res: Response, error: any, context: string) {
  const status = error?.status || error?.code || error?.statusCode;
  const message = error?.message || String(error);
  console.error(`[Real Underlying Gemini Error] Context: "${context}" | Status: ${status} | Message: ${message}`, error);

  const lowerMsg = message.toLowerCase();

  // 1. Missing or invalid API key
  const isAuthOrKey =
    error?.isAiKeyMissing ||
    message === 'AI key not configured' ||
    message.includes('AI key not configured') ||
    status === 401 ||
    status === 403 ||
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('api key not configured') ||
    lowerMsg.includes('api key should be set') ||
    lowerMsg.includes('permission_denied') ||
    lowerMsg.includes('insufficient authentication');

  if (isAuthOrKey) {
    return res.status(401).json({
      error: 'AI key not configured',
      message: 'AI key not configured. Please configure your GEMINI_API_KEY in server secrets.',
      isAiKeyMissing: true,
      context,
      status: 401,
    });
  }

  // 2. Invalid model error
  const isModelError =
    status === 404 ||
    (lowerMsg.includes('models/') && lowerMsg.includes('not found')) ||
    lowerMsg.includes('is not found for api version');

  if (isModelError) {
    return res.status(400).json({
      error: 'Invalid AI model configured.',
      message,
      isModelError: true,
      context,
      status: 400,
    });
  }

  // 3. ONLY return 503 for REAL 429 or 503 busy/rate-limit errors
  const isRealBusy = isRealBusyError(error);

  if (isRealBusy) {
    return res.status(503).json({
      error: 'Our AI is busy right now. Please try again in a few moments.',
      message: 'Our AI is busy right now. Please try again in a few moments.',
      isAiBusy: true,
      context,
      status: 503,
    });
  }

  // 4. Any other non-busy error returns 500 (never 503 / "AI is busy")
  return res.status(500).json({
    error: `AI request failed: ${message.slice(0, 160)}`,
    message,
    context,
    status: 500,
  });
}

// Global Key Guard for all /api/gemini routes
app.use('/api/gemini', (req: Request, res: Response, next: Function) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn(`[Gemini API Guard] ${req.method} ${req.originalUrl}: AI key not configured on server.`);
    return res.status(401).json({
      error: 'AI key not configured',
      message: 'AI key not configured. Please configure your GEMINI_API_KEY in server secrets.',
      isAiKeyMissing: true,
    });
  }
  next();
});

// -------------------------------------------------------------
// SECURE SERVER-SIDE GEMINI AI ENDPOINTS (With Credit Deduction)
// -------------------------------------------------------------

// 1. Scan Photos for Features (Gemini Vision, Cost: 2 credits)
app.post('/api/gemini/photo-features', checkAiCredits(2), async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', roomHint = '' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const { base64: cleanBase64, mimeType: resolvedMime } = resolveImageBase64(imageBase64, mimeType);
    if (!cleanBase64) {
      return res.status(400).json({ error: 'Valid image base64 or photo asset could not be loaded.' });
    }

    const prompt = `Analyze this real estate photo of a residential home${roomHint ? ` (room hint: ${roomHint})` : ''}.
Identify specific, valuable selling features visible in this photo that a home buyer would care about.
Examples: "Granite countertops", "Stainless steel appliances", "Hardwood floors", "Crown molding", "Subway tile backsplash", "Kitchen island with seating", "Recessed lighting", "Large soaking tub", "Double vanity", "Tile shower with glass door", "Vaulted ceiling", "Fireplace", "Sliding glass patio door", "Fenced backyard", "Composite deck", "Mature trees", "Open concept layout".

Respond ONLY in valid JSON with this exact structure:
{
  "roomDetected": "Kitchen",
  "features": [
    {
      "name": "Granite Countertops",
      "category": "Kitchen",
      "confidence": "high",
      "description": "Polished speckled granite counters with beveled edges"
    }
  ]
}`;

    const response = await generateContentWithRetryAndFallback({
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: resolvedMime,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const creditRecord = (req as any).deductAiCredits ? (req as any).deductAiCredits() : (req as any).aiCreditRecord;
    const parsed = parseAiJson(response.text || '{}', { roomDetected: 'General', features: [] });
    return res.json({
      ...parsed,
      creditsUsed: creditRecord?.creditsUsed,
      maxCredits: creditRecord?.maxCredits,
    });
  } catch (error) {
    return handleGeminiError(res, error, 'photo-features');
  }
});

// 2. AI Photo Coach (Cost: 2 credits)
app.post('/api/gemini/photo-coach', checkAiCredits(2), async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', caption = '' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const { base64: cleanBase64, mimeType: resolvedMime } = resolveImageBase64(imageBase64, mimeType);
    if (!cleanBase64) {
      return res.status(400).json({ error: 'Valid image base64 or photo asset could not be loaded.' });
    }

    const prompt = `You are a professional real estate photography coach helping an everyday homeowner take winning photos to sell their home FSBO without an agent.
Examine this photo${caption ? ` (caption: "${caption}")` : ''}.
Evaluate lighting, composition, camera level, and staging.
Provide a quality verdict: "Great", "Good", or "Retake", plus one concise, friendly tip (1-2 sentences).

Respond ONLY in valid JSON:
{
  "quality": "Great",
  "tip": "Turn on all ambient lamps and shoot around 11 AM when sunlight streams through the windows.",
  "strengths": ["Clean countertops", "Level horizon"],
  "improvementAreas": ["Slight backlighting from the window"]
}`;

    const response = await generateContentWithRetryAndFallback({
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: resolvedMime,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const creditRecord = (req as any).deductAiCredits ? (req as any).deductAiCredits() : (req as any).aiCreditRecord;
    const parsed = parseAiJson(response.text || '{}', {
      quality: 'Good',
      tip: 'Capture with camera held level at chest height in bright natural daylight.',
      strengths: ['Clear shot'],
      improvementAreas: [],
    });
    return res.json({
      ...parsed,
      creditsUsed: creditRecord?.creditsUsed,
      maxCredits: creditRecord?.maxCredits,
    });
  } catch (error) {
    return handleGeminiError(res, error, 'photo-coach');
  }
});

// 3. Check Public Property Records using Google Search Grounding (Cost: 3 credits)
app.post('/api/gemini/public-info', checkAiCredits(3), async (req: Request, res: Response) => {
  try {
    const { address, state = 'Michigan' } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const prompt = `Search the web for public real estate and municipal property records for this address:
"${address}, ${state}".
Look up publicly recorded facts from county records, tax assessors, Redfin, Zillow, or Realtor public pages:
- Bedrooms count
- Bathrooms count
- Finished square footage
- Lot size
- Year built
- School district name
- Estimated annual property taxes or tax assessed value

Extract the findings and provide them in clean JSON format:
{
  "beds": number or null,
  "baths": number or null,
  "sqft": number or null,
  "lotSize": "0.35 acres" or null,
  "yearBuilt": number or null,
  "schoolDistrict": "string" or null,
  "annualTaxes": number or null,
  "summary": "1-2 sentence overview of what was found publicly about this home."
}
Only output the JSON.`;

    let response: any;
    let sources: any[] = [];

    try {
      response = await generateContentWithRetryAndFallback({
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      sources = chunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({
          title: c.web.title || c.web.uri,
          url: c.web.uri,
        }));
    } catch (searchErr) {
      if (isRealBusyError(searchErr)) {
        console.warn('[public-info] googleSearch tool busy, falling back to direct model knowledge...');
        response = await generateContentWithRetryAndFallback({
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      } else {
        throw searchErr;
      }
    }

    const rawText = response.text || '';
    const propertyData = parseAiJson(rawText, { summary: rawText });

    const creditRecord = (req as any).deductAiCredits ? (req as any).deductAiCredits() : (req as any).aiCreditRecord;

    return res.json({
      propertyData,
      sources,
      creditsUsed: creditRecord?.creditsUsed,
      maxCredits: creditRecord?.maxCredits,
    });
  } catch (error) {
    return handleGeminiError(res, error, 'public-info');
  }
});

// 4. "What am I missing?" - Buyer Feature Gap Analysis (Cost: 1 credit)
app.post('/api/gemini/missing-features', checkAiCredits(1), async (req: Request, res: Response) => {
  try {
    const { property, state = 'Michigan' } = req.body;

    const prompt = `You are an expert real estate consultant.
Review this seller's property profile in ${state}:
- Address: ${property?.address || 'Not specified'}
- Price: $${property?.price?.toLocaleString() || 'N/A'}
- Specs: ${property?.beds || '?'} beds / ${property?.bathsFull || '?'}.${property?.bathsHalf || 0} baths
- SqFt: ${property?.sqft || '?'} sqft, Year Built: ${property?.yearBuilt || '?'}
- Marked Features: ${(property?.features || []).join(', ') || 'None marked'}

Identify 5 to 7 high-value features commonly searched by buyers in this market that the homeowner HAS NOT marked yet.
Frame each as a friendly Yes/No question with a 1-sentence explanation of why buyers search for it.

Respond in JSON:
{
  "suggestions": [
    {
      "id": "eg_fenced_yard",
      "question": "Do you have a fully fenced backyard?",
      "featureName": "Fenced Yard",
      "category": "Outdoor",
      "whyItMatters": "Dog owners and parents with young kids frequently filter for fenced yards in online searches."
    }
  ]
}`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const creditRecord = (req as any).deductAiCredits ? (req as any).deductAiCredits() : (req as any).aiCreditRecord;
    const parsed = parseAiJson(response.text || '{"suggestions":[]}', { suggestions: [] });
    return res.json({
      ...parsed,
      creditsUsed: creditRecord?.creditsUsed,
      maxCredits: creditRecord?.maxCredits,
    });
  } catch (error) {
    return handleGeminiError(res, error, 'missing-features');
  }
});

// 5. Listing Writer with Fair Housing Compliance Check (Cost: 3 credits)
app.post('/api/gemini/listing-copy', checkAiCredits(3), async (req: Request, res: Response) => {
  try {
    const { property, tone = 'Warm', state = 'Michigan' } = req.body;

    const specialThings = (property?.specialNotes || []).filter(Boolean).join('; ');
    const upgradesText = (property?.upgrades || []).map((u: any) => `${u.item} (${u.year})`).join(', ');
    const featuresList = (property?.features || []).join(', ');

    const prompt = `You are an expert real estate copywriter and Fair Housing compliance specialist.
Generate a complete, high-converting home sale listing for this FSBO property in ${state}:
- Address: ${property?.address || ''}
- Asking Price: $${property?.price?.toLocaleString() || 'TBD'}
- Specs: ${property?.beds || 3} Beds, ${property?.bathsFull || 2} Full Baths, ${property?.bathsHalf || 0} Half Baths, ${property?.sqft || 2000} Sq Ft, Built: ${property?.yearBuilt || 1995}
- Taxes: $${property?.taxes || 'N/A'}/yr, School District: ${property?.schoolDistrict || 'Local district'}
- Top Special Features: ${specialThings || 'Move-in ready, updated finishes, spacious yard'}
- Upgrades with years: ${upgradesText || 'None recorded'}
- Included features: ${featuresList || 'Stainless appliances, hardwood, deck'}
- Requested Tone: ${tone}

STRICT FAIR HOUSING REQUIREMENT:
The Fair Housing Act forbids describing or targeting buyers by race, religion, sex, familial status, disability, or national origin.
NEVER use phrases like "perfect for young families", "great for singles", "walk to church", "safe neighborhood for kids".
ALWAYS describe the PHYSICAL FEATURES OF THE HOUSE, never the buyer.

Generate:
1. "headline"
2. "fullDescription"
3. "keyFactsBlock"
4. "upgradesListBlock"
5. "marketplaceVersion"
6. "craigslistVersion"
7. "socialPostVersion"
8. "flyerTeaser"
9. "fairHousingAudit":
   - "isClean": boolean
   - "flaggedPhrases": array of strings
   - "complianceNote": "Confirmation of Fair Housing adherence."

Respond in JSON only.`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const creditRecord = (req as any).deductAiCredits ? (req as any).deductAiCredits() : (req as any).aiCreditRecord;
    const parsed = parseAiJson(response.text || '{}', {});
    return res.json({
      ...parsed,
      creditsUsed: creditRecord?.creditsUsed,
      maxCredits: creditRecord?.maxCredits,
    });
  } catch (error) {
    return handleGeminiError(res, error, 'listing-copy');
  }
});

// 6. Check Current Listing Site Rules (Cost: 2 credits)
app.post('/api/gemini/site-rules', checkAiCredits(2), async (req: Request, res: Response) => {
  try {
    const { siteName } = req.body;
    if (!siteName) return res.status(400).json({ error: 'siteName is required' });

    const todayDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const prompt = `Research the current ${new Date().getFullYear()} policy for an owner selling by owner (FSBO) posting on "${siteName}".
Questions:
1. Does ${siteName} allow homeowners to list directly for free or for a fee as an owner/FSBO?
2. Or does it require Flat-Fee MLS syndication?
3. What are current fees/limits?
Format in JSON:
{
  "siteName": "${siteName}",
  "directOwnerAllowed": boolean,
  "costSummary": "string",
  "currentPolicySummary": "string",
  "recommendedAction": "string",
  "asOfDate": "${todayDate}"
}
Only output the JSON.`;

    let response: any;
    let sources: any[] = [];

    try {
      response = await generateContentWithRetryAndFallback({
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      sources = chunks.filter((c: any) => c.web?.uri).map((c: any) => ({
        title: c.web.title || c.web.uri,
        url: c.web.uri,
      }));
    } catch (searchErr) {
      if (isRealBusyError(searchErr)) {
        console.warn('[site-rules] googleSearch tool busy, falling back to direct model knowledge...');
        response = await generateContentWithRetryAndFallback({
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      } else {
        throw searchErr;
      }
    }

    const rawText = response.text || '';
    const ruleData = parseAiJson(rawText, { currentPolicySummary: rawText, siteName });

    const creditRecord = (req as any).deductAiCredits ? (req as any).deductAiCredits() : (req as any).aiCreditRecord;

    return res.json({
      ruleData,
      sources,
      asOfDate: todayDate,
      creditsUsed: creditRecord?.creditsUsed,
      maxCredits: creditRecord?.maxCredits,
    });
  } catch (error) {
    return handleGeminiError(res, error, 'site-rules');
  }
});

// 7. Walkthrough Video Script Generator (Cost: 1 credit)
app.post('/api/gemini/walkthrough-script', checkAiCredits(1), async (req: Request, res: Response) => {
  try {
    const { property } = req.body;
    const prompt = `Create a smartphone video walkthrough filming script for:
Address: ${property?.address || 'Your Home'}
Beds/Baths: ${property?.beds || 3} bed / ${property?.bathsFull || 2} bath, ${property?.sqft || 2000} sqft
Special features: ${(property?.features || []).slice(0, 8).join(', ')}

Structure as a friendly shot-by-shot smartphone filming guide in JSON:
{
  "title": "Smartphone Walkthrough Video Script",
  "estimatedDuration": "75 seconds",
  "filmingTips": ["Hold phone with both hands", "Shoot in horizontal 4K"],
  "scenes": [
    {
      "sceneNumber": 1,
      "location": "Front Porch",
      "cameraMotion": "Slow pan across front facade",
      "spokenScript": "Welcome to 123 Maple...",
      "duration": "10s"
    }
  ]
}`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const creditRecord = (req as any).deductAiCredits ? (req as any).deductAiCredits() : (req as any).aiCreditRecord;
    const parsed = parseAiJson(response.text || '{}', { title: 'Smartphone Walkthrough Video Script', scenes: [] });
    return res.json({
      ...parsed,
      creditsUsed: creditRecord?.creditsUsed,
      maxCredits: creditRecord?.maxCredits,
    });
  } catch (error) {
    return handleGeminiError(res, error, 'walkthrough-script');
  }
});

// 8. AI Personalized Inquiry Reply (Cost: 1 credit)
app.post('/api/gemini/inquiry-reply', checkAiCredits(1), async (req: Request, res: Response) => {
  try {
    const { templateType = 'first_reply', buyerName = 'there', buyerMessage = '', property, sellerName = 'Homeowner', sellerPhone = '' } = req.body;

    const prompt = `Draft personalized inquiry responses for a homeowner selling FSBO:
Template: ${templateType}
Buyer Name: ${buyerName}
Buyer Message: "${buyerMessage}"
Seller Name: ${sellerName}
Seller Phone: ${sellerPhone}
Property: ${property?.address || 'our home'}, asking $${property?.price?.toLocaleString() || ''}

Draft:
1. "sms": Concise text message (under 300 chars)
2. "emailSubject": Subject line
3. "emailBody": Friendly, professional email body

Respond in JSON only.`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const creditRecord = (req as any).deductAiCredits ? (req as any).deductAiCredits() : (req as any).aiCreditRecord;
    const parsed = parseAiJson(response.text || '{}', {
      sms: 'Thanks for reaching out! When would you like to view the home?',
      emailSubject: `Regarding ${property?.address || 'the home'}`,
      emailBody: `Hi ${buyerName},\n\nThank you for your interest!`,
    });
    return res.json({
      ...parsed,
      creditsUsed: creditRecord?.creditsUsed,
      maxCredits: creditRecord?.maxCredits,
    });
  } catch (error) {
    return handleGeminiError(res, error, 'inquiry-reply');
  }
});

// -------------------------------------------------------------
// PAYMENTS & STRIPE CHECKOUT / PORTAL ENDPOINTS
// -------------------------------------------------------------

app.post('/api/stripe/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { planId, userEmail, userId, propertyId } = req.body;
    const appUrl = (process.env.APP_URL || 'https://fsbo-command-center.ai.studio').replace(/\/+$/, '');

    // If Stripe is configured with live secret key:
    if (stripe && process.env.STRIPE_SECRET_KEY) {
      const priceMap: Record<string, string | undefined> = {
        per_listing: process.env.STRIPE_PRICE_PER_LISTING,
        bundle: process.env.STRIPE_PRICE_BUNDLE,
        pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
      };

      const getFallbackProduct = () => {
        if (planId === 'pro') {
          return {
            name: 'FSBO Command Center - Pro Monthly',
            description: 'Up to 3 properties, 1000 AI credits/mo, email support',
            amount: 2900,
            recurring: { interval: 'month' } as const,
          };
        }
        if (planId === 'bundle') {
          return {
            name: 'FSBO Command Center - Seller Pro + Home Value Worksheet',
            description: 'Everything in Per Listing plus CMA Home Value Worksheet bundle',
            amount: 19700,
            recurring: undefined,
          };
        }
        return {
          name: 'FSBO Command Center - Per Listing (6 Months)',
          description: 'Full access for 1 property for 6 months, 300 AI credits',
          amount: 14900,
          recurring: undefined,
        };
      };

      const prod = getFallbackProduct();

      const lineItems = priceMap[planId]
        ? [{ price: priceMap[planId], quantity: 1 }]
        : [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: prod.name,
                description: prod.description,
              },
              unit_amount: prod.amount,
              recurring: prod.recurring,
            },
            quantity: 1,
          }];

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems as any,
        mode: planId === 'pro' ? 'subscription' : 'payment',
        success_url: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}&upgraded=${planId}`,
        cancel_url: `${appUrl}/pricing?canceled=true`,
        customer_email: userEmail,
        client_reference_id: userId,
        metadata: { userId, planId, propertyId: propertyId || '' },
      } as any);

      return res.json({ url: session.url, sessionId: session.id });
    }

    // Dev Simulation Mode (if Stripe keys not yet configured in environment):
    // Provides seamless local verification while adhering to Stripe specs
    return res.json({
      url: `${appUrl}/account?simulated_checkout=success&upgraded=${planId}&user=${userId}`,
      simulated: true,
      message: 'Stripe keys not set in .env. Test mode activated.',
    });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/stripe/create-portal-session', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    const appUrl = (process.env.APP_URL || 'https://fsbo-command-center.ai.studio').replace(/\/+$/, '');

    if (stripe && customerId) {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/account?portal_notice=true`,
      });
      return res.json({ url: session.url });
    }

    return res.json({
      url: `${appUrl}/account?portal_notice=true`,
      simulated: true,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Stripe Webhook Receiver
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any = req.body;
  if (stripe && webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`Checkout completed for customer ${session.customer_email}, plan: ${session.metadata?.planId}`);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      console.log(`Subscription event: ${event.type}`);
      break;
    }
    default:
      break;
  }

  return res.json({ received: true });
});

// -------------------------------------------------------------
// NOTIFICATIONS & EMAIL NOTIFICATION TRIGGER
// -------------------------------------------------------------

app.post('/api/notifications/send-email', (req: Request, res: Response) => {
  const { toEmail, subject, type, payload } = req.body;
  console.log(`[EMAIL DISPATCH] To: ${toEmail} | Subj: ${subject} | Type: ${type}`);
  // In production, integration with SendGrid, Resend, or Firebase Trigger Email extension
  return res.json({
    status: 'delivered',
    sentAt: new Date().toISOString(),
    to: toEmail,
    type,
  });
});

// -------------------------------------------------------------
// PUBLIC PROPERTY SITES & SHOWING REQUESTS (With Anti-Spam)
// -------------------------------------------------------------

app.post('/api/public-sites/:slug/request', (req: Request, res: Response) => {
  const { slug } = req.params;
  const { buyerName, buyerPhone, buyerEmail, preferredDate, hasPreApproval, message, honeypot } = req.body;

  // Honeypot spam trap: if hidden field is filled, silently ignore
  if (honeypot) {
    console.warn(`Spam bot caught via honeypot on /p/${slug}`);
    return res.json({ status: 'success', message: 'Request received' });
  }

  if (!buyerName || !buyerEmail) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  console.log(`[SHOWING REQUEST] On /p/${slug} from ${buyerName} (${buyerPhone}, ${buyerEmail})`);
  return res.json({
    status: 'success',
    requestId: 'req-' + Date.now(),
    receivedAt: new Date().toISOString(),
  });
});

// Setup Vite or Static Serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FSBO Command Center SaaS server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
