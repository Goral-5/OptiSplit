import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

async function fixMongoIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // List all indexes
    const indexes = await usersCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check for problematic unique email index
    const emailIndex = indexes.find(idx => idx.name === 'email_1' && idx.unique);
    
    if (emailIndex) {
      console.log('\n⚠️  Found problematic unique email index. Dropping...');
      await usersCollection.dropIndex('email_1');
      console.log('✅ Dropped unique email index');
    } else {
      console.log('\n✅ No problematic unique email index found');
    }

    // Create safe sparse index if it doesn't exist
    const existingSparseIndex = indexes.find(idx => idx.name === 'email_1' && idx.sparse);
    
    if (!existingSparseIndex) {
      console.log('\n📌 Creating safe sparse email index...');
      await usersCollection.createIndex({ email: 1 }, { sparse: true, name: 'email_1' });
      console.log('✅ Created sparse email index');
    }

    // Verify final state
    const finalIndexes = await usersCollection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)} (sparse: ${idx.sparse || false})`);
    });

    console.log('\n✅ MongoDB indexes fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixMongoIndexes();
