import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import CryptoJS from 'crypto-js';

const app = express();
app.use(cors());

const SAAVN_API_URL = process.env.SAAVN_API_URL;

// Simple In-Memory Cache for fast local responses
const apiCache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 hour

function getCache(key) {
  const item = apiCache.get(key);
  if (item && Date.now() < item.expiry) return item.data;
  return null;
}
function setCache(key, data) {
  // Prevent memory overload: Max 200 items
  if (apiCache.size >= 200) {
    const oldestKey = apiCache.keys().next().value;
    apiCache.delete(oldestKey);
  }
  apiCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// Middleware to set Vercel Edge Cache headers and handle In-Memory Caching
app.use('/api/music', (req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('/audio')) {
    // 1. Vercel CDN Cache
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    // 2. In-Memory Cache (for local development or warm Vercel instances)
    const cacheKey = req.originalUrl;
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return res.json(cached);
    }
    
    // Intercept response to save to memory cache
    const originalJson = res.json;
    res.json = function(body) {
      if (res.statusCode === 200 && !body.error) {
         setCache(cacheKey, body);
      }
      originalJson.call(this, body);
    };
  }
  next();
});

app.get('/api/music', (req, res) => {
  res.json({ status: 'ok', service: 'Parlaxio Music API (Vercel Serverless)' });
});

// Helper to decrypt Saavn URLs
function decryptSaavnUrl(encryptedUrl) {
  const secretKey = process.env.SAAVN_DES_KEY;
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const decrypted = CryptoJS.DES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
    key,
    { mode: CryptoJS.mode.ECB }
  );
  return decrypted.toString(CryptoJS.enc.Utf8).replace('_96.mp4', '_320.mp4');
}

// Map Saavn API response to our unified Song format
function mapSaavnSong(song) {
  let title = song.song || song.title;
  let artist = song.primary_artists || song.singers || song.subtitle || 'Unknown Artist';
  let image = song.image ? song.image.replace('150x150', '500x500') : '';
  
  // Fix weird encoding issues in Saavn titles
  if (title) title = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
  if (artist) artist = artist.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");

  return {
    id: song.id,
    title: title,
    artist: artist,
    duration: song.duration ? Math.floor(parseInt(song.duration) / 60) + ':' + (parseInt(song.duration) % 60).toString().padStart(2, '0') : '0:00',
    durationSec: parseInt(song.duration) || 0,
    coverUrl: image,
    encryptedUrl: song.encrypted_media_url || null
  };
}

