import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { visibleNavItems } from './navConfig'
import { UserMenu } from './UserMenu'
import { Drawer } from './Drawer'
import { ButtonLink } from '../shared/components'
import { cx } from '../shared/utils/cx'
import styles from './NavBar.module.css'

export function NavBar() {
  const { role, isAuthenticated } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const items = visibleNavItems(role, isAuthenticated)

  return (
    <header className={styles.topbar}>
      <div className={cx('container', styles.inner)}>
        <Link to="/" className={styles.brand}>
          <img src="/aliados_A1.png" alt="Logo" className={styles.logo} />
        
        </Link>

        <nav className={styles.desktopNav} aria-label="Principal">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(styles.link, isActive && styles.active)
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.desktopAccount}>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <ButtonLink to="/login" size="sm">
              Entrar
            </ButtonLink>
          )}
        </div>

        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={drawerOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  )
}
