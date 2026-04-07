import type { Anime, JikanResponse } from '../types/anime'

const BASE_URL = 'https://api.jikan.moe/v4'

export async function getTopAnime(page = 1): Promise<JikanResponse<Anime[]>> {
  const res = await fetch(`${BASE_URL}/top/anime?page=${page}`)
  if (!res.ok) throw new Error('Failed to fetch top anime')
  return res.json()
}

export async function searchAnime(query: string, page = 1): Promise<JikanResponse<Anime[]>> {
  const res = await fetch(`${BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&sfw=true`)
  if (!res.ok) throw new Error('Failed to search anime')
  return res.json()
}

export async function getAnimeById(id: number): Promise<JikanResponse<Anime>> {
  const res = await fetch(`${BASE_URL}/anime/${id}`)
  if (!res.ok) throw new Error('Failed to fetch anime details')
  return res.json()
}
