import { useState, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Loader2 } from 'lucide-react';
import { useMusic } from '../lib/MusicContext';
import { SearchResult, PlaylistItem } from '../lib/musicService';
import { ArtistAvatar } from '../components/ArtistAvatar';

interface CategoryViewProps {
  title: string;
  items: (SearchResult | PlaylistItem)[];
  onBack: () => void;
  onItemClick: (item: any) => void;
}

export function CategoryView({ title, items, onBack, onItemClick }: CategoryViewProps) {
  const { currentSong, isPlaying } = useMusic();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const isCurrentSong = (id: string) => currentSong?.id === id;

  if (loading) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-white/50 mb-4" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 min-h-screen animate-in fade-in zoom-in-95 duration-300 bg-[var(--color-theme-bg)]">
      <div className="pt-6 md:pt-8 px-6 lg:px-12 pb-6 flex items-center gap-4 sticky top-0 bg-[var(--color-theme-bg)] backdrop-blur-xl z-20 border-b border-white/[0.04]">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors border border-white/10 backdrop-blur-md shadow-lg"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
      </div>

      <div className="px-6 lg:px-12 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {items.map((item) => {
            const type = (item as any).type;
            const isPlaylist = type === 'playlist' || type === 'album';
            const isArtist = type === 'artist';
            const isSong = !isPlaylist && !isArtist;

            return (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className="group cursor-pointer"
              >
                <div className={`relative w-full aspect-square mb-3 overflow-hidden shadow-lg shadow-black/20 bg-white/5 ${isArtist ? 'rounded-full' : 'rounded-xl'}`}>
                  <ArtistAvatar
                    src={item.coverUrl}
                    name={item.title}
                    isArtist={isArtist}
                    className="w-full h-full"
                    imgClassName={`w-full h-full object-cover transition-transform duration-500 ${
                      isArtist ? 'group-hover:scale-105' : 'scale-[1.28] origin-center group-hover:scale-[1.34]'
                    }`}
                    textClassName="text-xl md:text-2xl font-extrabold"
                  />
                  <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] ${isArtist ? 'rounded-full' : 'rounded-xl'}`}>
                    {isPlaylist || isArtist ? (
                       <div className="w-12 h-12 rounded-full bg-white text-black shadow-lg translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                         <Play size={24} fill="currentColor" className="ml-1" />
                       </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCurrentSong(item.id) && isPlaying ? 'bg-white text-black' : 'bg-white text-black shadow-lg translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300'}`}>
                        {isCurrentSong(item.id) && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                      </div>
                    )}
                  </div>
                </div>
                <h4 className={`font-medium text-sm md:text-base truncate text-center ${isSong && isCurrentSong(item.id) ? 'text-white' : 'text-white/90'}`}>{item.title}</h4>
                <p className="text-white/50 text-xs md:text-sm truncate text-center mt-0.5">
                  {isArtist ? 'Artist' : (item as any).artist || ((item as any).type === 'album' ? 'Album' : 'Playlist')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
