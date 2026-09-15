import { useRef, useState, useEffect, useCallback } from 'react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onPlay: (id: number, type: 'movie' | 'tv') => void;
  defaultType?: 'movie' | 'tv';
  isTop10?: boolean;
}

export function MovieRow({ title, movies, onPlay, defaultType = 'movie', isTop10 = false }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!movies.length) return null;
  
  const displayMovies = isTop10 ? movies.slice(0, 10) : movies;

  const updateScrollButtons = useCallback(() => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = rowRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [displayMovies, updateScrollButtons]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const clientWidth = rowRef.current.clientWidth;
    const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative mb-8 md:mb-12 group/row">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 md:px-12 lg:px-16 tracking-tight">
        {title}
      </h2>
      
      {/* Desktop Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
          className="hidden md:flex absolute left-0 top-[calc(50%+12px)] -translate-y-1/2 z-30 h-[calc(100%-48px)] w-12 lg:w-16 items-center justify-center bg-gradient-to-r from-black/90 via-black/50 to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-all duration-300"
        >
          <div className="p-2 rounded-full bg-black/60 border border-white/20 hover:bg-white/20 hover:scale-110 transition-all shadow-xl">
            <ChevronLeft size={24} />
          </div>
        </button>
      )}

      {/* Desktop Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
          className="hidden md:flex absolute right-0 top-[calc(50%+12px)] -translate-y-1/2 z-30 h-[calc(100%-48px)] w-12 lg:w-16 items-center justify-center bg-gradient-to-l from-black/90 via-black/50 to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-all duration-300"
        >
          <div className="p-2 rounded-full bg-black/60 border border-white/20 hover:bg-white/20 hover:scale-110 transition-all shadow-xl">
            <ChevronRight size={24} />
          </div>
        </button>
      )}

      {/* Horizontal Scroll Container */}
      <div 
        ref={rowRef}
        className="flex overflow-x-auto hide-scrollbar gap-4 md:gap-5 py-4 -my-4 px-4 md:px-12 lg:px-16 scroll-px-4 md:scroll-px-12 lg:scroll-px-16 snap-x snap-mandatory"
      >
        {displayMovies.map((movie, index) => (
          <div 
            key={movie.id} 
            className="flex-none snap-start relative w-32 md:w-48 group/card"
          >
            {/* Pure Minimal Frosted Glass Number (No Box, No '#') */}
            {isTop10 && (
              <span 
                className="absolute top-1 left-2 z-30 select-none pointer-events-none text-4xl md:text-5xl font-black leading-none tracking-tighter"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.45) 60%, rgba(255, 255, 255, 0.1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.5)',
                  filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.9))'
                }}
              >
                {index + 1}
              </span>
            )}
            <div className="relative z-10 w-full">
              <MovieCard movie={movie} onPlay={onPlay} defaultType={defaultType} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
