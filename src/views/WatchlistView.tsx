import { useState, useEffect } from 'react';
import { Movie } from '../types';
import { Bookmark, Film } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { getWatchlist } from '../lib/storage';
import { getGenreNames } from '../lib/tmdb';

export function WatchlistView({ 
  onPlay, 
  hideHeader = false, 
  layout = 'grid' 
}: { 
  onPlay: (id: number, type: 'movie' | 'tv') => void; 
  hideHeader?: boolean; 
  layout?: 'grid' | 'list';
}) {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    // Initial Load
    setMovies(getWatchlist());
    
    // Listen for changes
    const handleStorage = () => setMovies(getWatchlist());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('watchlist-updated', handleStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('watchlist-updated', handleStorage);
    };
  }, []);

  const isList = layout === 'list' || hideHeader;

  return (
    <div className={`${hideHeader ? '' : 'px-4 md:px-12 pt-24 md:pt-36 pb-32 min-h-screen'} animate-in fade-in w-full`}>
      <div className="w-full mx-auto">
        {!hideHeader && (
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-12 rounded-full bg-gradient-to-b from-white via-zinc-200 to-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]"></div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-zinc-400">
              <Bookmark size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Watchlist</h1>
          </div>
        )}

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500 bg-zinc-900/40 rounded-2xl border border-white/10">
            <Film size={48} className="mb-3 opacity-30 text-zinc-400" />
            <h2 className="text-base font-semibold text-white mb-1">Your watchlist is empty</h2>
            <p className="text-xs text-zinc-400">Save movies and series to watch them later.</p>
          </div>
        ) : isList ? (
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md">
            {movies.map((movie) => {
              const genres = getGenreNames(movie.genre_ids);
              const releaseYear = (movie.release_date || movie.first_air_date)?.split('-')[0];
              const title = movie.title || movie.name;
              const type = movie.media_type || 'movie';

              return (
                <div 
                  key={movie.id} 
                  onClick={() => onPlay(movie.id, type)}
                  className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-white/[0.04] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-16 sm:w-14 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-zinc-800 border border-white/10">
                      <img 
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        alt={title} 
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-zinc-200 transition-colors">
                        {title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                        {movie.vote_average > 0 && (
                          <span className="text-zinc-200 font-medium">★ {movie.vote_average.toFixed(1)}</span>
                        )}
                        {releaseYear && <span>{releaseYear}</span>}
                        <span className="capitalize px-1.5 py-0.2 rounded text-[10px] bg-white/10 text-zinc-300">
                          {type === 'tv' ? 'Series' : 'Movie'}
                        </span>
                        {genres.length > 0 && (
                          <span className="hidden sm:inline text-zinc-500 truncate max-w-[150px]">
                            {genres.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-zinc-400 group-hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 shrink-0 ml-2">
                    Play
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onPlay={onPlay} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
