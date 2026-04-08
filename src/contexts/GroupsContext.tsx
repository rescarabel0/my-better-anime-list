import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState, useRef, type ReactNode } from 'react'
import type { AnimeGroupEntry, AnimeGroup } from '@/types/groups'
import { useUser } from '@/contexts/UserContext'
import { groupsApi, animeCacheApi } from '@/lib/api'

// --- Selection Context ---

interface SelectionState {
  selected: Map<number, AnimeGroupEntry>
}

type SelectionAction =
  | { type: 'TOGGLE'; entry: AnimeGroupEntry }
  | { type: 'SELECT'; entry: AnimeGroupEntry }
  | { type: 'DESELECT'; malId: number }
  | { type: 'CLEAR' }

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'TOGGLE': {
      const next = new Map(state.selected)
      if (next.has(action.entry.mal_id)) {
        next.delete(action.entry.mal_id)
      } else {
        next.set(action.entry.mal_id, action.entry)
      }
      return { selected: next }
    }
    case 'SELECT': {
      const next = new Map(state.selected)
      next.set(action.entry.mal_id, action.entry)
      return { selected: next }
    }
    case 'DESELECT': {
      const next = new Map(state.selected)
      next.delete(action.malId)
      return { selected: next }
    }
    case 'CLEAR':
      return { selected: new Map() }
    default:
      return state
  }
}

interface SelectionContextValue {
  selected: Map<number, AnimeGroupEntry>
  toggleSelect: (entry: AnimeGroupEntry) => void
  selectAnime: (entry: AnimeGroupEntry) => void
  deselectAnime: (malId: number) => void
  clearSelection: () => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

// --- Groups Context ---

interface GroupsState {
  groups: AnimeGroup[]
  animeCache: Record<number, AnimeGroupEntry>
}

type GroupsAction =
  | { type: 'SET_STATE'; groups: AnimeGroup[]; animeCache: Record<number, AnimeGroupEntry> }
  | { type: 'CREATE_GROUP'; group: AnimeGroup }
  | { type: 'DELETE_GROUP'; groupId: string }
  | { type: 'RENAME_GROUP'; groupId: string; name: string }
  | { type: 'ADD_ANIMES'; groupId: string; entries: AnimeGroupEntry[] }
  | { type: 'REMOVE_ANIME'; groupId: string; malId: number }
  | { type: 'ADD_GROUPS'; groups: AnimeGroup[] }

function groupsReducer(state: GroupsState, action: GroupsAction): GroupsState {
  switch (action.type) {
    case 'SET_STATE':
      return { groups: action.groups, animeCache: action.animeCache }
    case 'CREATE_GROUP': {
      return { ...state, groups: [...state.groups, action.group] }
    }
    case 'DELETE_GROUP': {
      return { ...state, groups: state.groups.filter((g) => g.id !== action.groupId) }
    }
    case 'RENAME_GROUP': {
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.groupId ? { ...g, name: action.name } : g,
        ),
      }
    }
    case 'ADD_ANIMES': {
      const newCache = { ...state.animeCache }
      for (const entry of action.entries) {
        newCache[entry.mal_id] = entry
      }
      const ids = new Set(action.entries.map((e) => e.mal_id))
      return {
        groups: state.groups.map((g) =>
          g.id === action.groupId
            ? { ...g, animeIds: [...g.animeIds, ...Array.from(ids).filter((id) => !g.animeIds.includes(id))] }
            : g,
        ),
        animeCache: newCache,
      }
    }
    case 'REMOVE_ANIME': {
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.groupId
            ? { ...g, animeIds: g.animeIds.filter((id) => id !== action.malId) }
            : g,
        ),
      }
    }
    case 'ADD_GROUPS': {
      return { ...state, groups: [...state.groups, ...action.groups] }
    }
    default:
      return state
  }
}

interface GroupsContextValue {
  groups: AnimeGroup[]
  allGroups: AnimeGroup[]
  animeCache: Record<number, AnimeGroupEntry>
  createGroup: (name: string) => Promise<AnimeGroup | undefined>
  deleteGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  addAnimesToGroup: (groupId: string, entries: AnimeGroupEntry[]) => void
  removeAnimeFromGroup: (groupId: string, malId: number) => void
  getGroupsByUserId: (userId: string) => AnimeGroup[]
  getGroupById: (groupId: string) => AnimeGroup | undefined
  loading: boolean
}

const GroupsContext = createContext<GroupsContextValue | null>(null)

// --- Provider ---

