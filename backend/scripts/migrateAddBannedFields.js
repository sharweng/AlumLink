// Script to update all users in MongoDB to add banned and bannedReason fields if missing
// Usage: node scripts/migrateAddBannedFields.js

import mongoose from 'mongoose'
import User from '../models/User'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alumlink';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({});
  let updatedCount = 0;

  for (const user of users) {
    let changed = false;
    if (typeof user.banned === 'undefined') {
      user.banned = false;
      changed = true;
    }
    if (typeof user.bannedReason === 'undefined') {
      user.bannedReason = '';
      changed = true;
    }
    if (changed) {
      await user.save();
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} users.`);
  mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
});
