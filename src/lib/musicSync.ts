import { account } from './appwrite';
import { Song, FollowedArtist, SavedPlaylist } from './MusicContext';

export interface CloudMusicData {
  musicWatchlist?: Song[];
  followedArtists?: FollowedArtist[];
  savedPlaylists?: SavedPlaylist[];
  recentlyPlayed?: Song[];
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export async function syncMusicToCloud(data: CloudMusicData) {
  try {
    const user = await account.get();
    if (!user) return;

    if (syncTimer) clearTimeout(syncTimer);

    syncTimer = setTimeout(async () => {
      try {
        const currentPrefs = await account.getPrefs();
        const updatedPrefs = {
          ...currentPrefs,
          ...(data.musicWatchlist !== undefined && { musicWatchlist: JSON.stringify(data.musicWatchlist) }),
          ...(data.followedArtists !== undefined && { followedArtists: JSON.stringify(data.followedArtists) }),
          ...(data.savedPlaylists !== undefined && { savedPlaylists: JSON.stringify(data.savedPlaylists) }),
          ...(data.recentlyPlayed !== undefined && { recentlyPlayed: JSON.stringify(data.recentlyPlayed) }),
        };
        await account.updatePrefs(updatedPrefs);
      } catch (err) {
        console.error('Failed to sync music data to cloud:', err);
      }
    }, 800);
  } catch {
    // User not logged in
  }
}

export async function fetchMusicFromCloud(): Promise<CloudMusicData | null> {
  try {
    const user = await account.get();
    if (!user) return null;

    const prefs = await account.getPrefs();
    return {
      musicWatchlist: prefs.musicWatchlist ? JSON.parse(prefs.musicWatchlist) : undefined,
      followedArtists: prefs.followedArtists ? JSON.parse(prefs.followedArtists) : undefined,
      savedPlaylists: prefs.savedPlaylists ? JSON.parse(prefs.savedPlaylists) : undefined,
      recentlyPlayed: prefs.recentlyPlayed ? JSON.parse(prefs.recentlyPlayed) : undefined,
    };
  } catch {
    return null;
  }
}
