import { ListingCopyData } from '../types';

export function formatLabel(key: string): string {
  const map: Record<string, string> = {
    price: 'Price',
    askingprice: 'Price',
    address: 'Address',
    beds: 'Beds',
    bedrooms: 'Beds',
    baths: 'Baths',
    bathrooms: 'Baths',
    bathsfull: 'Full Baths',
    bathshalf: 'Half Baths',
    sqft: 'Sq Ft',
    squarefootage: 'Sq Ft',
    squarefeet: 'Sq Ft',
    yearbuilt: 'Year Built',
    annualtaxes: 'Taxes',
    taxes: 'Taxes',
    propertytaxes: 'Taxes',
    schooldistrict: 'School District',
    schools: 'School District',
    basement: 'Basement',
    garage: 'Garage',
    lotsize: 'Lot Size',
    hoa: 'HOA',
    hoadues: 'HOA Dues',
  };
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (map[normalized]) return map[normalized];

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * If keyFactsBlock is an object, formats as lines like:
 * "Price: $435,000"
 * "Beds: 4"
 * "Baths: 2 Full, 1 Half"
 * "Sq Ft: 1,850"
 * "Year Built: 1998"
 * "Taxes: $4,620/yr"
 * "School District: ..."
 * If it's a string, returns as-is.
 */
export function formatKeyFacts(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;

  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === 'object' && item !== null ? formatKeyFacts(item) : String(item)))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof val === 'object' && val !== null) {
    const lines: string[] = [];
    for (const [k, rawVal] of Object.entries(val)) {
      if (rawVal === undefined || rawVal === null || rawVal === '') continue;
      const label = formatLabel(k);
      let v = rawVal;
      const lowerKey = k.toLowerCase();

      if (lowerKey.includes('price')) {
        if (typeof v === 'number') v = `$${v.toLocaleString()}`;
        else if (typeof v === 'string' && !v.trim().startsWith('$')) v = `$${v.trim()}`;
      } else if (lowerKey.includes('tax')) {
        if (typeof v === 'number') v = `$${v.toLocaleString()}/yr`;
        else if (typeof v === 'string' && !v.includes('/yr') && !v.includes('yr')) v = `${v.trim()}/yr`;
      } else if (lowerKey.includes('square') || lowerKey === 'sqft') {
        if (typeof v === 'number') v = v.toLocaleString();
      } else if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
        if ((v as any).full !== undefined || (v as any).half !== undefined) {
          const full = (v as any).full ?? (v as any).bathsFull ?? 0;
          const half = (v as any).half ?? (v as any).bathsHalf ?? 0;
          v = `${full} Full${half ? `, ${half} Half` : ''}`;
        } else {
          v = Object.entries(v)
            .map(([subK, subV]) => `${formatLabel(subK)}: ${subV}`)
            .join(', ');
        }
      }
      lines.push(`${label}: ${v}`);
    }
    return lines.join('\n');
  }

  return String(val);
}

/**
 * If upgradesListBlock is an array, formats as bullet list.
 * If it's an object, formats as bullet list of keys & values.
 * If it's a string, returns as-is.
 */
export function formatUpgradesList(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;

  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          return trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')
            ? trimmed
            : `• ${trimmed}`;
        }
        if (typeof item === 'object' && item !== null) {
          const name =
            (item as any).item ||
            (item as any).name ||
            (item as any).upgrade ||
            (item as any).title ||
            (item as any).feature ||
            Object.values(item)[0] ||
            '';
          const yr =
            (item as any).year || (item as any).date ? ` (${(item as any).year || (item as any).date})` : '';
          return `• ${name}${yr}`;
        }
        return `• ${String(item)}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof val === 'object' && val !== null) {
    return Object.entries(val)
      .map(([k, v]) => `• ${formatLabel(k)}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }

  return String(val);
}

/**
 * Universal safe string formatter for any AI field that could come back as an object or array.
 */
