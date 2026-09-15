import { useEffect, useState, useCallback } from 'react';
import { getTrending, getPopular, getTopRated, getBollywood, getPopularTV, getCombinedByGenre } from '../lib/tmdb';
import { Movie } from '../types';
import { Hero } from '../components/Hero';
import { MovieRow } from '../components/MovieRow';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { SubNav } from '../components/SubNav';
import { MovieCard } from '../components/MovieCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

const HOME_FILTERS = [
  { id: 'all', label: 'All' },
  { id: '28', label: 'Action' },
  { id: '35', label: 'Comedy' },
  { id: '18', label: 'Drama' },
  { id: '878', label: 'Sci-Fi' },
  { id: '10759', label: 'Action & Adv' },
  { id: '10765', label: 'Sci-Fi & Fantasy' },
  { id: '16', label: 'Animation' },
  { id: '10749', label: 'Romance' }
];

export function HomeView({ onPlay }: { onPlay: (id: number, type: 'movie' | 'tv') => void }) {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [bollywood, setBollywood] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Movie[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Genre Filter State
  const [filter, setFilter] = useState('all');
  const [genreResults, setGenreResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [genreLoading, setGenreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const { history } = useWatchHistory();

  useEffect(() => {
    async function loadData() {
      try {
        const [trendRes, popRes, topRes, bollyRes, seriesRes] = await Promise.all([
          getTrending(),
          getPopular(),
          getTopRated(),
          getBollywood(),
          getPopularTV()
        ]);
        setTrending(trendRes.results);
        setPopular(popRes.results);
        setTopRated(topRes.results);
        setBollywood(bollyRes.results);
        setSeries(seriesRes.results);
      } catch (err) {
        console.error("Failed to load TMDB data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadGenreData = useCallback(async (pageNum: number, currentFilter: string) => {
    if (currentFilter === 'all') return;
    setGenreLoading(true);
    try {
      const res = await getCombinedByGenre(currentFilter, pageNum);
      setGenreResults(prev => {
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
      setGenreLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filter !== 'all') {
      setGenreResults([]);
      setPage(1);
      setHasMore(true);
      loadGenreData(1, filter);
    }
  }, [filter, loadGenreData]);

  useEffect(() => {
    if (page > 1 && filter !== 'all') {
      loadGenreData(page, filter);
    }
  }, [page, filter, loadGenreData]);

  const lastElementRef = useInfiniteScroll(() => {
    if (filter !== 'all') setPage(prev => prev + 1);
  }, genreLoading, hasMore);

  if (loading && filter === 'all') {
    return (
      <div className="flex flex-col w-full pb-8 pt-20">
        <div className="w-full h-[65vh] md:h-[85vh] bg-zinc-900 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 shimmer-effect"></div>
        </div>
        <div className="-mt-12 md:-mt-32 relative z-20 px-4 md:px-12 lg:px-16 space-y-12">
          {[1, 2, 3].map((row) => (
            <div key={row}>
              <div className="w-48 h-8 bg-zinc-800 rounded-md mb-6 animate-pulse"></div>
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((card) => (
                  <div key={card} className="flex-none w-32 md:w-48 aspect-[2/3] bg-zinc-800 rounded-md border border-white/5 animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const topTrending = trending.slice(0, 5);

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in duration-700">
      {filter === 'all' && topTrending.length > 0 && <Hero movies={topTrending} onPlay={onPlay} />}
      
      <div className={`${filter === 'all' ? 'pt-4 md:pt-10' : 'pt-24 md:pt-36 px-4 md:px-12 lg:px-16 max-w-7xl mx-auto w-full'} relative z-20`}>
        <div className={filter === 'all' ? 'px-4 md:px-12 lg:px-16 max-w-7xl mx-auto w-full mb-8' : 'mb-8'}>
          <SubNav filters={HOME_FILTERS} current={filter} onChange={setFilter} />
        </div>

        {filter === 'all' ? (
          <>
            {history.length > 0 && (
              <MovieRow title="Continue Watching" movies={history} onPlay={onPlay} />
            )}
            <MovieRow title="Top 10 Trending Now" movies={trending.slice(5)} onPlay={onPlay} isTop10={true} />
            <MovieRow title="Popular TV Series" movies={series} onPlay={onPlay} defaultType="tv" />
            <MovieRow title="Bollywood Hits" movies={bollywood} onPlay={onPlay} defaultType="movie" />
            <MovieRow title="Popular" movies={popular} onPlay={onPlay} />
            <MovieRow title="Top Rated" movies={topRated} onPlay={onPlay} />
          </>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {genreResults.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onPlay={onPlay} />
              ))}
            </div>
            
            {genreLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-white/50" size={32} />
              </div>
            )}
            
            <div ref={lastElementRef} className="h-10 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
