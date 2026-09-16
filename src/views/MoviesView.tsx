import { useState, useEffect, useCallback } from 'react';
import { getMoviesByFilter } from '../lib/tmdb';
import { Movie } from '../types';
import { Loader2, Film } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { SubNav } from '../components/SubNav';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const FILTERS = [
  { id: 'all', label: 'All Movies' },
  { id: '28', label: 'Action' },
  { id: '35', label: 'Comedy' },
  { id: '18', label: 'Drama' },
  { id: '878', label: 'Sci-Fi' },
  { id: '53', label: 'Thriller' },
  { id: '27', label: 'Horror' },
  { id: '10749', label: 'Romance' },
  { id: '16', label: 'Animation' },
  { id: 'bollywood', label: 'Bollywood' },
  { id: 'hollywood', label: 'Hollywood' }
];

export function MoviesView({ onPlay }: { onPlay: (id: number, type: 'movie' | 'tv') => void }) {
  const [filter, setFilter] = useState('all');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadMovies = useCallback(async (pageNum: number, currentFilter: string) => {
    setLoading(true);
    try {
      const res = await getMoviesByFilter(currentFilter, pageNum);
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
      setHasMore(res.page < res.total_pages && res.page < 500); // TMDB caps at 500 pages
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    loadMovies(1, filter);
  }, [filter, loadMovies]);

  useEffect(() => {
    if (page > 1) {
      loadMovies(page, filter);
    }
  }, [page, filter, loadMovies]);

  const lastElementRef = useInfiniteScroll(() => {
    setPage(prev => prev + 1);
  }, loading, hasMore);

  return (
    <div className="px-4 md:px-12 pt-24 md:pt-36 pb-32 min-h-screen animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-white via-zinc-200 to-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]"></div>
          <div className="p-3 bg-white/10 rounded-full border border-white/20">
            <Film className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Movies</h1>
        </div>

        <SubNav filters={FILTERS} current={filter} onChange={setFilter} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onPlay={onPlay} defaultType="movie" />
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
