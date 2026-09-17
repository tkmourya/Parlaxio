import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Bookmark, Check, Film, Star, Clock, Info, Calendar, Sparkles } from 'lucide-react';
import { getMovieDetails, getCredits, getTvSeason, getImageUrl, getVideos, getCollection } from '../lib/tmdb';
import { Movie, Cast, Episode, Video } from '../types';
import { MovieCard } from '../components/MovieCard';
import { isInWatchlist, toggleWatchlist } from '../lib/storage';
import { TrailerModal } from '../components/TrailerModal';

interface DetailsViewProps {
  media: { id: number; type: 'movie' | 'tv' };
  onBack: () => void;
  onWatch: (id: number, type: 'movie' | 'tv', season?: number, episode?: number) => void;
  onSelectRelated: (id: number, type: 'movie' | 'tv') => void;
}

export function DetailsView({ media, onBack, onWatch, onSelectRelated }: DetailsViewProps) {
  const [details, setDetails] = useState<Movie | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

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
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">Loading details...</span>
        </div>
      </div>
    );
  }

  const title = details.title || details.name;
  const releaseYear = (details.release_date || details.first_air_date)?.split('-')[0];
  const runtimeHours = details.runtime ? Math.floor(details.runtime / 60) : 0;
  const runtimeMinutes = details.runtime ? details.runtime % 60 : 0;

  return (
    <div className="min-h-screen bg-black text-white pb-32 animate-in fade-in duration-300">
      
      {/* Floating Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 text-white shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center group"
        title="Back"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Hero Backdrop Banner */}
      <div className="relative w-full h-[55vh] md:h-[70vh] max-h-[750px] overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Content Body */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 -mt-36 md:-mt-52 space-y-10">
        
        {/* Main Header Info Box */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          
          {/* Poster Card */}
          <div className="w-36 sm:w-48 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/15 shadow-2xl shrink-0 hidden sm:block">
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
          <div className="space-y-4 max-w-3xl flex-1">
            
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              {title}
            </h1>

            {/* Badges & Meta row */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-zinc-300">
              {details.vote_average > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold">
                  <Star size={13} fill="currentColor" />
                  <span>{details.vote_average.toFixed(1)}</span>
                </div>
              )}

              {releaseYear && (
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 flex items-center gap-1">
                  <Calendar size={12} className="text-zinc-400" />
                  {releaseYear}
                </span>
              )}

              {media.type === 'tv' && details.number_of_seasons && (
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10">
                  {details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}
                </span>
              )}

              {details.runtime && details.runtime > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 flex items-center gap-1">
                  <Clock size={12} className="text-zinc-400" />
                  {runtimeHours > 0 ? `${runtimeHours}h ` : ''}{runtimeMinutes}m
                </span>
              )}

              <span className="px-2 py-0.5 rounded uppercase text-[10px] font-bold bg-white/10 text-zinc-300 border border-white/10">
                {media.type === 'tv' ? 'Series' : 'Movie'}
              </span>

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400 flex items-center">
                4K ULTRA HD
              </span>
            </div>

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {details.genres.map(g => (
                  <span key={g.id} className="text-xs text-zinc-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    {g.name}
                  </span>
                ))}
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

            {/* Synopsis / Storyline */}
            {details.overview && (
              <div className="pt-3 space-y-1.5">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Storyline</h3>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-4">
                  {details.overview}
                </p>
              </div>
            )}

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
