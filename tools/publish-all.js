const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccount.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const snap = await db.collection('journalEntries').get();
  if (snap.empty) {
    console.log('No entries found.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  snap.docs.forEach((doc) => {
    batch.update(doc.ref, { isPublished: true });
    count += 1;
  });

  await batch.commit();
  console.log(`Published ${count} entries.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
