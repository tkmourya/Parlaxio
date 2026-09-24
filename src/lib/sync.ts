import { databases, DATABASE_ID, WATCHLIST_COLLECTION_ID, HISTORY_COLLECTION_ID, ID, account } from './appwrite';
import { Query } from 'appwrite';
import { Movie } from '../types';

export const syncWatchlistToCloud = async (watchlist: Movie[]) => {
  if (!DATABASE_ID || !WATCHLIST_COLLECTION_ID || WATCHLIST_COLLECTION_ID === 'YOUR_WATCHLIST_COLLECTION_ID') return;
  try {
    const user = await account.get();
    if (!user) return;
    
    const existing = await databases.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
      Query.equal('userId', user.$id),
      Query.limit(100)
    ]);
    
    const cloudDocs = existing.documents;
    const cloudMovieIds = cloudDocs.map(d => d.movieId);
    const localMovieIds = watchlist.map(m => m.id.toString());
    
    // 1. Find what to DELETE (In Cloud, but not in Local)
    const toDelete = cloudDocs.filter(doc => !localMovieIds.includes(doc.movieId) && doc.movieId !== 'COMPRESSED');
    
    // 2. Find what to ADD (In Local, but not in Cloud)
    const toAdd = watchlist.filter(m => !cloudMovieIds.includes(m.id.toString()));
    
    // Execute Deletes
    for (const doc of toDelete) {
      await databases.deleteDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, doc.$id);
    }
    
    // Execute Adds
    for (const movie of toAdd) {
      await databases.createDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, ID.unique(), {
        userId: user.$id,
        movieId: movie.id.toString(),
        movieData: JSON.stringify(movie)
      });
    }
    
    // Cleanup any old 'COMPRESSED' rows if they exist from our test earlier
    const oldCompressed = cloudDocs.filter(d => d.movieId === 'COMPRESSED');
    for (const doc of oldCompressed) {
       await databases.deleteDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, doc.$id);
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
    
    // Filter out any leftover COMPRESSED documents and return normal ones
    return response.documents
      .filter(d => d.movieId !== 'COMPRESSED')
      .map(doc => JSON.parse(doc.movieData));
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
    
    const cloudDocs = existing.documents;
    const cloudMovieIds = cloudDocs.map(d => d.movieId);
    const localMovieIds = history.map(m => m.id.toString());
    
    // 1. Find what to DELETE (In Cloud, but not in Local)
    const toDelete = cloudDocs.filter(doc => !localMovieIds.includes(doc.movieId) && doc.movieId !== 'COMPRESSED');
    
    // 2. Find what to ADD (In Local, but not in Cloud)
    const toAdd = history.filter(m => !cloudMovieIds.includes(m.id.toString()));
    
    for (const doc of toDelete) {
      await databases.deleteDocument(DATABASE_ID, HISTORY_COLLECTION_ID, doc.$id);
    }
    
    for (const movie of toAdd) {
      await databases.createDocument(DATABASE_ID, HISTORY_COLLECTION_ID, ID.unique(), {
        userId: user.$id,
        movieId: movie.id.toString(),
        progress: movie.progress || 0,
        movieData: JSON.stringify(movie)
      });
    }
    
    // Cleanup old tests
    const oldCompressed = cloudDocs.filter(d => d.movieId === 'COMPRESSED');
    for (const doc of oldCompressed) {
       await databases.deleteDocument(DATABASE_ID, HISTORY_COLLECTION_ID, doc.$id);
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
    
    return response.documents
      .filter(d => d.movieId !== 'COMPRESSED')
      .map(doc => {
        const m = JSON.parse(doc.movieData);
        m.progress = doc.progress;
        return m;
      });
  } catch (error) {
    console.error('Cloud Fetch Error (History):', error);
    return null;
  }
};
