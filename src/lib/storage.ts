import { Movie } from '../types';
import { syncWatchlistToCloud, fetchWatchlistFromCloud } from './sync';

export const getWatchlist = (): Movie[] => {
  try {
    return JSON.parse(localStorage.getItem('watchlist') || '[]');
  } catch {
    return [];
  }
};

export const toggleWatchlist = (movie: Movie) => {
  let list = getWatchlist();
  if (list.find(m => m.id === movie.id)) {
    list = list.filter(m => m.id !== movie.id);
  } else {
    list.push(movie);
  }
  localStorage.setItem('watchlist', JSON.stringify(list));
  window.dispatchEvent(new Event('watchlist-updated'));
  
  // Background cloud sync
  syncWatchlistToCloud(list);
  
  return list;
};

export const isInWatchlist = (id: number) => {
  return getWatchlist().some(m => m.id === id);
};

export const restoreWatchlistFromCloud = async () => {
  const cloudData = await fetchWatchlistFromCloud();
  if (cloudData && cloudData.length > 0) {
    // Merge cloud and local data
    const localData = getWatchlist();
    const merged = [...localData];
    
    for (const cloudMovie of cloudData) {
      if (!merged.find(m => m.id === cloudMovie.id)) {
        merged.push(cloudMovie);
      }
    }
    
    localStorage.setItem('watchlist', JSON.stringify(merged));
    window.dispatchEvent(new Event('watchlist-updated'));
    // Sync merged data back up
    syncWatchlistToCloud(merged);
  }
};
