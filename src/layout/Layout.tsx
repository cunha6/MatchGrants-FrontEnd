import { Outlet } from 'react-router-dom'
import { FaEnvelope, FaLinkedin } from 'react-icons/fa'
import { NavBar } from './NavBar'
import styles from './Layout.module.css'

/** App shell: sticky nav, routed page content, footer. */
export function Layout() {
  return (
    <>
      <NavBar />
      <main className={styles.main}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        
        {/* Marca e Copyright */}
        <div className={styles.footerSection}>
          <span>
            <strong>MatchGrants</strong>
          </span>
          <span className={styles.muted}>© {new Date().getFullYear()}</span>
        </div>

        {/* Contactos (Email e LinkedIn) */}
        <div className={styles.footerSection}>
          <a
            href="mailto:hello@aliados.consulting"
            className={styles.link}
            aria-label="Enviar email para hello@aliados.consulting"
          >
            <FaEnvelope className={styles.icon} aria-hidden="true" />
            <span>hello@aliados.consulting</span>
          </a>

          <a
            href="https://www.linkedin.com/company/aliadosconsulting"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="Visitar página do LinkedIn da Aliados Consulting"
          >
            <FaLinkedin className={styles.icon} aria-hidden="true" />
            <span>Aliados Consulting</span>
          </a>
        </div>

        {/* Morada */}
        <div className={styles.footerSection}>
          <address className={styles.address}>
            Av. da Fábrica de Santo Tirso n.º 88, 4780-257<br />
            Santo Tirso, Portugal
          </address>
        </div>

      </div>
    </footer>
    </>
  )
}