// 1. Home Page Categories (Pre-fetched rows of Playlists/Albums)
app.get('/api/music/home', async (req, res) => {
  try {
    const rows = [];
    
    // Fetch Launch Data (Top Playlists & Trending)
    const launchRes = await fetch('https://www.jiosaavn.com/api.php?__call=webapi.getLaunchData&api_version=4&_format=json&_marker=0');
    const launchData = await launchRes.json();

    if (launchData.top_playlists) {
      rows.push({
        id: 'top_playlists',
        title: 'Top Popular Playlists',
        items: launchData.top_playlists.slice(0, 18).map(p => ({
          id: p.id || p.listid,
          title: p.title || p.listname,
          type: 'playlist',
          artist: p.subtitle || p.artist_name || p.header_desc || '',
          coverUrl: p.image ? p.image.replace('150x150', '500x500') : '',
        }))
      });
    }

    if (launchData.new_albums) {
      rows.push({
        id: 'new_albums',
        title: 'New Albums & Trending Releases',
        items: launchData.new_albums.slice(0, 18).map(a => {
          const primaryArtists = a.more_info?.artistMap?.primary_artists?.map(ar => ar.name).join(', ');
          const allArtists = a.more_info?.artistMap?.artists?.map(ar => ar.name).filter(Boolean);
          const uniqueArtists = Array.from(new Set(allArtists || [])).slice(0, 3).join(', ');
          const artistName = primaryArtists || uniqueArtists || a.artist_name || a.subtitle || a.music || a.header_desc || '';
          return {
            id: a.id || a.albumid,
            title: a.title || a.album,
            type: 'album',
            artist: artistName,
            coverUrl: a.image ? a.image.replace('150x150', '500x500') : '',
          };
        })
      });
    }

    // Rich categories with up to 18 cards per row
    const queries = [
      { id: 'trending_hits', title: 'Trending Bollywood Hits', q: 'latest bollywood' },
      { id: 'romantic', title: 'Romantic Hindi Melodies', q: 'romantic hits' },
      { id: 'party', title: 'Party & Punjabi Beats', q: 'punjabi party dance' },
      { id: 'hip_hop', title: 'Desi Hip Hop & Rap', q: 'desi hip hop' },
      { id: 'retro', title: 'Evergreen 90s & Retro Hits', q: '90s hindi hits' },
      { id: 'lofi', title: 'Lofi & Chill Relaxation', q: 'lofi chill hindi' },
      { id: 'devotional', title: 'Bhakti & Devotional', q: 'bhakti geet' },
      { id: 'global_pop', title: 'International Chartbusters', q: 'english pop hits' }
    ];

    const categoryPromises = queries.map(async (q) => {
      try {
        const pRes = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getPlaylistResults&q=${encodeURIComponent(q.q)}&_format=json&p=1&n=18`);
        const pData = await pRes.json();
        if (pData.results && pData.results.length > 0) {
          return {
            id: q.id,
            title: q.title,
            items: pData.results.map(p => ({
              id: p.id || p.listid,
              title: p.title || p.listname,
              type: 'playlist',
              artist: p.subtitle || p.artist_name || p.header_desc || '',
              coverUrl: p.image ? p.image.replace('150x150', '500x500') : '',
            }))
          };
        }
      } catch (e) {
        console.error(`Error fetching category ${q.id}:`, e.message);
      }
      return null;
    });

    const categoryResults = await Promise.all(categoryPromises);
    for (const cat of categoryResults) {
      if (cat) rows.push(cat);
    }

    // 1. Top Indian Artists Row
    const topIndianArtists = [
      { id: '459320', name: 'Arijit Singh', image: 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg' },
      { id: 'Lata Mangeshkar', name: 'Lata Mangeshkar', image: 'https://c.saavncdn.com/artists/Lata_Mangeshkar_004_20241003073909_500x500.jpg' },
      { id: 'Kishore Kumar', name: 'Kishore Kumar', image: 'https://c.saavncdn.com/artists/Kishore_Kumar_006_20241003072225_500x500.jpg' },
      { id: 'Mohammed Rafi', name: 'Mohammed Rafi', image: 'https://c.saavncdn.com/artists/Mohammed_Rafi_004_20241003071339_500x500.jpg' },
      { id: 'KK', name: 'KK', image: 'https://c.saavncdn.com/artists/KK_005_20241003072240_500x500.jpg' },
      { id: 'Alka Yagnik', name: 'Alka Yagnik', image: 'https://c.saavncdn.com/artists/Alka_Yagnik_004_20241118064500_500x500.jpg' },
      { id: '455130', name: 'Shreya Ghoshal', image: 'https://c.saavncdn.com/artists/Shreya_Ghoshal_007_20241101074144_500x500.jpg' },
      { id: 'Asha Bhosle', name: 'Asha Bhosle', image: 'https://c.saavncdn.com/artists/Asha_Bhosle_005_20241003072847_500x500.jpg' },
      { id: 'Palak Muchhal', name: 'Palak Muchhal', image: 'https://c.saavncdn.com/artists/Palak_Muchhal_004_20250625070200_500x500.jpg' },
      { id: '456863', name: 'Badshah', image: 'https://c.saavncdn.com/artists/Badshah_006_20241118064015_500x500.jpg' },
      { id: '888127', name: 'Darshan Raval', image: 'https://c.saavncdn.com/artists/Darshan_Raval_006_20250807060352_500x500.jpg' },
      { id: '464932', name: 'Neha Kakkar', image: 'https://c.saavncdn.com/artists/Neha_Kakkar_007_20241212115832_500x500.jpg' },
      { id: '455125', name: 'Sonu Nigam', image: 'https://c.saavncdn.com/artists/Sonu_Nigam_003_20260813182013_500x500.jpg' },
      { id: 'Diljit Dosanjh', name: 'Diljit Dosanjh', image: 'https://c.saavncdn.com/artists/Diljit_Dosanjh_005_20231025073054_500x500.jpg' },
      { id: 'A.R. Rahman', name: 'A.R. Rahman', image: 'https://c.saavncdn.com/artists/AR_Rahman_002_20210120084455_500x500.jpg' },
      { id: 'Jubin Nautiyal', name: 'Jubin Nautiyal', image: 'https://c.saavncdn.com/artists/Jubin_Nautiyal_003_20231130204020_500x500.jpg' },
      { id: 'Pritam', name: 'Pritam', image: 'https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg' },
      { id: 'Sunidhi Chauhan', name: 'Sunidhi Chauhan', image: 'https://c.saavncdn.com/artists/Sunidhi_Chauhan_005_20250515061617_500x500.jpg' },
      { id: 'Yo Yo Honey Singh', name: 'Yo Yo Honey Singh', image: 'https://c.saavncdn.com/artists/Yo_Yo_Honey_Singh_004_20260811095253_500x500.jpg' },
      { id: 'Guru Randhawa', name: 'Guru Randhawa', image: 'https://c.saavncdn.com/artists/Guru_Randhawa_004_20250701125845_500x500.jpg' },
      { id: 'Ankit Tiwari', name: 'Ankit Tiwari', image: 'https://c.saavncdn.com/artists/Ankit_Tiwari_002_20241004072220_500x500.jpg' },
      { id: 'Armaan Malik', name: 'Armaan Malik', image: 'https://c.saavncdn.com/artists/Armaan_Malik_006_20260813132832_500x500.jpg' }
    ];
    
    rows.push({
      id: 'top_indian_artists',
      title: 'Top Indian Artists',
      items: topIndianArtists.map(a => ({
        id: a.id,
        title: a.name,
        type: 'artist',
        coverUrl: a.image,
      }))
    });

    // 2. Top International Artists Row
    const topGlobalArtists = [
      { id: 'Shakira', name: 'Shakira', image: 'https://c.saavncdn.com/artists/Shakira_003_20200226074120_500x500.jpg' },
      { id: 'Taylor Swift', name: 'Taylor Swift', image: 'https://c.saavncdn.com/artists/Taylor_Swift_003_20200226074119_500x500.jpg' },
      { id: 'The Weeknd', name: 'The Weeknd', image: 'https://c.saavncdn.com/artists/The_Weeknd_002_20241003071400_500x500.jpg' },
      { id: 'Ed Sheeran', name: 'Ed Sheeran', image: 'https://c.saavncdn.com/artists/Ed_Sheeran_002_20250625073038_500x500.jpg' },
      { id: 'Drake', name: 'Drake', image: 'https://c.saavncdn.com/artists/Drake_006_20260520062317_500x500.jpg' },
      { id: 'Justin Bieber', name: 'Justin Bieber', image: 'https://c.saavncdn.com/artists/Justin_Bieber_005_20201127112218_500x500.jpg' },
      { id: 'Ariana Grande', name: 'Ariana Grande', image: 'https://c.saavncdn.com/artists/Ariana_Grande_007_20260616180049_500x500.jpg' },
      { id: 'Bruno Mars', name: 'Bruno Mars', image: 'https://c.saavncdn.com/artists/Bruno_Mars_003_20260324060413_500x500.jpg' },
      { id: 'Dua Lipa', name: 'Dua Lipa', image: 'https://c.saavncdn.com/artists/Dua_Lipa_004_20231120090922_500x500.jpg' },
      { id: 'Billie Eilish', name: 'Billie Eilish', image: 'https://c.saavncdn.com/artists/Billie_Eilish_20190211151539_500x500.jpg' },
      { id: 'Post Malone', name: 'Post Malone', image: 'https://c.saavncdn.com/artists/Post_Malone_004_20190911070147_500x500.jpg' },
      { id: 'Coldplay', name: 'Coldplay', image: 'https://c.saavncdn.com/artists/Coldplay_002_20241003070447_500x500.jpg' },
      { id: 'Eminem', name: 'Eminem', image: 'https://c.saavncdn.com/artists/Eminem_003_20240403152835_500x500.jpg' }
    ];

    rows.push({
      id: 'top_global_artists',
      title: 'Top International Artists',
      items: topGlobalArtists.map(a => ({
        id: a.id,
        title: a.name,
        type: 'artist',
        coverUrl: a.image,
      }))
    });

    res.json({ rows });
  } catch (err) {
    console.error('Home API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch home data' });
  }
});

// 2. Search
app.get('/api/music/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query "q" is required' });

    const saavnRes = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(query)}&_format=json&_marker=0&n=40`);
    const data = await saavnRes.json();
    
    if (!data.results) return res.json({ results: [] });

    const songs = data.results.map(mapSaavnSong).filter(s => s.encryptedUrl);
    
    // Remove duplicates by ID
    const uniqueSongs = [];
    const seen = new Set();
    for (const s of songs) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        uniqueSongs.push(s);
      }
    }

    res.json({ results: uniqueSongs });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 3. Recommendations (For "Up Next")
app.get('/api/music/recommend', async (req, res) => {
  try {
    const songId = req.query.id;
    const artistName = req.query.artist;
    
    if (!songId && !artistName) return res.status(400).json({ error: 'Song ID or Artist required' });

    const query = artistName ? artistName.split(',')[0] : 'popular songs';
    const saavnRes = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(query)}&_format=json&_marker=0&n=20`);
    const data = await saavnRes.json();
    
    if (!data.results) return res.json({ results: [] });

    const songs = data.results.map(mapSaavnSong)
      .filter(s => s.encryptedUrl && s.id !== songId);

    res.json({ results: songs });
  } catch (err) {
    console.error('Recommend error:', err.message);
    res.status(500).json({ error: 'Recommendation failed' });
  }
});

// 4. Playlist
app.get('/api/music/playlist', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Playlist ID required' });

    const saavnRes = await fetch(`https://www.jiosaavn.com/api.php?__call=playlist.getDetails&listid=${id}&_format=json`);
    const data = await saavnRes.json();
    
    if (!data.songs) return res.json({ id, title: data.listname || 'Playlist', coverUrl: data.image, songs: [] });

    const songs = data.songs.map(mapSaavnSong).filter(s => s.encryptedUrl);
    res.json({
      id: data.listid,
      title: data.listname,
      coverUrl: data.image ? data.image.replace('150x150', '500x500') : '',
      songs
    });
  } catch (err) {
    console.error('Playlist error:', err.message);
    res.status(500).json({ error: 'Playlist failed' });
  }
});

// 5. Album
app.get('/api/music/album', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Album ID required' });

    const saavnRes = await fetch(`https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&albumid=${id}&_format=json`);
    const data = await saavnRes.json();
    
    if (!data.songs) return res.json({ id, title: data.title || 'Album', coverUrl: data.image, songs: [] });

    const songs = data.songs.map(mapSaavnSong).filter(s => s.encryptedUrl);
    res.json({
      id: data.albumid || id,
      title: data.title,
      coverUrl: data.image ? data.image.replace('150x150', '500x500') : '',
      songs
    });
  } catch (err) {
    console.error('Album error:', err.message);
    res.status(500).json({ error: 'Album failed' });
  }
});

