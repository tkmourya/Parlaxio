import { databases, DATABASE_ID, WATCHLIST_COLLECTION_ID, HISTORY_COLLECTION_ID, ID, account } from './appwrite';
import { Query } from 'appwrite';
import { Movie } from '../types';

export const syncWatchlistToCloud = async (watchlist: Movie[]) => {
  if (!DATABASE_ID || !WATCHLIST_COLLECTION_ID || WATCHLIST_COLLECTION_ID === 'YOUR_WATCHLIST_COLLECTION_ID') return;
  try {
    const user = await account.get();
    if (!user) return;
    
    // Instead of deleting and recreating all documents (which can cause rate limits),
    // A production app would diff them. For this scale, it's a basic sync.
    // Wait, let's optimize: save the entire array as a JSON string in ONE document per user.
    // A string attribute can hold up to 1MB (using mediumtext in some DBs), but Appwrite strings are 65535 chars.
    // 65k chars is enough for about 100 movies in JSON.
    // Let's stick to the safer one-doc-per-movie approach.
    
    const existing = await databases.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
      Query.equal('userId', user.$id),
      Query.limit(100)
    ]);
    
    // Delete all existing
    for (const doc of existing.documents) {
      await databases.deleteDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, doc.$id);
    }
    
    // Create new
    for (const movie of watchlist) {
      await databases.createDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, ID.unique(), {
        userId: user.$id,
        movieId: movie.id.toString(),
        movieData: JSON.stringify(movie)
      });
    }
  } catch (error) {
    console.error('Cloud Sync Error (Watchlist):', error);
  }
};

export const fetchWatchlistFromCloud = async (): Promise<Movie[] | null> => {
  if (!DATABASE_ID || !WATCHLIST_COLLECTION_ID || WATCHLIST_COLLECTION_ID === 'YOUR_WATCHLIST_COLLECTION_ID') return null;
  try {
    const user = await account.get();
    if (!user) return null;
    const response = await databases.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
      Query.equal('userId', user.$id),
      Query.limit(100)
    ]);
    
    return response.documents.map(doc => JSON.parse(doc.movieData));
  } catch (error) {
    console.error('Cloud Fetch Error (Watchlist):', error);
    return null;
  }
};

export const syncHistoryToCloud = async (history: Movie[]) => {
  if (!DATABASE_ID || !HISTORY_COLLECTION_ID || HISTORY_COLLECTION_ID === 'YOUR_HISTORY_COLLECTION_ID') return;
  try {
    const user = await account.get();
    if (!user) return;
    
    const existing = await databases.listDocuments(DATABASE_ID, HISTORY_COLLECTION_ID, [
      Query.equal('userId', user.$id),
      Query.limit(100)
    ]);
    
    for (const doc of existing.documents) {
      await databases.deleteDocument(DATABASE_ID, HISTORY_COLLECTION_ID, doc.$id);
    }
    
    for (const movie of history) {
      await databases.createDocument(DATABASE_ID, HISTORY_COLLECTION_ID, ID.unique(), {
        userId: user.$id,
        movieId: movie.id.toString(),
        progress: movie.progress || 0,
        movieData: JSON.stringify(movie)
      });
    }
  } catch (error) {
    console.error('Cloud Sync Error (History):', error);
  }
};

export const fetchHistoryFromCloud = async (): Promise<Movie[] | null> => {
  if (!DATABASE_ID || !HISTORY_COLLECTION_ID || HISTORY_COLLECTION_ID === 'YOUR_HISTORY_COLLECTION_ID') return null;
  try {
    const user = await account.get();
    if (!user) return null;
    const response = await databases.listDocuments(DATABASE_ID, HISTORY_COLLECTION_ID, [
      Query.equal('userId', user.$id),
      Query.limit(100)
    ]);
    
    return response.documents.map(doc => {
      const m = JSON.parse(doc.movieData);
      m.progress = doc.progress;
      return m;
    });
  } catch (error) {
    console.error('Cloud Fetch Error (History):', error);
    return null;
  }
};