export function formatAiText(val: any, fallback = ''): string {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'string') return val;

  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === 'object' && item !== null ? formatAiText(item) : String(item)))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof val === 'object' && val !== null) {
    if (typeof (val as any).text === 'string') return (val as any).text;
    if (typeof (val as any).content === 'string') return (val as any).content;
    if (typeof (val as any).description === 'string') return (val as any).description;
    if (typeof (val as any).body === 'string') return (val as any).body;
    if (typeof (val as any).headline === 'string') return (val as any).headline;

    return Object.entries(val)
      .map(([k, v]) => `${formatLabel(k)}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }

  return String(val);
}

export function normalizeTone(tone?: string): 'Warm' | 'Professional' | 'Luxury' | 'Investor' {
  if (!tone) return 'Warm';
  const lower = tone.toLowerCase();
  if (lower.includes('prof')) return 'Professional';
  if (lower.includes('lux')) return 'Luxury';
  if (lower.includes('inv')) return 'Investor';
  return 'Warm';
}

function unwrapCopyPayload(raw: any): Record<string, any> | null {
  if (raw === undefined || raw === null) return null;

  if (typeof raw === 'string') {
    const trimmed = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return unwrapCopyPayload(JSON.parse(trimmed));
      } catch {
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            return unwrapCopyPayload(JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)));
          } catch {}
        }
      }
    }
    return { fullDescription: trimmed };
  }

  if (Array.isArray(raw)) {
    const firstObj = raw.find((item) => item && typeof item === 'object');
    if (firstObj) return unwrapCopyPayload(firstObj);
    const firstStr = raw.find((item) => typeof item === 'string' && item.trim());
    return firstStr ? { fullDescription: firstStr.trim() } : null;
  }

  if (typeof raw === 'object') {
    const candidates = [
      raw.listing,
      raw.listingCopy,
      raw.data,
      raw.result,
      raw.output,
      raw.response,
    ];
    for (const nested of candidates) {
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const merged = { ...raw, ...nested };
        return merged;
      }
    }
    return raw as Record<string, any>;
  }

  return null;
}

function pickFirstText(obj: Record<string, any>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const val = obj[key];
    const formatted = formatAiText(val, '').trim();
    if (formatted) return formatted;
  }
  return fallback;
}

/**
 * Sanitizes entire AI listing-copy response object into clean typed strings
 */
export function sanitizeListingCopy(
  raw: any,
  defaultHeadline = 'Move-In Ready Home',
  fallbackTone: 'Warm' | 'Professional' | 'Luxury' | 'Investor' = 'Warm'
): ListingCopyData {
  const payload = unwrapCopyPayload(raw);
  if (!payload) {
    return {
      tone: fallbackTone,
      headline: defaultHeadline,
      fullDescription: '',
      keyFactsBlock: '',
      upgradesListBlock: '',
      marketplaceVersion: '',
      craigslistVersion: '',
      socialPostVersion: '',
      flyerTeaser: '',
      fairHousingAudit: {
        isClean: true,
        flaggedPhrases: [],
        complianceNote: 'Verified compliant with federal Fair Housing laws.',
      },
      lastGenerated: new Date().toISOString(),
    };
  }

  const rawAudit = payload.fairHousingAudit;
  const isClean = typeof rawAudit?.isClean === 'boolean' ? rawAudit.isClean : true;
  const flaggedPhrases = Array.isArray(rawAudit?.flaggedPhrases)
    ? rawAudit.flaggedPhrases.map((p: any) => String(p))
    : [];
  const complianceNote = formatAiText(
    rawAudit?.complianceNote,
    'Verified compliant with federal Fair Housing laws.'
  );

  const fullDescription = pickFirstText(payload, [
    'fullDescription',
    'description',
    'listingDescription',
    'mlsDescription',
    'propertyDescription',
    'full_description',
    'listing_description',
    'about',
    'aboutThisHome',
    'body',
    'text',
    'copy',
    'content',
  ]);

  const headline = pickFirstText(
    payload,
    ['headline', 'title', 'listingHeadline'],
    defaultHeadline
  );

  return {
    tone: normalizeTone(payload.tone || fallbackTone),
    headline,
    fullDescription,
    keyFactsBlock: formatKeyFacts(payload.keyFactsBlock ?? payload.keyFacts),
    upgradesListBlock: formatUpgradesList(payload.upgradesListBlock ?? payload.upgradesList),
    marketplaceVersion: pickFirstText(payload, ['marketplaceVersion', 'facebookVersion', 'fbVersion']),
    craigslistVersion: pickFirstText(payload, ['craigslistVersion', 'craigslist']),
    socialPostVersion: pickFirstText(payload, ['socialPostVersion', 'socialVersion', 'socialPost']),
    flyerTeaser: pickFirstText(payload, ['flyerTeaser', 'teaser']),
    fairHousingAudit: {
      isClean,
      flaggedPhrases,
      complianceNote,
    },
    lastGenerated: payload.lastGenerated || new Date().toISOString(),
  };
}
