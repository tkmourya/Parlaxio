# YouTube Automatic Fallback (Future Reference)

If you ever want to use the YouTube (Piped API) code as an **Automatic Fallback** (i.e., when JioSaavn fails to play a song, it automatically fetches the stream from YouTube), you can use the code below.

## 1. Keep the API active in `musicService.ts`
Make sure the `PIPED_INSTANCES` and `getYoutubeAudioUrl` functions are UNCOMMENTED in `src/lib/musicService.ts`.

## 2. Update `MusicContext.tsx`
Replace the existing `onError` function inside your `useEffect` (around line 313) with this advanced fallback logic:

```tsx
    const onError = async (e: any) => {
      console.error('Audio playback error from Saavn', e);
      
      const current = currentSongRef.current;
      
      // If we haven't already tried a pipedapi (YouTube) URL, try the fallback!
      if (current && !audio.src.includes('pipedapi')) {
        console.log("Attempting YouTube fallback...");
        setIsLoading(true);
        
        try {
          const { getYoutubeAudioUrl } = await import('./musicService');
          const ytUrl = await getYoutubeAudioUrl(current.title, current.artist);
          
          if (ytUrl) {
            console.log("Fallback to YouTube successful!");
            audio.src = ytUrl;
            
            // Note: Mobile browsers might block this auto-play since it's asynchronous.
            // The user might have to click 'Play' again manually if it blocks.
            audio.play().catch(err => {
              console.warn("Mobile browser blocked fallback autoplay. User needs to press play.", err);
              setIsPlaying(false);
            });
            return;
          }
        } catch (err) {
          console.error("YouTube fallback also failed", err);
        }
      }
      
      // If all fails, stop the player
      setIsLoading(false);
      setIsPlaying(false);
    };
```

## Why this works
Whenever the browser's `<audio>` tag throws an error (e.g., Saavn returns a 404 broken link), the `onError` event fires. This code catches that error, dynamically imports the YouTube fetcher, gets the stream, and injects it right back into the player so the music continues!
