import { useState, useEffect } from 'react';
import { Movie } from '../types';
import { Bookmark, Film, Music, UserCheck, Play, Pause, Trash2, Heart, Disc3 } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { getWatchlist } from '../lib/storage';
import { getGenreNames } from '../lib/tmdb';
import { useMusic, Song, FollowedArtist, SavedPlaylist } from '../lib/MusicContext';

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
  const [activeTab, setActiveTab] = useState<'movies' | 'songs' | 'playlists' | 'artists'>('movies');
  const { watchlist, followedArtists, savedPlaylists, playSong, currentSong, isPlaying, togglePlay, toggleWatchlist, toggleFollowArtist, toggleSavePlaylist } = useMusic();

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
      <div className="w-full mx-auto max-w-7xl">
        {!hideHeader && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 rounded-full bg-gradient-to-b from-white via-zinc-200 to-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]"></div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-zinc-400">
                <Bookmark size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Library</h1>
                {/* <p className="text-xs text-white/50 mt-0.5">Your saved videos, favorite playlists, songs, and followed artists</p> */}
              </div>
            </div>

            {/* Category Tabs / Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white/[0.06] border border-white/10 rounded-full backdrop-blur-xl overflow-x-auto hide-scrollbar max-w-full shadow-2xl shrink-0">
              <button
                onClick={() => setActiveTab('movies')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'movies' ? 'bg-white text-black shadow-lg shadow-white/10 font-bold' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Film size={15} />
                <span>Videos ({movies.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('songs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'songs' ? 'bg-white text-black shadow-lg shadow-white/10 font-bold' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Music size={15} />
                <span>Saved Songs ({watchlist.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('playlists')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'playlists' ? 'bg-white text-black shadow-lg shadow-white/10 font-bold' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Disc3 size={15} />
                <span>Playlists ({savedPlaylists.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('artists')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'artists' ? 'bg-white text-black shadow-lg shadow-white/10 font-bold' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserCheck size={15} />
                <span>Artists ({followedArtists.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: MOVIES & SERIES */}
        {activeTab === 'movies' && (
          movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 bg-zinc-900/40 rounded-2xl border border-white/10">
              <Film size={48} className="mb-3 opacity-30 text-zinc-400" />
              <h2 className="text-base font-semibold text-white mb-1">Your video library is empty</h2>
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
          )
        )}

        {/* TAB 2: SAVED SONGS */}
        {activeTab === 'songs' && (
          watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 bg-zinc-900/40 rounded-2xl border border-white/10">
              <Music size={48} className="mb-3 opacity-30 text-zinc-400" />
              <h2 className="text-base font-semibold text-white mb-1">No saved songs yet</h2>
              <p className="text-xs text-zinc-400">Click the heart icon on any song to save it here.</p>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md">
              {watchlist.map((song) => {
                const isActive = currentSong?.id === song.id;

                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, watchlist)}
                    className={`flex items-center justify-between p-3.5 hover:bg-white/[0.06] transition cursor-pointer group ${isActive ? 'bg-white/10' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 relative">
                        <img
                          src={song.coverUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt={song.title}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {isActive && isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white ml-0.5" fill="currentColor" />}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-white/90'}`}>
                          {song.title}
                        </h3>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-white/40 font-medium hidden sm:inline">
                        {song.duration || '3:30'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(song);
                        }}
                        className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        title="Remove from Saved Songs"
                      >
                        <Heart size={18} className="fill-white text-white" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAB 3: PLAYLISTS & ALBUMS */}
        {activeTab === 'playlists' && (
          savedPlaylists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 bg-zinc-900/40 rounded-2xl border border-white/10">
              <Disc3 size={48} className="mb-3 opacity-30 text-zinc-400" />
              <h2 className="text-base font-semibold text-white mb-1">No favorited playlists or albums</h2>
              <p className="text-xs text-zinc-400">Click Favorite on any playlist or album page to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {savedPlaylists.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 flex flex-col transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                >
                  <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-xl border border-white/10 shadow-xl">
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover scale-[1.28] origin-center group-hover:scale-[1.34] transition-transform duration-500"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavePlaylist(item);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all shadow-lg"
                      title="Remove Favorite"
                    >
                      <Heart size={16} className="fill-white text-white" />
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-white truncate w-full mb-0.5">{item.title}</h4>
                  <p className="text-xs text-white/50 capitalize font-medium">{item.type || 'Playlist'}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB 4: FOLLOWED ARTISTS */}
        {activeTab === 'artists' && (
          followedArtists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 bg-zinc-900/40 rounded-2xl border border-white/10">
              <UserCheck size={48} className="mb-3 opacity-30 text-zinc-400" />
              <h2 className="text-base font-semibold text-white mb-1">No followed artists yet</h2>
              <p className="text-xs text-zinc-400">Click Follow on any artist page to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {followedArtists.map((artist) => (
                <div
                  key={artist.id || artist.title}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-3 overflow-hidden rounded-full border border-white/15 shadow-xl">
                    <img
                      src={artist.coverUrl}
                      alt={artist.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <h4 className="font-bold text-sm text-white truncate w-full mb-1">{artist.title}</h4>
                  <p className="text-xs text-white/50 mb-3 font-medium">Artist</p>

                  <button
                    onClick={() => toggleFollowArtist(artist)}
                    className="w-full py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserCheck size={14} className="text-white" />
                    <span>Following</span>
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
