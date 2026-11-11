import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a photo dataUrl (base64) to Firebase Storage and returns the public download URL.
 * Falls back to the original dataUrl if storage is unavailable or disabled.
 */
export async function uploadListingPhoto(
  userId: string,
  photoId: string,
  dataUrl: string
): Promise<string> {
  // If it's already an HTTP / HTTPS URL, no need to re-upload
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  try {
    const storageRef = ref(storage, `listings/${userId}/${photoId}.jpg`);
    await uploadString(storageRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err: any) {
    console.warn('Firebase Storage upload failed or not configured, using inline photo data:', err?.message || err);
    return dataUrl;
  }
}
