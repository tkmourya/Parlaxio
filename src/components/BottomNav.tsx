import { Home, Film, Tv, Settings, Zap } from 'lucide-react';
import { TabType } from './TopNav';

interface BottomNavProps {
  currentTab: TabType;
  onChange: (tab: TabType) => void;
}

export function BottomNav({ currentTab, onChange }: BottomNavProps) {
  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-30" />
      <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-full py-2 px-3 flex justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-x-auto hide-scrollbar gap-2">
        
        <button
          onClick={() => onChange('home')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'home' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'home' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Home size={20} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
          </div>
        </button>

        <button
          onClick={() => onChange('movies')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'movies' ? 'text-blue-400' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'movies' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Film size={20} strokeWidth={currentTab === 'movies' ? 2.5 : 2} />
          </div>
        </button>

        <button
          onClick={() => onChange('series')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'series' ? 'text-purple-400' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'series' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Tv size={20} strokeWidth={currentTab === 'series' ? 2.5 : 2} />
          </div>
        </button>

        <button
          onClick={() => onChange('anime')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'anime' ? 'text-pink-400' : 'text-white/50 hover:text-white/80'}`}
        >
          <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'anime' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Zap size={20} strokeWidth={currentTab === 'anime' ? 2.5 : 2} />
          </div>
        </button>

        <button
          onClick={() => onChange('settings')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${currentTab === 'settings' ? 'text-gray-300' : 'text-white/50 hover:text-white/80'}`}
        >
           <div className={`flex items-center justify-center p-2 rounded-full transition-colors ${currentTab === 'settings' ? 'bg-white/20 shadow-inner' : ''}`}>
             <Settings size={20} strokeWidth={currentTab === 'settings' ? 2.5 : 2} />
           </div>
        </button>

      </div>
    </div>
    </>
  );
}
