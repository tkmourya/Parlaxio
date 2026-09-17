import { useState } from 'react';
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
import { BottomNav } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { AuthProvider } from './lib/AuthContext';
import { useRouter } from './lib/router';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
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

  return (
    <div className="min-h-screen text-white selection:bg-white/30">
      {/* Top Nav for Desktop (Hidden on Player, Details, Auth, and Settings/LiveTV) */}
      {!playingMedia && !detailsMedia && currentTab !== 'auth' && currentTab !== 'settings' && currentTab !== 'livetv' && (
        <TopNav currentTab={currentTab} onChange={navigateTab} onAuthClick={navigateAuth} />
      )}

      {/* Main Content Area */}
      <main className="min-h-screen">
        {currentTab === 'home' && <HomeView onPlay={navigateDetails} onContinueWatch={navigatePlay} onProviderSelect={navigateProvider} onLiveTVClick={() => navigateTab('livetv')} />}
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
        {currentTab === 'livetv' && <LiveTVView onBack={() => navigateTab('home')} />}
      </main>

      {/* Bottom Nav for Mobile (Hidden on Player, Details, Auth, and Settings/LiveTV) */}
      {!playingMedia && !detailsMedia && currentTab !== 'auth' && currentTab !== 'settings' && currentTab !== 'livetv' && (
        <BottomNav currentTab={currentTab} onChange={navigateTab} />
      )}

      {/* Movie / Series Details Page */}
      {detailsMedia && !playingMedia && (
        <div className="fixed inset-0 z-40 bg-black overflow-y-auto">
          <DetailsView 
            media={detailsMedia} 
            onBack={navigateBack} 
            onWatch={navigatePlay}
            onSelectRelated={navigateDetails}
          />
        </div>
      )}

      {/* Fullscreen Video Player Modal */}
      {playingMedia && (
        <div className="fixed inset-0 z-50 bg-black">
          <PlayerView 
            media={playingMedia} 
            onBack={navigateBack} 
            onPlay={navigatePlay}
          />
        </div>
      )}
    </div>
  );
}
