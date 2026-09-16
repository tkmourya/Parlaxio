import { useState, useEffect } from 'react';
import { Movie } from '../types';
import { syncHistoryToCloud, fetchHistoryFromCloud } from '../lib/sync';
import { useAuth } from '../lib/AuthContext';

export function useWatchHistory() {
  const [history, setHistory] = useState<Movie[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // 1. Load Local
    const saved = localStorage.getItem('cinestream_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // 2. Fetch from Cloud if User logs in
  useEffect(() => {
    if (user) {
      fetchHistoryFromCloud().then((cloudData) => {
        if (cloudData && cloudData.length > 0) {
          setHistory((prev) => {
            const merged = [...prev];
            cloudData.forEach(cloudMovie => {
              const existingIdx = merged.findIndex(m => m.id === cloudMovie.id);
              if (existingIdx === -1) {
                merged.push(cloudMovie);
              } else if (cloudMovie.progress && cloudMovie.progress > (merged[existingIdx].progress || 0)) {
                // If cloud progress is greater, use it
                merged[existingIdx].progress = cloudMovie.progress;
              }
            });
            localStorage.setItem('cinestream_history', JSON.stringify(merged));
            return merged;
          });
        }
      });
    }
  }, [user]);

  // Exact progress is now passed directly from PlayerView (calculated by time)
  const addToHistory = (movie: Movie, progressPercentage: number = 0) => {
    setHistory((prev) => {
      // Find if it already exists
      const existing = prev.find(m => m.id === movie.id);
      
      // We either use the passed exact progress, or if it wasn't passed, keep existing progress + a small bump
      let newProgress = progressPercentage;
      
      if (progressPercentage === 0) {
        if (existing && existing.progress) {
           newProgress = Math.min(existing.progress + 5, 95);
        } else {
           newProgress = 5; // Minimal progress just for opening it
        }
      }

      // Remove if exists to move to front
      const filtered = prev.filter(m => m.id !== movie.id);
      const newHistory = [{...movie, progress: newProgress}, ...filtered].slice(0, 50); // Keep last 50
      
      localStorage.setItem('cinestream_history', JSON.stringify(newHistory));
      
      // Async sync to cloud
      if (user) {
        syncHistoryToCloud(newHistory);
      }
      
      return newHistory;
    });
  };

  const removeFromHistory = (id: number) => {
    setHistory((prev) => {
      const newHistory = prev.filter(m => m.id !== id);
      localStorage.setItem('cinestream_history', JSON.stringify(newHistory));
      if (user) syncHistoryToCloud(newHistory);
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cinestream_history');
    if (user) syncHistoryToCloud([]);
  };

  return { history, addToHistory, removeFromHistory, clearHistory };
}
