import { createContext, useContext, useReducer, useEffect, useCallback, useState, type ReactNode } from 'react'
import type { UserProfile, SharedToken } from '@/types/user'
import { usersApi, settingsApi, tokensApi } from '@/lib/api'

// --- User Reducer ---

interface UserState {
  users: Record<string, UserProfile>
  activeUserId: string | null
}

type UserAction =
  | { type: 'CREATE_USER'; profile: UserProfile }
  | { type: 'UPDATE_USER'; id: string; updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>> }
  | { type: 'DELETE_USER'; id: string }
  | { type: 'SWITCH_USER'; id: string }
  | { type: 'SET_STATE'; users: Record<string, UserProfile>; activeUserId: string | null }

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'CREATE_USER': {
      return {
        users: { ...state.users, [action.profile.id]: action.profile },
        activeUserId: action.profile.id,
      }
    }
    case 'UPDATE_USER': {
      const user = state.users[action.id]
      if (!user) return state
      return {
        ...state,
        users: { ...state.users, [action.id]: { ...user, ...action.updates } },
      }
    }
    case 'DELETE_USER': {
      const { [action.id]: _, ...rest } = state.users
      const newActiveId = state.activeUserId === action.id
        ? Object.keys(rest)[0] ?? null
        : state.activeUserId
      return { users: rest, activeUserId: newActiveId }
    }
    case 'SWITCH_USER': {
      if (!state.users[action.id]) return state
      return { ...state, activeUserId: action.id }
    }
    case 'SET_STATE':
      return { users: action.users, activeUserId: action.activeUserId }
    default:
      return state
  }
}

// --- Token Reducer ---

interface TokenState {
  tokens: Record<string, SharedToken>
}

type TokenAction =
  | { type: 'CREATE_TOKEN'; token: SharedToken }
  | { type: 'DELETE_TOKEN'; token: string }
  | { type: 'SET_TOKENS'; tokens: Record<string, SharedToken> }

function tokenReducer(state: TokenState, action: TokenAction): TokenState {
  switch (action.type) {
    case 'CREATE_TOKEN':
      return { tokens: { ...state.tokens, [action.token.token]: action.token } }
    case 'DELETE_TOKEN': {
      const { [action.token]: _, ...rest } = state.tokens
      return { tokens: rest }
    }
    case 'SET_TOKENS':
      return { tokens: action.tokens }
    default:
      return state
  }
}

// --- Context ---

interface UserContextValue {
  activeUser: UserProfile | null
  activeUserId: string | null
  allUsers: UserProfile[]
  createUser: (name: string, bio: string, avatarUrl: string) => Promise<UserProfile>
  updateUser: (id: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => void
  deleteUser: (id: string) => void
  switchUser: (id: string) => void
  getUserById: (id: string) => UserProfile | undefined
  loading: boolean
}

interface TokenContextValue {
  createToken: (userId: string, groupId: string) => Promise<string>
  getToken: (token: string) => SharedToken | undefined
  deleteToken: (token: string) => void
  getTokensForGroup: (groupId: string) => SharedToken[]
}

const UserContext = createContext<UserContextValue | null>(null)
const TokenContext = createContext<TokenContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [userState, userDispatch] = useReducer(userReducer, { users: {}, activeUserId: null })
  const [tokenState, tokenDispatch] = useReducer(tokenReducer, { tokens: {} })
  const [loading, setLoading] = useState(true)

  // Load initial data from API
  useEffect(() => {
    async function load() {
      try {
        const [users, settings, tokens] = await Promise.all([
          usersApi.getAll(),
          settingsApi.get(),
          tokensApi.getAll(),
        ])

        const usersMap: Record<string, UserProfile> = {}
        for (const u of users) usersMap[u.id] = u

        const tokensMap: Record<string, SharedToken> = {}
        for (const t of tokens) {
          tokensMap[t.token] = { token: t.token, userId: t.userId, groupId: t.groupId, createdAt: t.createdAt }
        }

        userDispatch({ type: 'SET_STATE', users: usersMap, activeUserId: settings.activeUserId })
        tokenDispatch({ type: 'SET_TOKENS', tokens: tokensMap })
      } catch {
        // API not available, start empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const createUser = useCallback(async (name: string, bio: string, avatarUrl: string): Promise<UserProfile> => {
    const created = await usersApi.create({ name, bio, avatarUrl, createdAt: new Date().toISOString() })
    userDispatch({ type: 'CREATE_USER', profile: created })
    settingsApi.update({ activeUserId: created.id }).catch(console.error)
    return created
  }, [])

  const updateUser = useCallback((id: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => {
    userDispatch({ type: 'UPDATE_USER', id, updates })
    usersApi.update(id, updates).catch(console.error)
  }, [])

  const deleteUser = useCallback((id: string) => {
    userDispatch({ type: 'DELETE_USER', id })
    usersApi.delete(id).catch(console.error)
  }, [])

  const switchUser = useCallback((id: string) => {
    userDispatch({ type: 'SWITCH_USER', id })
    settingsApi.update({ activeUserId: id }).catch(console.error)
  }, [])

  const userValue: UserContextValue = {
    activeUser: userState.activeUserId ? userState.users[userState.activeUserId] ?? null : null,
    activeUserId: userState.activeUserId,
    allUsers: Object.values(userState.users),
    createUser,
    updateUser,
    deleteUser,
    switchUser,
    getUserById: useCallback((id) => userState.users[id], [userState.users]),
    loading,
  }

  const createToken = useCallback(async (userId: string, groupId: string) => {
    const created = await tokensApi.create({ userId, groupId, createdAt: new Date().toISOString() })
    const shared: SharedToken = { token: created.id, userId, groupId, createdAt: created.createdAt }
    tokenDispatch({ type: 'CREATE_TOKEN', token: shared })
    return created.id
  }, [])

  const tokenValue: TokenContextValue = {
    createToken,
    getToken: useCallback((token: string) => tokenState.tokens[token], [tokenState.tokens]),
    deleteToken: useCallback((token: string) => {
      tokenDispatch({ type: 'DELETE_TOKEN', token })
      tokensApi.delete(token).catch(console.error)
    }, []),
    getTokensForGroup: useCallback(
      (groupId: string) => Object.values(tokenState.tokens).filter((t) => t.groupId === groupId),
      [tokenState.tokens],
    ),
  }

  return (
    <UserContext value={userValue}>
      <TokenContext value={tokenValue}>
        {children}
      </TokenContext>
    </UserContext>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

export function useTokens() {
  const ctx = useContext(TokenContext)
  if (!ctx) throw new Error('useTokens must be used within UserProvider')
  return ctx
}
