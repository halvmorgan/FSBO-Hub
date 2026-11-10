// Tracks and logs Firestore read counts per page load / session for full transparency and quota protection

let readCount = 0;

export function incrementFirestoreReadCount(source: string, docCount = 1): number {
  readCount += docCount;
  console.log(`[Firestore Read Count]: ${readCount} (+${docCount} read from "${source}")`);
  if (typeof window !== 'undefined') {
    (window as any).__firestoreReadCount = readCount;
  }
  return readCount;
}

export function getFirestoreReadCount(): number {
  return readCount;
}

export function resetFirestoreReadCount(): void {
  readCount = 0;
  console.log('[Firestore Read Count]: reset to 0');
  if (typeof window !== 'undefined') {
    (window as any).__firestoreReadCount = 0;
  }
}
