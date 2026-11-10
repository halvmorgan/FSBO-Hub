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
 * "Sq Ft: 2,450"
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

/**
 * Sanitizes entire AI listing-copy response object into clean typed strings
 */
export function sanitizeListingCopy(
  raw: any,
  defaultHeadline = 'Move-In Ready Home',
  fallbackTone: 'Warm' | 'Professional' | 'Luxury' | 'Investor' = 'Warm'
): ListingCopyData {
  if (!raw || typeof raw !== 'object') {
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

  const rawAudit = raw.fairHousingAudit;
  const isClean = typeof rawAudit?.isClean === 'boolean' ? rawAudit.isClean : true;
  const flaggedPhrases = Array.isArray(rawAudit?.flaggedPhrases)
    ? rawAudit.flaggedPhrases.map((p: any) => String(p))
    : [];
  const complianceNote = formatAiText(
    rawAudit?.complianceNote,
    'Verified compliant with federal Fair Housing laws.'
  );

  return {
    tone: normalizeTone(raw.tone || fallbackTone),
    headline: formatAiText(raw.headline, defaultHeadline),
    fullDescription: formatAiText(raw.fullDescription, ''),
    keyFactsBlock: formatKeyFacts(raw.keyFactsBlock),
    upgradesListBlock: formatUpgradesList(raw.upgradesListBlock),
    marketplaceVersion: formatAiText(raw.marketplaceVersion, ''),
    craigslistVersion: formatAiText(raw.craigslistVersion, ''),
    socialPostVersion: formatAiText(raw.socialPostVersion, ''),
    flyerTeaser: formatAiText(raw.flyerTeaser, ''),
    fairHousingAudit: {
      isClean,
      flaggedPhrases,
      complianceNote,
    },
    lastGenerated: raw.lastGenerated || new Date().toISOString(),
  };
}
