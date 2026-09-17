import { useEffect, useRef } from 'react';
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}
      <div className="w-full h-full [&>.plyr]:h-full [&>.plyr]:w-full [&_.plyr__controls]:mb-6 md:[&_.plyr__controls]:mb-10">
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain"
          crossOrigin="anonymous" 
          playsInline 
          poster={poster}
        ></video>
      </div>
    </div>
  );
}
