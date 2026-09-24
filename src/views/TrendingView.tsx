import { useState, useEffect, useCallback } from 'react';
import { getTrending } from '../lib/tmdb';
import { Movie } from '../types';
import { Loader2, Flame } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { GridSkeleton } from '../components/GridSkeleton';
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
    <div className="px-4 md:px-12 pt-[calc(env(safe-area-inset-top,0px)+6rem)] md:pt-[calc(env(safe-area-inset-top,0px)+9rem)] pb-32 min-h-screen animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-white via-zinc-200 to-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]"></div>
          <div className="p-3 bg-white/10 rounded-full border border-white/20">
            <Flame className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Trending Now</h1>
        </div>

        {loading && page === 1 ? (
          <div className="mt-8">
            <GridSkeleton count={18} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-8">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onPlay={onPlay} />
            ))}
          </div>
        )}

        {loading && page > 1 && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-white/50" size={32} />
          </div>
        )}
        
        <div ref={lastElementRef} className="h-10 w-full" />
      </div>
    </div>
  );
}
