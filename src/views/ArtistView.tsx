import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, Disc3, Loader2, Heart, Share2, MoreHorizontal, Radio, Copy, CheckCircle2, Music } from 'lucide-react';
import { useMusic, Song } from '../lib/MusicContext';
import { getArtist, ArtistData, PlaylistItem, SearchResult } from '../lib/musicService';
import { ArtistAvatar } from '../components/ArtistAvatar';

interface ArtistViewProps {
  id: string;
  name?: string | null;
  onBack: () => void;
  onPlaylistClick: (item: PlaylistItem) => void;
}

const ARTIST_AVATARS: Record<string, string> = {
  'Arijit Singh': 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg',
  'Shreya Ghoshal': 'https://c.saavncdn.com/artists/Shreya_Ghoshal_007_20241101074144_500x500.jpg',
  'Badshah': 'https://c.saavncdn.com/artists/Badshah_006_20241118064015_500x500.jpg',
  'Darshan Raval': 'https://c.saavncdn.com/artists/Darshan_Raval_006_20250807060352_500x500.jpg',
  'Neha Kakkar': 'https://c.saavncdn.com/artists/Neha_Kakkar_007_20241212115832_500x500.jpg',
  'Sonu Nigam': 'https://c.saavncdn.com/artists/Sonu_Nigam_003_20260813182013_500x500.jpg',
  'Diljit Dosanjh': 'https://c.saavncdn.com/artists/Diljit_Dosanjh_005_20231025073054_500x500.jpg',
  'A.R. Rahman': 'https://c.saavncdn.com/artists/AR_Rahman_002_20210120084455_500x500.jpg',
  'Jubin Nautiyal': 'https://c.saavncdn.com/artists/Jubin_Nautiyal_003_20231130204020_500x500.jpg',
  'Pritam': 'https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg',
  'Sunidhi Chauhan': 'https://c.saavncdn.com/artists/Sunidhi_Chauhan_005_20250515061617_500x500.jpg',
  'Yo Yo Honey Singh': 'https://c.saavncdn.com/artists/Yo_Yo_Honey_Singh_004_20260811095253_500x500.jpg',
  'Guru Randhawa': 'https://c.saavncdn.com/artists/Guru_Randhawa_004_20250701125845_500x500.jpg',
  'Ankit Tiwari': 'https://c.saavncdn.com/artists/Ankit_Tiwari_002_20241004072220_500x500.jpg',
  'Armaan Malik': 'https://c.saavncdn.com/artists/Armaan_Malik_006_20260813132832_500x500.jpg',
  'Taylor Swift': 'https://c.saavncdn.com/artists/Taylor_Swift_003_20200226074119_500x500.jpg',
  'The Weeknd': 'https://c.saavncdn.com/artists/The_Weeknd_002_20241003071400_500x500.jpg',
  'Ed Sheeran': 'https://c.saavncdn.com/artists/Ed_Sheeran_002_20250625073038_500x500.jpg',
  'Drake': 'https://c.saavncdn.com/artists/Drake_006_20260520062317_500x500.jpg',
  'Justin Bieber': 'https://c.saavncdn.com/artists/Justin_Bieber_005_20201127112218_500x500.jpg',
  'Ariana Grande': 'https://c.saavncdn.com/artists/Ariana_Grande_007_20260616180049_500x500.jpg',
  'Bruno Mars': 'https://c.saavncdn.com/artists/Bruno_Mars_003_20260324060413_500x500.jpg',
  'Dua Lipa': 'https://c.saavncdn.com/artists/Dua_Lipa_004_20231120090922_500x500.jpg',
  'Billie Eilish': 'https://c.saavncdn.com/artists/Billie_Eilish_20190211151539_500x500.jpg',
  'Post Malone': 'https://c.saavncdn.com/artists/Post_Malone_004_20190911070147_500x500.jpg',
  'Coldplay': 'https://c.saavncdn.com/artists/Coldplay_002_20241003070447_500x500.jpg',
  'Eminem': 'https://c.saavncdn.com/artists/Eminem_003_20240403152835_500x500.jpg',
  'Lata Mangeshkar': 'https://c.saavncdn.com/artists/Lata_Mangeshkar_004_20230623105323_500x500.jpg',
  'Kishore Kumar': 'https://c.saavncdn.com/artists/Kishore_Kumar_500x500.jpg',
  'Mohammed Rafi': 'https://c.saavncdn.com/artists/Mohammed_Rafi_500x500.jpg',
  'Asha Bhosle': 'https://c.saavncdn.com/artists/Asha_Bhosle_002_20200212082318_500x500.jpg',
  'Alka Yagnik': 'https://c.saavncdn.com/artists/Alka_Yagnik_002_20220314192930_500x500.jpg',
  'Palak Muchhal': 'https://c.saavncdn.com/artists/Palak_Muchhal_004_20250422120342_500x500.jpg',
  'KK': 'https://c.saavncdn.com/artists/KK_500x500.jpg',
  'Shakira': 'https://c.saavncdn.com/artists/Shakira_002_20220916145812_500x500.jpg'
};

