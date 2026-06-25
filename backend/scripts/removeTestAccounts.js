/**
 * One-off cleanup script: deletes the leftover security-assessment test
 * accounts that the pentest team left behind in the database (see the
 * security report's appendix). Run this once against your real
 * production MONGO_URI, then delete the script or leave it — it's
 * idempotent (safe to run again; it just won't find anything to delete).
 *
 * Usage (from backend/):
 *   node scripts/removeTestAccounts.js
 *
 * It reads MONGO_URI from your .env exactly like the main server does,
 * so make sure backend/.env points at the production database before
 * running this if that's the one you want to clean up.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const TEST_EMAILS = [
  'teachera@test.com',
  'teacherb@test.com',
  'teacherc@test.com',
  'csrftest@test.com',
  'xsstest@xss.com',
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Aborting — set it in backend/.env first.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to ${mongoose.connection.name}`);

  const result = await User.deleteMany({ email: { $in: TEST_EMAILS } });
  console.log(`Deleted ${result.deletedCount} test account(s).`);

  if (result.deletedCount === 0) {
    console.log('No matching test accounts were found (already clean, or different DB).');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
