import { Film, Search, Flame, Settings, Tv, Zap, Bookmark, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export type TabType = 'home' | 'movies' | 'series' | 'anime' | 'trending' | 'search' | 'settings' | 'watchlist' | 'auth' | 'provider' | 'livetv';

interface TopNavProps {
  currentTab: TabType;
  onChange: (tab: TabType) => void;
  onAuthClick: (mode: 'login' | 'register') => void;
}

export function TopNav({ currentTab, onChange, onAuthClick }: TopNavProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Desktop Top Blur Overlay */}
      <div 
        className="hidden md:block fixed top-0 left-0 right-0 h-32 z-40 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none" 
        style={{ backdropFilter: 'blur(8px)', WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)' }}
      ></div>

      <div className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 justify-center">
        <header className="bg-black/25 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-4 py-2 rounded-full flex items-center gap-3 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex items-center cursor-pointer pr-3.5 border-r border-white/10 select-none" onClick={() => onChange('home')}>
              <span className="font-brand-stylish font-black text-2xl tracking-[0.14em] uppercase bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] hover:opacity-90 transition-opacity">
                Parlaxio
              </span>
            </div>
            
            <nav className="flex items-center gap-1 font-medium text-sm">
              <button 
                onClick={() => onChange('home')}
                className={`transition-colors px-4 py-2 rounded-full flex items-center gap-2 ${currentTab === 'home' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                Home
              </button>
              <button 
                onClick={() => onChange('movies')}
                className={`transition-colors px-4 py-2 rounded-full flex items-center gap-2 ${currentTab === 'movies' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <Film size={16} />
                Movies
              </button>
              <button 
                onClick={() => onChange('series')}
                className={`transition-colors px-4 py-2 rounded-full flex items-center gap-2 ${currentTab === 'series' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <Tv size={16} />
                Series
              </button>
              <button 
                onClick={() => onChange('anime')}
                className={`transition-colors px-4 py-2 rounded-full flex items-center gap-2 ${currentTab === 'anime' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <Zap size={16} />
                Anime
              </button>
              <button 
                onClick={() => onChange('trending')}
                className={`transition-colors px-4 py-2 rounded-full flex items-center gap-2 ${currentTab === 'trending' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <Flame size={16} />
                Trending
              </button>
              <button 
                onClick={() => onChange('search')}
                className={`transition-colors flex items-center gap-2 px-4 py-2 rounded-full ${currentTab === 'search' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <Search size={16} />
                Search
              </button>
              <button 
                onClick={() => onChange('watchlist')}
                className={`transition-colors flex items-center gap-2 px-4 py-2 rounded-full ${currentTab === 'watchlist' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <Bookmark size={16} />
                Watchlist
              </button>
            </nav>
          </div>

          <div className="pl-4 border-l border-white/10 flex items-center shrink-0">
            {user ? (
               <button onClick={() => onChange('settings')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/5 shadow-inner">
                 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white via-zinc-200 to-zinc-400 flex items-center justify-center text-[10px] font-bold text-black shadow-sm shadow-white/10">
                   {user.avatarInitials}
                 </div>
                 <span className="text-sm font-medium text-white max-w-[100px] truncate">{user.name}</span>
               </button>
            ) : (
                <button 
                  onClick={() => onAuthClick('login')} 
                  title="Sign In"
                  aria-label="Sign In"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all border border-white/10 shadow-sm cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  <User size={18} />
                </button>
            )}
          </div>
        </header>
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none pt-safe-top">
        <div className="flex items-center justify-between p-4 pointer-events-auto">
          <div className="flex items-center cursor-pointer select-none" onClick={() => onChange('home')}>
            <span className="font-brand-stylish font-black text-2xl tracking-[0.14em] uppercase bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Parlaxio
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onChange('search')}
              className={`p-2 rounded-full transition-transform active:scale-95 ${currentTab === 'search' ? 'text-white' : 'text-white/90 hover:text-white'}`}
            >
              <Search size={22} className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
            </button>
            {user ? (
               <button onClick={() => onChange('settings')} className="p-0.5 rounded-full bg-transparent border border-white/20 transition-transform active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white via-zinc-200 to-zinc-400 flex items-center justify-center text-sm font-bold text-black shadow-sm shadow-white/10">
                   {user.avatarInitials}
                 </div>
               </button>
            ) : (
               <button onClick={() => onAuthClick('login')} className="p-2 rounded-full transition-transform active:scale-95 text-white/90 hover:text-white">
                 <User size={22} className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
               </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
