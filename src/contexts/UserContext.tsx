import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react'
import type { UserProfile, UserStorage, SharedToken, TokenStorage } from '@/types/user'

const USERS_KEY = 'anime-users'
const TOKENS_KEY = 'anime-tokens'

function loadUsers(): UserStorage {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as UserStorage
      if (parsed.users) return parsed
    }
  } catch { /* ignore */ }
  return { users: {}, activeUserId: null }
}

function saveUsers(state: UserStorage) {
  localStorage.setItem(USERS_KEY, JSON.stringify(state))
}

function loadTokens(): TokenStorage {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as TokenStorage
      if (parsed.tokens) return parsed
    }
  } catch { /* ignore */ }
  return { tokens: {} }
}

function saveTokens(state: TokenStorage) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(state))
}

// --- User Reducer ---

type UserAction =
  | { type: 'CREATE_USER'; profile: UserProfile }
  | { type: 'UPDATE_USER'; id: string; updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>> }
  | { type: 'DELETE_USER'; id: string }
  | { type: 'SWITCH_USER'; id: string }
  | { type: 'SET_STATE'; state: UserStorage }

function userReducer(state: UserStorage, action: UserAction): UserStorage {
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
      return action.state
    default:
      return state
  }
}

// --- Token Reducer ---

type TokenAction =
  | { type: 'CREATE_TOKEN'; token: SharedToken }
  | { type: 'DELETE_TOKEN'; token: string }

function tokenReducer(state: TokenStorage, action: TokenAction): TokenStorage {
  switch (action.type) {
    case 'CREATE_TOKEN':
      return { tokens: { ...state.tokens, [action.token.token]: action.token } }
    case 'DELETE_TOKEN': {
      const { [action.token]: _, ...rest } = state.tokens
      return { tokens: rest }
    }
    default:
      return state
  }
}

// --- Context ---

interface UserContextValue {
  activeUser: UserProfile | null
  activeUserId: string | null
  allUsers: UserProfile[]
  createUser: (name: string, bio: string, avatarUrl: string) => UserProfile
  updateUser: (id: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => void
  deleteUser: (id: string) => void
  switchUser: (id: string) => void
  getUserById: (id: string) => UserProfile | undefined
}

interface TokenContextValue {
  createToken: (userId: string, groupId: string) => string
  getToken: (token: string) => SharedToken | undefined
  deleteToken: (token: string) => void
  getTokensForGroup: (groupId: string) => SharedToken[]
}

const UserContext = createContext<UserContextValue | null>(null)
const TokenContext = createContext<TokenContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [userState, userDispatch] = useReducer(userReducer, undefined, loadUsers)
  const [tokenState, tokenDispatch] = useReducer(tokenReducer, undefined, loadTokens)

  useEffect(() => {
    saveUsers(userState)
  }, [userState])

  useEffect(() => {
    saveTokens(tokenState)
  }, [tokenState])

  const createUser = useCallback((name: string, bio: string, avatarUrl: string): UserProfile => {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name,
      bio,
      avatarUrl,
      createdAt: new Date().toISOString(),
    }
    userDispatch({ type: 'CREATE_USER', profile })
    return profile
  }, [])

  const userValue: UserContextValue = {
    activeUser: userState.activeUserId ? userState.users[userState.activeUserId] ?? null : null,
    activeUserId: userState.activeUserId,
    allUsers: Object.values(userState.users),
    createUser,
    updateUser: useCallback((id, updates) => userDispatch({ type: 'UPDATE_USER', id, updates }), []),
    deleteUser: useCallback((id) => userDispatch({ type: 'DELETE_USER', id }), []),
    switchUser: useCallback((id) => userDispatch({ type: 'SWITCH_USER', id }), []),
    getUserById: useCallback((id) => userState.users[id], [userState.users]),
  }

  const tokenValue: TokenContextValue = {
    createToken: useCallback((userId: string, groupId: string) => {
      const token = crypto.randomUUID().slice(0, 8)
      tokenDispatch({
        type: 'CREATE_TOKEN',
        token: { token, userId, groupId, createdAt: new Date().toISOString() },
      })
      return token
    }, []),
    getToken: useCallback((token: string) => tokenState.tokens[token], [tokenState.tokens]),
    deleteToken: useCallback((token: string) => tokenDispatch({ type: 'DELETE_TOKEN', token }), []),
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
