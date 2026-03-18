import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanupDuplicateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find all users with null or empty email
    const usersWithNullEmail = await usersCollection.find({
      $or: [
        { email: null },
        { email: '' },
        { email: { $exists: false } }
      ]
    }).toArray();

    console.log(`\n📊 Found ${usersWithNullEmail.length} users with null/empty email`);

    if (usersWithNullEmail.length > 0) {
      console.log('\n⚠️  These users will be deleted to prevent duplicate key errors:');
      usersWithNullEmail.forEach(user => {
        console.log(`   - ${user._id} (Clerk ID: ${user.clerkId})`);
      });

      // Delete users with null/empty email
      const result = await usersCollection.deleteMany({
        $or: [
          { email: null },
          { email: '' },
          { email: { $exists: false } }
        ]
      });

      console.log(`\n✅ Deleted ${result.deletedCount} users with null/empty email`);
    }

    // Verify no more duplicates
    const remainingUsers = await usersCollection.find({
      $or: [
        { email: null },
        { email: '' },
        { email: { $exists: false } }
      ]
    }).count();

    console.log(`\n✅ Remaining users with null email: ${remainingUsers}`);

    // Show all current users
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`\n📋 Total users in database: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

cleanupDuplicateUsers();
