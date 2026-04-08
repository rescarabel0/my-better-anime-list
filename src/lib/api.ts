const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

// --- Users ---

import type { UserProfile, SharedToken } from '@/types/user'

export const usersApi = {
  getAll: () => request<UserProfile[]>('/users'),
  get: (id: string) => request<UserProfile>(`/users/${id}`),
  create: (user: Omit<UserProfile, 'id'>) =>
    request<UserProfile>('/users', { method: 'POST', body: JSON.stringify(user) }),
  update: (id: string, data: Partial<UserProfile>) =>
    request<UserProfile>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
}

// --- Settings (singular resource) ---

interface Settings {
  activeUserId: string | null
}

export const settingsApi = {
  get: () => request<Settings>('/settings'),
  update: (data: Partial<Settings>) =>
    request<Settings>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
}

// --- Tokens ---

export const tokensApi = {
  getAll: () => request<(SharedToken & { id: string })[]>('/tokens'),
  get: (id: string) => request<SharedToken & { id: string }>(`/tokens/${id}`),
  create: (token: Omit<SharedToken, 'token'> & { token?: string }) =>
    request<SharedToken & { id: string }>('/tokens', { method: 'POST', body: JSON.stringify(token) }),
  delete: (id: string) => request<void>(`/tokens/${id}`, { method: 'DELETE' }),
}

// --- Groups ---

import type { AnimeGroup } from '@/types/groups'

export const groupsApi = {
  getAll: () => request<AnimeGroup[]>('/groups'),
  get: (id: string) => request<AnimeGroup>(`/groups/${id}`),
  create: (group: Omit<AnimeGroup, 'id'>) =>
    request<AnimeGroup>('/groups', { method: 'POST', body: JSON.stringify(group) }),
  update: (id: string, data: Partial<AnimeGroup>) =>
    request<AnimeGroup>(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/groups/${id}`, { method: 'DELETE' }),
}

// --- Anime Cache ---

import type { AnimeGroupEntry } from '@/types/groups'

type CacheEntry = AnimeGroupEntry & { id: number }

export const animeCacheApi = {
  getAll: () => request<CacheEntry[]>('/animeCache'),
  upsert: async (entry: AnimeGroupEntry) => {
    // Find existing by mal_id
    const existing = await request<CacheEntry[]>(`/animeCache?mal_id=${entry.mal_id}`)
    if (existing.length > 0) {
      return request<CacheEntry>(`/animeCache/${existing[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify(entry),
      })
    }
    return request<CacheEntry>('/animeCache', {
      method: 'POST',
      body: JSON.stringify(entry),
    })
  },
}
