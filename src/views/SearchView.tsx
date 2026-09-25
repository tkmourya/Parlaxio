import { useState, useEffect, useCallback, useRef } from 'react';
import { searchMovies } from '../lib/tmdb';
import { Movie } from '../types';
import { Search, Loader2, Clock, Flame, Trash2, X } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const TRENDING_MOVIE_SEARCHES = [
  "Oppenheimer",
  "Inception",
  "Interstellar",
  "Stranger Things",
  "Stree 2",
  "Avengers: Endgame",
  "The Dark Knight",
  "Breaking Bad",
  "Avatar",
  "Dune"
];

export function SearchView({ onPlay }: { onPlay: (id: number, type: 'movie' | 'tv') => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('parlaxio_recent_movie_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) return;
    const clean = searchTerm.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      localStorage.setItem('parlaxio_recent_movie_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setRecentSearches([]);
    localStorage.removeItem('parlaxio_recent_movie_searches');
  };

  const removeSingleRecentSearch = (itemToRemove: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== itemToRemove);
      localStorage.setItem('parlaxio_recent_movie_searches', JSON.stringify(filtered));
      return filtered;
    });
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsFocused(false);
      inputRef.current?.blur();
      if (query.trim()) {
        saveRecentSearch(query);
        executeSearch(query, 1);
      }
    }
  };

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const executeSearch = useCallback(async (searchQuery: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await searchMovies(searchQuery, pageNum);
      const validResults = res.results.filter((m: any) => m.media_type === 'movie' || m.media_type === 'tv');
      
      setResults(prev => {
        if (pageNum === 1) return validResults;
        const newRes = [...prev];
        validResults.forEach((m: any) => {
          if (!newRes.find(existing => existing.id === m.id)) {
            newRes.push(m);
          }
        });
        return newRes;
      });
      setHasMore(res.page < res.total_pages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setPage(1);
    setHasMore(true);
    
    const delayDebounce = setTimeout(() => {
      saveRecentSearch(query);
      executeSearch(query, 1);
    }, 500);
    
    return () => clearTimeout(delayDebounce);
  }, [query, executeSearch, saveRecentSearch]);

  useEffect(() => {
    if (page > 1 && query.trim().length >= 2) {
      executeSearch(query, page);
    }
  }, [page, query, executeSearch]);

  const lastElementRef = useInfiniteScroll(() => {
    setPage(prev => prev + 1);
  }, loading, hasMore);

  // Suggestions dropdown shows when input is focused AND search results are not covering the screen
  const showSuggestions = isFocused && results.length === 0;

  return (
    <div className="px-4 md:px-12 pt-[calc(env(safe-area-inset-top,0px)+6rem)] md:pt-[calc(env(safe-area-inset-top,0px)+9rem)] pb-32 min-h-screen animate-in fade-in">
      <div className="max-w-3xl mx-auto">
        <div ref={containerRef} className="relative mb-10 z-50">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-white/50" size={24} />
          </div>
          
          <form action="." onSubmit={(e) => {
            e.preventDefault();
            setIsFocused(false);
            inputRef.current?.blur();
            if (query.trim()) {
              saveRecentSearch(query);
              executeSearch(query, 1);
            }
          }} className="w-full">
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              className="w-full bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full py-3.5 pl-12 pr-10 focus:outline-none focus:border-white/50 focus:bg-white/20 shadow-lg text-[15px] sm:text-base transition-all placeholder:text-white/50"
              placeholder="Search for movies, TV shows..."
              value={query}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsFocused(true);
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}

          {/* Search Suggestions & Recent Searches Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-theme-bg)] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 md:p-5 z-40 animate-in fade-in zoom-in-95 duration-200">
              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={14} className="text-white/40" /> Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-white/40 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} /> Clear all
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleSuggestionClick(item)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 text-white/90 hover:text-white cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Clock size={16} className="text-white/30 group-hover:text-white/60 flex-shrink-0" />
                          <span className="text-sm truncate">{item}</span>
                        </div>
                        <button
                          onClick={(e) => removeSingleRecentSearch(item, e)}
                          className="text-white/20 hover:text-white/80 p-1 rounded-lg hover:bg-white/10 transition-colors"
                          title="Remove search"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular / Trending Searches */}
              <div>
                <div className="flex items-center gap-1.5 mb-3 px-1 text-white/60 text-xs font-semibold uppercase tracking-wider">
                  <Flame size={14} className="text-white/60" /> Popular Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_MOVIE_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSuggestionClick(term)}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-xs md:text-sm font-medium transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onPlay={onPlay} defaultType="movie" />
          ))}
        </div>

        <div className="flex justify-center h-24 items-center">
          {loading && <Loader2 className="animate-spin text-white/70" size={32} />}
        </div>
        
        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="text-center text-zinc-500 py-20">
            No movies found for "{query}"
          </div>
        )}

        <div ref={lastElementRef} className="h-10 w-full" />
      </div>
    </div>
  );
}
