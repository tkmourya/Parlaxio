import { useState, useEffect } from 'react';
import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { TrendingView } from './views/TrendingView';
import { WatchlistView } from './views/WatchlistView';
import { MoviesView } from './views/MoviesView';
import { SeriesView } from './views/SeriesView';
import { AnimeView } from './views/AnimeView';
import { PlayerView } from './views/PlayerView';
import { DetailsView } from './views/DetailsView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { ProviderView } from './views/ProviderView';
import { LiveTVView } from './views/LiveTVView';
import { PrivacyPolicyView, TermsView, LegalDMCAView } from './views/LegalViews';
import { BottomNav } from './components/BottomNav';
import { AuthPromptModal } from './components/AuthPromptModal';
import { TopNav } from './components/TopNav';
import { PWAPrompt } from './components/PWAPrompt';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { useRouter } from './lib/router';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [hideSettingsNav, setHideSettingsNav] = useState(false);
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
    if (!loading && playingMedia && !user) {
      setShowAuthPrompt(true);
    }
  }, [playingMedia, user, loading]);

  const handlePlay = (id: number, type: 'movie' | 'tv', season?: number, episode?: number) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    navigatePlay(id, type, season, episode);
  };

  return (
    <div className="min-h-screen text-white selection:bg-white/30">
      {/* Top Nav for Desktop (Hidden on Player, Details, Auth, and Settings/LiveTV/Legal) */}
      {!playingMedia && !detailsMedia && currentTab !== 'auth' && currentTab !== 'settings' && currentTab !== 'livetv' && currentTab !== 'privacy' && currentTab !== 'terms' && currentTab !== 'legal' && (
        <TopNav currentTab={currentTab} onChange={navigateTab} onAuthClick={navigateAuth} />
      )}

      {/* Main Content Area */}
      <main className="min-h-screen">
        {currentTab === 'home' && <HomeView onPlay={navigateDetails} onContinueWatch={handlePlay} onProviderSelect={navigateProvider} onLiveTVClick={() => navigateTab('livetv')} />}
        {currentTab === 'movies' && <MoviesView onPlay={navigateDetails} />}
        {currentTab === 'series' && <SeriesView onPlay={navigateDetails} />}
        {currentTab === 'anime' && <AnimeView onPlay={navigateDetails} />}
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

      {/* Bottom Nav for Mobile (Hidden on Player, Details, Auth, and Settings/LiveTV/Legal) */}
      {!playingMedia && !detailsMedia && currentTab !== 'auth' && currentTab !== 'settings' && currentTab !== 'livetv' && currentTab !== 'privacy' && currentTab !== 'terms' && currentTab !== 'legal' && (
        <BottomNav currentTab={currentTab} onChange={navigateTab} />
      )}

      {/* Movie / Series Details Page */}
      {detailsMedia && !playingMedia && (
        <div className="fixed inset-0 z-40 bg-black overflow-y-auto">
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
        <div className="fixed inset-0 z-50 bg-black">
          <PlayerView 
            media={playingMedia} 
            onBack={navigateBack} 
            onPlay={handlePlay}
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

      {/* PWA Update and Install Prompts */}
      <PWAPrompt />
    </div>
  );
}
