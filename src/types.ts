export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  adult?: boolean;
  // Additional details
  runtime?: number;
  number_of_seasons?: number;
  genres?: { id: number; name: string }[];
  progress?: number; // Optional progress percentage (0-100) for watch history
  season?: number;
  episode?: number;
  translations?: {
    translations: {
      iso_3166_1: string;
      iso_639_1: string;
      name: string;
      english_name: string;
      data: any;
    }[];
  };
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
}

export interface TMDBResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface CustomPlaylist {
  $id?: string;
  userId: string;
  name: string;
  creatorName: string;
  isPublic: boolean;
  coverUrl?: string;
  items: any[]; // JSON array of SaavnSong objects
  savedCount: number;
  $createdAt?: string;
}
