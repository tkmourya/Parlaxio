import { Movie, TMDBResponse } from '../types';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
  if (!path) return 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

async function fetchFromTMDB<T>(endpoint: string): Promise<T> {
  const isDev = import.meta.env.DEV;

  if (isDev && API_KEY) {
    // LOCALHOST / DEV MODE: Call TMDB directly so you don't need Vercel CLI locally
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB API Error: ${response.status}`);
    return response.json();
  } else {
    // PRODUCTION / VERCEL: Call our secure Serverless Function to hide the API key
    const url = `/api/tmdb?path=${encodeURIComponent(endpoint)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Vercel TMDB Proxy Error: ${response.status}`);
    return response.json();
  }
}

export const getTrending = (page = 1) => fetchFromTMDB<TMDBResponse>(`/trending/movie/day?page=${page}`);
export const getPopular = (page = 1) => fetchFromTMDB<TMDBResponse>(`/movie/popular?page=${page}`);
export const getTopRated = (page = 1) => fetchFromTMDB<TMDBResponse>(`/movie/top_rated?page=${page}`);
export const searchMovies = (query: string, page = 1) => fetchFromTMDB<TMDBResponse>(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);

// New Endpoints
export const getBollywood = (page = 1) => fetchFromTMDB<TMDBResponse>(`/discover/movie?with_original_language=hi&region=IN&sort_by=popularity.desc&page=${page}`);
export const getPopularTV = (page = 1) => fetchFromTMDB<TMDBResponse>(`/tv/popular?page=${page}`);
export const getTrendingTV = (page = 1) => fetchFromTMDB<TMDBResponse>(`/trending/tv/day?page=${page}`);
export const getRecommendations = (type: 'movie' | 'tv', id: number, page = 1) => fetchFromTMDB<TMDBResponse>(`/${type}/${id}/recommendations?page=${page}`);
export const getSimilar = (type: 'movie' | 'tv', id: number, page = 1) => fetchFromTMDB<TMDBResponse>(`/${type}/${id}/similar?page=${page}`);

export const getMoviesByFilter = (filter: string, page = 1) => {
  if (!isNaN(Number(filter)) && filter !== 'all') {
    return fetchFromTMDB<TMDBResponse>(`/discover/movie?with_genres=${filter}&sort_by=popularity.desc&page=${page}`);
  }
  switch(filter) {
    case 'hollywood': return fetchFromTMDB<TMDBResponse>(`/discover/movie?with_original_language=en&region=US&sort_by=popularity.desc&page=${page}`);
    case 'bollywood': return fetchFromTMDB<TMDBResponse>(`/discover/movie?with_original_language=hi&region=IN&sort_by=popularity.desc&page=${page}`);
    case 'hindi': return fetchFromTMDB<TMDBResponse>(`/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=${page}`);
    default: return getPopular(page);
  }
};

export const getSeriesByFilter = (filter: string, page = 1) => {
  if (!isNaN(Number(filter)) && filter !== 'all') {
    return fetchFromTMDB<TMDBResponse>(`/discover/tv?with_genres=${filter}&sort_by=popularity.desc&page=${page}`);
  }
  switch(filter) {
    case 'indian': return fetchFromTMDB<TMDBResponse>(`/discover/tv?with_original_language=hi&with_origin_country=IN&with_networks=213|1024|3919|196|1104|19106|3186&sort_by=popularity.desc&page=${page}`);
    case 'korean': return fetchFromTMDB<TMDBResponse>(`/discover/tv?with_original_language=ko&with_origin_country=KR&sort_by=popularity.desc&page=${page}`);
    case 'japanese': return fetchFromTMDB<TMDBResponse>(`/discover/tv?with_original_language=ja&with_origin_country=JP&without_genres=16&sort_by=popularity.desc&page=${page}`);
    case 'western': return fetchFromTMDB<TMDBResponse>(`/discover/tv?with_original_language=en&with_origin_country=US|GB&sort_by=popularity.desc&page=${page}`);
    default: return getPopularTV(page);
  }
};

export const getCombinedByGenre = async (genreId: string, page = 1) => {
  const [movies, tv] = await Promise.all([
    fetchFromTMDB<TMDBResponse>(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [], page: 1, total_pages: 1 })),
    fetchFromTMDB<TMDBResponse>(`/discover/tv?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [], page: 1, total_pages: 1 }))
  ]);
  const taggedMovies = movies.results.map((m: any) => ({ ...m, media_type: 'movie' }));
  const taggedTv = tv.results.map((t: any) => ({ ...t, media_type: 'tv' }));
  
  const combined = [...taggedMovies, ...taggedTv].sort((a, b) => b.popularity - a.popularity);
  return { results: combined, page, total_pages: Math.max(movies.total_pages || 1, tv.total_pages || 1) };
};

