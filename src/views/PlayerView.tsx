import { ArrowLeft, Play, Bookmark, Check, Info, Server, X, Loader2, Star } from 'lucide-react';
import { loadDefaultServer } from '../lib/preferences';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSmartRecommendations, getMovieDetails, getCredits, getTvSeason, getImageUrl, getVideos } from '../lib/tmdb';
import { Movie, Cast, Episode, Video } from '../types';
import { MovieCard } from '../components/MovieCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { isInWatchlist, toggleWatchlist } from '../lib/storage';
import { TrailerModal } from '../components/TrailerModal';

const STREAM_SERVERS = [
  {
    id: 'vidlink_4k',
    name: 'Server 1 (VidLink)',
    desc: '4K & 1080p Ultra HD (Fast Stream)',
    quality: '4K UHD',
    badge: 'HD',
    getUrl: (id: number, type: 'movie' | 'tv', s: number, e: number, isAnime?: boolean) =>
      isAnime && type === 'tv'
        ? `https://vidlink.pro/anime/${id}/${e}/dub?fallback=true&primaryColor=e50914&autoplay=1`
        : type === 'tv'
          ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&autoplay=1`
          : `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=1`
  },
  {
    id: 'vidsrc_sbs',
    name: 'Server 2 (VidSrc SBS)',
    desc: 'High Speed Multi-Source HD',
    quality: '1080p HD',
    badge: 'UHD',
    getUrl: (id: number, type: 'movie' | 'tv', s: number, e: number, isAnime?: boolean) =>
      type === 'tv'
        ? `https://vidsrc.sbs/embed/tv/${id}/${s}/${e}?autoplay=1&color=e50914`
        : `https://vidsrc.sbs/embed/movie/${id}?autoplay=1&color=e50914`
  },
  {
    id: 'vidcore',
    name: 'Server 3 (VidCore)',
    desc: 'Alternative Fast Server',
    quality: '1080p HD',
    badge: 'Core',
    getUrl: (id: number, type: 'movie' | 'tv', s: number, e: number, isAnime?: boolean) =>
      type === 'tv'
        ? `https://www.vidcore.org/embed/tv/${id}/${s}/${e}`
        : `https://www.vidcore.org/embed/movie/${id}`
  },
  {
    id: 'twoembed_cc',
    name: 'Server 4 (2Embed)',
    desc: 'Stable Global CDN Node',
    quality: '1080p HD',
    badge: 'Global HD',
    getUrl: (id: number, type: 'movie' | 'tv', s: number, e: number, isAnime?: boolean) =>
      type === 'tv'
        ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${id}`
  },
  {
    id: 'vidsrc_buzz',
    name: 'Server 5 (VidSrc Buzz)',
    desc: 'Reliable Streaming Network',
    quality: '1080p HD',
    badge: 'VidSrc',
    getUrl: (id: number, type: 'movie' | 'tv', s: number, e: number, isAnime?: boolean) =>
      type === 'tv'
        ? `https://vidsrc.buzz/embed/tv/${id}/${s}/${e}?autoplay=1&color=e50914`
        : `https://vidsrc.buzz/embed/movie/${id}?autoplay=1&color=e50914`
  },
  {
    id: 'vidsrc_cc',
    name: 'Server 6 (VidSrc CC)',
    desc: 'Reliable Streaming Network',
    quality: '1080p HD',
    badge: 'VidSrc',
    getUrl: (id: number, type: 'movie' | 'tv', s: number, e: number, isAnime?: boolean) =>
      type === 'tv'
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?autoplay=1&color=e50914`
        : `https://vidsrc.cc/v2/embed/movie/${id}?autoplay=1&color=e50914`
  },
  {
    id: 'smashystream_hindi',
    name: 'Server 7 (SmashS)',
    desc: 'Multi-Audio & Hindi Dub',
    quality: '1080p HD',
    badge: 'HiDub',
    getUrl: (id: number, type: 'movie' | 'tv', s: number, e: number, isAnime?: boolean) =>
      type === 'tv'
        ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&ep=${e}`
        : `https://embed.smashystream.com/playere.php?tmdb=${id}`
  }
];

