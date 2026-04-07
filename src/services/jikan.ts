import type { Anime, Genre, JikanResponse } from '../types/anime'

const BASE_URL = 'https://api.jikan.moe/v4'

export type SortOption = {
  order_by: string
  sort: 'asc' | 'desc'
}

export async function getGenres(): Promise<JikanResponse<Genre[]>> {
  const res = await fetch(`${BASE_URL}/genres/anime`)
  if (!res.ok) throw new Error('Failed to fetch genres')
  return res.json()
}

export async function getTopAnime(page = 1, sortOption?: SortOption, genreIds?: number[]): Promise<JikanResponse<Anime[]>> {
  const params = new URLSearchParams({ page: String(page) })
  if (sortOption) {
    params.set('order_by', sortOption.order_by)
    params.set('sort', sortOption.sort)
  }
  if (genreIds?.length) params.set('genres', genreIds.join(','))
  const res = await fetch(`${BASE_URL}/anime?${params}`)
  if (!res.ok) throw new Error('Failed to fetch top anime')
  return res.json()
}

export async function searchAnime(query: string, page = 1, sortOption?: SortOption, genreIds?: number[]): Promise<JikanResponse<Anime[]>> {
  const params = new URLSearchParams({ q: query, page: String(page), sfw: 'true' })
  if (sortOption) {
    params.set('order_by', sortOption.order_by)
    params.set('sort', sortOption.sort)
  }
  if (genreIds?.length) params.set('genres', genreIds.join(','))
  const res = await fetch(`${BASE_URL}/anime?${params}`)
  if (!res.ok) throw new Error('Failed to search anime')
  return res.json()
}

export async function getAnimeById(id: number): Promise<JikanResponse<Anime>> {
  const res = await fetch(`${BASE_URL}/anime/${id}`)
  if (!res.ok) throw new Error('Failed to fetch anime details')
  return res.json()
}
