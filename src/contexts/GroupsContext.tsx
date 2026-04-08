import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import type { AnimeGroupEntry, AnimeGroup, GroupsStorage } from '@/types/groups'
import type { UserStorage } from '@/types/user'
import { useUser } from '@/contexts/UserContext'

const STORAGE_KEY = 'anime-groups'
const USERS_KEY = 'anime-users'

function migrateAndLoad(): GroupsStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GroupsStorage
      if (parsed.groups && parsed.animeCache) {
        const needsMigration = parsed.groups.some((g) => !g.userId)
        if (needsMigration) {
          const usersRaw = localStorage.getItem(USERS_KEY)
          let userId: string

          if (usersRaw) {
            const usersData = JSON.parse(usersRaw) as UserStorage
            userId = usersData.activeUserId ?? Object.keys(usersData.users)[0] ?? crypto.randomUUID()
          } else {
            userId = crypto.randomUUID()
            const userStorage: UserStorage = {
              users: {
                [userId]: {
                  id: userId,
                  name: 'User',
                  bio: '',
                  avatarUrl: '',
                  createdAt: new Date().toISOString(),
                },
              },
              activeUserId: userId,
            }
            localStorage.setItem(USERS_KEY, JSON.stringify(userStorage))
          }

          parsed.groups = parsed.groups.map((g) => ({ ...g, userId: g.userId || userId }))
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
        }
        return parsed
      }
    }
  } catch { /* ignore */ }
  return { groups: [], animeCache: {} }
}

function saveGroups(state: GroupsStorage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

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

type GroupsAction =
  | { type: 'CREATE_GROUP'; name: string; userId: string }
  | { type: 'DELETE_GROUP'; groupId: string }
  | { type: 'RENAME_GROUP'; groupId: string; name: string }
  | { type: 'ADD_ANIMES'; groupId: string; entries: AnimeGroupEntry[] }
  | { type: 'REMOVE_ANIME'; groupId: string; malId: number }
  | { type: 'ENSURE_DEFAULTS'; userId: string }

function groupsReducer(state: GroupsStorage, action: GroupsAction): GroupsStorage {
  switch (action.type) {
    case 'CREATE_GROUP': {
      const newGroup: AnimeGroup = {
        id: crypto.randomUUID(),
        name: action.name,
        isDefault: false,
        animeIds: [],
        createdAt: new Date().toISOString(),
        userId: action.userId,
      }
      return { ...state, groups: [...state.groups, newGroup] }
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
    case 'ENSURE_DEFAULTS': {
      const userGroups = state.groups.filter((g) => g.userId === action.userId)
      const hasWatched = userGroups.some((g) => g.name === 'watched' && g.isDefault)
      const hasWantToWatch = userGroups.some((g) => g.name === 'wantToWatch' && g.isDefault)
      if (hasWatched && hasWantToWatch) return state
      const newGroups = [...state.groups]
      if (!hasWatched) {
        newGroups.push({
          id: `watched-${action.userId}`,
          name: 'watched',
          isDefault: true,
          animeIds: [],
          createdAt: new Date().toISOString(),
          userId: action.userId,
        })
      }
      if (!hasWantToWatch) {
        newGroups.push({
          id: `want-to-watch-${action.userId}`,
          name: 'wantToWatch',
          isDefault: true,
          animeIds: [],
          createdAt: new Date().toISOString(),
          userId: action.userId,
        })
      }
      return { ...state, groups: newGroups }
    }
    default:
      return state
  }
}

interface GroupsContextValue {
  groups: AnimeGroup[]
  allGroups: AnimeGroup[]
  animeCache: Record<number, AnimeGroupEntry>
  createGroup: (name: string) => void
  deleteGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  addAnimesToGroup: (groupId: string, entries: AnimeGroupEntry[]) => void
  removeAnimeFromGroup: (groupId: string, malId: number) => void
  getGroupsByUserId: (userId: string) => AnimeGroup[]
  getGroupById: (groupId: string) => AnimeGroup | undefined
}

const GroupsContext = createContext<GroupsContextValue | null>(null)

// --- Provider ---

export function GroupsProvider({ children }: { children: ReactNode }) {
  const { activeUserId } = useUser()
  const [selection, selectionDispatch] = useReducer(selectionReducer, { selected: new Map() })
  const [groupsState, groupsDispatch] = useReducer(groupsReducer, undefined, migrateAndLoad)

  useEffect(() => {
    saveGroups(groupsState)
  }, [groupsState])

  useEffect(() => {
    if (activeUserId) {
      groupsDispatch({ type: 'ENSURE_DEFAULTS', userId: activeUserId })
    }
  }, [activeUserId])

  const selectionValue: SelectionContextValue = {
    selected: selection.selected,
    toggleSelect: useCallback((entry) => selectionDispatch({ type: 'TOGGLE', entry }), []),
    selectAnime: useCallback((entry) => selectionDispatch({ type: 'SELECT', entry }), []),
    deselectAnime: useCallback((malId) => selectionDispatch({ type: 'DESELECT', malId }), []),
    clearSelection: useCallback(() => selectionDispatch({ type: 'CLEAR' }), []),
  }

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

  const groupsValue: GroupsContextValue = {
    groups: userGroups,
    allGroups: groupsState.groups,
    animeCache: groupsState.animeCache,
    createGroup: useCallback((name) => {
      if (activeUserId) groupsDispatch({ type: 'CREATE_GROUP', name, userId: activeUserId })
    }, [activeUserId]),
    deleteGroup: useCallback((groupId) => groupsDispatch({ type: 'DELETE_GROUP', groupId }), []),
    renameGroup: useCallback((groupId, name) => groupsDispatch({ type: 'RENAME_GROUP', groupId, name }), []),
    addAnimesToGroup: useCallback((groupId, entries) => groupsDispatch({ type: 'ADD_ANIMES', groupId, entries }), []),
    removeAnimeFromGroup: useCallback((groupId, malId) => groupsDispatch({ type: 'REMOVE_ANIME', groupId, malId }), []),
    getGroupsByUserId,
    getGroupById,
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
