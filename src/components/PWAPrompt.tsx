import { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Capacitor } from '@capacitor/core';

// Check once at module level
const isNativePlatform = Capacitor.isNativePlatform();

export function PWAPrompt() {
  // On native APK, unregister any existing SW and show nothing
  useEffect(() => {
    if (isNativePlatform && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      // Also clear all caches left by the old SW
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    }
  }, []);

  // Never render anything or register SW on native
  if (isNativePlatform) return null;

  return <PWAPromptWeb />;
}

// This component only mounts on web — SW hook is called here, never on native
function PWAPromptWeb() {

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  // Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Check if app is already installed/standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!needRefresh) {
        setShowInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [needRefresh]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    setShowInstall(false);
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    setDeferredPrompt(null);
  };

  // If there's an update, show Update Prompt
  if (needRefresh) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/20 shadow-[0_10px_40px_rgba(255,255,255,0.1)] rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white via-zinc-300 to-zinc-500"></div>
          
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
              <RefreshCw size={20} className="animate-spin-slow" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-white font-bold text-sm">Update Available</h3>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                A new version of Parlaxio is ready. Reload to apply the latest features and bug fixes.
              </p>
            </div>
            <button 
              onClick={() => setNeedRefresh(false)}
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 flex items-center justify-center transition shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full py-2.5 rounded-xl font-bold bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10 transition cursor-pointer"
          >
            Reload and Update
          </button>
        </div>
      </div>
    );
  }

  // If install is available, show Install Prompt
  if (showInstall) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
          
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/icon.svg" alt="App Icon" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-white font-bold text-sm">Install Parlaxio App</h3>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Install for a better experience, offline access, and an app icon on your home screen.
              </p>
            </div>
            <button 
              onClick={() => setShowInstall(false)}
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 flex items-center justify-center transition shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-white hover:bg-zinc-200 text-black shadow-lg transition cursor-pointer"
          >
            <Download size={16} />
            <span>Install App</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

