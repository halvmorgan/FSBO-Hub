// Strictly match exact legacy sample listing strings — never wipe real seller copy
// just for mentioning a city like "Rochester" or a feature like "Trex deck".
const LEGACY_SAMPLE_TEXT_RE =
  /(4288\s+meadowview|jordan\s*(?:&|and)\s*taylor\s+smith|taylor\.smith\.homesale@gmail\.com|\(248\)\s*555-0192|meadowview\s+dr(?:ive)?\b.*\brochester|rochester\s+schools.*\btrex\s+deck|trex\s+deck.*\brochester\s+schools|2,?450\s*(?:sq\.?\s*ft|square\s+feet).*\brochester\s+schools|rochester\s+schools.*\b2,?450\s*(?:sq\.?\s*ft|square\s+feet)|4288\s+meadowview\s+dr)/i;

export function hasLegacySampleText(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  return LEGACY_SAMPLE_TEXT_RE.test(text);
}

export function sanitizeSavedDescription(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  if (hasLegacySampleText(text)) return '';
  return text.trim();
}

export function sanitizeSpecialNotes(notes?: string[] | null): string[] {
  if (!Array.isArray(notes)) return [];
  return notes
    .map((n) => (typeof n === 'string' ? n.trim() : ''))
    .filter((n) => Boolean(n) && !hasLegacySampleText(n));
}

export function isStockPhotoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('unsplash.com') ||
    lower.includes('pexels.com') ||
    lower.includes('via.placeholder.com') ||
    lower.includes('picsum.photos') ||
    lower.includes('house_exterior_front') ||
    lower.includes('house_kitchen_interior') ||
    lower.includes('house_living_room') ||
    lower.includes('house_backyard')
  );
}
