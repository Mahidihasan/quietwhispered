import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { uploadImageToCloudinary } from './cloudinaryUpload';

const ensureFirebase = () => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Check environment configuration.');
  }
};

const getEntriesCollection = () => {
  ensureFirebase();
  return collection(db, 'journalEntries');
};

const ensureUser = () => {
  ensureFirebase();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to access journal data.');
  }
  return user;
};

const normalizeEntry = (snap) => {
  const data = snap.data();
  const createdAt = data.createdAt?.toDate?.() || null;
  return {
    _id: snap.id,
    id: snap.id,
    ...data,
    createdAt,
    date: data.date || createdAt || null
  };
};

export const uploadImage = async (file, options = {}) => {
  const folder = options.folder || 'journal-images';
  const onProgress = options.onProgress;
  return uploadImageToCloudinary(file, { folder, onProgress });
};

export const createEntry = async (entry) => {
  const user = ensureUser();
  const entriesCollection = getEntriesCollection();
  const payload = {
    ...entry,
    title: entry.title || '',
    content: entry.content || '',
    imageUrls: entry.imageUrls || [],
    youtubeEmbedUrl: entry.youtubeEmbedUrl || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ownerId: user.uid
  };
  return addDoc(entriesCollection, payload);
};

export const updateEntry = async (id, updates) => {
  ensureUser();
  ensureFirebase();
  const refDoc = doc(db, 'journalEntries', id);
  return updateDoc(refDoc, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteEntry = async (id) => {
  ensureUser();
  ensureFirebase();
  const refDoc = doc(db, 'journalEntries', id);
  return deleteDoc(refDoc);
};

export const getEntryById = async (id) => {
  ensureUser();
  ensureFirebase();
  const refDoc = doc(db, 'journalEntries', id);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  return normalizeEntry(snap);
};

export const getPublicEntryById = async (id) => {
  ensureFirebase();
  const refDoc = doc(db, 'journalEntries', id);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data?.isPublished) return null;
  return normalizeEntry(snap);
};

export const getEntriesPage = async ({ pageSize = 5, lastDoc = null } = {}) => {
  const user = ensureUser();
  const entriesCollection = getEntriesCollection();
  const baseQuery = [
    where('ownerId', '==', user.uid),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  ];
  const q = lastDoc ? query(entriesCollection, ...baseQuery, startAfter(lastDoc)) : query(entriesCollection, ...baseQuery);
  const snap = await getDocs(q);
  const entries = snap.docs.map(normalizeEntry);
  const nextLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { entries, lastDoc: nextLast };
};

export const getAllEntries = async () => {
  const user = ensureUser();
  const entriesCollection = getEntriesCollection();
  const q = query(entriesCollection, where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalizeEntry);
};

export const getPublicEntriesPage = async ({ pageSize = 5, lastDoc = null } = {}) => {
  ensureFirebase();
  const entriesCollection = getEntriesCollection();
  const baseQuery = [where('isPublished', '==', true), orderBy('createdAt', 'desc'), limit(pageSize)];
  const q = lastDoc ? query(entriesCollection, ...baseQuery, startAfter(lastDoc)) : query(entriesCollection, ...baseQuery);
  const snap = await getDocs(q);
  const entries = snap.docs.map(normalizeEntry);
  const nextLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { entries, lastDoc: nextLast };
};
