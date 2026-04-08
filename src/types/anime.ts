export interface Anime {
  mal_id: number
  title: string
  title_english: string | null
  images: {
    jpg: {
      image_url: string
      large_image_url: string
    }
  }
  synopsis: string | null
  score: number | null
  scored_by: number | null
  rank: number | null
  popularity: number | null
  episodes: number | null
  status: string
  aired: {
    string: string
  }
  genres: Array<{ mal_id: number; name: string }>
  studios: Array<{ mal_id: number; name: string }>
}

export interface Genre {
  mal_id: number
  name: string
  count: number
}

export interface JikanPagination {
  last_visible_page: number
  has_next_page: boolean
  current_page: number
  items: {
    count: number
    total: number
    per_page: number
  }
}

export interface JikanResponse<T> {
  data: T
  pagination?: JikanPagination
}
