import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
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
  paperTexture: 'none',
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

export const getPublicMediaSettings = async () => {
  if (cachedPublicMediaSettings) {
    return cachedPublicMediaSettings;
  }

  const settings = await getMediaSettings();
  cachedPublicMediaSettings = settings;
  return settings;
};

export { DEFAULT_SETTINGS };
