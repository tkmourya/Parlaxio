import { useState, useEffect, useCallback } from 'react';
import { getAnimeByFilter } from '../lib/tmdb';
import { Movie } from '../types';
import { Loader2, Zap } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { SubNav } from '../components/SubNav';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const FILTERS = [
  { id: 'all', label: 'All Anime' },
  { id: '10759', label: 'Action & Adv' },
  { id: '10765', label: 'Sci-Fi & Fantasy' },
  { id: '35', label: 'Comedy' },
  { id: '18', label: 'Drama' },
  { id: '10749', label: 'Romance' },
  { id: '9648', label: 'Mystery' }
];

export function AnimeView({ onPlay }: { onPlay: (id: number, type: 'movie' | 'tv') => void }) {
  const [filter, setFilter] = useState('all');
  const [anime, setAnime] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadAnime = useCallback(async (pageNum: number, currentFilter: string) => {
    setLoading(true);
    try {
      const res = await getAnimeByFilter(currentFilter, pageNum);
      setAnime(prev => {
        if (pageNum === 1) return res.results;
        const newAnime = [...prev];
        res.results.forEach(m => {
          if (!newAnime.find(existing => existing.id === m.id)) {
            newAnime.push(m);
          }
        });
        return newAnime;
      });
      setHasMore(res.page < res.total_pages && res.page < 500);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAnime([]);
    setPage(1);
    setHasMore(true);
    loadAnime(1, filter);
  }, [filter, loadAnime]);

  useEffect(() => {
    if (page > 1) {
      loadAnime(page, filter);
    }
  }, [page, filter, loadAnime]);

  const lastElementRef = useInfiniteScroll(() => {
    setPage(prev => prev + 1);
  }, loading, hasMore);

  return (
    <div className="px-4 md:px-12 pt-24 md:pt-36 pb-32 min-h-screen animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-white via-zinc-200 to-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]"></div>
          <div className="p-3 bg-white/10 rounded-full border border-white/20">
            <Zap className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Anime</h1>
        </div>

        <SubNav filters={FILTERS} current={filter} onChange={setFilter} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {anime.map((show) => (
            <MovieCard key={show.id} movie={show} onPlay={onPlay} defaultType="tv" />
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
