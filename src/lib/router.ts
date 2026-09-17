import { useState, useEffect } from 'react';
import { TabType } from '../components/TopNav';

export interface RouteState {
  tab: TabType;
  detailsMedia: { id: number; type: 'movie' | 'tv' } | null;
  playingMedia: { id: number; type: 'movie' | 'tv'; season?: number; episode?: number } | null;
  authMode: 'login' | 'register';
  providerDetails?: { id: string; name: string } | null;
}

/**
 * Parses the current pathname into a structured RouteState.
 */
export function parsePath(pathname: string): RouteState {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  
  // 1. Check /watch/:type/:id format
  const watchMatch = cleanPath.match(/^\/watch\/(movie|tv)\/(\d+)$/);
  if (watchMatch) {
    const type = watchMatch[1] as 'movie' | 'tv';
    const id = parseInt(watchMatch[2], 10);
    return {
      tab: type === 'tv' ? 'series' : 'movies',
      detailsMedia: { type, id },
      playingMedia: { type, id },
      authMode: 'login'
    };
  }

  // 2. Check /movie/:id or /tv/:id format (Details Page)
  const movieMatch = cleanPath.match(/^\/movie\/(\d+)$/);
  if (movieMatch) {
    return {
      tab: 'movies',
      detailsMedia: { type: 'movie', id: parseInt(movieMatch[1], 10) },
      playingMedia: null,
      authMode: 'login'
    };
  }

  const tvMatch = cleanPath.match(/^\/tv\/(\d+)$/);
  if (tvMatch) {
    return {
      tab: 'series',
      detailsMedia: { type: 'tv', id: parseInt(tvMatch[1], 10) },
      playingMedia: null,
      authMode: 'login'
    };
  }

  const detailsMatch = cleanPath.match(/^\/details\/(movie|tv)\/(\d+)$/);
  if (detailsMatch) {
    const type = detailsMatch[1] as 'movie' | 'tv';
    const id = parseInt(detailsMatch[2], 10);
    return {
      tab: type === 'tv' ? 'series' : 'movies',
      detailsMedia: { type, id },
      playingMedia: null,
      authMode: 'login'
    };
  }

  const authMatch = cleanPath.match(/^\/(login|signup)$/);
  if (authMatch) {
    return {
      tab: 'auth',
      detailsMedia: null,
      playingMedia: null,
      authMode: authMatch[1] === 'login' ? 'login' : 'register'
    };
  }

  const providerMatch = cleanPath.match(/^\/provider\/(\d+)\/(.*)$/);
  if (providerMatch) {
    return {
      tab: 'provider',
      detailsMedia: null,
      playingMedia: null,
      authMode: 'login',
      providerDetails: { id: providerMatch[1], name: decodeURIComponent(providerMatch[2]) }
    };
  }

  // 3. Standard tab routes
  if (cleanPath === '/movies') return { tab: 'movies', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/series') return { tab: 'series', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/anime') return { tab: 'anime', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/trending') return { tab: 'trending', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/search') return { tab: 'search', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/watchlist') return { tab: 'watchlist', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/settings') return { tab: 'settings', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/livetv') return { tab: 'livetv', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/privacy') return { tab: 'privacy', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/terms') return { tab: 'terms', detailsMedia: null, playingMedia: null, authMode: 'login' };
  if (cleanPath === '/legal') return { tab: 'legal', detailsMedia: null, playingMedia: null, authMode: 'login' };
  
  return {
    tab: 'home',
    detailsMedia: null,
    playingMedia: null,
    authMode: 'login'
  };
}

/**
 * Hook for managing browser URLs, browser back/forward buttons, and routing.
 */
export function useRouter() {
  const [route, setRoute] = useState<RouteState>(() => parsePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parsePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTab = (tab: TabType) => {
    const targetUrl = tab === 'home' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    setRoute({ tab, detailsMedia: null, playingMedia: null, authMode: 'login' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateDetails = (id: number, type: 'movie' | 'tv') => {
    const targetUrl = `/${type}/${id}`;
    window.history.pushState({ prevPath: window.location.pathname }, '', targetUrl);
    setRoute((prev) => ({ ...prev, detailsMedia: { id, type }, playingMedia: null }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigatePlay = (id: number, type: 'movie' | 'tv', season?: number, episode?: number) => {
    const targetUrl = `/watch/${type}/${id}`;
    window.history.pushState({ prevPath: window.location.pathname }, '', targetUrl);
    setRoute((prev) => ({ ...prev, playingMedia: { id, type, season, episode } }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateBack = () => {
    // If we have an internal history state (from our pushState), use native back
    // to preserve scroll positions automatically.
    if (window.history.state && window.history.state.prevPath) {
      window.history.back();
      return;
    }

    if (route.playingMedia) {
      // From Player → go to details or home (skip all iframe history entries)
      if (route.detailsMedia) {
        const targetUrl = `/${route.detailsMedia.type}/${route.detailsMedia.id}`;
        window.history.replaceState(null, '', targetUrl);
        setRoute((prev) => ({ ...prev, playingMedia: null }));
      } else {
        const targetUrl = route.tab === 'home' ? '/' : `/${route.tab}`;
        window.history.replaceState(null, '', targetUrl);
        setRoute((prev) => ({ ...prev, playingMedia: null, detailsMedia: null }));
      }
    } else if (route.detailsMedia) {
      // From Details → go back to tab
      const targetUrl = route.tab === 'home' ? '/' : `/${route.tab}`;
      window.history.replaceState(null, '', targetUrl);
      setRoute((prev) => ({ ...prev, detailsMedia: null }));
    } else if (route.providerDetails) {
      // From Provider → go back to home
      window.history.replaceState(null, '', '/');
      setRoute({ tab: 'home', detailsMedia: null, playingMedia: null, authMode: 'login' });
    } else if (route.tab === 'auth') {
      window.history.replaceState(null, '', '/');
      setRoute({ tab: 'home', detailsMedia: null, playingMedia: null, authMode: 'login' });
    } else {
      window.history.back();
    }
  };

  const navigateAuth = (mode: 'login' | 'register') => {
    const targetUrl = mode === 'register' ? '/signup' : '/login';
    window.history.pushState(null, '', targetUrl);
    setRoute((prev) => ({ ...prev, tab: 'auth', authMode: mode, detailsMedia: null, playingMedia: null }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateProvider = (id: string, name: string) => {
    const targetUrl = `/provider/${id}/${encodeURIComponent(name)}`;
    window.history.pushState(null, '', targetUrl);
    setRoute((prev) => ({ ...prev, tab: 'provider', detailsMedia: null, playingMedia: null, providerDetails: { id, name } }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    currentTab: route.tab,
    detailsMedia: route.detailsMedia,
    playingMedia: route.playingMedia,
    authMode: route.authMode,
    providerDetails: route.providerDetails,
    navigateTab,
    navigateDetails,
    navigatePlay,
    navigateBack,
    navigateAuth,
    navigateProvider
  };
}
