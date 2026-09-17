import { Play, Tv, Signal } from 'lucide-react';

interface ProviderCardsProps {
  onSelect: (providerId: string, name: string) => void;
  onLiveTVClick?: () => void;
}

const PROVIDERS = [
  { id: '8', name: 'Netflix', color: 'from-red-600 to-red-900', logoText: 'NETFLIX' },
  { id: '119', name: 'Prime Video', color: 'from-blue-500 to-blue-800', logoText: 'prime' },
  { id: '122', name: 'JioHotstar', color: 'from-indigo-600 to-blue-900', logoText: 'jiohotstar' },
  { id: '220', name: 'JioCinema', color: 'from-pink-500 to-rose-700', logoText: 'JioCinema' },
  { id: '283', name: 'Crunchyroll', color: 'from-orange-500 to-orange-700', logoText: 'crunchyroll' },
];

export function ProviderCards({ onSelect, onLiveTVClick }: ProviderCardsProps) {
  return (
    <div className="mb-10 px-4 md:px-12 lg:px-16">
      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-4 flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-white via-zinc-200 to-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]"></div>
        Streaming Partners
      </h2>
      <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 snap-x snap-mandatory">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSelect(provider.id, provider.name)}
            className="flex-none w-36 md:w-48 h-16 md:h-20 rounded-2xl bg-white/5 backdrop-blur-xl snap-start hover:bg-white/10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden group relative cursor-pointer text-left flex items-center justify-center"
          >
            {/* White Bokeh/Glow in the background */}
            <div className="absolute -inset-4 bg-white opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-500 z-0"></div>
            
            {/* Glass Highlights */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

            <div className="absolute z-20 flex items-center justify-center">
              <span className="font-black text-sm md:text-base tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400 drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
                {provider.logoText}
              </span>
            </div>

            <div className="absolute -bottom-2 -right-2 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity z-0 transform group-hover:scale-110 duration-500">
              <Play size={56} fill="currentColor" className="text-white" />
            </div>
          </button>
        ))}

        {/* Live TV Card */}
        {onLiveTVClick && (
          <button
            onClick={onLiveTVClick}
            className="flex-none w-36 md:w-48 h-16 md:h-20 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/20 backdrop-blur-xl snap-start hover:from-red-600/30 hover:to-red-900/30 border border-red-500/20 transition-all duration-300 shadow-[0_8px_32px_rgba(220,38,38,0.15)] overflow-hidden group relative cursor-pointer text-left flex items-center justify-center"
          >
            <div className="absolute -inset-4 bg-red-500 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            
            <div className="absolute z-20 flex items-center justify-center gap-2">
              <Signal className="text-red-500 animate-pulse" size={16} />
              <span className="font-black text-sm md:text-base tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-br from-white to-red-200 drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
                LIVE TV
              </span>
            </div>

            <div className="absolute -bottom-2 -right-2 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity z-0 transform group-hover:scale-110 duration-500">
              <Tv size={56} fill="currentColor" className="text-red-500" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
