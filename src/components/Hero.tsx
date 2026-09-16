import { Movie, Video } from '../types';
import { getImageUrl, getVideos } from '../lib/tmdb';
import { Play, Bookmark, Check, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isInWatchlist, toggleWatchlist } from '../lib/storage';
import { TrailerModal } from './TrailerModal';

interface HeroProps {
  movies: Movie[];
  onPlay: (id: number, type: 'movie' | 'tv') => void;
  defaultType?: 'movie' | 'tv';
}

export function Hero({ movies, onPlay, defaultType = 'movie' }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  
  const movie = movies[activeIndex];
  const title = movie?.title || movie?.name;
  const mediaType = movie?.media_type || defaultType;

  // Auto-slide
  useEffect(() => {
    if (!movies || movies.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % Math.min(movies.length, 5));
    }, 8000); // 8 seconds per slide
    return () => clearInterval(interval);
  }, [movies]);
  
  useEffect(() => {
    if (!movie) return;
    setSaved(isInWatchlist(movie.id));
    
    // Listen for updates from other tabs/cards
    const handleUpdate = () => setSaved(isInWatchlist(movie.id));
    window.addEventListener('watchlist-updated', handleUpdate);
    return () => window.removeEventListener('watchlist-updated', handleUpdate);
  }, [movie?.id]);

  const handleSave = () => {
    toggleWatchlist(movie);
    setSaved(!saved);
  };

  const handlePlayTrailer = async () => {
    try {
      const res = await getVideos(mediaType, movie.id);
      const trailers = res.results.filter((v: Video) => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailers.length > 0) {
        setTrailerKey(trailers[0].key);
      } else {
        alert("Trailer not available");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!movie) return null;

  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[100dvh] md:min-h-screen flex flex-col justify-end pb-8 sm:pb-10 md:pb-16 lg:pb-16 pt-20 md:pt-36 overflow-hidden transition-all duration-1000">
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 z-0 scale-110 blur-3xl opacity-40 mix-blend-screen pointer-events-none">
        <img 
          src={getImageUrl(movie.backdrop_path, 'w500')} 
          alt="ambient"
          className="w-full h-full object-cover object-top transition-opacity duration-1000"
        />
      </div>

      {/* Main Background Image */}
      <div className="absolute inset-0 z-10 transition-opacity duration-1000">
        <img 
          key={movie.id} // force re-render for crisp fade
          src={getImageUrl(movie.backdrop_path, 'original')} 
          alt={title}
          className="w-full h-full object-cover object-top md:object-[center_15%] animate-in fade-in duration-1000 text-transparent"
          referrerPolicy="no-referrer"
        />
        {/* Gradient Overlays for smooth blending into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/35 to-transparent md:w-3/4 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-20 px-4 md:px-12 max-w-4xl animate-in slide-in-from-bottom-4 fade-in duration-700 w-full" key={`content-${movie.id}`}>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
          {title}
        </h1>
        <p className="text-zinc-300 text-sm md:text-lg mb-6 max-w-2xl line-clamp-3 md:line-clamp-4 drop-shadow-md">
          {movie.overview}
        </p>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <button 
            onClick={() => onPlay(movie.id, mediaType)}
            className="bg-white text-black hover:bg-zinc-200 transition-colors font-bold py-2.5 px-6 md:py-3 md:px-8 rounded-full flex items-center gap-2 text-base md:text-lg shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          >
            <Play fill="currentColor" size={20} className="md:w-6 md:h-6" />
            Play
          </button>
          
          <button 
            onClick={handlePlayTrailer}
            className="bg-zinc-500/50 hover:bg-zinc-500/70 border border-white/20 backdrop-blur-md text-white transition-colors font-semibold py-2.5 px-6 md:py-3 md:px-8 rounded-full flex items-center gap-2 text-base md:text-lg shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          >
            <Info size={20} className="md:w-6 md:h-6" />
            Trailer
          </button>

          <button 
            onClick={handleSave}
            className="bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md text-white transition-colors p-2.5 md:p-3.5 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            {saved ? <Check size={20} className="text-green-400 md:w-6 md:h-6" /> : <Bookmark size={20} className="md:w-6 md:h-6" />}
          </button>
        </div>

        {/* Carousel Indicators */}
        <div className="mt-3 md:mt-5 flex gap-2">
          {movies.slice(0, 5).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === i ? 'w-8 bg-white' : 'w-2 bg-white/40 cursor-pointer hover:bg-white/70'}`}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </div>

      <TrailerModal trailerKey={trailerKey} onClose={() => setTrailerKey(null)} />
    </div>
  );
}
