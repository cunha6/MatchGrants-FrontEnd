import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { ROLE_LABELS } from '../shared/constants/domain'
import { Button } from '../shared/components'
import { cx } from '../shared/utils/cx'
import styles from './UserMenu.module.css'

/** Desktop account dropdown: shows the user + role, profile link and logout. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const initials = user.username.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <div className={styles.menu} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <span className={styles.identity}>
          <span className={styles.name}>{user.username}</span>
          <span className={styles.role}>{ROLE_LABELS[user.role]}</span>
        </span>
        <span className={cx(styles.chev, open && styles.chevOpen)} aria-hidden="true">
          ›
        </span>
      </button>
      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropHead}>
            <div className={styles.dropName}>{user.username}</div>
            <div className={styles.dropEmail}>{user.email}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={() => {
              setOpen(false)
              navigate(`/users/${user.id}`)
            }}
          >
            O meu perfil
          </button>
          <div className={styles.divider} />
          <div className={styles.logout}>
            <Button variant="ghost" size="sm" fullWidth onClick={handleLogout}>
              Terminar sessão
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
