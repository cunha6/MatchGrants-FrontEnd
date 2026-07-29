import type { Role } from '../shared/constants/domain'

export interface NavItem {
  to: string
  label: string
  /** Undefined → public. Otherwise visible only to these roles. */
  roles?: Role[]
  /** Requires an authenticated user (any role). */
  authOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/avisos', label: 'Avisos', authOnly: true },
  {
    to: '/anuncios',
    label: 'Contratações Publicas',
    roles: ['admin', 'commercial_public', 'client', 'viewer'],
  },
  { to: '/match', label: 'Match' },
  { to: '/plano-anual', label: 'Plano Anual', roles: ['admin', 'commercial_grants', 'commercial_public'] },
  { to: '/newsletter', label: 'Newsletter', roles: ['admin', 'commercial_grants', 'commercial_public'] },
  { to: '/users', label: 'Utilizadores', roles: ['admin', 'commercial_grants', 'commercial_public'] },
  { to: '/ingestao', label: 'Scrape', roles: ['admin', 'commercial_grants', 'commercial_public'] },
]

/** Filter nav items against the current user's role. */
export function visibleNavItems(
  role: Role | null,
  isAuthenticated: boolean,
): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.roles) return role !== null && item.roles.includes(role)
    if (item.authOnly) return isAuthenticated
    return true
  })
}
