import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import type { Role } from '../shared/constants/domain'
import { LoadingBlock } from '../shared/components/Spinner'
import { Forbidden } from './StatusPages'

interface ProtectedRouteProps {
  /** If given, the user's role must be one of these; otherwise 403. */
  roles?: Role[]
  children?: ReactNode
}

/**
 * Guards routes. While the session is being restored it shows a spinner; an
 * anonymous user is redirected to /login (remembering where they came from);
 * an authenticated user without an allowed role gets the 403 screen.
 */
export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { status, user, hasRole } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <LoadingBlock message="A restaurar sessão…" />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !hasRole(...roles)) {
    return <Forbidden />
  }

  return children ? <>{children}</> : <Outlet />
}