const ARTIST_AVATARS = {
  'Arijit Singh': 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg',
  'Shreya Ghoshal': 'https://c.saavncdn.com/artists/Shreya_Ghoshal_007_20241101074144_500x500.jpg',
  'Badshah': 'https://c.saavncdn.com/artists/Badshah_006_20241118064015_500x500.jpg',
  'Darshan Raval': 'https://c.saavncdn.com/artists/Darshan_Raval_006_20250807060352_500x500.jpg',
  'Neha Kakkar': 'https://c.saavncdn.com/artists/Neha_Kakkar_007_20241212115832_500x500.jpg',
  'Sonu Nigam': 'https://c.saavncdn.com/artists/Sonu_Nigam_003_20260813182013_500x500.jpg',
  'Diljit Dosanjh': 'https://c.saavncdn.com/artists/Diljit_Dosanjh_005_20231025073054_500x500.jpg',
  'A.R. Rahman': 'https://c.saavncdn.com/artists/AR_Rahman_002_20210120084455_500x500.jpg',
  'Jubin Nautiyal': 'https://c.saavncdn.com/artists/Jubin_Nautiyal_003_20231130204020_500x500.jpg',
  'Pritam': 'https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg',
  'Sunidhi Chauhan': 'https://c.saavncdn.com/artists/Sunidhi_Chauhan_005_20250515061617_500x500.jpg',
  'Yo Yo Honey Singh': 'https://c.saavncdn.com/artists/Yo_Yo_Honey_Singh_004_20260811095253_500x500.jpg',
  'Guru Randhawa': 'https://c.saavncdn.com/artists/Guru_Randhawa_004_20250701125845_500x500.jpg',
  'Ankit Tiwari': 'https://c.saavncdn.com/artists/Ankit_Tiwari_002_20241004072220_500x500.jpg',
  'Armaan Malik': 'https://c.saavncdn.com/artists/Armaan_Malik_006_20260813132832_500x500.jpg',
  'Taylor Swift': 'https://c.saavncdn.com/artists/Taylor_Swift_003_20200226074119_500x500.jpg',
  'The Weeknd': 'https://c.saavncdn.com/artists/The_Weeknd_002_20241003071400_500x500.jpg',
  'Ed Sheeran': 'https://c.saavncdn.com/artists/Ed_Sheeran_002_20250625073038_500x500.jpg',
  'Drake': 'https://c.saavncdn.com/artists/Drake_006_20260520062317_500x500.jpg',
  'Justin Bieber': 'https://c.saavncdn.com/artists/Justin_Bieber_005_20201127112218_500x500.jpg',
  'Ariana Grande': 'https://c.saavncdn.com/artists/Ariana_Grande_007_20260616180049_500x500.jpg',
  'Bruno Mars': 'https://c.saavncdn.com/artists/Bruno_Mars_003_20260324060413_500x500.jpg',
  'Dua Lipa': 'https://c.saavncdn.com/artists/Dua_Lipa_004_20231120090922_500x500.jpg',
  'Billie Eilish': 'https://c.saavncdn.com/artists/Billie_Eilish_20190211151539_500x500.jpg',
  'Post Malone': 'https://c.saavncdn.com/artists/Post_Malone_004_20190911070147_500x500.jpg',
  'Coldplay': 'https://c.saavncdn.com/artists/Coldplay_002_20241003070447_500x500.jpg',
  'Eminem': 'https://c.saavncdn.com/artists/Eminem_003_20240403152835_500x500.jpg',
  'Lata Mangeshkar': 'https://c.saavncdn.com/artists/Lata_Mangeshkar_004_20241003073909_500x500.jpg',
  'Kishore Kumar': 'https://c.saavncdn.com/artists/Kishore_Kumar_006_20241003072225_500x500.jpg',
  'Mohammed Rafi': 'https://c.saavncdn.com/artists/Mohammed_Rafi_004_20241003071339_500x500.jpg',
  'Asha Bhosle': 'https://c.saavncdn.com/artists/Asha_Bhosle_005_20241003072847_500x500.jpg',
  'Alka Yagnik': 'https://c.saavncdn.com/artists/Alka_Yagnik_004_20241118064500_500x500.jpg',
  'Palak Muchhal': 'https://c.saavncdn.com/artists/Palak_Muchhal_004_20250625070200_500x500.jpg',
  'KK': 'https://c.saavncdn.com/artists/KK_005_20241003072240_500x500.jpg',
  'Shakira': 'https://c.saavncdn.com/artists/Shakira_003_20200226074120_500x500.jpg'
};

