import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

const fac = new FastAverageColor();

export function useImageColor(imageUrl: string | undefined | null) {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }

    let isMounted = true;
    
    // We append a cross-origin parameter if needed, but fast-average-color handles most
    fac.getColorAsync(imageUrl, { crossOrigin: 'anonymous' })
      .then(result => {
        if (isMounted) {
          setColor(result.hex);
          // Dynamically change status bar if on mobile
          if (Capacitor.isNativePlatform()) {
            StatusBar.setBackgroundColor({ color: result.hex }).catch(() => {});
          }
        }
      })
      .catch(() => {
        if (isMounted) setColor(null);
      });

    return () => {
      isMounted = false;
      // Reset the status bar to the original theme color when this view unmounts
      if (Capacitor.isNativePlatform()) {
        const metaColor = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
        if (metaColor) {
          StatusBar.setBackgroundColor({ color: metaColor }).catch(() => {});
        }
      }
    };
  }, [imageUrl]);

  return color;
}