export const getMediaByProvider = async (providerId: string, filter: string = 'all', page = 1) => {
  // Map provider IDs to their Web Series vs Daily TV Network IDs for better accuracy
  // We strictly use this for Indian platforms where TMDB watch_providers data is messy or incomplete.
  const providerNetworks: Record<string, { web: string, tv: string }> = {
    '122': { web: '3919|3186', tv: '159|2179|8036' }, // Hotstar (Hotstar vs Star Plus/Star Bharat)
    '220': { web: '31365', tv: '524|2532|4008' }, // JioCinema (Jio vs Colors/VOOT)
  };

  let moviePromise = Promise.resolve({ results: [], page: 1, total_pages: 1 });
  let tvPromise = Promise.resolve({ results: [], page: 1, total_pages: 1 });

  // For global platforms, 50 votes filters out junk. For Indian platforms, we lower it to 2 because TMDB lacks Indian votes.
  const isIndianProvider = providerId === '122' || providerId === '220';
  const minVotes = isIndianProvider ? 2 : 50;

  if (filter === 'all' || filter === 'movie') {
    moviePromise = fetchFromTMDB<TMDBResponse>(`/discover/movie?with_watch_providers=${providerId}&watch_region=IN&vote_count.gte=${minVotes}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [], page: 1, total_pages: 1 }));
  }
  
  if (filter === 'all' || filter === 'tv' || filter === 'anime' || filter === 'web-series' || filter === 'tv-shows') {
    let genreFilter = '';
    let networkQuery = `with_watch_providers=${providerId}&watch_region=IN`; 

    const netMap = providerNetworks[providerId];
    
    if (netMap) {
      // Use isolated network mapping for Hotstar/JioCinema
      if (filter === 'all' || filter === 'tv') {
        networkQuery = `with_networks=${netMap.web}${netMap.tv ? `|${netMap.tv}` : ''}`;
      } else if (filter === 'web-series') {
        networkQuery = `with_networks=${netMap.web}`;
      } else if (filter === 'tv-shows') {
        networkQuery = `with_networks=${netMap.tv}`;
      } else if (filter === 'anime') {
        // Indian platforms license anime (they don't produce it), so use watch_providers instead of networks
        networkQuery = `with_watch_providers=${providerId}&watch_region=IN`;
        genreFilter = '&with_genres=16';
      }
    } else {
      // Standard behavior for Netflix, Prime, Crunchyroll
      if (filter === 'web-series') {
        genreFilter = '&without_genres=10766,10764,16'; // Exclude Soap, Reality, Anime
      } else if (filter === 'tv-shows') {
        genreFilter = '&with_genres=10766|10764'; // Only Soap or Reality
      } else if (filter === 'anime') {
        genreFilter = '&with_genres=16'; // Only Anime
      }
    }

    tvPromise = fetchFromTMDB<TMDBResponse>(`/discover/tv?${networkQuery}${genreFilter}&vote_count.gte=${minVotes}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [], page: 1, total_pages: 1 }));
  }

  const [movies, tv] = await Promise.all([moviePromise, tvPromise]);
  
  // Tag results with media_type because TMDB discover endpoints omit them
  const taggedMovies = movies.results.map((m: any) => ({ ...m, media_type: 'movie' }));
  const taggedTv = tv.results.map((t: any) => ({ ...t, media_type: 'tv' }));

  const combined = [...taggedMovies, ...taggedTv].sort((a, b) => b.popularity - a.popularity);
  return { results: combined, page, total_pages: Math.max(movies.total_pages || 1, tv.total_pages || 1) };
};

export const getAnimeByFilter = (filter: string, page = 1) => {
  const base = '/discover/tv?with_original_language=ja&sort_by=popularity.desc';
  if (!isNaN(Number(filter)) && filter !== 'all') {
    return fetchFromTMDB<TMDBResponse>(`${base}&with_genres=16,${filter}&page=${page}`);
  }
  switch(filter) {
    case 'action': return fetchFromTMDB<TMDBResponse>(`${base}&with_genres=16,10759&page=${page}`);
    case 'fantasy': return fetchFromTMDB<TMDBResponse>(`${base}&with_genres=16,10765&page=${page}`);
    case 'comedy': return fetchFromTMDB<TMDBResponse>(`${base}&with_genres=16,35&page=${page}`);
    default: return fetchFromTMDB<TMDBResponse>(`${base}&with_genres=16&page=${page}`);
  }
};

export const getMovieDetails = (type: 'movie' | 'tv', id: number) => fetchFromTMDB<any>(`/${type}/${id}?append_to_response=${type === 'movie' ? 'release_dates' : 'content_ratings'},translations,recommendations,similar`);
export const getCredits = (type: 'movie' | 'tv', id: number) => fetchFromTMDB<any>(`/${type}/${id}/credits`);
export const getVideos = (type: 'movie' | 'tv', id: number) => fetchFromTMDB<any>(`/${type}/${id}/videos`);
export const getTvSeason = (id: number, season: number) => fetchFromTMDB<any>(`/tv/${id}/season/${season}`);
export const getCollection = (collectionId: number) => fetchFromTMDB<any>(`/collection/${collectionId}`);

export const getSmartRecommendations = async (type: 'movie' | 'tv', id: number, page = 1) => {
   try {
     const details = await getMovieDetails(type, id);
     
     // Take up to 2 primary genres and use OR (|) operator for broader matching
     const genreIds = details.genres?.slice(0, 2).map((g: any) => g.id).join('|') || ''; 
     const originalLanguage = details.original_language || '';
     const originCountry = (details.origin_country && details.origin_country.length > 0) ? details.origin_country[0] : '';
     
     let query = `/discover/${type}?sort_by=popularity.desc&page=${page}`;
     if (genreIds) query += `&with_genres=${genreIds}`;
     if (originalLanguage) query += `&with_original_language=${originalLanguage}`;
     if (originCountry) query += `&with_origin_country=${originCountry}`;
     
     const res = await fetchFromTMDB<TMDBResponse>(query);
     // Filter out the currently playing media just in case
     res.results = res.results.filter(m => m.id !== id);
     
     if (res.results.length >= 5 || page > 1) {
       return res;
     }
   } catch (error) {
     console.error("Error fetching discover recommendations, falling back to similar...", error);
   }

   // Fallback to default Similar/Recommendations if Discover yields too few results
   let res = await getSimilar(type, id, page);
   if (res.results.length < 5 && page === 1) {
       res = await getRecommendations(type, id, page);
   }
   return res;
};

// Genre mappings from TMDB API
export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics"
};

export const getGenreNames = (genreIds?: number[]) => {
  if (!genreIds) return [];
  return genreIds.map(id => GENRE_MAP[id]).filter(Boolean);
};
