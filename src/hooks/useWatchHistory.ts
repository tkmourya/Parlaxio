import { useState, useEffect } from 'react';
import { Movie } from '../types';

export function useWatchHistory() {
  const [history, setHistory] = useState<Movie[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cinestream_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const addToHistory = (movie: Movie) => {
    setHistory((prev) => {
      // Find if it already exists to increment progress
      const existing = prev.find(m => m.id === movie.id);
      let newProgress = 10;
      
      if (existing && existing.progress) {
        newProgress = Math.min(existing.progress + 20, 95);
      } else {
        newProgress = Math.floor(Math.random() * 40) + 15; // Random start progress between 15-55%
      }

      // Remove if exists to move to front
      const filtered = prev.filter(m => m.id !== movie.id);
      const newHistory = [{...movie, progress: newProgress}, ...filtered].slice(0, 20); // Keep last 20
      localStorage.setItem('cinestream_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const removeFromHistory = (id: number) => {
    setHistory((prev) => {
      const newHistory = prev.filter(m => m.id !== id);
      localStorage.setItem('cinestream_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cinestream_history');
  };

  return { history, addToHistory, removeFromHistory, clearHistory };
}