export function ArtistView({ id, name, onBack, onPlaylistClick }: ArtistViewProps) {
  const { currentSong, isPlaying, playSong, togglePlay, toggleWatchlist, isWatchlisted, toggleFollowArtist, isFollowingArtist } = useMusic();
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showArtistMenu, setShowArtistMenu] = useState(false);
  const [activeSongMenuId, setActiveSongMenuId] = useState<string | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAllSongs, setShowAllSongs] = useState(false);

  const artistMenuRef = useRef<HTMLDivElement>(null);
  const songMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowSkeleton(true), 150);
    } else {
      setShowSkeleton(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    async function fetchArtist() {
      setLoading(true);
      const data = await getArtist(id, name || undefined);
      setArtist(data);
      if (data && data.title) {
        const url = new URL(window.location.href);
        url.searchParams.set('title', data.title);
        const cleanUrl = url.toString().replace(/title=([^&]+)/, (_, t) => `title=${t.replace(/\+/g, '%20')}`);
        window.history.replaceState(window.history.state, '', cleanUrl);
      }
      setLoading(false);
    }
    fetchArtist();
  }, [id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (artistMenuRef.current && !artistMenuRef.current.contains(target) && !target.closest('.artist-menu-trigger')) {
        setShowArtistMenu(false);
      }
      if (songMenuRef.current && !songMenuRef.current.contains(target) && !target.closest('.song-menu-trigger')) {
        setActiveSongMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const isCurrentSong = (songId: string) => currentSong?.id === songId;
  const isFollowing = artist ? isFollowingArtist(artist.title) || isFollowingArtist(id) : false;

  const handleToggleFollow = () => {
    if (!artist) return;
    const coverUrl = ARTIST_AVATARS[artist.title] || ARTIST_AVATARS[id] || artist.coverUrl;
    toggleFollowArtist({ id: id || artist.title, title: artist.title, coverUrl });
    const nextState = !isFollowing;
    showToast(nextState ? `Following ${artist.title}` : `Unfollowed ${artist.title}`);
    setShowArtistMenu(false);
  };

  const handleShareArtist = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Artist link copied to clipboard!');
    } else {
      showToast('Link copied!');
    }
    setShowArtistMenu(false);
  };

  const handlePlayRadio = () => {
    if (artist && artist.songs.length > 0) {
      playSong(artist.songs[0], artist.songs);
      showToast(`Playing ${artist.title} Radio`);
    }
    setShowArtistMenu(false);
  };

  const handleToggleLikeSong = (song: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(song);
    const isSaved = !isWatchlisted(song.id);
    showToast(isSaved ? `Saved "${song.title}" to Watchlist` : `Removed "${song.title}" from Watchlist`);
    setActiveSongMenuId(null);
  };

  const handleShareSong = (song: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?song=${encodeURIComponent(song.id)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Song link for "${song.title}" copied!`);
    } else {
      showToast(`Song link copied!`);
    }
    setActiveSongMenuId(null);
  };

  if (loading) {
    if (!showSkeleton) return <div className="flex-1 min-h-screen bg-[var(--color-theme-bg)]" />;
    
    return (
      <div className="flex-1 overflow-y-auto pb-32 min-h-screen bg-[var(--color-theme-bg)] animate-pulse">
        {/* Back Button Skeleton */}
        <div className="absolute top-6 left-6 sm:left-10 z-30 w-10 h-10 rounded-full bg-white/10 border border-white/5" />
        
        {/* Hero & Content Skeleton */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8">
          {/* Artist Hero Header Section */}
          <div className="pt-4 pb-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-center">
            {/* Avatar */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 rounded-full bg-white/10 shadow-lg shrink-0 border border-white/5" />
            
            {/* Metadata */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
              <div className="h-10 md:h-16 bg-white/10 rounded-xl w-64 md:w-[400px] mb-4" />
              <div className="h-4 bg-white/10 rounded-md w-full max-w-[500px] mb-2" />
              <div className="h-4 bg-white/10 rounded-md w-3/4 max-w-[400px] mb-6" />
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-32 rounded-full bg-white/10" />
                <div className="h-8 w-32 rounded-full bg-white/10" />
              </div>
            </div>
          </div>

          {/* Action Controls Bar Skeleton */}
          <div className="py-4 flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8 border-b border-white/[0.08]">
            <div className="h-12 w-36 rounded-full bg-white/10" />
            <div className="h-12 w-32 rounded-full bg-white/10" />
            <div className="h-12 w-12 rounded-full bg-white/10 hidden sm:block" />
          </div>

          {/* Songs List Skeleton */}
          <div className="space-y-3">
            <div className="h-8 bg-white/10 rounded-md w-40 mb-6" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-md shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-white/10 rounded-md w-48 sm:w-64" />
                  <div className="h-3 bg-white/10 rounded-md w-32 sm:w-40" />
                </div>
                <div className="w-8 h-8 bg-white/10 rounded-full shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center min-h-screen bg-[var(--color-theme-bg)]">
        <p className="text-white/60 text-lg">Failed to load Artist.</p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all font-medium border border-white/10"
        >
          Go Back
        </button>
      </div>
    );
  }

  const artistPhoto = ARTIST_AVATARS[artist.title] || ARTIST_AVATARS[id] || artist.coverUrl;

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 min-h-screen animate-in fade-in bg-[var(--color-theme-bg)] text-white relative">
      {/* Back Arrow Fixed at Top-Left Corner */}
      <button
        onClick={onBack}
        className="absolute top-[max(env(safe-area-inset-top,0px),1.25rem)] left-5 md:left-6 z-30 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors border border-white/10 backdrop-blur-md shadow-lg group"
        title="Go Back"
      >
        <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Toast Banner Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-zinc-800/95 backdrop-blur-xl border border-white/20 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Full-screen minimal frosted glass backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 blur-[100px] saturate-200 bg-cover bg-center opacity-30 transition-all duration-1000 scale-125"
          style={{ backgroundImage: `url(${artistPhoto})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] sm:pt-[calc(env(safe-area-inset-top,0px)+2rem)]">
        {/* Artist Hero Header Section */}
        <div className="pt-4 pb-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-center">
          {/* Circular Avatar */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-white/20 rounded-full blur-xl group-hover:opacity-100 opacity-50 transition duration-700" />
            <div className="relative p-1.5 rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent border border-white/15 backdrop-blur-md shadow-2xl">
              <ArtistAvatar
                src={artistPhoto}
                name={artist.title}
                isArtist={true}
                className="w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 rounded-full"
                imgClassName="w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 object-cover rounded-full shadow-inner group-hover:scale-[1.02] transition-transform duration-500"
                textClassName="text-4xl sm:text-5xl md:text-6xl font-extrabold"
              />
            </div>
          </div>

          {/* Artist Metadata */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-2 tracking-tight leading-tight drop-shadow-md">
              {artist.title}
            </h1>

            <p className="text-white/70 text-sm md:text-base font-normal max-w-2xl mb-4 leading-relaxed">
              Discover top tracks, trending hits, and popular albums by {artist.title} on Parlaxio Music.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-semibold text-white/80">
              <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
                <Music size={14} className="text-white/80" />
                {artist.songs.length} Popular Songs
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md">

                Play on Parlaxio
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="py-4 flex flex-wrap items-center gap-4 mb-8 border-b border-white/[0.08]">
          {/* Play / Pause All Button (White/Black Gradient Theme) */}
          <button
            onClick={() => {
              if (artist.songs.length > 0) {
                if (currentSong && artist.songs.some(s => s.id === currentSong.id)) {
                  togglePlay();
                } else {
                  playSong(artist.songs[0], artist.songs);
                }
              }
            }}
            className="h-14 px-8 bg-gradient-to-br from-white via-zinc-100 to-zinc-300 hover:from-white hover:to-zinc-200 text-black font-extrabold rounded-full flex items-center gap-3 shadow-xl shadow-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          >
            {isPlaying && currentSong && artist.songs.some(s => s.id === currentSong.id) ? (
              <>
                <Pause size={24} fill="currentColor" />
                <span className="text-base tracking-wide">Pause</span>
              </>
            ) : (
              <>
                <Play size={24} fill="currentColor" className="ml-0.5" />
                <span className="text-base tracking-wide">Play Top Tracks</span>
              </>
            )}
          </button>

          {/* Follow Button */}
          <button
            onClick={handleToggleFollow}
            className={`h-12 px-6 rounded-full flex items-center gap-2 text-sm font-semibold transition-all backdrop-blur-md border ${isFollowing
              ? 'bg-white/25 text-white border-white/40 shadow-inner'
              : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20 hover:text-white'
              }`}
          >
            <Heart size={18} className={isFollowing ? 'fill-white text-white' : ''} />
            <span>{isFollowing ? 'Following' : 'Follow'}</span>
          </button>

          {/* Radio Button */}
          <button
            onClick={handlePlayRadio}
            className="h-12 px-5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-all backdrop-blur-md"
            title="Artist Radio"
          >
            <Radio size={18} className="text-white/80" />
            <span className="hidden sm:inline">Artist Radio</span>
          </button>

          {/* More Options Menu (3 Dots) */}
          <div className="relative" ref={artistMenuRef}>
            <button
              onClick={() => setShowArtistMenu(!showArtistMenu)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all backdrop-blur-md active:scale-95"
              title="More Options"
            >
              <MoreHorizontal size={22} />
            </button>

            {/* Artist Context Dropdown Menu */}
            {showArtistMenu && (
              <div className="absolute right-0 sm:left-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={handleShareArtist}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors font-medium text-left"
                >
                  <Share2 size={16} className="text-white/80" />
                  <span>Share Artist</span>
                </button>

                <button
                  onClick={handleToggleFollow}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors font-medium text-left"
                >
                  <Heart size={16} className={isFollowing ? 'text-white fill-white' : 'text-white/60'} />
                  <span>{isFollowing ? 'Unfollow Artist' : 'Follow Artist'}</span>
                </button>

                <button
                  onClick={handlePlayRadio}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors font-medium text-left"
                >
                  <Radio size={16} className="text-white/80" />
                  <span>Play Artist Radio</span>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  onClick={handleShareArtist}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/70 transition-colors font-medium text-left"
                >
                  <Copy size={16} className="text-white/50" />
                  <span>Copy Artist Link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Sections: Top Songs & Popular Albums */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Top Songs Column (7 Cols on LG) */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Top Popular Songs</span>
              </h2>
              <span className="text-xs text-white/40 font-medium uppercase tracking-wider">
                {artist.songs.length} Tracks
              </span>
            </div>

            {artist.songs.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {artist.songs.slice(0, showAllSongs ? artist.songs.length : 10).map((song, index) => {
                  const isActive = isCurrentSong(song.id);
                  const isMenuOpen = activeSongMenuId === song.id;
                  const isLiked = !!likedSongIds[song.id];

                  return (
                    <div
                      key={song.id}
                      onClick={() => playSong(song, artist.songs)}
                      className={`group relative flex items-center px-2 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${isMenuOpen ? 'z-40' : 'z-10'
                        } ${isActive
                          ? 'bg-white/10 shadow-md'
                          : 'hover:bg-white/5'
                        }`}
                    >
                      {/* Desktop Track Index / Play visualizer */}
                      <div className="hidden md:flex w-8 justify-center items-center text-white/50 text-sm font-semibold shrink-0">
                        {isActive && isPlaying ? (
                          <div className="flex items-end gap-[3px] h-4">
                            <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_infinite_alternate] h-full" />
                            <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.2s_infinite_alternate] h-2/3" />
                            <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.4s_infinite_alternate] h-full" />
                          </div>
                        ) : (
                          <span className="group-hover:hidden">{index + 1}</span>
                        )}
                        {!isActive && <Play size={15} className="hidden group-hover:block text-white" fill="currentColor" />}
                        {isActive && !isPlaying && <Play size={15} className="text-white" fill="currentColor" />}
                      </div>

                      {/* Song Image & Details */}
                      <div className="flex-1 min-w-0 flex items-center gap-3.5">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md shadow-black/30 group-hover:scale-105 transition-transform duration-300">
                          <img 
                            src={song.coverUrl} 
                            className="w-full h-full object-cover" 
                            alt={song.title} 
                          />
                          {/* Mobile Play / Equalizer Overlay */}
                          <div className={`md:hidden absolute inset-0 bg-black/40 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                            {isActive && isPlaying ? (
                              <div className="flex items-end gap-[3px] h-4">
                                <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_infinite_alternate] h-full" />
                                <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.2s_infinite_alternate] h-2/3" />
                                <span className="w-1 bg-white rounded-full animate-[musicbar_0.5s_ease-in-out_0.4s_infinite_alternate] h-full" />
                              </div>
                            ) : (
                              <Play size={16} className="text-white" fill="currentColor" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-base font-bold truncate text-white`}>
                            {song.title}
                          </span>
                          <span className="text-white/50 text-xs truncate mt-0.5">
                            {song.artist || artist.title}
                          </span>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="text-white/40 text-xs font-medium px-3 hidden sm:block shrink-0">
                        {song.duration || '3:30'}
                      </div>

                      {/* Track Menu (3 Dots) */}
                      <div className="relative shrink-0 ml-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSongMenuId(isMenuOpen ? null : song.id);
                          }}
                          className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors song-menu-trigger"
                          title="More options"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {/* Song Popup Menu - Rich Frosted Dark Glassmorphism */}
                        {isMenuOpen && (
                          <div
                            ref={songMenuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-52 bg-zinc-900/90 border border-white/20 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200 text-white"
                            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playSong(song, artist.songs);
                                setActiveSongMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs font-medium text-white text-left transition-colors"
                            >
                              <Play size={15} className="text-white" />
                              <span>Play Song</span>
                            </button>

                            <button
                              onClick={(e) => handleToggleLikeSong(song, e)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs font-medium text-white text-left transition-colors"
                            >
                              <Heart size={15} className={isWatchlisted(song.id) ? 'text-white fill-white' : 'text-white/60'} />
                              <span>{isWatchlisted(song.id) ? 'Remove Watchlist' : 'Save to Watchlist'}</span>
                            </button>

                            <button
                              onClick={(e) => handleShareSong(song, e)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs font-medium text-white text-left transition-colors"
                            >
                              <Share2 size={15} className="text-white/80" />
                              <span>Share Song</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {artist.songs.length > 10 && (
                  <button
                    onClick={() => setShowAllSongs(!showAllSongs)}
                    className="mt-3 w-full py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
                  >
                    {showAllSongs ? 'Show Less' : `Show All ${artist.songs.length} Tracks`}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-sm italic">No songs available for this artist.</p>
            )}
          </div>

          {/* Popular Albums Column (5 Cols on LG) */}
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-5 flex items-center gap-2">
              <Disc3 size={22} className="text-white/80" />
              <span>Albums & Singles</span>
            </h2>

            {artist.albums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {artist.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onPlaylistClick(album)}
                    className="group cursor-pointer bg-white/5 hover:bg-white/15 p-0 overflow-hidden rounded-2xl transition-all duration-300 border border-white/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="relative w-full aspect-square overflow-hidden shadow-lg shadow-black/40">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-10 h-10 rounded-full bg-white text-black shadow-lg flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <h4 className="font-semibold text-sm text-white group-hover:text-white transition-colors truncate">
                        {album.title}
                      </h4>
                      <p className="text-white/40 text-xs mt-0.5 capitalize font-medium">
                        {album.type || 'Album'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm italic">No albums available for this artist.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
