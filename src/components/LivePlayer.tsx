import { useEffect, useRef, useState } from 'react';
// - Plyr types don't declare a default export
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';

interface LivePlayerProps {
  url: string;
  poster?: string;
  onClose?: () => void;
}

export function LivePlayer({ url, poster, onClose }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Default Plyr options
    const defaultOptions: Plyr.Options = {
      autoplay: true,
      controls: [
        'play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
      ],
      settings: ['quality', 'speed'],
    };

    function initPlayer() {
      if (!playerRef.current) {
        playerRef.current = new Plyr(videoElement!, defaultOptions);

        // Listen for controls visibility to toggle our custom UI
        playerRef.current.on('controlshidden', () => setIsControlsVisible(false));
        playerRef.current.on('controlsshown', () => setIsControlsVisible(true));
      }
    }

    // If HLS is supported and we're passing an m3u8 playlist
    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 100,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        // Map available qualities
        const availableQualities = hls.levels.map((l) => l.height);
        availableQualities.unshift(0); // 0 will be 'Auto'

        defaultOptions.quality = {
          default: 0,
          options: availableQualities,
          forced: true,
          onChange: (e: number) => updateQuality(e),
        };

        defaultOptions.i18n = {
          qualityBadge: {
            2160: '4K',
            1440: 'HD',
            1080: 'HD',
            720: 'HD',
            576: 'SD',
            480: 'SD',
          },
          qualityLabel: {
            0: 'Auto',
          },
        };

        initPlayer();
      });
    } else {
      // Native support (Safari) or simple MP4
      videoElement.src = url;
      initPlayer();
    }

    function updateQuality(newQuality: number) {
      if (!hlsRef.current) return;
      if (newQuality === 0) {
        hlsRef.current.currentLevel = -1; // Auto
      } else {
        hlsRef.current.levels.forEach((level, levelIndex) => {
          if (level.height === newQuality) {
            hlsRef.current!.currentLevel = levelIndex;
          }
        });
      }
    }

    return () => {
      // Don't destroy inside this effect to handle fast url switching safely
      // We will destroy on unmount
    };
  }, [url]);

  useEffect(() => {
    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-[110] w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-all border border-white/10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      )}

      <style>{`
        /* Netflix Red Theme */
        :root {
          --plyr-color-main: #e50914; /* Netflix Red */
        }
        
        /* Frosted Glass Settings Menu */
        .plyr__menu__container {
          background: rgba(24, 24, 27, 0.65) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
          padding: 6px !important;
        }

        /* Menu items hover effect */
        .plyr__menu__container .plyr__control {
          color: rgba(255, 255, 255, 0.9) !important;
          border-radius: 8px !important;
          transition: background 0.2s ease !important;
        }

        .plyr__menu__container .plyr__control:hover {
          background: rgba(255, 255, 255, 0.15) !important;
        }

        /* White checkmark for active radio button */
        .plyr__control[role="menuitemradio"][aria-checked="true"]::after {
          content: '' !important;
          display: block !important;
          position: absolute !important;
          width: 4px !important;
          height: 8px !important;
          border: solid white !important;
          border-width: 0 2px 2px 0 !important;
          transform: translateY(-60%) rotate(45deg) !important;
          border-radius: 0 !important;
          background: transparent !important;
          left: 13.5px !important; /* Adjusted further left for perfect center */
          top: 50% !important;
        }

        /* Mobile Layout Optimizations */
        @media (max-width: 480px) {
          .plyr__volume {
            display: none !important; /* Mobile uses physical volume buttons */
          }
          .plyr__controls__item.plyr__time {
            font-size: 12px !important; /* Make time slightly smaller on mobile */
          }
        }
      `}</style>

      <div className="w-full h-full [&>.plyr]:h-full [&>.plyr]:w-full [&_.plyr__controls]:mb-6 md:[&_.plyr__controls]:mb-10">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          playsInline
          poster={poster}
        ></video>
      </div>

      {/* LIVE Edge Button */}
      <button
        onClick={() => {
          if (videoRef.current) {
            // Seek to a huge number to force HLS jump to the live edge buffer
            videoRef.current.currentTime = videoRef.current.duration || 999999;
          }
        }}
        className={`absolute top-4 md:top-6 right-4 md:right-6 z-[110] px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-bold text-white tracking-widest uppercase hover:bg-black/60 transition-all duration-300 flex items-center gap-2 ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        title="Jump to Live"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
        LIVE
      </button>
    </div>
  );
}
