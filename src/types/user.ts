export interface AuthenticatedUser {
  id: string
  name?: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
}
