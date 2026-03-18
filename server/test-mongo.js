import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

console.log('🧪 Testing MongoDB Connection...\n');
console.log('URI:', MONGO_URI?.substring(0, 20) + '...');
console.log('');

async function testConnection() {
  try {
    console.log('⏳ Attempting to connect...');
    const conn = await mongoose.connect(MONGO_URI);
    
    console.log('✅ SUCCESS! Connected to MongoDB Atlas');
    console.log('📍 Host:', conn.connection.host);
    console.log('🗄️  Database:', conn.connection.name);
    console.log('');
    
    // Test basic operation
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📦 Collections found:', collections.length);
    
    await mongoose.connection.close();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ FAILED to connect to MongoDB Atlas');
    console.error('');
    console.error('Error details:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('');
    console.error('Common solutions:');
    console.error('1. Check Network Access in MongoDB Atlas (add 0.0.0.0/0)');
    console.error('2. Verify username and password are correct');
    console.error('3. Ensure cluster is active (not creating)');
    console.error('4. Check your internet connection');
    process.exit(1);
  }
}

testConnection();
