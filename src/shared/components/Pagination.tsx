import styles from './Pagination.module.css'
import { cx } from '../utils/cx'

interface PaginationProps {
  page: number
  numPages: number
  total?: number
  pageSize?: number
  onPage: (page: number) => void
}

/** Build a compact page list with ellipses: 1 … 4 5 [6] 7 8 … 20 */
function pagesToShow(page: number, numPages: number): (number | '…')[] {
  if (numPages <= 7) {
    return Array.from({ length: numPages }, (_, i) => i + 1)
  }
  const out: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(numPages - 1, page + 1)
  if (start > 2) out.push('…')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < numPages - 1) out.push('…')
  out.push(numPages)
  return out
}

export function Pagination({
  page,
  numPages,
  total,
  pageSize,
  onPage,
}: PaginationProps) {
  if (numPages <= 1) {
    return total !== undefined ? (
      <div className={styles.wrap}>
        <span className={styles.summary}>{total} resultado(s)</span>
      </div>
    ) : null
  }

  const from = pageSize ? (page - 1) * pageSize + 1 : undefined
  const to = pageSize && total ? Math.min(page * pageSize, total) : undefined

  return (
    <nav className={styles.wrap} aria-label="Paginação">
      {total !== undefined && (
        <span className={styles.summary}>
          {from !== undefined && to !== undefined
            ? `${from}–${to} de ${total}`
            : `${total} resultado(s)`}
        </span>
      )}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          ‹
        </button>
        {pagesToShow(page, numPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className={styles.gap}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={cx(styles.btn, p === page && styles.active)}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.btn}
          onClick={() => onPage(page + 1)}
          disabled={page >= numPages}
          aria-label="Página seguinte"
        >
          ›
        </button>
      </div>
    </nav>
  )
}
