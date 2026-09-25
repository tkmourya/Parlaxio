import { useState, useEffect, useCallback } from 'react';
import { getMediaByProvider } from '../lib/tmdb';
import { Movie } from '../types';
import { Loader2 } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { SubNav } from '../components/SubNav';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const getProviderFilters = (providerId: string) => {
  if (providerId === '283') {
    // Crunchyroll
    return [
      { id: 'all', label: 'All Content' },
      { id: 'movie', label: 'Anime Movies' },
      { id: 'tv', label: 'Anime Series' }
    ];
  }
  
  if (providerId === '220') {
    // JioCinema
    return [
      { id: 'all', label: 'All Content' },
      { id: 'movie', label: 'Movies' },
      { id: 'tv-shows', label: 'Daily TV Shows' }
    ];
  }

  if (providerId === '122') {
    // JioHotstar — TMDB has 0 anime results for this provider
    return [
      { id: 'all', label: 'All Content' },
      { id: 'web-series', label: 'Web Series' },
      { id: 'tv-shows', label: 'Daily TV Shows' }
    ];
  }

  // Default for Netflix, Prime
  return [
    { id: 'all', label: 'All Content' },
    { id: 'movie', label: 'Movies' },
    { id: 'web-series', label: 'Web Series' },
    { id: 'tv-shows', label: 'Daily TV Shows' },
    { id: 'anime', label: 'Anime' }
  ];
};

interface ProviderViewProps {
  providerId: string;
  providerName: string;
  onPlay: (id: number, type: 'movie' | 'tv') => void;
}

export function ProviderView({ providerId, providerName, onPlay }: ProviderViewProps) {
  const filters = getProviderFilters(providerId);
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (pageNum: number, currentFilter: string) => {
    setLoading(true);
    try {
      const res = await getMediaByProvider(providerId, currentFilter, pageNum);
      setResults(prev => {
        if (pageNum === 1) return res.results;
        const newResults = [...prev];
        res.results.forEach(m => {
          if (!newResults.find(existing => existing.id === m.id)) {
            newResults.push(m);
          }
        });
        return newResults;
      });
      setHasMore(res.page < res.total_pages && res.page < 500);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(true);
    loadData(1, filter);
  }, [providerId, filter, loadData]);

  useEffect(() => {
    if (page > 1) {
      loadData(page, filter);
    }
  }, [page, filter, loadData]);

  const lastElementRef = useInfiniteScroll(() => {
    setPage(prev => prev + 1);
  }, loading, hasMore);

  return (
    <div className="px-4 md:px-12 pt-[calc(env(safe-area-inset-top,0px)+5rem)] md:pt-[calc(env(safe-area-inset-top,0px)+7rem)] pb-32 min-h-screen animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-1.5 h-7 md:h-8 rounded-full bg-gradient-to-b from-white via-zinc-200 to-zinc-500"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{providerName}</h1>
        </div>

        <div className="mb-8">
          <SubNav filters={filters} current={filter} onChange={setFilter} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onPlay={onPlay} />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-white/50" size={32} />
          </div>
        )}
        
        {!loading && results.length === 0 && (
          <div className="text-center text-zinc-500 py-20">
            No content found for {providerName}
          </div>
        )}

        <div ref={lastElementRef} className="h-10 w-full" />
      </div>
    </div>
  );
}