// 6. Artist
app.get('/api/music/artist', async (req, res) => {
  try {
    const rawId = req.query.id;
    if (!rawId) return res.status(400).json({ error: 'Artist ID or Name required' });

    let targetArtistId = rawId;
    let isNumericId = /^\d+$/.test(rawId);
    let artistSearchImage = null;

    // If ID is name (not numeric), search JioSaavn for the official artist ID & image
    if (!isNumericId) {
      try {
        const artistSearchRes = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getArtistResults&q=${encodeURIComponent(rawId)}&_format=json`);
        const artistSearchData = await artistSearchRes.json();
        if (artistSearchData && artistSearchData.results && artistSearchData.results.length > 0) {
          const firstResult = artistSearchData.results[0];
          if (firstResult.id) {
            targetArtistId = firstResult.id;
            isNumericId = true;
          }
          if (firstResult.image) {
            artistSearchImage = firstResult.image.replace('150x150', '500x500');
          }
        }
      } catch (e) {
        console.error('Artist search error:', e.message);
      }
    }

    if (isNumericId) {
      const nameParam = req.query.name;
      const saavnPromise = fetch(`https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=${targetArtistId}&_format=json`).then(r => r.json());
      let morePromise = null;
      if (nameParam) {
        morePromise = fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(nameParam)}&_format=json&_marker=0&n=40`).then(r => r.json()).catch(() => null);
      }
      
      const data = await saavnPromise;

      if (data && data.name && data.topSongs && data.topSongs.songs && data.topSongs.songs.length > 0) {
        let topSongs = data.topSongs.songs.map(mapSaavnSong).filter(s => s.encryptedUrl);
        
        // Fetch more songs for this artist using the search API
        try {
          const moreData = morePromise ? await morePromise : await fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(data.name)}&_format=json&_marker=0&n=40`).then(r => r.json());
          if (moreData && moreData.results) {
            const moreSongs = moreData.results.map(mapSaavnSong).filter(s => s.encryptedUrl);
            const seen = new Set(topSongs.map(s => s.id));
            for (const s of moreSongs) {
              if (!seen.has(s.id)) {
                topSongs.push(s);
                seen.add(s.id);
              }
            }
          }
        } catch (e) {
          console.error('Failed to fetch more songs:', e.message);
        }
        const topAlbums = data.topAlbums && data.topAlbums.albums ? data.topAlbums.albums.map(a => {
          const img = a.image || a.imageUrl || '';
          return {
            id: a.albumid || a.id,
            title: a.title || a.album || a.name || 'Unknown Album',
            type: 'album',
            coverUrl: img ? img.replace('150x150', '500x500') : ''
          };
        }) : [];

        const realArtistCover = ARTIST_AVATARS[data.name] || ARTIST_AVATARS[rawId] || (data.image ? data.image.replace('150x150', '500x500') : artistSearchImage);

        return res.json({
          id: data.artistId || rawId,
          title: data.name,
          coverUrl: realArtistCover,
          subtitle: data.subtitle || 'Artist',
          followerCount: data.follower_count,
          songs: topSongs,
          albums: topAlbums
        });
      }
    }

    // Fallback search by artist name for International artists or non-numeric IDs
    const searchRes = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(rawId)}&_format=json&_marker=0&n=30`);
    const searchData = await searchRes.json();

    const songs = searchData.results ? searchData.results.map(mapSaavnSong).filter(s => s.encryptedUrl) : [];
    const realCoverUrl = ARTIST_AVATARS[rawId] || artistSearchImage || (songs.length > 0 ? songs[0].coverUrl : '');

    const albumMap = new Map();
    for (const song of songs) {
      if (song.coverUrl && !albumMap.has(song.title)) {
        albumMap.set(song.title, {
          id: song.id,
          title: song.title,
          type: 'single',
          coverUrl: song.coverUrl
        });
      }
    }

    return res.json({
      id: rawId,
      title: rawId,
      coverUrl: realCoverUrl,
      subtitle: 'Artist',
      followerCount: '1000000',
      songs: songs,
      albums: Array.from(albumMap.values()).slice(0, 6)
    });
  } catch (err) {
    console.error('Artist error:', err.message);
    res.status(500).json({ error: 'Artist failed' });
  }
});

