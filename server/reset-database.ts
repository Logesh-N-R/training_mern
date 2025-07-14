
import { connectToDatabase } from './db';
import { storage } from './storage';

async function resetDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const db = await connectToDatabase();
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    console.log('Found collections:', collections.map(c => c.name));
    
    // Drop all collections
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`Dropped collection: ${collection.name}`);
    }
    
    console.log('All collections dropped successfully!');
    
    // Reinitialize database with indexes
    console.log('Reinitializing database...');
    await storage.initializeDatabase();
    
    console.log('Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