export function GroupsProvider({ children }: { children: ReactNode }) {
  const { activeUserId, loading: userLoading } = useUser()
  const [selection, selectionDispatch] = useReducer(selectionReducer, { selected: new Map() })
  const [groupsState, groupsDispatch] = useReducer(groupsReducer, { groups: [], animeCache: {} })
  const [loading, setLoading] = useState(true)

  // Load initial data from API
  useEffect(() => {
    if (userLoading) return
    async function load() {
      try {
        const [groups, cacheEntries] = await Promise.all([
          groupsApi.getAll(),
          animeCacheApi.getAll(),
        ])
        const animeCache: Record<number, AnimeGroupEntry> = {}
        for (const entry of cacheEntries) {
          const { id: _, ...rest } = entry as AnimeGroupEntry & { id: number }
          animeCache[rest.mal_id] = rest
        }
        groupsDispatch({ type: 'SET_STATE', groups, animeCache })
      } catch {
        // API not available
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userLoading])

  useEffect(() => {
    if (!activeUserId || loading) return
    const userId = activeUserId
    async function ensureDefaults() {
      const userGroups = groupsState.groups.filter((g) => g.userId === userId)
      const hasWatched = userGroups.some((g) => g.name === 'watched' && g.isDefault)
      const hasWantToWatch = userGroups.some((g) => g.name === 'wantToWatch' && g.isDefault)
      if (hasWatched && hasWantToWatch) return
      const toCreate: Omit<AnimeGroup, 'id'>[] = []
      if (!hasWatched) {
        toCreate.push({ name: 'watched', isDefault: true, animeIds: [], createdAt: new Date().toISOString(), userId })
      }
      if (!hasWantToWatch) {
        toCreate.push({ name: 'wantToWatch', isDefault: true, animeIds: [], createdAt: new Date().toISOString(), userId })
      }
      const created = await Promise.all(toCreate.map((g) => groupsApi.create(g)))
      groupsDispatch({ type: 'ADD_GROUPS', groups: created })
    }
    ensureDefaults()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId, loading])

  const selectionValue: SelectionContextValue = {
    selected: selection.selected,
    toggleSelect: useCallback((entry) => selectionDispatch({ type: 'TOGGLE', entry }), []),
    selectAnime: useCallback((entry) => selectionDispatch({ type: 'SELECT', entry }), []),
    deselectAnime: useCallback((malId) => selectionDispatch({ type: 'DESELECT', malId }), []),
    clearSelection: useCallback(() => selectionDispatch({ type: 'CLEAR' }), []),
  }

  const groupsRef = useRef(groupsState.groups)
  groupsRef.current = groupsState.groups

  const userGroups = useMemo(
    () => activeUserId ? groupsState.groups.filter((g) => g.userId === activeUserId) : [],
    [groupsState.groups, activeUserId],
  )

  const getGroupsByUserId = useCallback(
    (userId: string) => groupsState.groups.filter((g) => g.userId === userId),
    [groupsState.groups],
  )

  const getGroupById = useCallback(
    (groupId: string) => groupsState.groups.find((g) => g.id === groupId),
    [groupsState.groups],
  )

  const createGroup = useCallback(async (name: string): Promise<AnimeGroup | undefined> => {
    if (!activeUserId) return undefined
    const created = await groupsApi.create({ name, isDefault: false, animeIds: [], createdAt: new Date().toISOString(), userId: activeUserId })
    groupsDispatch({ type: 'CREATE_GROUP', group: created })
    return created
  }, [activeUserId])

  const deleteGroup = useCallback((groupId: string) => {
    groupsDispatch({ type: 'DELETE_GROUP', groupId })
    groupsApi.delete(groupId).catch(console.error)
  }, [])

  const renameGroup = useCallback((groupId: string, name: string) => {
    groupsDispatch({ type: 'RENAME_GROUP', groupId, name })
    groupsApi.update(groupId, { name }).catch(console.error)
  }, [])

  const addAnimesToGroup = useCallback((groupId: string, entries: AnimeGroupEntry[]) => {
    groupsDispatch({ type: 'ADD_ANIMES', groupId, entries })
    // Persist anime cache entries
    for (const entry of entries) {
      animeCacheApi.upsert(entry).catch(console.error)
    }
    // Update the group's animeIds on the server
    const group = groupsRef.current.find((g) => g.id === groupId)
    const currentIds = group?.animeIds ?? []
    const newIds = entries.map((e) => e.mal_id).filter((id) => !currentIds.includes(id))
    if (newIds.length > 0) {
      groupsApi.update(groupId, { animeIds: [...currentIds, ...newIds] }).catch(console.error)
    }
  }, [])

  const removeAnimeFromGroup = useCallback((groupId: string, malId: number) => {
    groupsDispatch({ type: 'REMOVE_ANIME', groupId, malId })
    const group = groupsRef.current.find((g) => g.id === groupId)
    if (group) {
      groupsApi.update(groupId, { animeIds: group.animeIds.filter((id) => id !== malId) }).catch(console.error)
    }
  }, [])

  const groupsValue: GroupsContextValue = {
    groups: userGroups,
    allGroups: groupsState.groups,
    animeCache: groupsState.animeCache,
    createGroup,
    deleteGroup,
    renameGroup,
    addAnimesToGroup,
    removeAnimeFromGroup,
    getGroupsByUserId,
    getGroupById,
    loading,
  }

  return (
    <SelectionContext value={selectionValue}>
      <GroupsContext value={groupsValue}>
        {children}
      </GroupsContext>
    </SelectionContext>
  )
}

export function useSelection() {
  const ctx = useContext(SelectionContext)
  if (!ctx) throw new Error('useSelection must be used within GroupsProvider')
  return ctx
}

export function useGroups() {
  const ctx = useContext(GroupsContext)
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider')
  return ctx
}