// 8. Song Details by ID
app.get('/api/music/song', async (req, res) => {
  const songId = req.query.id;
  if (!songId) return res.status(400).json({ error: 'Song ID required' });
  try {
    const saavnRes = await fetch(`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songId}&_format=json&_marker=0`);
    const saavnData = await saavnRes.json();
    const song = saavnData[songId];
    if (!song) return res.status(404).json({ error: 'Song not found' });
    const mapped = mapSaavnSong(song);
    res.json({ song: mapped });
  } catch (err) {
    console.error('Song details error:', err.message);
    res.status(500).json({ error: 'Failed to fetch song details' });
  }
});

// 7. Audio Stream Proxy
// Note: In serverless, memory cache (Map) only persists per execution context.
// It will still help slightly but won't be as reliable as a long-running process.
const streamCache = new Map();

app.get('/api/music/audio/:songId', async (req, res) => {
  const songId = req.params.songId;
  if (!songId) return res.status(400).json({ error: 'Invalid song id' });

  try {
    let streamUrl = streamCache.get(songId);
    
    if (!streamUrl) {
      const saavnRes = await fetch(`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songId}&_format=json&_marker=0`);
      const saavnData = await saavnRes.json();
      
      const song = saavnData[songId];
      if (!song || !song.encrypted_media_url) {
        throw new Error("No matching song found on Saavn");
      }
      
      streamUrl = decryptSaavnUrl(song.encrypted_media_url);
      streamCache.set(songId, streamUrl);
      setTimeout(() => streamCache.delete(songId), 5 * 60 * 60 * 1000);
    }

    res.redirect(streamUrl);
  } catch (err) {
    console.error('=== EXTRACTION FAILED ===');
    console.error(err.message);
    res.status(500).json({ error: 'Extraction failed', detail: err.message });
  }
});
app.get('/api/music/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send('URL required');

    const imageRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!imageRes.ok) {
      return res.status(imageRes.status).send('Failed to fetch image');
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Image proxy error:', err.message);
    res.status(500).send('Image proxy error');
  }
});

export default app;
