const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const cloudinary = require('cloudinary').v2;

initializeApp();

const cloudinaryApiSecret = defineSecret('CLOUDINARY_API_SECRET');
const cloudinaryCloudName = defineString('CLOUDINARY_CLOUD_NAME');
const cloudinaryApiKey = defineString('CLOUDINARY_API_KEY');
const ADMIN_UID = 'P8XDi8J7v1ffk8Cd882QFsPw5fh2';

const getCloudinaryPublicId = (url) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('cloudinary.com')) return null;
    const parts = parsed.pathname.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex < 0) return null;

    let assetParts = parts.slice(uploadIndex + 1);
    if (assetParts[0]?.startsWith('v') && /^v\d+$/.test(assetParts[0])) {
      assetParts = assetParts.slice(1);
    }
    if (!assetParts.length) return null;
    assetParts[assetParts.length - 1] = assetParts[assetParts.length - 1].replace(/\.[^.]+$/, '');
    return assetParts.join('/') || null;
  } catch {
    return null;
  }
};

exports.deleteJournalEntry = onCall({ secrets: [cloudinaryApiSecret] }, async (request) => {
  if (!request.auth || request.auth.uid !== ADMIN_UID) {
    throw new HttpsError('permission-denied', 'Only the journal administrator can delete entries.');
  }

  const entryId = request.data?.id;
  if (typeof entryId !== 'string' || !entryId.trim()) {
    throw new HttpsError('invalid-argument', 'A journal entry ID is required.');
  }

  const entryRef = getFirestore().collection('journalEntries').doc(entryId);
  const snapshot = await entryRef.get();
  if (!snapshot.exists) return { deleted: true };
  if (snapshot.get('ownerId') !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'You cannot delete this entry.');
  }

  const urls = new Set(snapshot.get('imageUrls') || []);
  const body = String(snapshot.get('content') || '');
  for (const match of body.matchAll(/https?:\/\/[^\s)\]"']+/g)) {
    if (match[0].includes('cloudinary.com')) urls.add(match[0].replace(/[.,;]+$/, ''));
  }

  const publicIds = [...new Set([...urls].map(getCloudinaryPublicId).filter(Boolean))];
  if (publicIds.length) {
    cloudinary.config({
      cloud_name: cloudinaryCloudName.value(),
      api_key: cloudinaryApiKey.value(),
      api_secret: cloudinaryApiSecret.value()
    });

    try {
      await Promise.all(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
    } catch (error) {
      console.error('Cloudinary deletion failed; Firestore entry was retained.', error);
      throw new HttpsError('internal', 'Could not remove the entry images. The post was not deleted.');
    }
  }

  await entryRef.delete();
  return { deleted: true, imagesDeleted: publicIds.length };
});

exports.getPublicJournalEntryHttp = onRequest(
  { cors: ['https://quietwhispered.vercel.app'] },
  async (request, response) => {
    if (request.method !== 'GET') {
      response.set('Allow', 'GET').status(405).json({ error: 'method-not-allowed' });
      return;
    }

    const entryId = request.query.id;
    if (typeof entryId !== 'string' || !entryId.trim()) {
      response.status(400).json({ error: 'A journal entry ID is required.' });
      return;
    }

    try {
      const snapshot = await getFirestore().collection('journalEntries').doc(entryId).get();
      if (!snapshot.exists) {
        response.status(404).json({ entry: null });
        return;
      }

      const data = snapshot.data();
      if (data?.isPublished !== true && data?.privacy !== 'link') {
        response.status(404).json({ entry: null });
        return;
      }

      response.json({
        entry: {
          ...data,
          _id: snapshot.id,
          id: snapshot.id,
          createdAt: data.createdAt?.toDate?.() || null,
          updatedAt: data.updatedAt?.toDate?.() || null,
          date: data.date?.toDate?.() || data.date || null
        }
      });
    } catch (error) {
      console.error('Public journal entry lookup failed.', error);
      response.status(500).json({ error: 'Could not load the shared post.' });
    }
  }
);
