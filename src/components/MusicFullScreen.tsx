import { ChevronDown, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Disc3, Loader2, Heart } from 'lucide-react';
import { useMusic } from '../lib/MusicContext';

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MusicFullScreen() {
  const { currentSong, isPlaying, isLoading, togglePlay, playNext, playPrev, setIsFullScreen, queue, playSong, currentTime, duration, seekTo, toggleWatchlist, isWatchlisted } = useMusic();

  if (!currentSong) return null;

  const isFav = isWatchlisted(currentSong.id);
  const currentIndex = queue.findIndex(s => s.id === currentSong.id);
  // Instead of slicing, we show the full queue so the user can see what they played before.
  const displayQueue = queue;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 animate-in slide-in-from-bottom-full duration-300">
      {/* Background Blur */}
      <div 
        className="absolute inset-0 opacity-30 blur-[100px] saturate-200 pointer-events-none"
        style={{
          backgroundImage: `url(${currentSong.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/70 to-zinc-950 pointer-events-none" />

      {/* === DESKTOP LAYOUT === */}
      <div className="hidden md:flex relative z-10 h-full">
        {/* Left: Player */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 lg:px-20">
          {/* Header */}
          <div className="absolute top-6 left-6">
            <button 
              onClick={() => setIsFullScreen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronDown size={24} />
            </button>
          </div>

          <div className="flex items-center gap-10 max-w-3xl w-full">
            {/* Cover Art */}
            <div className="w-72 h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 flex-shrink-0">
              <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
            </div>

            {/* Info + Controls */}
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-xs tracking-widest uppercase font-medium mb-3">Now Playing</p>
              
              {/* Title, Artist + Favorite Button */}
              <div className="flex items-center justify-between mb-8 gap-4">
                <div className="min-w-0">
                  <h2 className="text-4xl font-bold text-white mb-2 truncate">{currentSong.title}</h2>
                  <p className="text-white/50 text-lg truncate">{currentSong.artist}</p>
                </div>
                <button
                  onClick={() => toggleWatchlist(currentSong)}
                  className="p-1 transition-transform active:scale-95 flex-shrink-0"
                  title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart 
                    size={26} 
                    className={`transition-all ${
                      isFav 
                        ? 'text-white fill-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)] hover:scale-110' 
                        : 'text-white/40 hover:text-white hover:scale-110'
                    }`} 
                    fill={isFav ? "currentColor" : "none"} 
                  />
                </button>
              </div>

              {/* Progress */}
              <div className="mb-8">
                <div 
                  className="h-1 bg-white/10 rounded-full w-full overflow-hidden mb-2.5 cursor-pointer relative group"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    seekTo(pct * duration);
                  }}
                >
                  <div className="h-full bg-white rounded-full relative" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"></div>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] font-medium text-white/40">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-6">
                <button className="text-white/30 hover:text-white transition-colors">
                  <Shuffle size={18} />
                </button>
                <button onClick={playPrev} className="text-white hover:scale-110 transition-transform">
                  <SkipBack size={26} fill="currentColor" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                >
                  {isLoading ? <Loader2 size={26} className="animate-spin" /> : isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={playNext} className="text-white hover:scale-110 transition-transform">
                  <SkipForward size={26} fill="currentColor" />
                </button>
                <button className="text-white/30 hover:text-white transition-colors">
                  <Repeat size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Queue Panel */}
        {displayQueue.length > 0 && (
          <div className="w-80 lg:w-96 border-l border-white/[0.06] bg-black/20 h-full overflow-y-auto hide-scrollbar">
            <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-10 px-6 py-5 border-b border-white/[0.06]">
              <h3 className="text-white font-bold text-base">Up Next</h3>
              <p className="text-white/40 text-xs mt-0.5">{displayQueue.length} songs</p>
            </div>
            <div className="p-3">
              {displayQueue.map((song, i) => {
                const isActive = song.id === currentSong.id;
                return (
                <div 
                  key={song.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]'}`}
                  onClick={() => playSong(song, queue)}
                >
                  <div className="w-5 flex justify-center items-center">
                    {isActive && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-3">
                        <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_infinite_alternate] h-full"></span>
                        <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.2s_infinite_alternate] h-2/3"></span>
                        <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.4s_infinite_alternate] h-full"></span>
                      </div>
                    ) : (
                      <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/20'}`}>{i + 1}</span>
                    )}
                  </div>
                  <img src={song.coverUrl} className="w-10 h-10 rounded-md object-cover" alt={song.title} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm truncate transition-colors ${isActive ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>{song.title}</h4>
                    <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-white/40'}`}>{song.artist}</p>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>

      {/* === MOBILE LAYOUT === */}
      <div className="md:hidden relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
          <button 
            onClick={() => setIsFullScreen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white"
          >
            <ChevronDown size={22} />
          </button>
          <span className="text-white/50 font-medium text-[11px] tracking-widest uppercase">Now Playing</span>
          <div className="w-9 h-9" />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="px-8 flex flex-col items-center">
            
            {/* Cover Art */}
            <div className="w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 mb-8">
              <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
            </div>

            {/* Title & Artist + Favorite Toggle */}
            <div className="w-full flex items-center justify-between mb-6 gap-3">
              <div className="min-w-0 flex-1 text-left">
                <h2 className="text-2xl font-bold text-white mb-1 truncate">{currentSong.title}</h2>
                <p className="text-white/50 text-base truncate">{currentSong.artist}</p>
              </div>
              <button
                onClick={() => toggleWatchlist(currentSong)}
                className="p-1 transition-transform active:scale-95 flex-shrink-0 ml-2"
                title={isFav ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart 
                  size={24} 
                  className={`transition-all ${
                    isFav 
                      ? 'text-white fill-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)] hover:scale-110' 
                      : 'text-white/40 hover:text-white hover:scale-110'
                  }`} 
                  fill={isFav ? "currentColor" : "none"} 
                />
              </button>
            </div>

            {/* Progress */}
            <div className="w-full mb-6">
              <div 
                className="h-1 bg-white/10 rounded-full w-full overflow-hidden mb-2 cursor-pointer relative group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  seekTo(pct * duration);
                }}
              >
                <div className="h-full bg-white rounded-full relative" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-medium text-white/40">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full max-w-xs mb-10">
              <button className="text-white/30 hover:text-white transition-colors">
                <Shuffle size={18} />
              </button>
              <button onClick={playPrev} className="text-white">
                <SkipBack size={28} fill="currentColor" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl"
              >
                {isLoading ? <Loader2 size={28} className="animate-spin" /> : isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={playNext} className="text-white">
                <SkipForward size={28} fill="currentColor" />
              </button>
              <button className="text-white/30 hover:text-white transition-colors">
                <Repeat size={18} />
              </button>
            </div>
          </div>

          {/* Up Next - Full Width */}
          {displayQueue.length > 0 && (
            <div className="mx-3 mt-4 mb-8 bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-white font-bold text-base">Up Next</h3>
                <p className="text-white/40 text-[11px] mt-0.5">{displayQueue.length} songs in queue</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {displayQueue.map((song, i) => {
                  const isActive = song.id === currentSong.id;
                  return (
                  <div 
                    key={song.id} 
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${isActive ? 'bg-white/[0.08]' : 'active:bg-white/[0.06]'}`}
                    onClick={() => playSong(song, queue)}
                  >
                    <div className="w-4 flex justify-center items-center">
                      {isActive && isPlaying ? (
                        <div className="flex items-end gap-[2px] h-3">
                          <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_infinite_alternate] h-full"></span>
                          <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.2s_infinite_alternate] h-2/3"></span>
                          <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.4s_infinite_alternate] h-full"></span>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/20'}`}>{i + 1}</span>
                      )}
                    </div>
                    <img src={song.coverUrl} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" alt={song.title} />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-white/90'}`}>{song.title}</h4>
                      <p className={`text-[11px] truncate ${isActive ? 'text-white/70' : 'text-white/40'}`}>{song.artist}</p>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
