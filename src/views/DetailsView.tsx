import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Bookmark, Check, Film, Star, Clock, Info, Calendar, Sparkles, ShieldAlert, ChevronLeft } from 'lucide-react';
import { getMovieDetails, getCredits, getTvSeason, getImageUrl, getVideos, getCollection } from '../lib/tmdb';
import { Movie, Cast, Episode, Video } from '../types';
import { MovieCard } from '../components/MovieCard';
import { isInWatchlist, toggleWatchlist } from '../lib/storage';
import { TrailerModal } from '../components/TrailerModal';
import { loadFamilySafeMode } from '../lib/preferences';
import { useImageColor } from '../hooks/useImageColor';

interface DetailsViewProps {
  media: { id: number; type: 'movie' | 'tv' };
  onBack: () => void;
  onWatch: (id: number, type: 'movie' | 'tv', season?: number, episode?: number) => void;
  onSelectRelated: (id: number, type: 'movie' | 'tv') => void;
}

export function DetailsView({ media, onBack, onWatch, onSelectRelated }: DetailsViewProps) {
  const [details, setDetails] = useState<Movie | null>(null);
  useImageColor(details?.backdrop_path ? getImageUrl(details.backdrop_path, 'w500') : null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // TV specific state
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    async function loadData() {
      setLoading(true);
      try {
        const [detRes, credRes] = await Promise.all([
          getMovieDetails(media.type, media.id),
          getCredits(media.type, media.id)
        ]);

        setDetails(detRes);
        
        // Family Safe Block Check
        if (loadFamilySafeMode()) {
          const badKeywords = [
            19037,  // nudity
            13059,  // prostitution/female nudity
            10321,  // erotic
            158718, // sexual content
            255146, // softcore
            267122, // sex
            158713, // bdsm
            1664,   // eroticism
            9799,   // erotica
            100021, // male nudity
            9785,   // perversion
            195669, // ecchi
            198385  // hentai
          ];
          const keywordsArr = detRes.keywords?.keywords || detRes.keywords?.results || [];
          const hasBadKeyword = keywordsArr.some((k: any) => badKeywords.includes(k.id));
          if (hasBadKeyword || detRes.adult) {
            setIsBlocked(true);
            setLoading(false);
            return;
          }
        }

        setCast(credRes.cast ? credRes.cast.slice(0, 12) : []);
        setSaved(isInWatchlist(detRes.id));

        // Load Collection (e.g. Harry Potter parts)
        let collectionItems: Movie[] = [];
        if (detRes.belongs_to_collection) {
          try {
            const col = await getCollection(detRes.belongs_to_collection.id);
            if (col && col.parts) {
              collectionItems = col.parts.map((p: any) => ({ ...p, media_type: 'movie' }));
            }
          } catch (e) {
            console.error(e);
          }
        }

        // Load recommendations
        let recs: Movie[] = [];
        if (detRes.recommendations && detRes.recommendations.results && detRes.recommendations.results.length > 0) {
          recs = detRes.recommendations.results;
        } else if (detRes.similar && detRes.similar.results) {
          recs = detRes.similar.results;
        }

        // Combine Collection + Recommendations, filter duplicates, limit to 15
        const combined = [...collectionItems, ...recs];
        const uniqueMap = new Map(combined.map(item => [item.id, item]));
        setRecommended(Array.from(uniqueMap.values()).slice(0, 15));
      } catch (err) {
        console.error('Failed to load movie details', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [media.id, media.type]);

  // Load TV season episodes
  useEffect(() => {
    if (media.type !== 'tv' || !details) return;

    async function loadEpisodes() {
      setLoadingEpisodes(true);
      try {
        const data = await getTvSeason(media.id, selectedSeason);
        setEpisodesList(data.episodes || []);
      } catch (e) {
        console.error('Failed to load season episodes', e);
      } finally {
        setLoadingEpisodes(false);
      }
    }
    loadEpisodes();
  }, [media.id, media.type, selectedSeason, details]);

  // Watchlist sync
  useEffect(() => {
    if (!details) return;
    setSaved(isInWatchlist(details.id));
    const handleUpdate = () => setSaved(isInWatchlist(details.id));
    window.addEventListener('watchlist-updated', handleUpdate);
    return () => window.removeEventListener('watchlist-updated', handleUpdate);
  }, [details?.id]);

  const handleToggleWatchlist = () => {
    if (!details) return;
    toggleWatchlist(details);
    setSaved(!saved);
  };

  const handlePlayTrailer = async () => {
    try {
      const res = await getVideos(media.type, media.id);
      const trailers = res.results.filter((v: Video) => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailers.length > 0) {
        setTrailerKey(trailers[0].key);
      } else {
        alert('Trailer not available for this title');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !details) {
    return (
      <div className="min-h-screen bg-transparent text-white pb-32">
        {/* Floating Back Button Skeleton */}
        <div className="absolute top-[max(env(safe-area-inset-top,0px),1.25rem)] left-5 md:left-6 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/5 animate-pulse" />
        
        {/* Hero Backdrop Skeleton */}
        <div className="relative w-full h-[65vh] md:h-[75vh] max-h-[850px] bg-zinc-900/50 animate-pulse">
          <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[var(--color-theme-bg)] to-transparent" />
        </div>

        {/* Content Body Skeleton */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 -mt-44 md:-mt-60 space-y-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            
            {/* Poster Card Skeleton */}
            <div className="w-36 sm:w-48 md:w-56 aspect-[2/3] rounded-2xl bg-zinc-800/80 animate-pulse shrink-0 hidden sm:block shadow-lg border border-white/5" />

            {/* Details & Actions Skeleton */}
            <div className="space-y-6 max-w-3xl flex-1 min-w-0 w-full pt-4 md:pt-0">
              
              {/* Title Skeleton */}
              <div className="h-10 md:h-14 bg-zinc-800/80 rounded-xl w-3/4 md:w-2/3 animate-pulse" />
              
              {/* Badges Skeleton */}
              <div className="flex gap-3">
                <div className="h-5 w-16 bg-zinc-800/80 rounded-md animate-pulse" />
                <div className="h-5 w-12 bg-zinc-800/80 rounded-md animate-pulse" />
                <div className="h-5 w-20 bg-zinc-800/80 rounded-md animate-pulse" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2">
                <div className="h-12 w-32 md:w-40 bg-zinc-800/80 rounded-full animate-pulse" />
                <div className="h-12 w-12 bg-zinc-800/80 rounded-full animate-pulse" />
                <div className="h-12 w-12 bg-zinc-800/80 rounded-full animate-pulse" />
              </div>

              {/* Overview Skeleton */}
              <div className="space-y-3 pt-6">
                <div className="h-4 bg-zinc-800/60 rounded-md w-full animate-pulse" />
                <div className="h-4 bg-zinc-800/60 rounded-md w-[90%] animate-pulse" />
                <div className="h-4 bg-zinc-800/60 rounded-md w-[80%] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Content Blocked</h2>
        <p className="text-zinc-400 mb-8 max-w-sm">
          Family Safe Mode is turned ON. This content contains explicit themes or nudity and has been hidden.
        </p>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const title = details.title || details.name;
  const releaseYear = (details.release_date || details.first_air_date)?.split('-')[0];
  const runtimeHours = details.runtime ? Math.floor(details.runtime / 60) : 0;
  const runtimeMinutes = details.runtime ? details.runtime % 60 : 0;

  const getAgeRating = () => {
    if (!details) return null;
    let rating = '';
    if (media.type === 'movie' && (details as any).release_dates?.results) {
      const results = (details as any).release_dates.results;
      const inRelease = results.find((r: any) => r.iso_3166_1 === 'IN' && r.release_dates?.some((d: any) => d.certification));
      const usRelease = results.find((r: any) => r.iso_3166_1 === 'US' && r.release_dates?.some((d: any) => d.certification));
      const anyRelease = results.find((r: any) => r.release_dates?.some((d: any) => d.certification));
      const release = inRelease || usRelease || anyRelease;
      
      if (release) {
        const validDate = release.release_dates?.find((d: any) => d.certification && d.certification !== '');
        if (validDate) rating = validDate.certification;
      }
    } else if (media.type === 'tv' && (details as any).content_ratings?.results) {
      const inRating = (details as any).content_ratings.results.find((r: any) => r.iso_3166_1 === 'IN' && r.rating);
      const usRating = (details as any).content_ratings.results.find((r: any) => r.iso_3166_1 === 'US' && r.rating);
      const anyRating = (details as any).content_ratings.results.find((r: any) => r.rating);
      const contentRating = inRating || usRating || anyRating;
      rating = contentRating?.rating || '';
    }

    if (/^\d+$/.test(rating)) {
      rating = parseInt(rating, 10) >= 18 ? '18+' : `U/A ${rating}+`;
    }

    return rating || (details.adult ? '18+' : '');
  };
  const ageRating = getAgeRating();

  return (
    <div className="min-h-screen bg-transparent text-white pb-32 animate-in fade-in duration-300">
      
      {/* Floating Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-[max(env(safe-area-inset-top,0px),1.25rem)] left-5 md:left-6 z-30 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors border border-white/10 backdrop-blur-md shadow-lg group"
        title="Go Back"
      >
        <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Hero Backdrop Banner */}
      <div className="relative w-full h-[65vh] md:h-[75vh] max-h-[850px] overflow-hidden">
        {details.backdrop_path ? (
          <img 
            src={getImageUrl(details.backdrop_path, 'original')} 
            alt={title}
            className="w-full h-full object-cover object-top md:object-[center_20%] opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900" />
        )}
        
        {/* Cinematic Vignette Gradients */}
        <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-[var(--color-theme-bg)] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-full md:w-[60%] bg-gradient-to-r from-[var(--color-theme-bg)] to-transparent pointer-events-none opacity-80" />
      </div>

      {/* Content Body */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 -mt-44 md:-mt-60 space-y-10">
        
        {/* Main Header Info Box */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          
          {/* Poster Card */}
          <div className="w-36 sm:w-48 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg shrink-0 hidden sm:block">
            {details.poster_path ? (
              <img 
                src={getImageUrl(details.poster_path, 'w500')} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 font-medium">No Image</div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="space-y-4 max-w-3xl flex-1 min-w-0 w-full">
            
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              {title}
            </h1>

            {/* Badges & Meta row */}
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-semibold text-zinc-300">
              {details.vote_average > 0 && (
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star size={14} fill="currentColor" />
                  <span>{details.vote_average.toFixed(1)}</span>
                </div>
              )}

              {releaseYear && (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span>{releaseYear}</span>
                </>
              )}

              {media.type === 'tv' && details.number_of_seasons && (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span>{details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}</span>
                </>
              )}

              {ageRating && (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-white/10 backdrop-blur-md text-white/90 uppercase border-0">
                    {ageRating}
                  </span>
                </>
              )}

              {details.runtime && details.runtime > 0 && (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span>{runtimeHours > 0 ? `${runtimeHours}h ` : ''}{runtimeMinutes}m</span>
                </>
              )}

              <span className="hidden md:inline text-zinc-600">&bull;</span>
              <span className="hidden md:inline uppercase text-xs font-bold text-zinc-400">
                {media.type === 'tv' ? 'Series' : 'Movie'}
              </span>

              <span className="text-zinc-600">&bull;</span>
              <span className="text-xs font-extrabold bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                4K
              </span>
            </div>

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="pt-1 text-xs md:text-sm text-zinc-400 font-medium break-words">
                {details.genres.map(g => g.name).join(' • ')}
              </div>
            )}

            {/* Available Languages (Inferred from TMDB Translations) */}
            {details.translations?.translations && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs md:text-sm text-zinc-400 mr-1">Languages:</span>
                <span className="text-xs md:text-sm text-zinc-400">
                  {Array.from(new Set(
                    details.translations.translations
                      .filter((t: any) => ['hi', 'en', 'te', 'ta', 'ja', 'ko', 'es', 'fr', 'de'].includes(t.iso_639_1))
                      .map((t: any) => t.english_name)
                  )).join(', ')}
                </span>
              </div>
            )}

            {/* Synopsis / Storyline */}
            {details.overview && (
              <div className="pt-2 space-y-1">
                <p className={`text-zinc-400 text-sm md:text-base leading-relaxed max-w-3xl ${!isOverviewExpanded ? 'line-clamp-3 md:line-clamp-4' : ''}`}>
                  {details.overview}
                </p>
                {details.overview.length > 150 && (
                  <button 
                    onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                    className="text-white text-xs font-bold mt-1 hover:underline cursor-pointer"
                  >
                    {isOverviewExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons (Watch Now + Watchlist + Trailer) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-3">
              <button 
                onClick={() => onWatch(media.id, media.type, selectedSeason, 1)}
                className="px-5 md:px-7 py-3 md:py-3.5 rounded-full bg-gradient-to-r from-white via-zinc-200 to-zinc-400 hover:from-white hover:via-zinc-100 hover:to-zinc-300 text-black font-extrabold text-[13px] md:text-base flex items-center gap-2 shadow-[0_4px_15px_rgba(255,255,255,0.2)] transition-all active:scale-95 cursor-pointer"
              >
                <Play fill="black" size={16} className="md:w-[18px] md:h-[18px]" />
                <span>Watch Now</span>
              </button>

              <button 
                onClick={handlePlayTrailer}
                className="px-4 md:px-5 py-3 md:py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-[13px] md:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-md"
              >
                <Info size={16} className="text-zinc-400 md:w-[18px] md:h-[18px]" />
                <span>Trailer</span>
              </button>

              <button 
                onClick={handleToggleWatchlist}
                title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
                className={`w-[42px] h-[42px] md:w-auto md:px-5 md:py-3.5 flex items-center justify-center gap-2 rounded-full backdrop-blur-xl transition-all active:scale-95 cursor-pointer shadow-md text-[13px] md:text-sm font-semibold shrink-0 ${
                  saved 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                <Bookmark size={16} className="md:w-[18px] md:h-[18px]" fill={saved ? "currentColor" : "none"} />
                <span className="hidden md:inline">{saved ? "Watchlisted" : "Watchlist"}</span>
              </button>
            </div>

          </div>

        </div>

        {/* If TV Series: Seasons & Episodes Section */}
        {media.type === 'tv' && details.number_of_seasons && details.number_of_seasons > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Episodes</h2>
              
              {/* Season Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                {Array.from({ length: details.number_of_seasons }, (_, i) => i + 1).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedSeason === s
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10'
                    }`}
                  >
                    Season {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Episodes List */}
            {loadingEpisodes ? (
              <div className="py-12 flex justify-center text-zinc-500 text-xs">Loading episodes...</div>
            ) : episodesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {episodesList.map((ep) => (
                  <div 
                    key={ep.id}
                    onClick={() => onWatch(media.id, 'tv', selectedSeason, ep.episode_number)}
                    className="p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-white/10 hover:border-white/20 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between gap-3"
                  >
                    <div className="flex gap-3">
                      <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                        {ep.still_path ? (
                          <img src={getImageUrl(ep.still_path, 'w500')} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No preview</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play fill="white" size={20} className="text-white drop-shadow" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Episode {ep.episode_number}
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-zinc-200 transition-colors">
                          {ep.name}
                        </h4>
                        {(ep as any).runtime && (
                          <span className="text-[11px] text-zinc-500 block mt-0.5">{(ep as any).runtime} mins</span>
                        )}
                      </div>
                    </div>

                    {ep.overview && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {ep.overview}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs">No episode data available for this season.</div>
            )}
          </div>
        )}

        {/* Cast Section */}
        {cast.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h2 className="text-xl font-bold text-white">Cast</h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3">
              {cast.map(c => (
                <div key={c.id} className="w-24 shrink-0 text-center space-y-1.5">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-zinc-900 shadow-md">
                    {c.profile_path ? (
                      <img src={getImageUrl(c.profile_path, 'w500')} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-medium">N/A</div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-white block truncate">{c.name}</span>
                  <span className="text-[10px] text-zinc-400 block truncate">{c.character}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations / Similar Titles */}
        {recommended.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/10 w-full overflow-hidden">
            <h2 className="text-xl font-bold text-white">More Like This</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {recommended.map(movie => (
                <div key={movie.id} className="w-36 sm:w-40 md:w-48 flex-shrink-0 snap-start">
                  <MovieCard 
                    movie={movie} 
                    onPlay={(id, type) => onSelectRelated(id, type)} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Trailer Modal */}
      {trailerKey && (
        <TrailerModal trailerKey={trailerKey} onClose={() => setTrailerKey(null)} />
      )}

    </div>
  );
}
