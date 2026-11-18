const LEGACY_SAMPLE_TEXT_RE = /\b(meadowview|trex\s+deck|rochester)\b/i;

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
