export interface UserProfile {
  id: string
  name: string
  bio: string
  avatarUrl: string
  createdAt: string
}

export interface UserStorage {
  users: Record<string, UserProfile>
  activeUserId: string | null
}

export interface SharedToken {
  token: string
  userId: string
  groupId: string
  createdAt: string
}

export interface TokenStorage {
  tokens: Record<string, SharedToken>
}
