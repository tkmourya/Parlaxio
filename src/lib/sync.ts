import { databases, DATABASE_ID, WATCHLIST_COLLECTION_ID, HISTORY_COLLECTION_ID, PLAYLISTS_COLLECTION_ID, ID, account, Permission, Role } from './appwrite';
import { Query } from 'appwrite';
import { Movie, CustomPlaylist } from '../types';

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

// =======================
// CUSTOM PLAYLISTS SYNC
// =======================

export const fetchUserCustomPlaylists = async (userId: string) => {
  if (!DATABASE_ID || !PLAYLISTS_COLLECTION_ID) return [];
  try {
    const response = await databases.listDocuments(DATABASE_ID, PLAYLISTS_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.orderDesc('$createdAt')
    ]);
    return response.documents.map(doc => ({
      ...doc,
      items: doc.items ? JSON.parse(doc.items) : []
    })) as unknown as CustomPlaylist[];
  } catch (e) {
    console.error('Fetch User Playlists Error:', e);
    return [];
  }
};

export const fetchPublicPlaylists = async () => {
  if (!DATABASE_ID || !PLAYLISTS_COLLECTION_ID) return [];
  try {
    const response = await databases.listDocuments(DATABASE_ID, PLAYLISTS_COLLECTION_ID, [
      Query.equal('isPublic', true),
      Query.orderDesc('$createdAt'),
      Query.limit(25)
    ]);
    return response.documents.map(doc => ({
      ...doc,
      items: doc.items ? JSON.parse(doc.items) : []
    })) as unknown as CustomPlaylist[];
  } catch (e) {
    console.error('Fetch Public Playlists Error:', e);
    return [];
  }
};

export const createCustomPlaylist = async (userId: string, creatorName: string, name: string, isPublic: boolean, items: any[] = []) => {
  if (!DATABASE_ID || !PLAYLISTS_COLLECTION_ID) throw new Error('Database not configured');
  try {
    const coverUrl = items.length > 0 && items[0].image ? items[0].image : '';
    const response = await databases.createDocument(
      DATABASE_ID, 
      PLAYLISTS_COLLECTION_ID, 
      ID.unique(), 
      {
        userId,
        creatorName,
        name,
        isPublic,
        coverUrl,
        items: JSON.stringify(items),
        savedCount: 0
      },
      [
        Permission.read(Role.any()), // Anyone can read
        Permission.update(Role.user(userId)), // Only creator can update
        Permission.delete(Role.user(userId)) // Only creator can delete
      ]
    );
    return {
      ...response,
      items: response.items ? JSON.parse(response.items) : []
    } as unknown as CustomPlaylist;
  } catch (e) {
    console.error('Create Playlist Error:', e);
    throw e;
  }
};

export const updateCustomPlaylistItems = async (playlistId: string, items: any[]) => {
  if (!DATABASE_ID || !PLAYLISTS_COLLECTION_ID) throw new Error('Database not configured');
  try {
    const coverUrl = items.length > 0 && items[0].image ? items[0].image : '';
    const response = await databases.updateDocument(DATABASE_ID, PLAYLISTS_COLLECTION_ID, playlistId, {
      items: JSON.stringify(items),
      coverUrl
    });
    return {
      ...response,
      items: response.items ? JSON.parse(response.items) : []
    } as unknown as CustomPlaylist;
  } catch (e) {
    console.error('Update Playlist Error:', e);
    throw e;
  }
};

export const deleteCustomPlaylist = async (playlistId: string) => {
  if (!DATABASE_ID || !PLAYLISTS_COLLECTION_ID) throw new Error('Database not configured');
  try {
    await databases.deleteDocument(DATABASE_ID, PLAYLISTS_COLLECTION_ID, playlistId);
    return true;
  } catch (e) {
    console.error('Delete Playlist Error:', e);
    throw e;
  }
};

export const getCustomPlaylistById = async (playlistId: string) => {
  if (!DATABASE_ID || !PLAYLISTS_COLLECTION_ID) return null;
  try {
    const doc = await databases.getDocument(DATABASE_ID, PLAYLISTS_COLLECTION_ID, playlistId);
    return {
      ...doc,
      items: doc.items ? JSON.parse(doc.items) : []
    } as unknown as CustomPlaylist;
  } catch (e) {
    console.error('Get Custom Playlist Error:', e);
    return null;
  }
};
