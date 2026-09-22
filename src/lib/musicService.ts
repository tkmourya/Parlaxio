import { Song } from './MusicContext';

const API_BASE = import.meta.env.VITE_MUSIC_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export interface SearchResult extends Song {
  duration: string;
  durationSec: number;
}

export async function searchSongs(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`${API_BASE}/api/music/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Music search error:', err);
    return [];
  }
}
export async function getSongDetails(id: string): Promise<SearchResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/music/song?id=${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.song || null;
  } catch {
    return null;
  }
}

export interface PlaylistItem {
  id: string;
  title: string;
  type: string;
  coverUrl: string;
  artist?: string;
}

export interface HomeRow {
  id: string;
  title: string;
  items: PlaylistItem[];
}

export async function getHomeRows(): Promise<HomeRow[]> {
  // 1. Try returning cached home rows instantly from localStorage for 0ms loading
  try {
    const cached = localStorage.getItem('parlaxio_home_rows_cache_v2');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Fetch network update asynchronously
        fetch(`${API_BASE}/api/music/home`)
          .then(res => res.json())
          .then(data => {
            if (data.rows) localStorage.setItem('parlaxio_home_rows_cache_v2', JSON.stringify(data.rows));
          })
          .catch(() => {});
        return parsed;
      }
    }
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/api/music/home`);
    if (!res.ok) throw new Error('Home API failed');
    const data = await res.json();
    if (data.rows) {
      localStorage.setItem('parlaxio_home_rows_cache_v2', JSON.stringify(data.rows));
    }
    return data.rows || [];
  } catch (err) {
    console.error('Home data error:', err);
    return [];
  }
}

export async function getRecommendations(songId: string, artistName: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`${API_BASE}/api/music/recommend?id=${encodeURIComponent(songId)}&artist=${encodeURIComponent(artistName)}`);
    if (!res.ok) throw new Error('Recommendation failed');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Recommend data error:', err);
    return [];
  }
}

export interface PlaylistData {
  id: string;
  title: string;
  coverUrl: string;
  songs: SearchResult[];
}

export async function getPlaylist(id: string): Promise<PlaylistData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/music/playlist?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Playlist fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Playlist data error:', err);
    return null;
  }
}

export async function getAlbum(id: string): Promise<PlaylistData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/music/album?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Album fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Album data error:', err);
    return null;
  }
}

export interface ArtistData {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  followerCount: string;
  songs: SearchResult[];
  albums: PlaylistItem[];
}

export async function getArtist(id: string): Promise<ArtistData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/music/artist?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Artist fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Artist data error:', err);
    return null;
  }
}

export function getAudioUrl(songId: string): string {
  return `${API_BASE}/api/music/audio/${songId}`;
}

// ==========================================
// YOUTUBE FALLBACK API (PIPED API)
// ==========================================
// const PIPED_INSTANCES = [
//   'https://pipedapi.kavin.rocks',
//   'https://pipedapi.lunar.icu',
//   'https://pipedapi.smnz.de',
//   'https://pi.ggtyler.dev/api'
// ];

// export async function getYoutubeAudioUrl(title: string, artist: string): Promise<string | null> {
//   const query = encodeURIComponent(`${title} ${artist} original audio`);
  
//   for (const instance of PIPED_INSTANCES) {
//     try {
//       // 1. Search for the track
//       const searchRes = await fetch(`${instance}/search?q=${query}&filter=music_songs`, { signal: AbortSignal.timeout(5000) });
//       if (!searchRes.ok) continue;
//       const searchData = await searchRes.json();
      
//       if (!searchData.items || searchData.items.length === 0) continue;
      
//       // Get the first result's video ID
//       const url = searchData.items[0].url;
//       const videoId = url.includes('?v=') ? url.split('?v=')[1] : url.split('/').pop();
//       if (!videoId) continue;
      
//       // 2. Get the stream details
//       const streamRes = await fetch(`${instance}/streams/${videoId}`, { signal: AbortSignal.timeout(5000) });
//       if (!streamRes.ok) continue;
//       const streamData = await streamRes.json();
      
//       if (!streamData.audioStreams || streamData.audioStreams.length === 0) continue;
      
//       // 3. Extract the best audio stream (m4a/webm)
//       const bestAudio = streamData.audioStreams
//         .filter((s: any) => s.mimeType.startsWith('audio/mp4') || s.mimeType.startsWith('audio/webm'))
//         .sort((a: any, b: any) => b.bitrate - a.bitrate)[0];
        
//       if (bestAudio?.url) {
//         return bestAudio.url;
//       }
//     } catch (e) {
//       console.warn(`Piped instance failed: ${instance}`);
//       continue;
//     }
//   }
  
//   return null;
// }
