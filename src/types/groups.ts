export interface AnimeGroupEntry {
  mal_id: number
  title: string
  title_english: string | null
  image_url: string
  score: number | null
  episodes: number | null
}

export interface AnimeGroup {
  id: string
  name: string
  isDefault: boolean
  animeIds: number[]
  createdAt: string
}

export interface GroupsStorage {
  groups: AnimeGroup[]
  animeCache: Record<number, AnimeGroupEntry>
}
