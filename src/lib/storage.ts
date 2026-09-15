import { Movie } from '../types';

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
  return list;
};

export const isInWatchlist = (id: number) => {
  return getWatchlist().some(m => m.id === id);
};
