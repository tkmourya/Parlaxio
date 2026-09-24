import { useState, useEffect, useCallback } from 'react';
import { getSeriesByFilter } from '../lib/tmdb';
import { Movie } from '../types';
import { Loader2, Tv } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { SubNav } from '../components/SubNav';
import { GridSkeleton } from '../components/GridSkeleton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const FILTERS = [
  { id: 'all', label: 'All Series' },
  { id: '10759', label: 'Action & Adv' },
  { id: '35', label: 'Comedy' },
  { id: '18', label: 'Drama' },
  { id: '10765', label: 'Sci-Fi & Fantasy' },
  { id: '9648', label: 'Mystery' },
  { id: '16', label: 'Animation' },
  { id: 'korean', label: 'K-Drama' },
  { id: 'indian', label: 'Indian' },
  { id: 'south_indian', label: 'South Indian' },
  { id: 'western', label: 'Western' }
];

export function SeriesView({ onPlay }: { onPlay: (id: number, type: 'movie' | 'tv') => void }) {
  const [filter, setFilter] = useState('all');
  const [series, setSeries] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadSeries = useCallback(async (pageNum: number, currentFilter: string) => {
    setLoading(true);
    try {
      const res = await getSeriesByFilter(currentFilter, pageNum);
      setSeries(prev => {
        if (pageNum === 1) return res.results;
        const newSeries = [...prev];
        res.results.forEach(m => {
          if (!newSeries.find(existing => existing.id === m.id)) {
            newSeries.push(m);
          }
        });
        return newSeries;
      });
      setHasMore(res.page < res.total_pages && res.page < 500);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSeries([]);
    setPage(1);
    setHasMore(true);
    loadSeries(1, filter);
  }, [filter, loadSeries]);

  useEffect(() => {
    if (page > 1) {
      loadSeries(page, filter);
    }
  }, [page, filter, loadSeries]);

  const lastElementRef = useInfiniteScroll(() => {
    setPage(prev => prev + 1);
  }, loading, hasMore);

  return (
    <div className="px-4 md:px-12 pt-[calc(env(safe-area-inset-top,0px)+6rem)] md:pt-[calc(env(safe-area-inset-top,0px)+9rem)] pb-32 min-h-screen animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-white via-zinc-200 to-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]"></div>
          <div className="p-3 bg-white/10 rounded-full border border-white/20">
            <Tv className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TV Series</h1>
        </div>

        <SubNav filters={FILTERS} current={filter} onChange={setFilter} />

        {loading && page === 1 ? (
          <div className="mt-8">
            <GridSkeleton count={18} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-8">
            {series.map((show) => (
              <MovieCard key={show.id} movie={show} onPlay={onPlay} defaultType="tv" />
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
