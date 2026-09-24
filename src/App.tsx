import { useState, useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { TrendingView } from './views/TrendingView';
import { WatchlistView } from './views/WatchlistView';
import { MoviesView } from './views/MoviesView';
import { SeriesView } from './views/SeriesView';
import { AnimeView } from './views/AnimeView';
import { MusicView } from './views/MusicView';
import { PlayerView } from './views/PlayerView';
import { DetailsView } from './views/DetailsView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { ProviderView } from './views/ProviderView';
import { LiveTVView } from './views/LiveTVView';
import { PrivacyPolicyView, TermsView, LegalDMCAView } from './views/LegalViews';
import { BottomNav } from './components/BottomNav';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer';
import { AuthPromptModal } from './components/AuthPromptModal';
import { VerificationPromptModal } from './components/VerificationPromptModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { TopNav } from './components/TopNav';
import { PWAPrompt } from './components/PWAPrompt';
import { NetworkStatus } from './components/NetworkStatus';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { useRouter } from './lib/router';
import { loadTheme } from './lib/preferences';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

function useDoubleBackToExit() {
  const [showExitToast, setShowExitToast] = useState(false);

  useEffect(() => {
    // Only initialize this logic once
    if (!window.history.state?.isWorkingState && !window.history.state?.isAppRoot) {
      const fullUrl = window.location.pathname + window.location.search;
      window.history.replaceState({ isAppRoot: true }, '', fullUrl);
      window.history.pushState({ isWorkingState: true }, '', fullUrl);
    }
    
    // Force webview to go under the status bar
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    }

    let lastBackPressTime = 0;

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.isAppRoot) {
        // If we are on a tab other than home, go back to home instead of exiting
        if (window.location.pathname !== '/' && window.location.pathname !== '') {
          window.history.pushState({ isWorkingState: true }, '', '/');
          // Dispatch a custom event or just let the router pick it up on next render?
          // Actually, pushState doesn't fire popstate, so we must dispatch it manually:
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }

        const currentTime = Date.now();
        if (currentTime - lastBackPressTime < 2000) {
          if (Capacitor.isNativePlatform()) {
            CapApp.exitApp();
          } else {
            window.history.back();
          }
        } else {
          lastBackPressTime = currentTime;
          setShowExitToast(true);
          window.history.pushState({ isWorkingState: true }, '', window.location.pathname);
          setTimeout(() => setShowExitToast(false), 2000);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Capacitor Native Hardware Back Button
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          // If we are on a tab other than home, go back to home instead of exiting
          if (window.location.pathname !== '/' && window.location.pathname !== '') {
            window.history.pushState({ isWorkingState: true }, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
            return;
          }

          const currentTime = Date.now();
          if (currentTime - lastBackPressTime < 2000) {
            CapApp.exitApp();
          } else {
            lastBackPressTime = currentTime;
            setShowExitToast(true);
            setTimeout(() => setShowExitToast(false), 2000);
          }
        } else {
          window.history.back();
        }
      });
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (Capacitor.isNativePlatform()) {
        CapApp.removeAllListeners();
      }
    };
  }, []);

  return showExitToast;
}

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [resetData, setResetData] = useState<{userId: string, secret: string} | null>(null);
  const [hideSettingsNav, setHideSettingsNav] = useState(false);
  const [hideMusicTopNav, setHideMusicTopNav] = useState(false);
  const showExitToast = useDoubleBackToExit();
  const { 
    currentTab, 
    detailsMedia,
    playingMedia, 
    authMode, 
    providerDetails,
    navigateTab, 
    navigateDetails,
    navigatePlay, 
    navigateBack, 
    navigateAuth,
    navigateProvider
  } = useRouter();

  // API Key is now handled securely by Vercel Serverless Function in production
  // We no longer block the UI here.

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (currentTab !== 'music') {
      setHideMusicTopNav(false);
    }
  }, [currentTab]);

  useEffect(() => {
    if (!loading && playingMedia && !user) {
      setShowAuthPrompt(true);
    }
  }, [playingMedia, user, loading]);

  const { completeVerification } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const secret = params.get('secret');

    if (userId && secret) {
      if (params.get('verify') === 'true') {
        completeVerification(userId, secret).then(() => {
          alert('Email successfully verified! You now have the VIP badge.');
          window.history.replaceState({}, '', '/');
        }).catch((e: any) => {
          alert('Verification failed: ' + e.message);
        });
      } else if (params.get('reset') === 'true') {
        setResetData({ userId, secret });
        window.history.replaceState({}, '', '/');
      }
    }
  }, [completeVerification]);

  useEffect(() => {
    const handleAuthRequired = () => {
      setShowAuthPrompt(true);
    };
    window.addEventListener('auth-required', handleAuthRequired);
    return () => window.removeEventListener('auth-required', handleAuthRequired);
  }, []);

  const handlePlay = (id: number, type: 'movie' | 'tv', season?: number, episode?: number) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    if (!user.emailVerification) {
      setShowVerificationPrompt(true);
      return;
    }
    navigatePlay(id, type, season, episode);
  };

  return (
    <div className="min-h-screen text-white selection:bg-white/30">
      {/* Top Nav for Desktop (Hidden on Player, Details, Auth, Settings/LiveTV/Legal, and Music Artist/Playlist Subviews) */}
      {!playingMedia && !detailsMedia && !hideMusicTopNav && currentTab !== 'auth' && currentTab !== 'settings' && currentTab !== 'livetv' && currentTab !== 'privacy' && currentTab !== 'terms' && currentTab !== 'legal' && (
        <TopNav currentTab={currentTab} onChange={navigateTab} onAuthClick={navigateAuth} />
      )}

      {/* Main Content Area */}
      <main className="min-h-screen">
        {currentTab === 'home' && <HomeView onPlay={navigateDetails} onContinueWatch={handlePlay} onProviderSelect={navigateProvider} onLiveTVClick={() => navigateTab('livetv')} />}
        {currentTab === 'movies' && <MoviesView onPlay={navigateDetails} />}
        {currentTab === 'series' && <SeriesView onPlay={navigateDetails} />}
        {currentTab === 'anime' && <AnimeView onPlay={navigateDetails} />}
        {currentTab === 'music' && <MusicView onSubViewChange={setHideMusicTopNav} />}
        {currentTab === 'trending' && <TrendingView onPlay={navigateDetails} />}
        {currentTab === 'search' && <SearchView onPlay={navigateDetails} />}
        {currentTab === 'watchlist' && <WatchlistView onPlay={navigateDetails} />}
        {currentTab === 'settings' && (
          <SettingsView 
            onPlay={navigateDetails} 
            onAuthClick={navigateAuth} 
            onSubViewChange={setHideSettingsNav}
            onNavigate={navigateTab}
          />
        )}
        {currentTab === 'provider' && providerDetails && (
          <ProviderView 
            providerId={providerDetails.id} 
            providerName={providerDetails.name} 
            onPlay={navigateDetails} 
          />
        )}
        {currentTab === 'auth' && <AuthView initialMode={authMode} onComplete={() => navigateTab('home')} />}
        {currentTab === 'livetv' && <LiveTVView onBack={() => navigateTab('home')} onRequireAuth={() => setShowAuthPrompt(true)} />}
        
        {/* Legal Pages */}
        {currentTab === 'privacy' && <PrivacyPolicyView onBack={navigateBack} />}
        {currentTab === 'terms' && <TermsView onBack={navigateBack} />}
        {currentTab === 'legal' && <LegalDMCAView onBack={navigateBack} />}
      </main>

      <GlobalAudioPlayer currentTab={currentTab} />

      {/* Bottom Nav for Mobile (Hidden on Player, Details, Auth, and Settings/LiveTV/Legal) */}
      {!playingMedia && !detailsMedia && currentTab !== 'auth' && currentTab !== 'settings' && currentTab !== 'livetv' && currentTab !== 'privacy' && currentTab !== 'terms' && currentTab !== 'legal' && (
        <BottomNav currentTab={currentTab} onChange={navigateTab} />
      )}

      {/* Movie / Series Details Page */}
      {detailsMedia && !playingMedia && (
        <div className="fixed inset-0 z-[60] bg-[var(--color-theme-bg)] overflow-y-auto">
          <DetailsView 
            media={detailsMedia} 
            onBack={navigateBack} 
            onWatch={handlePlay}
            onSelectRelated={navigateDetails}
          />
        </div>
      )}

      {/* Fullscreen Video Player Modal */}
      {playingMedia && user && (
        <div className="fixed inset-0 z-50 bg-[var(--color-theme-bg)]">
          <PlayerView 
            media={playingMedia} 
            onBack={navigateBack} 
            onPlay={navigateDetails}
          />
        </div>
      )}

      {/* Beautiful Auth Prompt Modal */}
      {showAuthPrompt && (
        <AuthPromptModal 
          onClose={() => setShowAuthPrompt(false)}
          onLogin={() => {
            setShowAuthPrompt(false);
            navigateAuth('login');
          }}
          onRegister={() => {
            setShowAuthPrompt(false);
            navigateAuth('register');
          }}
        />
      )}

      {/* Verification Prompt Modal */}
      {showVerificationPrompt && (
        <VerificationPromptModal onClose={() => setShowVerificationPrompt(false)} />
      )}

      {/* Reset Password Modal */}
      {resetData && (
        <ResetPasswordModal 
          userId={resetData.userId} 
          secret={resetData.secret} 
          onClose={() => setResetData(null)}
          onSuccess={() => {
            setResetData(null);
            alert('Password successfully reset! Please login.');
            setShowAuthPrompt(true);
          }}
        />
      )}

      {/* PWA Update and Install Prompts */}
      <PWAPrompt />

      {/* Offline/No Internet Indicator */}
      <NetworkStatus />

      {/* Double Back to Exit Toast */}
      {showExitToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xl text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-2xl whitespace-nowrap">
            Press back again to exit
          </div>
        </div>
      )}
    </div>
  );
}
