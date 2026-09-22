import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Shuffle, Loader2, Clock, ChevronLeft, Heart, Share2, MoreHorizontal, Copy, CheckCircle2, Sparkles, Music } from 'lucide-react';
import { useMusic } from '../lib/MusicContext';
import { getPlaylist, getAlbum, PlaylistData, SearchResult } from '../lib/musicService';

interface PlaylistViewProps {
  id: string;
  type: 'playlist' | 'album';
  onBack: () => void;
}

export function PlaylistView({ id, type, onBack }: PlaylistViewProps) {
  const [data, setData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const { playSong, currentSong, isPlaying, togglePlay, toggleWatchlist, isWatchlisted, toggleSavePlaylist, isPlaylistSaved } = useMusic();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [activeSongMenuId, setActiveSongMenuId] = useState<string | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const playlistMenuRef = useRef<HTMLDivElement>(null);
  const songMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      const res = type === 'playlist' ? await getPlaylist(id) : await getAlbum(id);
      setData(res);
      if (res && res.title) {
        const url = new URL(window.location.href);
        url.searchParams.delete('ptype');
        url.searchParams.set('title', res.title);
        const cleanUrl = url.toString().replace(/title=([^&]+)/, (_, t) => `title=${t.replace(/\+/g, '%20')}`);
        window.history.replaceState(window.history.state, '', cleanUrl);
      }
      setLoading(false);
    }
    fetchDetails();
  }, [id, type]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (playlistMenuRef.current && !playlistMenuRef.current.contains(target) && !target.closest('.playlist-menu-trigger')) {
        setShowPlaylistMenu(false);
      }
      if (songMenuRef.current && !songMenuRef.current.contains(target) && !target.closest('.song-menu-trigger')) {
        setActiveSongMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handlePlayAll = () => {
    if (!data || data.songs.length === 0) return;
    if (currentSong && data.songs.some(s => s.id === currentSong.id)) {
      togglePlay();
    } else {
      playSong(data.songs[0], data.songs);
    }
  };

  const handleShuffle = () => {
    if (!data || data.songs.length === 0) return;
    const shuffled = [...data.songs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
    showToast('Playing in Shuffle mode');
  };

  const isLiked = data ? isPlaylistSaved(data.id) || isPlaylistSaved(id) : false;

  const handleToggleLikePlaylist = () => {
    if (!data) return;
    toggleSavePlaylist({ id: data.id || id, title: data.title, coverUrl: data.coverUrl, type });
    const nextState = !isLiked;
    showToast(nextState ? `Saved "${data.title}" to Favorites` : `Removed "${data.title}" from Favorites`);
    setShowPlaylistMenu(false);
  };

  const handleSharePlaylist = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast(`${type === 'playlist' ? 'Playlist' : 'Album'} link copied!`);
    } else {
      showToast('Link copied!');
    }
    setShowPlaylistMenu(false);
  };

  const handleToggleLikeSong = (song: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(song);
    const isSaved = !isWatchlisted(song.id);
    showToast(isSaved ? `Saved "${song.title}" to Watchlist` : `Removed "${song.title}" from Watchlist`);
    setActiveSongMenuId(null);
  };

  const handleShareSong = (song: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?song=${encodeURIComponent(song.id)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Song link for "${song.title}" copied!`);
    } else {
      showToast(`Song link copied!`);
    }
    setActiveSongMenuId(null);
  };

  if (loading) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center min-h-screen bg-[var(--color-theme-bg)]">
        <Loader2 size={36} className="animate-spin text-white/60 mb-4" />
        <p className="text-white/60 font-medium">Loading {type}...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center min-h-screen bg-[var(--color-theme-bg)]">
        <p className="text-white/60 text-lg">Failed to load {type}.</p>
        <button 
          onClick={onBack} 
          className="mt-4 px-6 py-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all font-medium border border-white/10"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isCurrentPlaylistPlaying = isPlaying && currentSong && data.songs.some(s => s.id === currentSong.id);

  // Calculate total duration
  const totalDuration = data.songs.reduce((acc, song) => acc + (song.durationSec || 0), 0);
  const totalMins = Math.floor(totalDuration / 60);
  const totalHours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  const durationText = totalHours > 0 ? `${totalHours} hr ${remainingMins} min` : `${totalMins} min`;

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 min-h-screen animate-in fade-in bg-[var(--color-theme-bg)] text-white relative">
      {/* Back Arrow Fixed at Top-Left Corner */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 sm:left-10 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors border border-white/10 backdrop-blur-md shadow-lg"
        title="Go Back"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-zinc-800/95 backdrop-blur-xl border border-white/20 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Full-screen minimal frosted glass backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 blur-[100px] saturate-200 bg-cover bg-center opacity-30 transition-all duration-1000 scale-125"
          style={{ backgroundImage: `url(${data.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8">
        {/* Playlist Hero Header Section */}
        <div className="pt-4 pb-8 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-center">
          {/* Playlist Cover Image - Clean song cover art fallback + crop */}
          {(() => {
            const cleanCover = (data.songs && data.songs.length > 0 && data.songs[0].coverUrl) ? data.songs[0].coverUrl : data.coverUrl;
            return (
              <div className="relative group shrink-0 overflow-hidden rounded-2xl">
                <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition duration-700" />
                <img 
                  src={cleanCover} 
                  alt={data.title} 
                  className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 object-cover rounded-2xl shadow-2xl border border-white/10 scale-[1.28] origin-center group-hover:scale-[1.32] transition-transform duration-500"
                />
              </div>
            );
          })()}
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 tracking-tight leading-tight drop-shadow-md">
              {data.title}
            </h1>
            
            <p className="text-white/70 text-sm md:text-base font-normal max-w-2xl mb-3 leading-relaxed">
              Stream the best selection of trending tracks and songs curated for you on Parlaxio Music.
            </p>

            {(() => {
              const playlistArtists = Array.from(
                new Set(
                  (data.songs || [])
                    .flatMap(s => (s.artist ? s.artist.split(/[,&]/) : []))
                    .map(a => a.trim())
                    .filter(Boolean)
                )
              ).slice(0, 4).join(', ');

              return (
                <p className="text-white/60 text-sm font-medium flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-white font-semibold capitalize">{type}</span>
                  {playlistArtists && (
                    <>
                      <span>•</span>
                      <span className="text-white/90 font-medium">{playlistArtists}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-white">{data.songs.length} songs</span>
                  {durationText && (
                    <>
                      <span>•</span>
                      <span className="text-white/40">{durationText}</span>
                    </>
                  )}
                </p>
              );
            })()}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="py-4 flex flex-wrap items-center gap-4 mb-6 border-b border-white/[0.08]">
          {/* Play All Button (White/Black Gradient) */}
          <button 
            onClick={handlePlayAll}
            className="h-14 px-8 bg-gradient-to-br from-white via-zinc-100 to-zinc-300 hover:from-white hover:to-zinc-200 text-black font-extrabold rounded-full flex items-center gap-3 shadow-xl shadow-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          >
            {isCurrentPlaylistPlaying ? (
              <>
                <Pause size={24} fill="currentColor" />
                <span className="text-base tracking-wide">Pause</span>
              </>
            ) : (
              <>
                <Play size={24} fill="currentColor" className="ml-0.5" />
                <span className="text-base tracking-wide">Play All</span>
              </>
            )}
          </button>

          {/* Shuffle Button */}
          <button 
            onClick={handleShuffle}
            className="h-12 w-12 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md active:scale-95"
            title="Shuffle Play"
          >
            <Shuffle size={20} />
          </button>

          {/* Like Button */}
          <button 
            onClick={handleToggleLikePlaylist}
            className={`h-12 px-5 rounded-full flex items-center gap-2 text-sm font-semibold transition-all backdrop-blur-md border ${
              isLiked 
                ? 'bg-white/25 text-white border-white/40 shadow-inner' 
                : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Heart size={18} className={isLiked ? 'fill-white text-white' : ''} />
            <span className="hidden sm:inline">{isLiked ? 'Favorite' : 'Add Favorite'}</span>
          </button>

          {/* More Options (3 Dots) */}
          <div className="relative" ref={playlistMenuRef}>
            <button 
              onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all backdrop-blur-md active:scale-95"
              title="More Options"
            >
              <MoreHorizontal size={22} />
            </button>

            {/* Playlist Popup Menu */}
            {showPlaylistMenu && (
              <div className="absolute left-0 mt-2 w-52 bg-zinc-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={handleSharePlaylist}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors font-medium text-left"
                >
                  <Share2 size={16} className="text-white/80" />
                  <span>Share {type === 'playlist' ? 'Playlist' : 'Album'}</span>
                </button>

                <button 
                  onClick={handleToggleLikePlaylist}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors font-medium text-left"
                >
                  <Heart size={16} className={isLiked ? 'text-white fill-white' : 'text-white/60'} />
                  <span>{isLiked ? 'Remove Favorite' : 'Save to Favorites'}</span>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button 
                  onClick={handleSharePlaylist}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/70 transition-colors font-medium text-left"
                >
                  <Copy size={16} className="text-white/50" />
                  <span>Copy Link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tracklist Table */}
        <div className="mt-6">
          <div className="flex items-center text-white/40 text-xs font-semibold uppercase tracking-wider px-4 mb-3 border-b border-white/[0.08] pb-2.5">
            <div className="w-9 text-center">#</div>
            <div className="flex-1">Title</div>
            <div className="hidden sm:block w-32 text-right pr-6"><Clock size={15} className="inline-block" /></div>
            <div className="w-10 text-center" />
          </div>

          <div className="flex flex-col gap-1.5">
            {data.songs.map((song, index) => {
              const isActive = currentSong?.id === song.id;
              const isMenuOpen = activeSongMenuId === song.id;
              const isSongLiked = !!likedSongIds[song.id];
              
              return (
                <div 
                  key={song.id}
                  onClick={() => playSong(song, data.songs)}
                  className={`group relative flex items-center px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isMenuOpen ? 'z-40' : 'z-10'
                  } ${
                    isActive 
                      ? 'bg-white/15 border border-white/20 backdrop-blur-xl shadow-lg shadow-black/30' 
                      : 'hover:bg-white/10 hover:backdrop-blur-md border border-transparent hover:border-white/5'
                  }`}
                >
                  <div className="w-9 flex justify-center text-white/50 text-sm font-semibold shrink-0">
                    {isActive && isPlaying ? (
                       <div className="flex items-end gap-[3px] h-4">
                         <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_infinite_alternate] h-full" />
                         <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.2s_infinite_alternate] h-2/3" />
                         <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.4s_infinite_alternate] h-full" />
                       </div>
                    ) : (
                      <span className="group-hover:hidden">{index + 1}</span>
                    )}
                    {!isActive && <Play size={15} className="hidden group-hover:block text-white" fill="currentColor" />}
                    {isActive && !isPlaying && <Play size={15} className="text-white" fill="currentColor" />}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex items-center gap-3.5 ml-1">
                    <img src={song.coverUrl} className="w-11 h-11 rounded-xl object-cover shadow-md shadow-black/30 group-hover:scale-105 transition-transform duration-300 shrink-0" alt="" />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-base font-bold truncate text-white`}>
                        {song.title}
                      </span>
                      <span className="text-white/50 text-xs truncate mt-0.5">
                        {song.artist}
                      </span>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block w-32 text-right text-white/40 text-xs font-medium pr-6 shrink-0">
                    {song.duration || '3:30'}
                  </div>

                  {/* Track Menu (3 Dots) */}
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSongMenuId(isMenuOpen ? null : song.id);
                      }}
                      className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors song-menu-trigger"
                      title="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {/* Song Popup Menu */}
                    {isMenuOpen && (
                      <div 
                        ref={songMenuRef}
                        onClick={(e) => e.stopPropagation()}
                        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
                        className="absolute right-0 top-full mt-1.5 w-52 bg-zinc-900/90 border border-white/15 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSong(song, data.songs);
                            setActiveSongMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs font-medium text-white text-left transition-colors"
                        >
                          <Play size={15} className="text-white" />
                          <span>Play Song</span>
                        </button>

                        <button
                          onClick={(e) => handleToggleLikeSong(song, e)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs font-medium text-left text-white transition-colors"
                        >
                          <Heart size={15} className={isWatchlisted(song.id) ? 'text-white fill-white' : 'text-white/60'} />
                          <span>{isWatchlisted(song.id) ? 'Remove Watchlist' : 'Save to Watchlist'}</span>
                        </button>

                        <button
                          onClick={(e) => handleShareSong(song, e)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs font-medium text-left text-white transition-colors"
                        >
                          <Share2 size={15} className="text-white/80" />
                          <span>Share Song</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
