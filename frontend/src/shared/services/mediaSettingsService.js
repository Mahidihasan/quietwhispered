import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const SETTINGS_DOC_ID = 'global-media-settings';
let cachedPublicMediaSettings = null;

const ensureFirebase = () => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Check environment configuration.');
  }
};

const getSettingsRef = () => {
  ensureFirebase();
  return doc(db, 'appSettings', SETTINGS_DOC_ID);
};

const DEFAULT_SETTINGS = {
  paperTexture: 'lines',
  /* Default texture: ruled paper lines */
  paperColor: '#FAF8F5',
  /* Off-white - default entry background color (does not affect UI) */
  dividerColor: '#D0D0D0',
  mediaFrame: 'polaroid',
  frameSize: 'md',
  quoteFont: 'Caveat',
  quoteFontSize: 22,
  bodyFont: 'Newsreader',
  entryFont: 'Caveat',
  enabled: true,
  updatedAt: null
};

export const saveMediaSettings = async (settings) => {
  ensureFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to save settings.');

  const ref = getSettingsRef();
  const payload = {
    ...DEFAULT_SETTINGS,
    ...settings,
    updatedBy: user.uid,
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, payload, { merge: true });
  cachedPublicMediaSettings = {
    ...DEFAULT_SETTINGS,
    ...payload,
    updatedAt: payload.updatedAt
  };
  return payload;
};

export const getMediaSettings = async () => {
  ensureFirebase();
  const ref = getSettingsRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_SETTINGS;
  
  const data = snap.data();
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    updatedAt: data.updatedAt?.toDate?.() || null
  };
};

export const getPublicMediaSettings = async (forceRefresh = false) => {
  if (cachedPublicMediaSettings && !forceRefresh) {
    return cachedPublicMediaSettings;
  }

  const settings = await getMediaSettings();
  cachedPublicMediaSettings = settings;
  return settings;
};

export const subscribeToMediaSettings = (callback) => {
  ensureFirebase();
  const ref = getSettingsRef();
  const unsubscribe = onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const settings = {
        ...DEFAULT_SETTINGS,
        ...data,
        updatedAt: data.updatedAt?.toDate?.() || null
      };
      cachedPublicMediaSettings = settings;
      callback(settings);
    } else {
      callback(DEFAULT_SETTINGS);
    }
  }, (error) => {
    console.error('Error subscribing to media settings:', error);
    // Fall back to cached or default
    callback(cachedPublicMediaSettings || DEFAULT_SETTINGS);
  });
  return unsubscribe;
};

export { DEFAULT_SETTINGS };
