import { useState, useEffect, useCallback } from 'react';
import { getTrending } from '../lib/tmdb';
import { Movie } from '../types';
import { Loader2, Flame } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export function TrendingView({ onPlay }: { onPlay: (id: number, type: 'movie' | 'tv') => void }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadTrending = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await getTrending(pageNum);
      setMovies(prev => {
        if (pageNum === 1) return res.results;
        const newMovies = [...prev];
        res.results.forEach(m => {
          if (!newMovies.find(existing => existing.id === m.id)) {
            newMovies.push(m);
          }
        });
        return newMovies;
      });
      setHasMore(res.page < res.total_pages && res.page < 500);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrending(1);
  }, [loadTrending]);

  useEffect(() => {
    if (page > 1) {
      loadTrending(page);
    }
  }, [page, loadTrending]);

  const lastElementRef = useInfiniteScroll(() => {
    setPage(prev => prev + 1);
  }, loading, hasMore);

  return (
    <div className="px-4 md:px-12 pt-24 md:pt-36 pb-32 min-h-screen animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-orange-500/20 rounded-full border border-orange-500/30">
            <Flame className="text-orange-500" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Trending Now</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onPlay={onPlay} />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-white/50" size={32} />
          </div>
        )}
        
        <div ref={lastElementRef} className="h-10 w-full" />
      </div>
    </div>
  );
}
