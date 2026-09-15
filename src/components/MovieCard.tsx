import { Movie } from '../types';
import { getImageUrl } from '../lib/tmdb';
import { Star, Bookmark, Check, Play } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { isInWatchlist, toggleWatchlist } from '../lib/storage';

export interface MovieCardProps {
  movie: Movie;
  onPlay: (id: number, type: 'movie' | 'tv') => void;
  defaultType?: 'movie' | 'tv';
}

export function MovieCard({ movie, onPlay, defaultType = 'movie' }: MovieCardProps) {
  const [saved, setSaved] = useState(false);
  const title = movie.title || movie.name;
  const mediaType = movie.media_type || defaultType;
  const releaseYear = (movie.release_date || movie.first_air_date)?.split('-')[0] || '';
  
  useEffect(() => {
    setSaved(isInWatchlist(movie.id));
    
    // Listen for cross-component updates
    const handleUpdate = () => setSaved(isInWatchlist(movie.id));
    window.addEventListener('watchlist-updated', handleUpdate);
    return () => window.removeEventListener('watchlist-updated', handleUpdate);
  }, [movie.id]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering onPlay
    toggleWatchlist(movie);
    setSaved(!saved);
  };

  return (
    <div className="w-full flex flex-col group cursor-pointer" onClick={() => onPlay(movie.id, mediaType)}>
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-zinc-900 border border-white/10 shadow-xl transition-all duration-300 md:group-hover:scale-105 md:group-hover:border-white/30 md:group-hover:shadow-2xl md:group-hover:z-30">
        <img 
          src={getImageUrl(movie.poster_path)} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-110"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        


        {/* Mobile-only play icon overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 md:group-hover:opacity-0 transition-opacity flex items-center justify-center z-10 md:hidden">
           <Play fill="white" size={48} className="drop-shadow-lg" />
        </div>

        {/* Progress Bar (Continue Watching) */}
        {movie.progress !== undefined && movie.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20 overflow-hidden">
            <div 
              className="h-full bg-[#e50914] shadow-[0_0_10px_rgba(229,9,20,0.8)] transition-all duration-500 ease-out"
              style={{ width: `${movie.progress}%` }}
            />
          </div>
        )}

        {/* Desktop Internal Hover Details Overlay (Doesn't break grid) */}
        <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent flex-col justify-end p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10 pointer-events-none group-hover:pointer-events-auto">
          {/* Actions Row */}
          <div className="flex items-center gap-2 mb-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onPlay(movie.id, mediaType); }}
              className="w-8 h-8 bg-white hover:bg-zinc-200 text-black rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              <Play fill="currentColor" size={14} className="ml-0.5" />
            </button>
            <button 
              onClick={handleSave}
              className="w-8 h-8 bg-zinc-800/80 hover:bg-zinc-700 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {saved ? <Check size={16} className="text-green-400" /> : <Bookmark size={16} />}
            </button>
          </div>

          {/* Info Row */}
          <div className="flex items-center gap-2 text-xs font-semibold mb-2 drop-shadow-md">
            <span className="text-green-400">{(movie.vote_average * 10).toFixed(0)}% Match</span>
            {releaseYear && <span className="text-zinc-300">{releaseYear}</span>}
            <span className="border border-zinc-500 text-zinc-300 px-1 rounded uppercase text-[10px]">{mediaType}</span>
          </div>

          {/* Synopsis */}
          <div className="text-[11px] text-zinc-300 font-medium line-clamp-3 leading-snug drop-shadow-md">
            {movie.overview || "No description available."}
          </div>
        </div>
      </div>

      {/* Title & Metadata (Rating + Year) */}
      <div className="mt-2 flex flex-col">
        <h3 className="text-xs md:text-sm font-semibold text-white truncate leading-snug group-hover:text-zinc-200 transition-colors">
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[11px] md:text-xs text-zinc-400 font-medium">
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-1 text-white">
              <Star className="w-3 h-3 text-white fill-white" />
              <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
          {releaseYear && <span>{releaseYear}</span>}
        </div>
      </div>
    </div>
  );
}
