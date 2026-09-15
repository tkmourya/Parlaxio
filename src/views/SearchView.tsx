import { useState, useEffect, useCallback } from 'react';
import { searchMovies } from '../lib/tmdb';
import { Movie } from '../types';
import { Search, Loader2 } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export function SearchView({ onPlay }: { onPlay: (id: number, type: 'movie' | 'tv') => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const executeSearch = useCallback(async (searchQuery: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await searchMovies(searchQuery, pageNum);
      setResults(prev => {
        if (pageNum === 1) return res.results;
        const newRes = [...prev];
        res.results.forEach(m => {
          if (!newRes.find(existing => existing.id === m.id)) {
            newRes.push(m);
          }
        });
        return newRes;
      });
      setHasMore(res.page < res.total_pages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setPage(1);
    setHasMore(true);
    
    const delayDebounce = setTimeout(() => {
      executeSearch(query, 1);
    }, 500);
    
    return () => clearTimeout(delayDebounce);
  }, [query, executeSearch]);

  useEffect(() => {
    if (page > 1 && query.trim().length >= 2) {
      executeSearch(query, page);
    }
  }, [page, query, executeSearch]);

  const lastElementRef = useInfiniteScroll(() => {
    setPage(prev => prev + 1);
  }, loading, hasMore);

  return (
    <div className="px-4 md:px-12 pt-8 md:pt-36 pb-32 min-h-screen animate-in fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="relative mb-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-white/50" size={24} />
          </div>
          <input
            type="text"
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full py-4 pl-12 pr-4 focus:outline-none focus:border-white/50 focus:bg-white/20 shadow-lg text-lg transition-all placeholder:text-white/50"
            placeholder="Search for movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onPlay={onPlay} defaultType="movie" />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-white/70" size={32} />
          </div>
        )}
        
        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="text-center text-zinc-500 py-20">
            No movies found for "{query}"
          </div>
        )}

        <div ref={lastElementRef} className="h-10 w-full" />
      </div>
    </div>
  );
}
