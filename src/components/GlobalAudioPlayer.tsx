import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Loader2, X } from 'lucide-react';
import { useMusic } from '../lib/MusicContext';
import { MusicFullScreen } from './MusicFullScreen';
import { TabType } from './TopNav';

interface GlobalAudioPlayerProps {
  currentTab: TabType;
}

export function GlobalAudioPlayer({ currentTab }: GlobalAudioPlayerProps) {
  const { currentSong, isPlaying, isLoading, togglePlay, playNext, playPrev, isFullScreen, setIsFullScreen, currentTime, duration, seekTo, closePlayer } = useMusic();

  // Draggable state
  const pillRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; moved: boolean } | null>(null);

  // Reset position when switching pages
  useEffect(() => { setPos(null); }, [currentTab]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    const el = pillRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
      moved: false,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragState.current.startX;
    const dy = touch.clientY - dragState.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragState.current.moved = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 56, dragState.current.startPosX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, dragState.current.startPosY + dy));
    setPos({ x: newX, y: newY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      dragState.current = null;
      return;
    }
    if (dragState.current && !dragState.current.moved) {
      // It was a tap on non-button area (like album art) — open full screen
      setIsFullScreen(true);
    }
    dragState.current = null;
  };

  // Mouse drag for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const el = pillRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
      moved: false,
    };
    const onMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragState.current.moved = true;
      const newX = Math.max(0, Math.min(window.innerWidth - 56, dragState.current.startPosX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 56, dragState.current.startPosY + dy));
      setPos({ x: newX, y: newY });
    };
    const onUp = (ev: MouseEvent) => {
      if ((ev.target as HTMLElement)?.closest('button')) {
        dragState.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        return;
      }
      if (dragState.current && !dragState.current.moved) {
        setIsFullScreen(true);
      }
      dragState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!currentSong) return null;

  const isOnMusicPage = currentTab === 'music';

  return (
    <>
      {/* ====== FULL MINI PLAYER (Music Page) ====== */}
      <div 
        className={`fixed bottom-[88px] md:bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-xl z-40 transition-all duration-300 ${
          isFullScreen || !isOnMusicPage ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'
        }`}
      >
        <div 
          className="bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] p-2 pr-4 rounded-full shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-white/[0.12] transition-colors relative overflow-hidden"
          onClick={() => setIsFullScreen(true)}
        >
          <div 
            className="absolute bottom-0 left-8 right-8 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seekTo(pct * duration);
            }}
          >
            <div className="h-full bg-white rounded-full relative" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
          <img src={currentSong.coverUrl} alt={currentSong.title} className="w-12 h-12 rounded-full object-cover shadow-md z-10" />
          <div className="flex-1 min-w-0 z-10">
            <h4 className="text-white font-bold text-sm truncate">{currentSong.title}</h4>
            <p className="text-white/60 text-xs truncate">{currentSong.artist}</p>
          </div>
          <div className="flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
            <button onClick={playPrev} className="text-white/70 hover:text-white transition-colors p-1">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button onClick={togglePlay} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={playNext} className="text-white/70 hover:text-white transition-colors p-1">
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button onClick={closePlayer} className="text-white/50 hover:text-white transition-colors p-1.5 ml-1 rounded-full hover:bg-white/10" title="Close player">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ====== DRAGGABLE MINI PILL (Other Pages) ====== */}
      <div
        ref={pillRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        className={`fixed z-[45] select-none touch-none transition-opacity duration-300 ${
          isFullScreen || isOnMusicPage ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={
          pos
            ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
            : { right: 12, bottom: 100 }
        }
      >
        <div className="bg-white/[0.12] backdrop-blur-2xl border border-white/[0.18] rounded-full shadow-2xl shadow-black/60 flex items-center gap-2 p-1.5 pr-2.5 cursor-grab active:cursor-grabbing active:scale-95 transition-transform">
          {/* Tiny cover (Clicking cover art opens full screen player) */}
          <div 
            className="relative w-9 h-9 flex-shrink-0 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setIsFullScreen(true); }}
          >
            <img src={currentSong.coverUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-2.5">
                  <span className="w-[2px] bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_infinite_alternate] h-full"></span>
                  <span className="w-[2px] bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.2s_infinite_alternate] h-2/3"></span>
                  <span className="w-[2px] bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.4s_infinite_alternate] h-full"></span>
                </div>
              </div>
            )}
          </div>

          {/* Play/Pause (Frosted Glass Design) */}
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/25 shadow-md hover:scale-105 transition-all"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); closePlayer(); }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => { e.stopPropagation(); closePlayer(); }}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/30 text-white/70 hover:text-white flex items-center justify-center flex-shrink-0 transition-colors ml-0.5"
            title="Close player"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Full Screen Player */}
      {isFullScreen && <MusicFullScreen />}
    </>
  );
}
