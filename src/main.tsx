import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/AuthContext.tsx';
import { MusicProvider } from './lib/MusicContext.tsx';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEYS = [
  'watchlist', 
  'cinestream_history', 
  'parlaxio_music_watchlist', 
  'parlaxio_followed_artists', 
  'parlaxio_saved_playlists', 
  'parlaxio_recently_played'
];

async function initApp() {
  // Sync Native Preferences to localStorage on App Boot
  if (Capacitor.isNativePlatform()) {
    try {
      for (const key of STORAGE_KEYS) {
        const { value } = await Preferences.get({ key });
        if (value) {
          localStorage.setItem(key, value);
        }
      }
      
      // Patch localStorage to automatically sync writes back to Preferences natively
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        originalSetItem.call(this, key, value);
        if (STORAGE_KEYS.includes(key) || key.startsWith('parlaxio_')) {
          Preferences.set({ key, value }).catch(e => console.error('Pref set error', e));
        }
      };
      
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = function(key) {
        originalRemoveItem.call(this, key);
        Preferences.remove({ key }).catch(e => console.error('Pref remove error', e));
      };
      
    } catch (e) {
      console.error('Failed to load native preferences:', e);
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <MusicProvider>
          <App />
        </MusicProvider>
      </AuthProvider>
    </StrictMode>,
  );
}

initApp();