interface PlayerViewProps {
  media: { id: number; type: 'movie' | 'tv'; isAnime?: boolean; season?: number; episode?: number };
  onBack: () => void;
  onPlay?: (id: number, type: 'movie' | 'tv') => void;
}

export function PlayerView({ media, onBack, onPlay }: PlayerViewProps) {
  const [details, setDetails] = useState<Movie | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [saved, setSaved] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isPlayingStream, setIsPlayingStream] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);



  // TV specific state
  const [season, setSeason] = useState(media.season || 1);
  const [episode, setEpisode] = useState(media.episode || 1);
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const { addToHistory } = useWatchHistory();

  // Load details and cast
  const detailsRef = useRef<Movie | null>(null);
  const playTimeRef = useRef(0);

  // Track time spent watching
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingStream) {
      interval = setInterval(() => {
        playTimeRef.current += 1;
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingStream]);

  // Save exact progress on unmount
  useEffect(() => {
    return () => {
      if (detailsRef.current) {
        // Calculate progress percentage
        // Default runtime 120 mins if missing
        const runtimeMins = detailsRef.current.runtime || 120;
        const totalSecs = runtimeMins * 60;
        let progress = (playTimeRef.current / totalSecs) * 100;

        // If watched for less than 1 min, don't bump much
        if (progress < 1) progress = 1;
        // Cap at 95%
        if (progress > 95) progress = 95;

        // Add to history with real progress
        addToHistory({
          id: detailsRef.current.id,
          title: detailsRef.current.title || detailsRef.current.name,
          name: detailsRef.current.name || detailsRef.current.title,
          overview: detailsRef.current.overview,
          poster_path: detailsRef.current.poster_path,
          backdrop_path: detailsRef.current.backdrop_path,
          vote_average: detailsRef.current.vote_average,
          genre_ids: detailsRef.current.genres?.map((g: any) => g.id) || [],
          media_type: media.type,
          release_date: detailsRef.current.release_date,
          first_air_date: detailsRef.current.first_air_date,
          season: media.type === 'tv' ? (media.season || season) : undefined,
          episode: media.type === 'tv' ? (media.episode || episode) : undefined
        }, Math.floor(progress));
      }
    };
  }, []);

  useEffect(() => {
    async function loadMainData() {
      try {
        const [detRes, credRes] = await Promise.all([
          getMovieDetails(media.type, media.id),
          getCredits(media.type, media.id)
        ]);

        detailsRef.current = detRes;

        // Add to history initially (progress will be 5%)
        addToHistory({
          id: detRes.id,
          title: detRes.title || detRes.name,
          name: detRes.name || detRes.title,
          overview: detRes.overview,
          poster_path: detRes.poster_path,
          backdrop_path: detRes.backdrop_path,
          vote_average: detRes.vote_average,
          genre_ids: detRes.genres?.map((g: any) => g.id) || [],
          media_type: media.type,
          release_date: detRes.release_date,
          first_air_date: detRes.first_air_date,
          season: media.type === 'tv' ? (media.season || season) : undefined,
          episode: media.type === 'tv' ? (media.episode || episode) : undefined
        }, 5);

        setDetails(detRes);
        setCast(credRes.cast.slice(0, 10)); // top 10 cast
      } catch (e) {
        console.error(e);
      }
    }
    loadMainData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.id, media.type]);

  // Load Watchlist state
  useEffect(() => {
    if (!details) return;
    setSaved(isInWatchlist(details.id));
    const handleUpdate = () => setSaved(isInWatchlist(details.id));
    window.addEventListener('watchlist-updated', handleUpdate);
    return () => window.removeEventListener('watchlist-updated', handleUpdate);
  }, [details?.id]);



  const handleSave = () => {
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
        alert("Trailer not available");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load episodes if TV
  useEffect(() => {
    if (media.type === 'tv') {
      getTvSeason(media.id, season).then(res => {
        setEpisodesList(res.episodes || []);
      }).catch(console.error);
    }
  }, [media.id, media.type, season]);

  const loadRecommendations = useCallback(async (pageNum: number) => {
    setLoadingRecs(true);
    try {
      const res = await getSmartRecommendations(media.type, media.id, pageNum);
      setRecommended(prev => {
        if (pageNum === 1) return res.results;
        const newRecs = [...prev];
        res.results.forEach(m => {
          if (!newRecs.find(existing => existing.id === m.id)) {
            newRecs.push(m);
          }
        });
        return newRecs;
      });
      setHasMore(res.page < res.total_pages && res.page < 10);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRecs(false);
    }
  }, [media.id, media.type]);

  useEffect(() => {
    setRecommended([]);
    setPage(1);
    setHasMore(true);
    loadRecommendations(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [media.id, media.type, loadRecommendations]);

  useEffect(() => {
    if (page > 1) {
      loadRecommendations(page);
    }
  }, [page, loadRecommendations]);

  const lastElementRef = useInfiniteScroll(() => {
    setPage(prev => prev + 1);
  }, loadingRecs, hasMore);

  const defaultServerIdx = loadDefaultServer();
  const [selectedServer, setSelectedServer] = useState(defaultServerIdx < STREAM_SERVERS.length ? defaultServerIdx : 0);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);

  const activeServer = STREAM_SERVERS[selectedServer] || STREAM_SERVERS[0];
  const streamUrl = activeServer.getUrl(media.id, media.type, season, episode, media.isAnime);

  const handlePlayStream = async () => {
    setIsPlayingStream(true);
  };

  const handleCustomBack = () => {
    onBack();
  };

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
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white overflow-y-auto hide-scrollbar animate-in fade-in duration-300">

      {/* Dedicated Player Top Navigation Bar (Frosted Glass, No Border, Icon-Only Buttons, High z-index) */}
      <div className="sticky top-0 left-0 right-0 z-[100] bg-black/50 backdrop-blur-2xl px-4 md:px-8 py-2.5 flex items-center justify-between">
        {/* Back Button (Icon Only) */}
        <button
          onClick={handleCustomBack}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Movie/Series Title & Year */}
        <div className="text-xs md:text-sm font-semibold text-white/90 truncate max-w-xs md:max-w-md text-center">
          {details?.title || details?.name}
          {details && (details.release_date || details.first_air_date) && (
            <span className="text-zinc-400 font-normal ml-1.5 text-xs">
              ({(details.release_date || details.first_air_date).split('-')[0]})
            </span>
          )}
        </div>

        {/* Close Button (Icon Only) */}
        <button
          onClick={handleCustomBack}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Close Player"
          aria-label="Close Player"
        >
          <X size={18} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Cinema Video Player (Directly Below Top Bar - No Overlapping) */}
      <div className="w-full px-0 md:px-12 lg:px-16 py-0 md:py-4">
        <div className="relative w-full h-[30vh] md:h-[75vh] lg:h-[80vh] bg-black rounded-none md:rounded-2xl shadow-2xl border-0 md:border md:border-white/10 overflow-hidden" style={{ transform: 'translateZ(0)' }}>
          {!isPlayingStream ? (
            <div className="w-full h-full relative flex items-center justify-center group bg-zinc-900 rounded-none md:rounded-2xl overflow-hidden">
              {details?.backdrop_path && (
                <img
                  src={getImageUrl(details.backdrop_path, 'original')}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-700 group-hover:opacity-40"
                  alt={details.title || details.name}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-black/60" />

              <div className="relative z-10 flex flex-col items-center gap-3">
                <button
                  onClick={handlePlayStream}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-2xl text-white flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-110 active:scale-95 group/play cursor-pointer"
                  title="Play Stream"
                  aria-label="Play Stream"
                >
                  <Play fill="currentColor" size={28} className="ml-1 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover/play:scale-110" />
                </button>
                <span className="text-xs font-semibold text-zinc-300">Click to Play Stream</span>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full bg-zinc-950">
              {/* Loading Indicator behind fallback iframe */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-500 z-0 pointer-events-none">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <span className="text-sm font-medium animate-pulse">Connecting to Server...</span>
              </div>

              <iframe
                key={selectedServer}
                id="movie-frame"
                src={streamUrl}
                className="absolute inset-0 w-full h-full border-0 z-10 rounded-none md:rounded-2xl overflow-hidden"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                title="Stream Player"
              />
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Content Container */}
      <div className="w-full px-4 md:px-12 lg:px-16 py-8 space-y-10">

        {/* Details Section */}
        {details && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                    {details.title || details.name}
                  </h1>
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-semibold text-zinc-300">
                  {/* Match tag removed */}

                  {details.vote_average > 0 && (
                    <div className="flex items-center gap-1 text-white font-bold">
                      <Star size={14} fill="currentColor" />
                      <span>{details.vote_average.toFixed(1)}</span>
                    </div>
                  )}

                  {(details.release_date || details.first_air_date) && (
                    <>
                      {details.vote_average > 0 && <span className="text-zinc-600">&bull;</span>}
                      <span>{(details.release_date || details.first_air_date)?.split('-')[0]}</span>
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
                  
                  {media.type === 'tv' && details.number_of_seasons && (
                    <>
                      <span className="text-zinc-600">&bull;</span>
                      <span>{details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}</span>
                    </>
                  )}
                  
                  {details.runtime && details.runtime > 0 && (
                    <>
                      <span className="text-zinc-600">&bull;</span>
                      <span>{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>
                    </>
                  )}

                  <span className="text-zinc-600">&bull;</span>
                  <span className="uppercase text-xs font-bold text-zinc-400">
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
                    {details.genres.map((g: any) => g.name).join(' • ')}
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button 
                  onClick={handleSave}
                  title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 backdrop-blur-md shadow-md cursor-pointer group ${
                    saved 
                      ? 'bg-white/20 text-white border border-white/20' 
                      : 'bg-white/10 hover:bg-white/20 border border-white/15 text-white'
                  }`}
                >
                  <Bookmark size={18} fill={saved ? "currentColor" : "none"} className={!saved ? 'group-hover:scale-110 transition-transform' : ''} />
                </button>
                
                {/* Minimal Server Switcher Icon Button */}
                <button
                  onClick={() => setIsServerModalOpen(true)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-md cursor-pointer group"
                  title="Change Stream Server"
                  aria-label="Change Stream Server"
                >
                  <Server size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Overview / Synopsis (2-3 lines by default, tap to expand) */}
            {details.overview && (
              <div
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                className="cursor-pointer group/overview pt-2 max-w-5xl select-none"
                role="button"
                tabIndex={0}
              >
                <p className={`text-zinc-300 text-sm md:text-base leading-relaxed transition-all duration-300 opacity-90 ${isOverviewExpanded ? '' : 'line-clamp-2 md:line-clamp-3'}`}>
                  {details.overview}
                </p>
                {details.overview.length > 120 && (
                  <span className="inline-block mt-1 text-xs font-semibold text-zinc-400 group-hover/overview:text-white transition-colors">
                    {isOverviewExpanded ? 'Show less' : 'More...'}
                  </span>
                )}
              </div>
            )}

            {/* Top Cast Row */}
            {cast.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Cast</h3>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3 snap-x">
                  {cast.map(c => (
                    <div key={c.id} className="flex-shrink-0 w-24 snap-start text-center group">
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-zinc-900 mb-2 shadow-md transition-transform duration-300 group-hover:scale-105">
                        {c.profile_path ? (
                          <img src={getImageUrl(c.profile_path, 'w500')} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 font-medium text-xs bg-zinc-900">N/A</div>
                        )}
                      </div>
                      <p className="text-white text-xs font-medium truncate group-hover:text-red-400 transition-colors">{c.name}</p>
                      <p className="text-zinc-500 text-[10px] truncate">{c.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TV Show Episode Selector */}
            {media.type === 'tv' && details?.number_of_seasons && (
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-xl">Episodes</h3>
                  <div className="relative">
                    <button
                      onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                      className="flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm font-semibold outline-none cursor-pointer shadow-lg transition-colors min-w-[130px] justify-between group"
                    >
                      <span>Season {season}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-400 group-hover:text-white transition-all duration-300 ${isSeasonDropdownOpen ? '-rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                    </button>

                    {isSeasonDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSeasonDropdownOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-36 bg-zinc-900 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                          <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col p-1.5 gap-0.5">
                            {Array.from({ length: details.number_of_seasons }, (_, i) => i + 1).map(s => (
                              <button
                                key={s}
                                onClick={() => {
                                  setSeason(s);
                                  setEpisode(1);
                                  setIsSeasonDropdownOpen(false);
                                }}
                                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${season === s ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                              >
                                Season {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                  {episodesList.map(ep => (
                    <button
                      key={ep.id}
                      onClick={() => { 
                        setEpisode(ep.episode_number); 
                        setIsPlayingStream(true);
                      }}
                      className={`flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${episode === ep.episode_number ? 'bg-white/15 shadow-lg' : 'bg-zinc-900/60 hover:bg-white/5'}`}
                    >
                      <div className="w-28 aspect-video bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden relative shadow-inner">
                        {ep.still_path && <img src={getImageUrl(ep.still_path, 'w500')} className="w-full h-full object-cover" alt={ep.name} />}
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${episode === ep.episode_number ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                          <Play fill="white" size={18} />
                        </div>
                      </div>
                      <div className="overflow-hidden flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className={`text-xs font-bold truncate ${episode === ep.episode_number ? 'text-white' : 'text-zinc-200'}`}>
                            {ep.episode_number}. {ep.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{ep.overview || ep.air_date}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* More Like This (Full-Width Recommendations) */}
        {recommended.length > 0 && (
          <div className="pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {recommended.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onPlay={onPlay}
                  defaultType={media.type}
                />
              ))}
            </div>

            {loadingRecs && (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-white/50" size={32} />
              </div>
            )}

            <div ref={lastElementRef} className="h-10 w-full" />
          </div>
        )}
      </div>

      {/* Server Selection Modal Popup */}
      {isServerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsServerModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md md:max-w-2xl bg-black/60 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_10px_40px_rgba(255,255,255,0.1)] space-y-5 text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center">
                  <Server size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Select Stream Server</h3>
                  <p className="text-xs text-zinc-400">If a server doesn't work, please select another one</p>
                </div>
              </div>
              <button
                onClick={() => setIsServerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Server Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[60vh] md:max-h-none overflow-y-auto custom-scrollbar pr-1 md:pr-0">
              {STREAM_SERVERS.map((srv, idx) => (
                <div
                  key={srv.id}
                  onClick={() => {
                    setSelectedServer(idx);
                    setIsServerModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${selectedServer === idx
                    ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 shadow-[0_4px_12px_rgba(255,255,255,0.1)]'
                    : 'bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{srv.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                      {srv.badge}
                    </span>
                  </div>

                  {selectedServer === idx ? (
                    <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Server Tip */}
            <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
              💡 Tip: For Hindi Dubbing & 4K Ultra HD experience, select <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/20 shadow-sm">Server 2 (VidSrc SBS)</span>.
            </p>

            {/* Close */}
            <button
              onClick={() => setIsServerModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <TrailerModal trailerKey={trailerKey} onClose={() => setTrailerKey(null)} />
    </div>
  );
}
