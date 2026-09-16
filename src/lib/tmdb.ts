import { Movie, TMDBResponse } from '../types';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
  if (!path) return 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

async function fetchFromTMDB<T>(endpoint: string): Promise<T> {
  if (!API_KEY) throw new Error('TMDB API Key is missing');
  
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status}`);
  }
  return response.json();
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
  
  const combined = [...movies.results, ...tv.results].sort((a, b) => b.popularity - a.popularity);
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

export const getMovieDetails = (type: 'movie' | 'tv', id: number) => fetchFromTMDB<any>(`/${type}/${id}?append_to_response=${type === 'movie' ? 'release_dates' : 'content_ratings'},translations`);
export const getCredits = (type: 'movie' | 'tv', id: number) => fetchFromTMDB<any>(`/${type}/${id}/credits`);
export const getVideos = (type: 'movie' | 'tv', id: number) => fetchFromTMDB<any>(`/${type}/${id}/videos`);
export const getTvSeason = (id: number, season: number) => fetchFromTMDB<any>(`/tv/${id}/season/${season}`);

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
