import mongoose from 'mongoose';
import connectDB from './mongodb';

export async function initializeDatabase() {
  await connectDB();

  // Drop old indexes that might conflict
  const db = mongoose.connection.db;
  if (!db) return;

  try {
    // Check if holidays collection exists and drop problematic index
    const collections = await db.listCollections({ name: 'holidays' }).toArray();
    if (collections.length > 0) {
      const holidaysCollection = db.collection('holidays');
      const indexes = await holidaysCollection.indexes();

      // Find and drop the old unique index on just 'date'
      for (const index of indexes) {
        if (index.key && index.key.date && !index.key.userId && index.unique) {
          console.log('Dropping old date_1 unique index...');
          await holidaysCollection.dropIndex(index.name!);
          console.log('Old index dropped successfully');
        }
      }
    }
  } catch (error) {
    // Index might not exist, that's okay
    console.log('Index cleanup completed (or not needed)');
  }
}
