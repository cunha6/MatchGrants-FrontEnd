import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setUnauthorizedHandler } from '../../api/client'
import type { Role } from '../../shared/constants/domain'
import type { User } from '../users/types'
import { fetchMe, login as loginRequest, logout as logoutRequest } from './api'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  user: User | null
  role: Role | null
  status: AuthStatus
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
  /** Replace the cached user (e.g. after editing one's own profile). */
  setUser: (user: User) => void
  /** True if the current user's role is one of the given roles. */
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // Any 401 anywhere in the app drops us back to anonymous.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus('anonymous')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // Restore the session from the cookie on startup.
  useEffect(() => {
    const controller = new AbortController()
    fetchMe(controller.signal)
      .then((me) => {
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        // 401 (no session) or network error → treat as anonymous.
        setStatus('anonymous')
      })
    return () => controller.abort()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const me = await loginRequest({ username, password })
    setUser(me)
    setStatus('authenticated')
    return me
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      status,
      isAuthenticated: status === 'authenticated' && user !== null,
      login,
      logout,
      setUser,
      hasRole,
    }),
    [user, status, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
