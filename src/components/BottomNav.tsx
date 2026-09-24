import { Home, Film, Tv, Settings, Zap, Music } from 'lucide-react';
import { TabType } from './TopNav';

interface BottomNavProps {
  currentTab: TabType;
  onChange: (tab: TabType) => void;
}

export function BottomNav({ currentTab, onChange }: BottomNavProps) {
  return (
    <>
      <svg width="0" height="0" className="absolute pointer-events-none">
        <linearGradient id="iconGradient" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>
      </svg>
      <div className="bottom-nav-container md:hidden fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--color-theme-bg)] to-transparent pointer-events-none z-30 opacity-90" />
      <div className="bottom-nav-container md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-full py-2 px-3 flex justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-x-auto hide-scrollbar gap-2">
        
        <button
          onClick={() => onChange('home')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'home' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'home' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Home size={20} strokeWidth={currentTab === 'home' ? 2.5 : 2} color={currentTab === 'home' ? 'url(#iconGradient)' : 'currentColor'} />
          </div>
        </button>

        <button
          onClick={() => onChange('movies')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'movies' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'movies' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Film size={20} strokeWidth={currentTab === 'movies' ? 2.5 : 2} color={currentTab === 'movies' ? 'url(#iconGradient)' : 'currentColor'} />
          </div>
        </button>

        <button
          onClick={() => onChange('series')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'series' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'series' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Tv size={20} strokeWidth={currentTab === 'series' ? 2.5 : 2} color={currentTab === 'series' ? 'url(#iconGradient)' : 'currentColor'} />
          </div>
        </button>

        <button
          onClick={() => onChange('music')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'music' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'music' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Music size={20} strokeWidth={currentTab === 'music' ? 2.5 : 2} color={currentTab === 'music' ? 'url(#iconGradient)' : 'currentColor'} />
          </div>
        </button>

        <button
          onClick={() => onChange('anime')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'anime' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'anime' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Zap size={20} strokeWidth={currentTab === 'anime' ? 2.5 : 2} color={currentTab === 'anime' ? 'url(#iconGradient)' : 'currentColor'} />
          </div>
        </button>



      </div>
    </div>
    </>
  );
}
