import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { incrementFirestoreReadCount } from '../lib/firestoreTracker';
import {
  UserProfile,
  SaasConfig,
  DEFAULT_SAAS_CONFIG,
  InAppNotification,
  PlanType,
} from '../types/saas';
import { PropertyProfile, PhotoItem } from '../types';
import { DEFAULT_PROPERTY } from '../lib/defaults';
import { getAllPhotosFromDB } from '../lib/indexedDb';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  saasConfig: SaasConfig;
  loading: boolean;
  userProperties: PropertyProfile[];
  activeProperty: PropertyProfile | null;
  activePropertyId: string | null;
  notifications: InAppNotification[];
  unreadNotifsCount: number;
  hasLocalDataToImport: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  setActivePropertyId: (id: string) => void;
  createProperty: (newProp: Partial<PropertyProfile>) => Promise<PropertyProfile>;
  updateCurrentProperty: (updated: PropertyProfile) => Promise<void>;
  deleteCurrentProperty: () => Promise<void>;
  importLocalDataToCloud: () => Promise<void>;
  dismissLocalImportPrompt: () => void;
  markNotificationRead: (id: string) => Promise<void>;
  updateSaasConfig: (newConfig: Partial<SaasConfig>) => Promise<void>;
  grantUserPlan: (uid: string, plan: PlanType, status?: string) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  deductCreditClient: (cost?: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SAAS_CONFIG_CACHE_KEY = 'fsbo_saas_config_cached';
const SAAS_CONFIG_TIMESTAMP_KEY = 'fsbo_saas_config_ts';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours cache TTL to avoid Firestore quota burn

function getInitialSaasConfig(): SaasConfig {
  try {
    const cached = localStorage.getItem(SAAS_CONFIG_CACHE_KEY);
    if (cached) {
      return { ...DEFAULT_SAAS_CONFIG, ...JSON.parse(cached) };
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_SAAS_CONFIG;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [saasConfig, setSaasConfig] = useState<SaasConfig>(getInitialSaasConfig);
  const [loading, setLoading] = useState(true);
  const [userProperties, setUserProperties] = useState<PropertyProfile[]>([]);
  const [activePropertyId, setActivePropertyIdState] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [hasLocalDataToImport, setHasLocalDataToImport] = useState(false);

  // 1. Check for legacy local data on first load
  useEffect(() => {
    try {
      const localProp = localStorage.getItem('fsbo_property');
      const localDismissed = localStorage.getItem('fsbo_import_dismissed');
      if (localProp && !localDismissed) {
        setHasLocalDataToImport(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // 2. Load Global SaaS Config from Firestore `saasConfig/global` with 24-hour cache (0 reads on normal repeat visits)
  useEffect(() => {
    async function loadConfigOnce() {
      try {
        const lastFetched = parseInt(localStorage.getItem(SAAS_CONFIG_TIMESTAMP_KEY) || '0', 10);
        const isFresh = Date.now() - lastFetched < CACHE_TTL_MS;

        if (isFresh) {
          const cached = localStorage.getItem(SAAS_CONFIG_CACHE_KEY);
          if (cached) {
            setSaasConfig({ ...DEFAULT_SAAS_CONFIG, ...JSON.parse(cached) });
            return;
          }
        }

        const configRef = doc(db, 'saasConfig', 'global');
        incrementFirestoreReadCount('saasConfig/global', 1);
        const snap = await getDoc(configRef);
        if (snap.exists()) {
          const merged = { ...DEFAULT_SAAS_CONFIG, ...snap.data() } as SaasConfig;
          setSaasConfig(merged);
          localStorage.setItem(SAAS_CONFIG_CACHE_KEY, JSON.stringify(merged));
          localStorage.setItem(SAAS_CONFIG_TIMESTAMP_KEY, Date.now().toString());
        }
      } catch (error: any) {
        console.warn('Could not read saasConfig from cloud (using cached/defaults):', error.message);
        try {
          const cached = localStorage.getItem(SAAS_CONFIG_CACHE_KEY);
          if (cached) {
            setSaasConfig({ ...DEFAULT_SAAS_CONFIG, ...JSON.parse(cached) });
          }
        } catch {}
      }
    }

    loadConfigOnce();
  }, []);

  // 3. Auth State Observer
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);

      if (fbUser) {
        const userRef = doc(db, 'users', fbUser.uid);
        try {
          incrementFirestoreReadCount(`users/${fbUser.uid}`, 1);
          const userSnap = await getDoc(userRef);

          // Bootstrap admin rule: if email matches halvmorgan@gmail.com, auto-assign admin role!
          const isAdminEmail = fbUser.email?.toLowerCase() === 'halvmorgan@gmail.com';

          if (!userSnap.exists()) {
            const trialEnd = new Date(Date.now() + 7 * 86400000).toISOString();
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Seller',
              photoURL: fbUser.photoURL || undefined,
              role: isAdminEmail ? 'admin' : 'user',
              plan: 'trial',
              planStatus: 'trialing',
              trialEndsAt: trialEnd,
              aiCreditsUsed: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);

            // Seed initial property
            const initialProp: PropertyProfile = {
              ...DEFAULT_PROPERTY,
              address: '4288 Meadowview Drive',
            };
            const propRef = doc(collection(db, 'users', fbUser.uid, 'properties'));
            await setDoc(propRef, { ...initialProp, id: propRef.id, ownerUid: fbUser.uid });
            await updateDoc(userRef, { activePropertyId: propRef.id });

            // Create Welcome Notification
            const notifRef = doc(collection(db, 'notifications'));
            await setDoc(notifRef, {
              id: notifRef.id,
              uid: fbUser.uid,
              title: 'Welcome to FSBO Command Center!',
              message: 'Your 7-day Free Trial is active. Start by customizing your property facts and uploading photos.',
              type: 'system',
              read: false,
              createdAt: new Date().toISOString(),
            });
          } else {
            const data = userSnap.data() as UserProfile;
            // Ensure admin email is always recognized as admin
            if (isAdminEmail && data.role !== 'admin') {
              await updateDoc(userRef, { role: 'admin' });
              data.role = 'admin';
            }
            setUserProfile(data);
            if (data.activePropertyId) {
              setActivePropertyIdState(data.activePropertyId);
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
        }
      } else {
        setUserProfile(null);
        setUserProperties([]);
        setActivePropertyIdState(null);
        setNotifications([]);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 4. Sync User's Properties in Real Time (Subscribes strictly ONCE per signed-in user)
  const currentUid = currentUser?.uid;
  useEffect(() => {
    if (!currentUid) return;
    const propsCol = collection(db, 'users', currentUid, 'properties');
    const unsub = onSnapshot(
      propsCol,
      (snap) => {
        incrementFirestoreReadCount(`users/${currentUid}/properties`, snap.docs.length);
        const list: PropertyProfile[] = [];
        snap.forEach((d) => {
          list.push({ ...DEFAULT_PROPERTY, ...d.data(), id: d.id } as PropertyProfile);
        });
        setUserProperties(list);

        setActivePropertyIdState((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          return list[0]?.id || null;
        });
      },
      (err) => {
        console.warn('Properties sync error:', err);
      }
    );
    return () => unsub();
  }, [currentUid]);

  // 5. Sync User's Notifications (Subscribes strictly ONCE per signed-in user)
  useEffect(() => {
    if (!currentUid) return;
    const notifsQuery = query(collection(db, 'notifications'), where('uid', '==', currentUid));
    const unsub = onSnapshot(
      notifsQuery,
      (snap) => {
        incrementFirestoreReadCount('notifications', snap.docs.length);
        const notifList: InAppNotification[] = [];
        snap.forEach((d) => {
          notifList.push({ ...(d.data() as InAppNotification), id: d.id });
        });
        notifList.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(notifList);
      },
      (err) => {
        console.warn('Notifications error:', err);
      }
    );
    return () => unsub();
  }, [currentUid]);

  // Active property object
  const activeProperty =
    userProperties.find((p) => p.id === activePropertyId) || userProperties[0] || null;

  // Active property switcher
  const setActivePropertyId = async (id: string) => {
    setActivePropertyIdState(id);
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), { activePropertyId: id }).catch(
        () => {}
      );
    }
  };

  // Auth Operations
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string, name?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      // Send verification email
      sendEmailVerification(cred.user).catch(() => {});
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
  };

  // Create new property (gated by plan limit)
  const createProperty = async (newProp: Partial<PropertyProfile>) => {
    if (!currentUser || !userProfile) throw new Error('Not logged in');

    const currentPlanConfig = saasConfig.plans[userProfile.plan] || saasConfig.plans.trial;
    if (userProperties.length >= currentPlanConfig.propertyLimit) {
      throw new Error(
        `Your ${currentPlanConfig.name} allows up to ${currentPlanConfig.propertyLimit} property. Please upgrade to Pro to add more properties.`
      );
    }

    const propCol = collection(db, 'users', currentUser.uid, 'properties');
    const newDoc = {
      ...DEFAULT_PROPERTY,
      ...newProp,
      ownerUid: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ref = await addDoc(propCol, newDoc);
    const created = { ...newDoc, id: ref.id } as PropertyProfile;

    await setActivePropertyId(ref.id);
    return created;
  };

  // Update current property
  const updateCurrentProperty = async (updated: PropertyProfile) => {
    if (!currentUser || !activePropertyId) return;
    const propRef = doc(db, 'users', currentUser.uid, 'properties', activePropertyId);
    await updateDoc(propRef, {
      ...updated,
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete current property
  const deleteCurrentProperty = async () => {
    if (!currentUser || !activePropertyId) return;
    if (userProperties.length <= 1) {
      throw new Error('You must maintain at least one property.');
    }
    const propRef = doc(db, 'users', currentUser.uid, 'properties', activePropertyId);
    await deleteDoc(propRef);
    const remaining = userProperties.filter((p) => p.id !== activePropertyId);
    if (remaining.length > 0 && remaining[0].id) {
      await setActivePropertyId(remaining[0].id);
    }
  };

  // Import local data from old version
  const importLocalDataToCloud = async () => {
    if (!currentUser) return;
    try {
      const localPropStr = localStorage.getItem('fsbo_property');
      const localProp = localPropStr ? JSON.parse(localPropStr) : DEFAULT_PROPERTY;
      const dbPhotos = await getAllPhotosFromDB();

      // Create new property in Firestore
      const propCol = collection(db, 'users', currentUser.uid, 'properties');
      const propData = {
        ...localProp,
        photos: dbPhotos,
        ownerUid: currentUser.uid,
        importedAt: new Date().toISOString(),
      };
      const ref = await addDoc(propCol, propData);
      await setActivePropertyId(ref.id);

      // Dismiss local flag
      localStorage.setItem('fsbo_import_dismissed', 'true');
      setHasLocalDataToImport(false);
    } catch (err) {
      console.error('Import local data error:', err);
      throw err;
    }
  };

  const dismissLocalImportPrompt = () => {
    localStorage.setItem('fsbo_import_dismissed', 'true');
    setHasLocalDataToImport(false);
  };

  const markNotificationRead = async (id: string) => {
    const notifRef = doc(db, 'notifications', id);
    await updateDoc(notifRef, { read: true }).catch(() => {});
  };

  const updateSaasConfig = async (newConfig: Partial<SaasConfig>) => {
    const merged = { ...saasConfig, ...newConfig };
    setSaasConfig(merged);
    try {
      localStorage.setItem(SAAS_CONFIG_CACHE_KEY, JSON.stringify(merged));
      localStorage.setItem(SAAS_CONFIG_TIMESTAMP_KEY, Date.now().toString());
    } catch {}
    const configRef = doc(db, 'saasConfig', 'global');
    await updateDoc(configRef, { ...newConfig, updatedAt: new Date().toISOString() });
  };

  const grantUserPlan = async (uid: string, plan: PlanType, status = 'active') => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      plan,
      planStatus: status,
      planExpiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteUserAccount = async () => {
    if (!currentUser) return;
    // Delete profile document
    await deleteDoc(doc(db, 'users', currentUser.uid));
    await fbSignOut(auth);
  };

  const deductCreditClient = (cost = 1) => {
    if (userProfile && currentUser) {
      const updatedCredits = userProfile.aiCreditsUsed + cost;
      setUserProfile({ ...userProfile, aiCreditsUsed: updatedCredits });
      updateDoc(doc(db, 'users', currentUser.uid), {
        aiCreditsUsed: updatedCredits,
      }).catch(() => {});
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        saasConfig,
        loading,
        userProperties,
        activeProperty,
        activePropertyId,
        notifications,
        unreadNotifsCount,
        hasLocalDataToImport,
        signInWithGoogle,
        loginWithEmail,
        signupWithEmail,
        resetPassword,
        sendVerification,
        logout,
        setActivePropertyId,
        createProperty,
        updateCurrentProperty,
        deleteCurrentProperty,
        importLocalDataToCloud,
        dismissLocalImportPrompt,
        markNotificationRead,
        updateSaasConfig,
        grantUserPlan,
        deleteUserAccount,
        deductCreditClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
