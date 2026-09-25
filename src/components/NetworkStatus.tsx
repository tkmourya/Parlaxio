import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (isOffline) {
      document.documentElement.style.setProperty('--offline-banner-height', 'calc(env(safe-area-inset-top, 0px) + 28px)');
    } else {
      document.documentElement.style.setProperty('--offline-banner-height', '0px');
    }
    return () => document.documentElement.style.setProperty('--offline-banner-height', '0px');
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top-full duration-300 pointer-events-none">
      <div className="w-full bg-white/15 backdrop-blur-2xl shadow-2xl px-4 pt-[calc(env(safe-area-inset-top,0px))] pb-0.5 flex items-center justify-center gap-2 h-[calc(env(safe-area-inset-top,0px)+28px)]">
        <WifiOff size={14} className="text-white/90 drop-shadow-md" />
        <span className="text-[11px] sm:text-xs font-bold tracking-wide text-white drop-shadow-md">No Internet Connection</span>
      </div>
    </div>
  );
}
