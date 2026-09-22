import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Search as SearchIcon, ChevronRight, ChevronLeft, Loader2, Disc3, ChevronDown, X, ArrowLeft, Clock, Flame, Trash2 } from 'lucide-react';
import { useMusic, Song } from '../lib/MusicContext';
import { searchSongs, SearchResult, getHomeRows, getRecommendations, HomeRow, PlaylistItem, getSongDetails } from '../lib/musicService';
import { PlaylistView } from './PlaylistView';
import { CategoryView } from './CategoryView';
import { ArtistView } from './ArtistView';
import { ArtistAvatar } from '../components/ArtistAvatar';

function MusicRow({ 
  title, 
  items, 
  onHeaderClick, 
  onItemClick, 
  isCurrentSong, 
  isPlaying 
}: { 
  title: string; 
  items: any[]; 
  onHeaderClick: () => void; 
  onItemClick: (item: any) => void; 
  isCurrentSong: (id: string) => boolean; 
  isPlaying: boolean; 
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -480 : 480;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-12" key={title}>
      <div className="flex items-center justify-between mb-5">
        <h2 
          className="text-[22px] md:text-2xl font-bold text-white flex items-center gap-2 cursor-pointer hover:text-white/80 transition-colors w-max group"
          onClick={onHeaderClick}
        >
          {title} <ChevronRight className="text-white/40 mt-0.5 group-hover:text-white/80 transition-colors" size={20} />
        </h2>

        {/* Desktop-only Scroll Arrows */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/10 shadow-md"
            title="Scroll Left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/10 shadow-md"
            title="Scroll Right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div ref={rowRef} className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar pb-4 snap-x scroll-smooth">
        {items.map((item) => {
          const isPlaylist = item.type === 'playlist' || item.type === 'album';
          const isArtist = item.type === 'artist';
          const isSong = !isPlaylist && !isArtist;
          
          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="flex-shrink-0 w-36 md:w-48 group cursor-pointer snap-start"
            >
              <div className={`relative w-full aspect-square mb-3 overflow-hidden shadow-lg shadow-black/20 ${isArtist ? 'rounded-full' : 'rounded-xl'}`}>
                <ArtistAvatar
                  src={item.coverUrl}
                  name={item.title}
                  isArtist={isArtist}
                  className="w-full h-full"
                  imgClassName={`w-full h-full object-cover transition-transform duration-500 ${
                    isArtist ? 'group-hover:scale-105' : 'scale-[1.28] origin-center group-hover:scale-[1.34]'
                  }`}
                  textClassName="text-2xl md:text-3xl font-extrabold"
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
                {isArtist ? 'Artist' : item.artist || (item.type === 'album' ? 'Album' : 'Playlist')}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const TRENDING_SEARCHES = ["Arijit Singh", "Lofi Chill", "Top 50 Global", "Shreya Ghoshal", "Romantic Hindi", "Badshah", "Kishore Kumar", "KK Hits"];

const HOT_SEARCH_TAGS = ["Arijit Singh", "Coke Studio", "Lofi Chill", "Punjabi Beats", "Shreya Ghoshal", "Taylor Swift", "Stree 2 Hits", "Kishore Kumar", "KK"];

const MOOD_CHIPS = [
  { id: 'mc1', label: 'Chill Vibes', query: 'lofi chill', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=60' },
  { id: 'mc2', label: 'Bollywood', query: 'latest bollywood', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=60' },
  { id: 'mc3', label: 'Punjabi Hits', query: 'punjabi hits', cover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=60' },
  { id: 'mc4', label: 'English Pop', query: 'english pop', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=60' },
  { id: 'mc5', label: 'Devotional', query: 'bhakti', cover: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=100&q=60' },
  { id: 'mc6', label: 'Ghazal & Sufi', query: 'ghazal sufi', cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=100&q=60' },
  { id: 'mc7', label: 'Romantic', query: 'romantic love songs', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100&q=60' },
  { id: 'mc8', label: 'Sad & Emotional', query: 'sad hindi songs', cover: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=100&q=60' },
  { id: 'mc9', label: 'Desi Hip-Hop', query: 'desi hip hop rap', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=100&q=60' },
  { id: 'mc10', label: 'Coke Studio', query: 'coke studio', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=60' },
];

const EXTRA_CHIPS = [
  { id: 'ex1', label: 'Regional Hits', query: 'regional hit', cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=100&q=60' },
  { id: 'ex2', label: 'Workout Gym', query: 'workout gym bass', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=60' },
  { id: 'ex3', label: 'Party & Dance', query: 'party dance hits', cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=100&q=60' },
  { id: 'ex4', label: '90s Nostalgia', query: '90s bollywood hits', cover: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=100&q=60' },
  { id: 'ex5', label: 'Acoustic Covers', query: 'acoustic covers unplugged', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=60' },
  { id: 'ex6', label: 'Retro Golden Hits', query: 'old is gold retro 70s 80s', cover: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=100&q=60' },
  { id: 'ex7', label: 'Indie & Unplugged', query: 'indie hindi unplugged', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=60' },
  { id: 'ex8', label: 'South Special', query: 'telugu tamil superhits', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=60' },
  { id: 'ex9', label: 'Instrumental', query: 'flute violin relaxation', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=60' },
  { id: 'ex10', label: 'EDM & Festival', query: 'edm festival dance', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=60' },
];

const TOP_INDIAN_ARTISTS = [
  { id: '459320', title: 'Arijit Singh', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg' },
  { id: 'Lata Mangeshkar', title: 'Lata Mangeshkar', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Lata_Mangeshkar_004_20230623105323_500x500.jpg' },
  { id: 'Kishore Kumar', title: 'Kishore Kumar', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Kishore_Kumar_500x500.jpg' },
  { id: 'Mohammed Rafi', title: 'Mohammed Rafi', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Mohammed_Rafi_500x500.jpg' },
  { id: 'KK', title: 'KK', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/KK_500x500.jpg' },
  { id: 'Alka Yagnik', title: 'Alka Yagnik', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Alka_Yagnik_002_20220314192930_500x500.jpg' },
  { id: '455130', title: 'Shreya Ghoshal', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Shreya_Ghoshal_007_20241101074144_500x500.jpg' },
  { id: 'Asha Bhosle', title: 'Asha Bhosle', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Asha_Bhosle_002_20200212082318_500x500.jpg' },
  { id: 'Palak Muchhal', title: 'Palak Muchhal', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Palak_Muchhal_004_20250422120342_500x500.jpg' },
  { id: '456863', title: 'Badshah', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Badshah_006_20241118064015_500x500.jpg' },
  { id: '888127', title: 'Darshan Raval', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Darshan_Raval_006_20250807060352_500x500.jpg' },
  { id: '464932', title: 'Neha Kakkar', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Neha_Kakkar_007_20241212115832_500x500.jpg' },
  { id: '455125', title: 'Sonu Nigam', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Sonu_Nigam_003_20260813182013_500x500.jpg' },
  { id: 'Diljit Dosanjh', title: 'Diljit Dosanjh', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Diljit_Dosanjh_005_20231025073054_500x500.jpg' },
  { id: 'A.R. Rahman', title: 'A.R. Rahman', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/AR_Rahman_002_20210120084455_500x500.jpg' },
  { id: 'Jubin Nautiyal', title: 'Jubin Nautiyal', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Jubin_Nautiyal_003_20231130204020_500x500.jpg' },
  { id: 'Pritam', title: 'Pritam', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg' },
  { id: 'Sunidhi Chauhan', title: 'Sunidhi Chauhan', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Sunidhi_Chauhan_005_20250515061617_500x500.jpg' },
  { id: 'Yo Yo Honey Singh', title: 'Yo Yo Honey Singh', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Yo_Yo_Honey_Singh_004_20260811095253_500x500.jpg' },
  { id: 'Guru Randhawa', title: 'Guru Randhawa', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Guru_Randhawa_004_20250701125845_500x500.jpg' },
  { id: 'Ankit Tiwari', title: 'Ankit Tiwari', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Ankit_Tiwari_002_20241004072220_500x500.jpg' },
  { id: 'Armaan Malik', title: 'Armaan Malik', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Armaan_Malik_006_20260813132832_500x500.jpg' }
];

const TOP_GLOBAL_ARTISTS = [
  { id: 'Shakira', title: 'Shakira', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Shakira_002_20220916145812_500x500.jpg' },
  { id: 'Taylor Swift', title: 'Taylor Swift', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Taylor_Swift_003_20200226074119_500x500.jpg' },
  { id: 'The Weeknd', title: 'The Weeknd', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/The_Weeknd_002_20241003071400_500x500.jpg' },
  { id: 'Ed Sheeran', title: 'Ed Sheeran', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Ed_Sheeran_002_20250625073038_500x500.jpg' },
  { id: 'Drake', title: 'Drake', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Drake_006_20260520062317_500x500.jpg' },
  { id: 'Justin Bieber', title: 'Justin Bieber', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Justin_Bieber_005_20201127112218_500x500.jpg' },
  { id: 'Ariana Grande', title: 'Ariana Grande', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Ariana_Grande_007_20260616180049_500x500.jpg' },
  { id: 'Bruno Mars', title: 'Bruno Mars', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Bruno_Mars_003_20260324060413_500x500.jpg' },
  { id: 'Dua Lipa', title: 'Dua Lipa', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Dua_Lipa_004_20231120090922_500x500.jpg' },
  { id: 'Billie Eilish', title: 'Billie Eilish', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Billie_Eilish_20190211151539_500x500.jpg' },
  { id: 'Post Malone', title: 'Post Malone', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Post_Malone_004_20190911070147_500x500.jpg' },
  { id: 'Coldplay', title: 'Coldplay', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Coldplay_002_20241003070447_500x500.jpg' },
  { id: 'Eminem', title: 'Eminem', type: 'artist', coverUrl: 'https://c.saavncdn.com/artists/Eminem_003_20240403152835_500x500.jpg' }
];

interface MusicViewProps {
  onSubViewChange?: (hasSubView: boolean) => void;
}

export function MusicView({ onSubViewChange }: MusicViewProps = {}) {
  const { playSong, setQueue, currentSong, isPlaying, togglePlay, recentlyPlayed, watchlist, followedArtists, savedPlaylists, isLoading: contextLoading } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [homeRows, setHomeRows] = useState<HomeRow[]>([]);
  const [moodResults, setMoodResults] = useState<SearchResult[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState<{title: string, items: any[]} | null>(null);
  
  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('parlaxio_recent_music_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = useCallback((query: string) => {
    if (!query || !query.trim()) return;
    const clean = query.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      localStorage.setItem('parlaxio_recent_music_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setRecentSearches([]);
    localStorage.removeItem('parlaxio_recent_music_searches');
  };

  const removeSingleRecentSearch = (itemToRemove: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== itemToRemove);
      localStorage.setItem('parlaxio_recent_music_searches', JSON.stringify(filtered));
      return filtered;
    });
  };

  const handleSuggestionClick = (query: string) => {
    const cleanQuery = query.replace(/^🔥\s*/, '').trim();
    setSearchQuery(cleanQuery);
    saveRecentSearch(cleanQuery);
    setIsSearchFocused(false);
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      saveRecentSearch(searchQuery);
      const results = await searchSongs(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, saveRecentSearch]);
  
  // Persist artist, playlist/album and title in URL query string cleanly without redundant ptype
  const [activeArtistId, setActiveArtistId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('artist'));
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('playlist') || params.get('album');
  });
  const [activePlaylistType, setActivePlaylistType] = useState<'playlist'|'album'|null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('album')) return 'album';
    if (params.has('playlist')) return 'playlist';
    return (params.get('ptype') as any) || null;
  });
  const [activeTitle, setActiveTitle] = useState<string | null>(() => new URLSearchParams(window.location.search).get('title'));

  useEffect(() => {
    if (onSubViewChange) {
      onSubViewChange(!!(activeArtistId || activePlaylistId || activeCategory));
    }
  }, [activeArtistId, activePlaylistId, activeCategory, onSubViewChange]);

  // Handle swipe-to-back (popstate) to properly close sub-views instead of exiting the app
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveArtistId(params.get('artist'));
      
      const playlist = params.get('playlist') || params.get('album');
      setActivePlaylistId(playlist);
      setActivePlaylistType(params.has('album') ? 'album' : params.has('playlist') ? 'playlist' : null);
      
      setActiveTitle(params.get('title'));
      setActiveCategory(null); // Category view doesn't use URL params, so clear it
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSubViewBack = useCallback(() => {
    if (window.history.state && window.history.state.musicSubView) {
      window.history.back();
    } else {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('artist');
      newUrl.searchParams.delete('playlist');
      newUrl.searchParams.delete('album');
      newUrl.searchParams.delete('title');
      window.history.replaceState(null, '', newUrl.toString());
      
      setActiveArtistId(null);
      setActivePlaylistId(null);
      setActivePlaylistType(null);
      setActiveCategory(null);
      setActiveTitle(null);
    }
  }, []);

  // Auto-play song if `song` param exists in URL on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSongId = params.get('song');
    if (urlSongId && (!currentSong || currentSong.id !== urlSongId)) {
      getSongDetails(urlSongId).then(song => {
        if (song) {
          playSong(song);
        }
      });
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    
    // Clean up legacy ptype
    url.searchParams.delete('ptype');

    if (activeArtistId) {
      url.searchParams.set('artist', activeArtistId);
      url.searchParams.delete('playlist');
      url.searchParams.delete('album');
      if (activeTitle) {
        url.searchParams.set('title', activeTitle);
      } else {
        url.searchParams.delete('title');
      }
    } else {
      url.searchParams.delete('artist');
    }
    
    if (activePlaylistId && activePlaylistType) {
      if (activePlaylistType === 'album') {
        url.searchParams.set('album', activePlaylistId);
        url.searchParams.delete('playlist');
      } else {
        url.searchParams.set('playlist', activePlaylistId);
        url.searchParams.delete('album');
      }
      if (activeTitle) {
        url.searchParams.set('title', activeTitle);
      } else {
        url.searchParams.delete('title');
      }
    } else if (!activeArtistId) {
      url.searchParams.delete('playlist');
      url.searchParams.delete('album');
      if (!currentSong) {
        url.searchParams.delete('title');
      }
    }

    if (currentSong) {
      url.searchParams.set('song', currentSong.id);
      if (!activeArtistId && !activePlaylistId) {
        url.searchParams.set('title', currentSong.title);
      }
    } else {
      url.searchParams.delete('song');
    }
    
    let cleanUrl = url.toString().replace(/title=([^&]+)/, (_, t) => `title=${t.replace(/\+/g, '%20')}`);
    window.history.replaceState(window.history.state, '', cleanUrl);
  }, [activeArtistId, activePlaylistId, activePlaylistType, activeTitle, currentSong]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filterRefDesktop = useRef<HTMLDivElement>(null);
  const filterRefMobile = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click/tap
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const desktopContains = filterRefDesktop.current?.contains(target);
      const mobileContains = filterRefMobile.current?.contains(target);
      if (!desktopContains && !mobileContains) {
        setShowMoreFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Load home rows
  useEffect(() => {
    loadHomeData();
  }, []);

  // Load recommendations
  useEffect(() => {
    if (currentSong) {
      getRecommendations(currentSong.id, currentSong.artist).then(res => {
        setRecommendedSongs(res);
      });
    }
  }, [currentSong?.id]);

  const loadHomeData = async () => {
    setIsLoadingTrending(true);
    const rows = await getHomeRows();
    setHomeRows(rows);
    setIsLoadingTrending(false);
  };

  const [visibleMoodCount, setVisibleMoodCount] = useState(16);

  const handleMoodChip = async (chip: any) => {
    setActiveChip(chip.id);
    setVisibleMoodCount(16);
    const results = await searchSongs(chip.query);
    setMoodResults(results);
  };

  const handlePlaySong = (song: Song, allSongs: Song[]) => {
    const index = allSongs.findIndex(s => s.id === song.id);
    const queue = [...allSongs.slice(index), ...allSongs.slice(0, index)];
    playSong(song, queue);
  };

  const handlePlaySongWithAutoplay = async (song: Song, fallbackList: Song[]) => {
    // 1. Play immediately for instant feedback
    playSong(song, [song]);
    
    // 2. Fetch smart recommendations in background for the queue
    try {
      const recommendations = await getRecommendations(song.id, song.artist);
      if (recommendations && recommendations.length > 0) {
        const filteredRecs = recommendations.filter(r => r.id !== song.id);
        setQueue([song, ...filteredRecs]);
      } else {
        // Fallback if no recommendations exist
        const index = fallbackList.findIndex(s => s.id === song.id);
        const queue = [...fallbackList.slice(index), ...fallbackList.slice(0, index)];
        setQueue(queue);
      }
    } catch (e) {
      console.error('Autoplay fetch failed', e);
      const index = fallbackList.findIndex(s => s.id === song.id);
      const queue = [...fallbackList.slice(index), ...fallbackList.slice(0, index)];
      setQueue(queue);
    }
  };

  const isCurrentSong = (id: string) => currentSong?.id === id;
  const formatDuration = (dur: string | undefined) => dur || '3:45';
  const showSearchResults = searchQuery.trim().length > 0;

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Helper for horizontal rows
  const renderRow = (title: string, items: any[]) => (
    <MusicRow 
      key={title}
      title={title}
      items={items}
      onHeaderClick={() => {
        window.history.pushState({ musicSubView: true }, '', window.location.href);
        setActiveCategory({ title, items });
      }}
      onItemClick={(item) => {
        const isPlaylist = item.type === 'playlist' || item.type === 'album';
        const itemTitle = item.title || item.name || null;
        if (item.type === 'artist') {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('artist', item.id);
          if (itemTitle) newUrl.searchParams.set('title', itemTitle);
          window.history.pushState({ musicSubView: true }, '', newUrl.toString());
          
          setActiveTitle(itemTitle);
          setActiveArtistId(item.id);
        } else if (isPlaylist) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set(item.type, item.id);
          if (itemTitle) newUrl.searchParams.set('title', itemTitle);
          window.history.pushState({ musicSubView: true }, '', newUrl.toString());

          setActiveTitle(itemTitle);
          setActivePlaylistType(item.type);
          setActivePlaylistId(item.id);
        } else {
          handlePlaySong(item, items);
        }
      }}
      isCurrentSong={isCurrentSong}
      isPlaying={isPlaying}
    />
  );

  if (activePlaylistId && activePlaylistType) {
    return (
      <PlaylistView 
        id={activePlaylistId} 
        type={activePlaylistType} 
        onBack={handleSubViewBack} 
      />
    );
  }

  if (activeArtistId) {
    return (
      <ArtistView 
        id={activeArtistId} 
        onBack={handleSubViewBack} 
        onPlaylistClick={(item) => {
          const itemTitle = item.title || null;
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set(item.type, item.id);
          if (itemTitle) newUrl.searchParams.set('title', itemTitle);
          window.history.pushState({ musicSubView: true }, '', newUrl.toString());

          setActiveTitle(itemTitle);
          setActivePlaylistType(item.type as 'playlist'|'album');
          setActivePlaylistId(item.id);
        }} 
      />
    );
  }

  if (activeCategory) {
    return (
      <CategoryView 
        title={activeCategory.title}
        items={activeCategory.items}
        onBack={handleSubViewBack}
        onItemClick={(item) => {
          const isPlaylist = item.type === 'playlist' || item.type === 'album';
          const itemTitle = item.title || item.name || null;
          if (item.type === 'artist') {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('artist', item.id);
            if (itemTitle) newUrl.searchParams.set('title', itemTitle);
            window.history.pushState({ musicSubView: true }, '', newUrl.toString());
            
            setActiveTitle(itemTitle);
            setActiveArtistId(item.id);
          } else if (isPlaylist) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set(item.type, item.id);
            if (itemTitle) newUrl.searchParams.set('title', itemTitle);
            window.history.pushState({ musicSubView: true }, '', newUrl.toString());

            setActiveTitle(itemTitle);
            setActivePlaylistType(item.type);
            setActivePlaylistId(item.id);
          } else {
            handlePlaySong(item, activeCategory.items);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen animate-in fade-in pb-40">
      
      {/* === DESKTOP LAYOUT (md+) === */}
      <div className="hidden md:block pt-32 px-8 lg:px-16 max-w-[1400px] mx-auto">
        
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-12 flex gap-3">
          {showSearchResults && (
            <button onClick={clearSearch} className="flex-shrink-0 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white p-3.5 rounded-full transition-colors flex items-center justify-center">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full bg-white/[0.06] backdrop-blur-xl hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/[0.08] focus:border-white/20 rounded-full py-3.5 pl-14 pr-12 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all text-[15px]"
            />
            {isSearching && <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 text-white/40 animate-spin" size={18} />}
            {showSearchResults && (
              <button onClick={clearSearch} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            )}

            {/* Suggestions Dropdown (Desktop) */}
            {isSearchFocused && !showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-theme-bg)] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-30 divide-y divide-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Section 1: Recent User Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-3.5">
                    <div className="flex items-center justify-between px-2 mb-2">
                      <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={13} className="text-white/60" />
                        Recent Searches
                      </span>
                      <button
                        onMouseDown={clearRecentSearches}
                        className="text-[11px] font-semibold text-white/40 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Clear All
                      </button>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {recentSearches.map((item) => (
                        <div
                          key={item}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(item);
                          }}
                          className="px-3 py-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Clock size={14} className="text-white/40 shrink-0" />
                            <span className="text-sm font-medium truncate">{item}</span>
                          </div>
                          <button
                            onMouseDown={(e) => removeSingleRecentSearch(item, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
                            title="Remove search"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Hot Search Tags */}
                <div className="p-3.5">
                  <div className="px-2 mb-2.5 text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame size={13} className="text-white/60" />
                    Hot Search Tags
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {HOT_SEARCH_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(tag);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Flame size={12} className="text-white/60 shrink-0" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3: Trending Searches */}
                <div className="p-3.5">
                  <div className="px-2 mb-2 text-[11px] font-bold text-white/50 uppercase tracking-wider">
                    Trending Searches
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {TRENDING_SEARCHES.map((suggestion) => (
                      <div
                        key={suggestion}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(suggestion);
                        }}
                        className="px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-2.5 text-sm font-medium"
                      >
                        <SearchIcon size={14} className="text-white/40" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showSearchResults ? (
          <section className="mb-12">
            <h2 className="text-[22px] font-bold text-white mb-5 flex items-center gap-3">
              {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
            </h2>
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden shadow-lg shadow-black/10">
              {searchResults.length === 0 && !isSearching ? (
                <div className="text-center py-12 text-white/40">No results found</div>
              ) : (
                searchResults.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => handlePlaySongWithAutoplay(song, searchResults)}
                    className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors group ${
                      isCurrentSong(song.id) ? 'bg-white/10' : 'hover:bg-white/[0.05]'
                    } ${index < searchResults.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                  >
                    <span className={`w-7 text-center font-medium text-sm ${
                      isCurrentSong(song.id) ? 'text-white' : 'text-white/30 group-hover:hidden'
                    }`}>
                      {isCurrentSong(song.id) ? <Disc3 size={16} className="animate-spin mx-auto" /> : index + 1}
                    </span>
                    <Play className="text-white w-7 hidden group-hover:block" size={14} fill="currentColor" />
                    <img src={song.coverUrl} alt={song.title} className="w-11 h-11 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${isCurrentSong(song.id) ? 'text-white' : 'text-white/90'}`}>{song.title}</h4>
                      <p className="text-white/40 text-xs truncate">{song.artist}</p>
                    </div>
                    <span className="text-white/30 text-xs font-medium">{formatDuration((song as SearchResult).duration)}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Mood & Genre chips */}
            <section className="mb-10 relative" ref={filterRefDesktop}>
              <h2 className="text-[22px] font-bold text-white mb-5">Moods & Genres</h2>
              
              {/* Horizontal Scroll Row with Inline More Button */}
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1 items-center flex-nowrap">
                {MOOD_CHIPS.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => handleMoodChip(chip)}
                    className={`px-5 py-2.5 rounded-full transition-all shrink-0 whitespace-nowrap ${
                      activeChip === chip.id ? 'bg-white text-black font-semibold' : 'bg-white/10 hover:bg-white/20 text-white font-medium'
                    }`}
                  >
                    <span className="text-sm">{chip.label}</span>
                  </button>
                ))}
                
                {/* Inline "More" Filter Pill at end of scroll bar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreFilters(prev => !prev);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all shrink-0 whitespace-nowrap shadow-md cursor-pointer ${
                    showMoreFilters ? 'bg-white text-black font-semibold' : 'bg-white/10 hover:bg-white/20 text-white font-medium'
                  }`}
                >
                  <span className="text-sm">More</span>
                  <ChevronDown size={16} className={`transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown Menu - Outside overflow container so it floats cleanly on mobile & desktop */}
              {showMoreFilters && (
                <div className="absolute right-0 top-full mt-2 w-56 max-w-[90vw] bg-[var(--color-theme-bg)] backdrop-blur-2xl border border-white/15 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex flex-col gap-1 max-h-96 overflow-y-auto hide-scrollbar">
                    {EXTRA_CHIPS.map(chip => (
                      <button
                        key={chip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoodChip(chip);
                          setShowMoreFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors ${
                          activeChip === chip.id ? 'bg-white/20 text-white font-semibold' : 'text-white/80 hover:bg-white/10 font-medium'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Mood Results */}
            {activeChip && moodResults.length > 0 && (
              <section className="mb-12">
                <h2 className="text-[22px] font-bold text-white mb-5 flex items-center justify-between">
                  {MOOD_CHIPS.find(c => c.id === activeChip)?.label || EXTRA_CHIPS.find(c => c.id === activeChip)?.label}
                  <button onClick={() => setActiveChip(null)} className="text-sm font-normal text-white/50 hover:text-white transition-colors">Clear Filter</button>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {moodResults.slice(0, visibleMoodCount).map(song => (
                    <div
                      key={song.id}
                      onClick={() => handlePlaySong(song, moodResults)}
                      className={`flex items-center gap-3 p-2 pr-4 rounded-xl cursor-pointer transition-all group backdrop-blur-md border border-white/[0.06] ${
                        isCurrentSong(song.id) ? 'bg-white/15 border-white/[0.12]' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}
                    >
                      <img src={song.coverUrl} alt={song.title} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm truncate ${isCurrentSong(song.id) ? 'text-white' : 'text-white/90'}`}>{song.title}</h4>
                        <p className="text-white/50 text-xs truncate">{song.artist}</p>
                      </div>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isCurrentSong(song.id) ? 'bg-white text-black' : 'opacity-0 group-hover:opacity-100 bg-white/10 text-white'
                      }`}>
                        {isCurrentSong(song.id) && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* More Songs Button */}
                {moodResults.length > visibleMoodCount && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setVisibleMoodCount(prev => prev + 16)}
                      className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-sm font-semibold transition-all border border-white/10 flex items-center gap-2 shadow-lg"
                    >
                      <span>More Songs ({moodResults.length - visibleMoodCount} remaining)</span>
                      <ChevronDown size={16} />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Horizontal Rows */}
            {isLoadingTrending ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/30" size={32} /></div>
            ) : (
              <>
                {recentlyPlayed.length > 0 && renderRow('Recently Played Songs', recentlyPlayed)}
                {watchlist.length > 0 && renderRow('Your Saved Watchlist', watchlist)}
                {savedPlaylists.length > 0 && renderRow('Your Favorited Playlists', savedPlaylists)}
                {followedArtists.length > 0 && renderRow('Your Followed Artists', followedArtists)}
                {recommendedSongs.length > 0 && renderRow('Recommended For You', recommendedSongs)}
                {homeRows.filter(r => r.id !== 'top_artists' && r.id !== 'top_indian_artists' && r.id !== 'top_global_artists').map(row => renderRow(row.title, row.items || (row as any).songs || []))}
                {renderRow('Top Indian Artists', TOP_INDIAN_ARTISTS)}
                {renderRow('Top International Artists', TOP_GLOBAL_ARTISTS)}
              </>
            )}
          </>
        )}
      </div>

      {/* === MOBILE LAYOUT (< md) === */}
      <div className="md:hidden pt-20 px-4 pb-8">
        
        {!showSearchResults && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Music</h1>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6 flex gap-2">
          {showSearchResults && (
            <button onClick={clearSearch} className="flex-shrink-0 text-white p-2 flex items-center justify-center transition-colors">
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search songs, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-full py-3 pl-11 pr-10 text-white placeholder-white/40 focus:outline-none focus:border-white/15 transition-all text-sm"
            />
            {isSearching && <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 text-white/40 animate-spin" size={16} />}
            {showSearchResults && (
              <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
            
            {/* Suggestions Dropdown (Mobile) */}
            {isSearchFocused && !showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-theme-bg)] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-30 divide-y divide-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Section 1: Recent User Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-3.5">
                    <div className="flex items-center justify-between px-2 mb-2">
                      <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={13} className="text-white/60" />
                        Recent Searches
                      </span>
                      <button
                        onMouseDown={clearRecentSearches}
                        onTouchStart={clearRecentSearches}
                        className="text-[11px] font-semibold text-white/40 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Clear All
                      </button>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {recentSearches.map((item) => (
                        <div
                          key={item}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(item);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(item);
                          }}
                          className="px-3 py-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Clock size={14} className="text-white/40 shrink-0" />
                            <span className="text-sm font-medium truncate">{item}</span>
                          </div>
                          <button
                            onMouseDown={(e) => removeSingleRecentSearch(item, e)}
                            onTouchStart={(e) => removeSingleRecentSearch(item, e)}
                            className="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
                            title="Remove search"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Hot Search Tags */}
                <div className="p-3.5">
                  <div className="px-2 mb-2.5 text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame size={13} className="text-white/60" />
                    Hot Search Tags
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {HOT_SEARCH_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(tag);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(tag);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Flame size={12} className="text-white/60 shrink-0" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3: Trending Searches */}
                <div className="p-3.5">
                  <div className="px-2 mb-2 text-[11px] font-bold text-white/50 uppercase tracking-wider">
                    Trending Searches
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {TRENDING_SEARCHES.map((suggestion) => (
                      <div
                        key={suggestion}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(suggestion);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(suggestion);
                        }}
                        className="px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-2.5 text-sm font-medium"
                      >
                        <SearchIcon size={14} className="text-white/40" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {showSearchResults ? (
          /* Search Results (Mobile) */
          <section>
            <h2 className="text-lg font-bold text-white mb-3">
              {isSearching ? 'Searching...' : `Results`}
            </h2>
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
              {searchResults.length === 0 && !isSearching ? (
                <div className="text-center py-10 text-white/40 text-sm">No results found</div>
              ) : (
                searchResults.map(song => (
                  <div
                    key={song.id}
                    onClick={() => handlePlaySongWithAutoplay(song, searchResults)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                      isCurrentSong(song.id) ? 'bg-white/10' : 'active:bg-white/[0.06]'
                    }`}
                  >
                    <img src={song.coverUrl} alt={song.title} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm truncate ${isCurrentSong(song.id) ? 'text-white' : 'text-white/90'}`}>{song.title}</h4>
                      <p className="text-white/45 text-xs truncate">{song.artist}</p>
                    </div>
                    {isCurrentSong(song.id) && isPlaying && <Disc3 size={16} className="text-white animate-spin flex-shrink-0" />}
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Mood & Genre chips */}
            <section className="mb-8 relative" ref={filterRefMobile}>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1 snap-x items-center flex-nowrap">
                {MOOD_CHIPS.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => handleMoodChip(chip)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-full transition-all snap-start ${
                      activeChip === chip.id ? 'bg-white text-black font-semibold' : 'bg-white/10 hover:bg-white/20 text-white font-medium'
                    }`}
                  >
                    <span className="text-xs whitespace-nowrap">{chip.label}</span>
                  </button>
                ))}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowMoreFilters(prev => !prev);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all bg-white/10 hover:bg-white/20 text-white font-medium shrink-0 whitespace-nowrap shadow-md cursor-pointer"
                >
                  <span className="text-xs">More</span>
                  <ChevronDown size={14} className={`transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showMoreFilters && (
                <div className="absolute right-0 top-full mt-2 w-48 max-w-[90vw] bg-[var(--color-theme-bg)] backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex flex-col gap-1 max-h-80 overflow-y-auto hide-scrollbar">
                    {EXTRA_CHIPS.map(chip => (
                      <button
                        key={chip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoodChip(chip);
                          setShowMoreFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors ${
                          activeChip === chip.id ? 'bg-white/20 text-white font-semibold' : 'text-white/80 hover:bg-white/10 font-medium'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Mood Results (Mobile) */}
            {activeChip && moodResults.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-white mb-3 flex justify-between items-center">
                  {MOOD_CHIPS.find(c => c.id === activeChip)?.label || EXTRA_CHIPS.find(c => c.id === activeChip)?.label}
                  <button onClick={() => setActiveChip(null)} className="text-xs font-normal text-white/50 px-2 py-1">Clear</button>
                </h2>
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                  {moodResults.slice(0, visibleMoodCount).map(song => (
                    <div
                      key={song.id}
                      onClick={() => handlePlaySong(song, moodResults)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                        isCurrentSong(song.id) ? 'bg-white/10' : 'active:bg-white/[0.06]'
                      }`}
                    >
                      <img src={song.coverUrl} alt={song.title} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm truncate ${isCurrentSong(song.id) ? 'text-white' : 'text-white/90'}`}>{song.title}</h4>
                        <p className="text-white/45 text-xs truncate">{song.artist}</p>
                      </div>
                      {isCurrentSong(song.id) && isPlaying && <Disc3 size={16} className="text-white animate-spin flex-shrink-0" />}
                    </div>
                  ))}
                </div>

                {moodResults.length > visibleMoodCount && (
                  <div className="mt-5 flex justify-center">
                    <button
                      onClick={() => setVisibleMoodCount(prev => prev + 16)}
                      className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-white/90 text-sm font-semibold transition-all border border-white/10 flex items-center gap-2"
                    >
                      <span>More Songs</span>
                      <ChevronDown size={16} />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Horizontal Rows */}
            {isLoadingTrending ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/30" size={32} /></div>
            ) : (
              <div className="mt-8">
                {recentlyPlayed.length > 0 && renderRow('Recently Played Songs', recentlyPlayed)}
                {watchlist.length > 0 && renderRow('Your Saved Watchlist', watchlist)}
                {savedPlaylists.length > 0 && renderRow('Your Favorited Playlists', savedPlaylists)}
                {followedArtists.length > 0 && renderRow('Your Followed Artists', followedArtists)}
                {recommendedSongs.length > 0 && renderRow('Recommended For You', recommendedSongs)}
                {homeRows.filter(r => r.id !== 'top_artists' && r.id !== 'top_indian_artists' && r.id !== 'top_global_artists').map(row => renderRow(row.title, row.items || (row as any).songs || []))}
                {renderRow('Top Indian Artists', TOP_INDIAN_ARTISTS)}
                {renderRow('Top International Artists', TOP_GLOBAL_ARTISTS)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
