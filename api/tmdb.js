export default async function handler(req, res) {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }

  // We read the API key from Vercel's secure backend environment variables.
  // It can be named TMDB_API_KEY or VITE_TMDB_API_KEY.
  const API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'TMDB API Key is missing in Vercel environment' });
  }

  const BASE_URL = 'https://api.themoviedb.org/3';
  const separator = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${separator}api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Allow CORS if needed, though Vercel handles it for same-domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // optional caching
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Vercel API Error:", error);
    res.status(500).json({ error: 'Failed to fetch from TMDB API' });
  }
}
