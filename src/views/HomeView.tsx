import { useEffect, useState, useCallback } from 'react';
import { getTrending, getPopular, getTopRated, getBollywood, getSouthIndian, getPopularTV, getCombinedByGenre, getAnimeByFilter, getSeriesByFilter, getMoviesByFilter, getTrendingAll, getTrendingIndia } from '../lib/tmdb';
import { Movie } from '../types';
import { Hero } from '../components/Hero';
import { MovieRow } from '../components/MovieRow';
import { ProviderCards } from '../components/ProviderCards';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { SubNav } from '../components/SubNav';
import { MovieCard } from '../components/MovieCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader2, Tv, Signal } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { AdBlockModal } from '../components/AdBlockModal';

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

interface HomeViewProps {
  onPlay: (id: number, type: 'movie' | 'tv') => void;
  onContinueWatch?: (id: number, type: 'movie' | 'tv', season?: number, episode?: number) => void;
  onProviderSelect?: (id: string, name: string) => void;
  onLiveTVClick?: () => void;
}

export function HomeView({ onPlay, onContinueWatch, onProviderSelect, onLiveTVClick }: HomeViewProps) {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [bollywood, setBollywood] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Movie[]>([]);
  const [anime, setAnime] = useState<Movie[]>([]);
  const [korean, setKorean] = useState<Movie[]>([]);
  const [hollywood, setHollywood] = useState<Movie[]>([]);
  const [indianSeries, setIndianSeries] = useState<Movie[]>([]);
  const [southIndian, setSouthIndian] = useState<Movie[]>([]);
  const [southSeries, setSouthSeries] = useState<Movie[]>([]);
  const [documentaries, setDocumentaries] = useState<Movie[]>([]);
  const [action, setAction] = useState<Movie[]>([]);
  const [trendingAll, setTrendingAll] = useState<Movie[]>([]);
  const [trendingIndia, setTrendingIndia] = useState<Movie[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // Auto-show AdBlock notice on first login
  useEffect(() => {
    if (user) {
      const hasSeen = localStorage.getItem('parlaxio_seen_ad_notice');
      if (!hasSeen) {
        setIsAdModalOpen(true);
        localStorage.setItem('parlaxio_seen_ad_notice', 'true');
      }
    }
  }, [user]);
  
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
        const [trendRes, popRes, topRes, bollyRes, southRes, seriesRes, animeRes, koreanRes, hollyRes, indianRes, southSeriesRes, docRes, actionRes, trendAllRes, trendIndiaRes] = await Promise.all([
          getTrending(),
          getPopular(),
          getTopRated(),
          getBollywood(),
          getSouthIndian(),
          getPopularTV(),
          getAnimeByFilter('all'),
          getSeriesByFilter('korean'),
          getMoviesByFilter('hollywood'),
          getSeriesByFilter('indian'),
          getSeriesByFilter('south_indian'),
          getMoviesByFilter('99'),
          getMoviesByFilter('28'),
          getTrendingAll(),
          getTrendingIndia()
        ]);
        setTrending(trendRes.results);
        setPopular(popRes.results);
        setTopRated(topRes.results);
        setBollywood(bollyRes.results);
        setSouthIndian(southRes.results);
        setSeries(seriesRes.results);
        setAnime(animeRes.results);
        setKorean(koreanRes.results);
        setHollywood(hollyRes.results);
        setIndianSeries(indianRes.results);
        setSouthSeries(southSeriesRes.results);
        setDocumentaries(docRes.results);
        setAction(actionRes.results);
        setTrendingAll(trendAllRes.results);
        setTrendingIndia(trendIndiaRes.results);
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
      
      {filter === 'all' && onProviderSelect && (
        <div className="mt-8">
          <ProviderCards onSelect={onProviderSelect} onLiveTVClick={onLiveTVClick} />
        </div>
      )}

      <div className={`${filter === 'all' ? 'pt-8 md:pt-10' : 'pt-24 md:pt-36 px-4 md:px-12 lg:px-16 max-w-7xl mx-auto w-full'} relative z-20`}>
        <div className={filter === 'all' ? 'px-4 md:px-12 lg:px-16 max-w-7xl mx-auto w-full mb-8' : 'mb-8'}>
          <SubNav filters={HOME_FILTERS} current={filter} onChange={setFilter} />
        </div>

        {filter === 'all' ? (
          <>
            {history.length > 0 && (
              <MovieRow title="Continue Watching" movies={history} onPlay={onContinueWatch || onPlay} />
            )}
            {/* Top 10 Today */}
            <MovieRow 
              title="Top 10 Today" 
              movies={trendingAll} 
              onPlay={onPlay} 
              isTop10={true}
            />

            {/* Trending Now */}
            <MovieRow 
              title="Trending Now" 
              movies={trending} 
              fetchFn={getTrending}
              onPlay={onPlay} 
            />

            {/* Trending in India */}
            <MovieRow 
              title="Trending in India" 
              movies={trendingIndia} 
              onPlay={onPlay} 
            />

            {/* Popular Movies */}
            <MovieRow 
              title="Popular on Parlaxio" 
              movies={popular} 
              fetchFn={getPopular}
              onPlay={onPlay} 
            />

            {/* Critically Acclaimed */}
            <MovieRow 
              title="Critically Acclaimed" 
              movies={topRated} 
              fetchFn={getTopRated}
              onPlay={onPlay} 
            />

            {/* Bollywood Hits */}
            <MovieRow 
              title="Bollywood Hits" 
              movies={bollywood} 
              fetchFn={getBollywood}
              onPlay={onPlay} 
            />

            {/* South Indian Hits */}
            <MovieRow 
              title="South Indian Hits" 
              movies={southIndian} 
              fetchFn={getSouthIndian}
              onPlay={onPlay} 
            />

            {/* Trending Series */}
            <MovieRow 
              title="Trending Series" 
              movies={series} 
              fetchFn={getPopularTV}
              onPlay={onPlay} 
              defaultType="tv"
            />

            {/* Anime Hits */}
            <MovieRow 
              title="Anime Hits" 
              movies={anime} 
              fetchFn={(page) => getAnimeByFilter('all', page)}
              onPlay={onPlay} 
              defaultType="tv"
            />

            {/* K-Dramas */}
            <MovieRow 
              title="K-Dramas" 
              movies={korean} 
              fetchFn={(page) => getSeriesByFilter('korean', page)}
              onPlay={onPlay} 
              defaultType="tv"
            />

            {/* Hollywood Blockbusters */}
            <MovieRow 
              title="Hollywood Blockbusters" 
              movies={hollywood} 
              fetchFn={(page) => getMoviesByFilter('hollywood', page)}
              onPlay={onPlay} 
            />

            {/* Indian Web Series */}
            <MovieRow 
              title="Indian Web Series" 
              movies={indianSeries} 
              fetchFn={(page) => getSeriesByFilter('indian', page)}
              onPlay={onPlay}
              defaultType="tv" 
            />

            {/* South Indian Web Series */}
            <MovieRow 
              title="South Indian Web Series" 
              movies={southSeries} 
              fetchFn={(page) => getSeriesByFilter('south_indian', page)}
              onPlay={onPlay}
              defaultType="tv" 
            />

            {/* Action Hits */}
            <MovieRow 
              title="Action Hits" 
              movies={action} 
              fetchFn={(page) => getMoviesByFilter('28', page)}
              onPlay={onPlay} 
            />

            {/* Documentaries */}
            <MovieRow 
              title="Documentaries" 
              movies={documentaries} 
              fetchFn={(page) => getMoviesByFilter('99', page)}
              onPlay={onPlay} 
            />
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

      <AdBlockModal 
        isOpen={isAdModalOpen} 
        onClose={() => setIsAdModalOpen(false)} 
      />
    </div>
  );
}
