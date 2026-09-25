import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { CapacitorMusicControls } from 'capacitor-music-controls-plugin';
import { Capacitor } from '@capacitor/core';
import { getAudioUrl, getSongDetails } from './musicService';
import { syncMusicToCloud, fetchMusicFromCloud } from './musicSync';
import { useAuth } from './AuthContext';

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  coverUrl: string;
  encryptedUrl?: string; // from Saavn
  type?: string;
}

export interface FollowedArtist {
  id: string;
  title: string;
  coverUrl: string;
  type?: string;
}

export interface SavedPlaylist {
  id: string;
  title: string;
  coverUrl: string;
  type: 'playlist' | 'album';
}

interface MusicContextType {
  currentSong: Song | null;
  queue: Song[];
  recentlyPlayed: Song[];
  watchlist: Song[];
  followedArtists: FollowedArtist[];
  savedPlaylists: SavedPlaylist[];
  isPlaying: boolean;
  isFullScreen: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  setIsFullScreen: (val: boolean) => void;
  playSong: (song: Song, newQueue?: Song[]) => void;
  setQueue: (queue: Song[] | ((prev: Song[]) => Song[])) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setIsPlaying: (val: boolean) => void;
  seekTo: (time: number) => void;
  toggleWatchlist: (song: Song) => void;
  isWatchlisted: (songId: string) => boolean;
  toggleFollowArtist: (artist: FollowedArtist) => void;
  isFollowingArtist: (artistId: string) => boolean;
  toggleSavePlaylist: (item: SavedPlaylist) => void;
  isPlaylistSaved: (playlistId: string) => boolean;
  closePlayer: () => void;
  useYouTubeSource: boolean;
  setUseYouTubeSource: (val: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    try {
      const saved = localStorage.getItem('parlaxio_last_played_song');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [queue, setQueue] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('parlaxio_last_played_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('parlaxio_recently_played');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [watchlist, setWatchlist] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('parlaxio_music_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>(() => {
    try {
      const saved = localStorage.getItem('parlaxio_followed_artists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem('parlaxio_saved_playlists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreenInternal] = useState(() => {
    try {
      return localStorage.getItem('parlaxio_player_fullscreen') === 'true';
    } catch {
      return false;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [useYouTubeSource, setUseYouTubeSource] = useState(false);

  // Sync isFullScreen with history stack for swipe-to-back support
  const setIsFullScreen = useCallback((val: boolean) => {
    if (val === isFullScreen) return;
    if (val) {
      // Push history state when opening full screen player
      window.history.pushState({ ...window.history.state, playerFullScreen: true }, '');
      setIsFullScreenInternal(true);
    } else {
      // If closing manually, and history has our state, pop it
      if (window.history.state && window.history.state.playerFullScreen) {
        window.history.back();
      } else {
        setIsFullScreenInternal(false);
      }
    }
  }, [isFullScreen]);

  // Listen to popstate to close player on swipe back
  useEffect(() => {
    const handlePopState = () => {
      if (window.history.state && window.history.state.playerFullScreen) {
        setIsFullScreenInternal(true);
      } else {
        setIsFullScreenInternal(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist full screen player state in localStorage & clean legacy player param
  useEffect(() => {
    try {
      localStorage.setItem('parlaxio_player_fullscreen', String(isFullScreen));
    } catch {}

    const url = new URL(window.location.href);
    if (url.searchParams.has('player')) {
      url.searchParams.delete('player');
      const cleanUrl = url.toString().replace(/title=([^&]+)/, (_, t) => `title=${t.replace(/\+/g, '%20')}`);
      window.history.replaceState(window.history.state, '', cleanUrl);
    }
  }, [isFullScreen]);

  // Use refs to keep stable callbacks without recreating the Audio element
  const currentSongRef = useRef<Song | null>(currentSong);
  const queueRef = useRef<Song[]>(queue);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const addToRecentlyPlayed = useCallback((song: Song) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      return [song, ...filtered].slice(0, 20);
    });
  }, []);

  const loadAndPlay = useCallback((song: Song) => {
    setIsLoading(true);
    setCurrentSong(song);
    addToRecentlyPlayed(song);
    setCurrentTime(0);
    setDuration(0);
    
    isTransitioningRef.current = true;
    
    const cleanCover = song.coverUrl?.includes('default') || song.coverUrl?.includes('share-image') ? '/logo_px.jpg' : song.coverUrl;
    
    // Update native notification FIRST (before audio src change) to minimize flicker
    if (Capacitor.isNativePlatform()) {
      // Update isPlaying immediately to keep notification alive
      try { CapacitorMusicControls.updateIsPlaying({ isPlaying: true }); } catch (_) { /* ignore */ }
      CapacitorMusicControls.create({
        track: song.title,
        artist: song.artist || 'Unknown Artist',
        cover: cleanCover || '',
        duration: song.durationSec || 0,
        elapsed: 0,
        hasScrubbing: true,
        isPlaying: true,
        dismissable: false,
        hasPrev: true,
        hasNext: true,
        hasClose: false,
        playIcon: 'media_play',
        pauseIcon: 'media_pause',
        prevIcon: 'media_prev',
        nextIcon: 'media_next',
        closeIcon: 'media_close',
        notificationIcon: 'notification'
      }).then(() => {
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(console.error);
        }
        setTimeout(() => { isTransitioningRef.current = false; }, 1000);
      }).catch(e => {
        console.error('MusicControls create error', e);
        isTransitioningRef.current = false;
      });
    } else {
      isTransitioningRef.current = false;
    }

    // Setup Media Session API for background playback & lockscreen controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || 'Unknown Artist',
        album: '',
        artwork: [
          { src: cleanCover || '', sizes: '150x150', type: 'image/jpeg' },
          { src: cleanCover || '', sizes: '500x500', type: 'image/jpeg' }
        ]
      });
    }

    // Start playing after notification is updated
    if (audioRef.current) {
      audioRef.current.src = getAudioUrl(song.id);
      audioRef.current.load(); // Ensure new src is fetched
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error('Playback failed synchronously, retrying...', e);
          setTimeout(() => {
            if (audioRef.current) audioRef.current.play().catch(console.error);
          }, 500);
        });
      }
    }
  }, [addToRecentlyPlayed]);

  // Handle YouTube Source asynchronous overriding (COMMENTED OUT FOR TESTING)
  useEffect(() => {
    let active = true;
    
    const setupYTAudio = async () => {
      /*
      // Only do this if YT source is enabled
      if (currentSong && audioRef.current && useYouTubeSource) {
        setIsLoading(true);
        try {
          const { getYoutubeAudioUrl } = await import('./musicService');
          const ytUrl = await getYoutubeAudioUrl(currentSong.title, currentSong.artist);
          
          if (!active) return;
          
          if (ytUrl) {
            audioRef.current.src = ytUrl;
            if (isPlaying) {
              audioRef.current.play().catch(e => console.error("YT Playback failed:", e));
            }
          } else {
            console.warn("YouTube fallback failed, using original Saavn audio.");
          }
        } catch (e) {
          console.error("Failed to fetch YT Audio:", e);
        }
        setIsLoading(false);
      } else {
        // If YT is disabled but a song is playing, make sure isLoading is false
        setIsLoading(false);
      }
      */
      setIsLoading(false);
    };
    
    setupYTAudio();
    
    return () => { active = false; };
  }, [currentSong, useYouTubeSource]);

  // Sync current playing song in URL searchParams (e.g. ?song=12345&title=Apna%20Bana%20Le)
  useEffect(() => {
    if (currentSong?.id) {
      const url = new URL(window.location.href);
      // Only set song and title if not browsing an artist or playlist page
      if (!url.searchParams.has('playlist') && !url.searchParams.has('album') && !url.searchParams.has('artist')) {
        url.searchParams.set('song', currentSong.id);
        if (currentSong.title) {
          url.searchParams.set('title', currentSong.title);
        }
        const cleanUrl = url.toString().replace(/title=([^&]+)/, (_, t) => `title=${t.replace(/\+/g, '%20')}`);
        window.history.replaceState(window.history.state, '', cleanUrl);
      }
    }
  }, [currentSong?.id, currentSong?.title]);

  // Restore song from URL on direct link / refresh
  useEffect(() => {
    const urlSongId = new URLSearchParams(window.location.search).get('song');
    if (urlSongId && (!currentSong || currentSong.id !== urlSongId)) {
      getSongDetails(urlSongId).then(song => {
        if (song) {
          loadAndPlay(song);
        }
      });
    }
  }, [loadAndPlay]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isTransitioningRef = useRef(false);

  const playNextInternal = useCallback(() => {
    const prev = currentSongRef.current;
    const currentQueue = queueRef.current;
    if (!prev) return;
    
    const currentIndex = currentQueue.findIndex(s => s.id === prev.id);
    if (currentIndex !== -1 && currentIndex < currentQueue.length - 1) {
      loadAndPlay(currentQueue[currentIndex + 1]);
    } else if (currentQueue.length > 0) {
      loadAndPlay(currentQueue[0]);
    }
  }, [loadAndPlay]);

  const playPrevInternal = useCallback(() => {
    const prev = currentSongRef.current;
    const currentQueue = queueRef.current;
    if (!prev) return;
    
    const currentIndex = currentQueue.findIndex(s => s.id === prev.id);
    if (currentIndex > 0) {
      loadAndPlay(currentQueue[currentIndex - 1]);
    } else {
      // If at start, restart current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }
  }, [loadAndPlay]);

  // Stable refs so the Audio element never needs to be recreated
  const playNextRef = useRef(playNextInternal);
  const playPrevRef = useRef(playPrevInternal);
  useEffect(() => { playNextRef.current = playNextInternal; }, [playNextInternal]);
  useEffect(() => { playPrevRef.current = playPrevInternal; }, [playPrevInternal]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.autoplay = true;
    audioRef.current = audio;

    // Set initial audio src if last song was loaded from localStorage
    if (currentSong) {
      audio.src = getAudioUrl(currentSong.id);
    }
    
    // Setup Media Session action handlers
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        audio.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextRef.current();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevRef.current();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
        }
      });
    }

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      if (Capacitor.isNativePlatform()) {
        CapacitorMusicControls.updateElapsed({ isPlaying: !audio.paused, elapsed: audio.currentTime });
      }
    };
    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      if (Capacitor.isNativePlatform()) {
        CapacitorMusicControls.updateElapsed({ isPlaying: true, elapsed: audio.currentTime });
      }
    };
    const onPause = () => {
      setIsPlaying(false);
      if (Capacitor.isNativePlatform()) {
        CapacitorMusicControls.updateElapsed({ isPlaying: false, elapsed: audio.currentTime });
      }
    };
    const onEnded = () => playNextRef.current();
    let lastErrorTime = 0;
    const onError = (e: any) => {
      console.error('Audio playback error', e);
      setIsLoading(false);
      // Auto-skip to next song on error, but guard against infinite loop
      const now = Date.now();
      if (now - lastErrorTime > 2000) {
        lastErrorTime = now;
        setTimeout(() => playNextRef.current(), 500);
      } else {
        // Too many errors too fast, stop playback
        setIsPlaying(false);
      }
    };

    // Native App Controls Listener
    const handleNativeControls = (rawAction: any) => {
      let actionObj = rawAction;
      if (typeof rawAction === 'string') {
        try {
          actionObj = JSON.parse(rawAction);
        } catch (e) {
          actionObj = { message: rawAction };
        }
      }
      const message = actionObj.message || actionObj;
      if (message === 'music-controls-next') {
        playNextRef.current();
      } else if (message === 'music-controls-previous') {
        playPrevRef.current();
      } else if (message === 'music-controls-pause') {
        if (!isTransitioningRef.current) audio.pause();
      } else if (message === 'music-controls-play') {
        audio.play();
      } else if (message === 'music-controls-destroy') {
        if (!isTransitioningRef.current) audio.pause();
      } else if (message === 'music-controls-seek-to') {
        const position = actionObj.position;
        if (position !== undefined) {
          audio.currentTime = position;
        }
      }
    };

    let nativeListener: any = null;
    if (Capacitor.isNativePlatform()) {
      nativeListener = CapacitorMusicControls.addListener('controlsNotification', handleNativeControls);
      document.addEventListener('controlsNotification', (event: any) => {
        handleNativeControls(event.message || event);
      });
    }

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (nativeListener) {
        nativeListener.remove();
      }
      document.removeEventListener('controlsNotification', handleNativeControls);
      audio.pause();
      audio.src = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps — Audio element created once, never destroyed

  // Cloud restore & merge on mount
  useEffect(() => {
    const restoreCloudData = async () => {
      const cloudData = await fetchMusicFromCloud();
      if (!cloudData) return;

      if (cloudData.musicWatchlist && cloudData.musicWatchlist.length > 0) {
        setWatchlist(prev => {
          const merged = [...prev];
          for (const item of cloudData.musicWatchlist!) {
            if (!merged.some(s => s.id === item.id)) merged.push(item);
          }
          localStorage.setItem('parlaxio_music_watchlist', JSON.stringify(merged));
          return merged;
        });
      }

      if (cloudData.followedArtists && cloudData.followedArtists.length > 0) {
        setFollowedArtists(prev => {
          const merged = [...prev];
          for (const item of cloudData.followedArtists!) {
            if (!merged.some(a => a.id === item.id || a.title === item.title)) merged.push(item);
          }
          localStorage.setItem('parlaxio_followed_artists', JSON.stringify(merged));
          return merged;
        });
      }

      if (cloudData.savedPlaylists && cloudData.savedPlaylists.length > 0) {
        setSavedPlaylists(prev => {
          const merged = [...prev];
          for (const item of cloudData.savedPlaylists!) {
            if (!merged.some(p => p.id === item.id)) merged.push(item);
          }
          localStorage.setItem('parlaxio_saved_playlists', JSON.stringify(merged));
          return merged;
        });
      }

      if (cloudData.recentlyPlayed && cloudData.recentlyPlayed.length > 0) {
        setRecentlyPlayed(prev => {
          const merged = [...prev];
          for (const item of cloudData.recentlyPlayed!) {
            if (!merged.some(s => s.id === item.id)) merged.push(item);
          }
          const sliced = merged.slice(0, 20);
          localStorage.setItem('parlaxio_recently_played', JSON.stringify(sliced));
          return sliced;
        });
      }
    };

    restoreCloudData();
  }, []);

  // Sync state changes to localStorage and Cloud
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem('parlaxio_last_played_song', JSON.stringify(currentSong));
    }
  }, [currentSong]);

  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem('parlaxio_last_played_queue', JSON.stringify(queue));
    }
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('parlaxio_recently_played', JSON.stringify(recentlyPlayed));
    syncMusicToCloud({ recentlyPlayed });
  }, [recentlyPlayed]);

  useEffect(() => {
    localStorage.setItem('parlaxio_music_watchlist', JSON.stringify(watchlist));
    syncMusicToCloud({ musicWatchlist: watchlist });
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('parlaxio_followed_artists', JSON.stringify(followedArtists));
    syncMusicToCloud({ followedArtists });
  }, [followedArtists]);

  useEffect(() => {
    localStorage.setItem('parlaxio_saved_playlists', JSON.stringify(savedPlaylists));
    syncMusicToCloud({ savedPlaylists });
  }, [savedPlaylists]);

  const toggleWatchlist = (song: Song) => {
    setWatchlist(prev => {
      const exists = prev.some(s => s.id === song.id);
      if (exists) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [song, ...prev];
      }
    });
  };

  const isWatchlisted = (songId: string) => watchlist.some(s => s.id === songId);

  const toggleFollowArtist = (artist: FollowedArtist) => {
    setFollowedArtists(prev => {
      const exists = prev.some(a => a.id === artist.id);
      if (exists) {
        return prev.filter(a => a.id !== artist.id);
      } else {
        return [artist, ...prev];
      }
    });
  };

  const isFollowingArtist = (artistId: string) => followedArtists.some(a => a.id === artistId);

  const toggleSavePlaylist = (item: SavedPlaylist) => {
    setSavedPlaylists(prev => {
      const exists = prev.some(p => p.id === item.id);
      if (exists) {
        return prev.filter(p => p.id !== item.id);
      } else {
        return [item, ...prev];
      }
    });
  };

  const isPlaylistSaved = (playlistId: string) => savedPlaylists.some(p => p.id === playlistId);

  const playSong = (song: Song, newQueue?: Song[]) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('auth-required'));
      return;
    }
    if (newQueue) setQueue(newQueue);
    loadAndPlay(song);
  };

  const playNext = () => playNextInternal();

  const playPrev = () => {
    const prev = currentSongRef.current;
    const currentQueue = queueRef.current;
    if (!prev) return;
    const currentIndex = currentQueue.findIndex(s => s.id === prev.id);
    if (currentIndex > 0) {
      loadAndPlay(currentQueue[currentIndex - 1]);
    } else {
      seekTo(0);
    }
  };

  const togglePlay = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('auth-required'));
      return;
    }
    if (!audioRef.current) return;
    if (!audioRef.current.src && currentSong) {
      audioRef.current.src = getAudioUrl(currentSong.id);
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error('Play toggle failed', e);
        setIsLoading(false);
      });
    }
  };

  const seekTo = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentSong(null);
    setIsFullScreen(false);
    localStorage.removeItem('parlaxio_last_played_song');
    localStorage.removeItem('parlaxio_player_fullscreen');
  };

  return (
    <MusicContext.Provider value={{
      currentSong, queue, recentlyPlayed, watchlist, followedArtists, savedPlaylists, isPlaying, isFullScreen, isLoading,
      currentTime, duration, setIsFullScreen, playSong, setQueue,
      playNext, playPrev, togglePlay, setIsPlaying, seekTo, closePlayer,
      toggleWatchlist, isWatchlisted, toggleFollowArtist, isFollowingArtist,
      toggleSavePlaylist, isPlaylistSaved, useYouTubeSource, setUseYouTubeSource
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) throw new Error('useMusic must be used within a MusicProvider');
  return context;
}
