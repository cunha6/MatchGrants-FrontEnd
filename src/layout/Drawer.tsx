import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { ROLE_LABELS } from '../shared/constants/domain'
import { visibleNavItems } from './navConfig'
import { Button } from '../shared/components'
import { cx } from '../shared/utils/cx'
import styles from './Drawer.module.css'

interface DrawerProps {
  open: boolean
  onClose: () => void
}

/** Mobile slide-in navigation (hamburger target). */
export function Drawer({ open, onClose }: DrawerProps) {
  const { user, role, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const items = visibleNavItems(role, isAuthenticated)

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/login')
  }

  // Portal to <body>: the navbar has `backdrop-filter`, which would otherwise
  // trap this position:fixed drawer inside the (short) header box instead of
  // letting it cover the viewport.
  return createPortal(
    <div className={cx(styles.root, open && styles.open)} aria-hidden={!open}>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.panel} aria-label="Menu">
        <nav className={styles.nav}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(styles.link, isActive && styles.active)
              }
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                className={styles.account}
                onClick={() => {
                  onClose()
                  navigate(`/users/${user.id}`)
                }}
              >
                <span className={styles.name}>{user.username}</span>
                <span className={styles.role}>{ROLE_LABELS[user.role]}</span>
              </button>
              <Button variant="ghost" fullWidth onClick={handleLogout}>
                Terminar sessão
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                onClose()
                navigate('/login')
              }}
            >
              Entrar
            </Button>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
