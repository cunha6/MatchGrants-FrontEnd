import { useMemo, useState, type ReactNode } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { MEDIA } from '../constants/breakpoints'
import { cx } from '../utils/cx'
import styles from './DataTable.module.css'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
  /** On mobile, this column becomes the card title (no label shown). */
  primary?: boolean
  /** Hide the label on the mobile card (value stands alone). */
  hideLabelOnMobile?: boolean
  /** Enables click-to-sort on this column (client-side). */
  sortable?: boolean
  /** Value used for sorting (defaults to nothing). Return a number for dates. */
  sortAccessor?: (row: T) => string | number | null | undefined
}

export type SortDir = 'asc' | 'desc'
export interface SortState {
  key: string
  dir: SortDir
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string | number
  /** Whole-row click (keyboard accessible). Typically navigates to detail. */
  onRowClick?: (row: T) => void
  ariaLabel?: string
  /**
   * Controlled sort state. Pass this + `onSortChange` when sorting must
   * happen server-side (e.g. paginated data) — `rows` is then trusted to
   * already be in the right order and DataTable won't re-sort it locally.
   * Omit both to keep the default client-side sort (via `sortAccessor`).
   */
  sort?: SortState | null
  onSortChange?: (sort: SortState | null) => void
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'pt', { numeric: true })
}

/**
 * One data set, two presentations that stay in sync:
 *  - ≥768px: a real <table>, with click-to-sort headers for sortable columns.
 *  - <768px: each row collapses into a stacked, fully legible card, plus a
 *    compact "Ordenar" control (cards have no headers to click).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  ariaLabel,
  sort: controlledSort,
  onSortChange,
}: DataTableProps<T>) {
  const isMobile = useMediaQuery(MEDIA.mdDown)
  const clickable = Boolean(onRowClick)
  const isControlled = controlledSort !== undefined
  const [internalSort, setInternalSort] = useState<SortState | null>(null)
  const sort = isControlled ? controlledSort! : internalSort

  const applySort = (next: SortState | null) => {
    if (isControlled) onSortChange?.(next)
    else setInternalSort(next)
  }

  const sortableCols = columns.filter((c) => c.sortable)

  // Controlled mode trusts the caller to have already ordered `rows` (e.g. via
  // a server-side order_by) — only uncontrolled mode sorts client-side.
  const sortedRows = useMemo(() => {
    if (isControlled) return rows
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortAccessor) return rows
    const acc = col.sortAccessor
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => compareValues(acc(a), acc(b)) * factor)
  }, [rows, sort, columns, isControlled])

  // header click cycles: none → asc → desc → none
  const toggleSort = (key: string) => {
    if (!sort || sort.key !== key) return applySort({ key, dir: 'asc' })
    if (sort.dir === 'asc') return applySort({ key, dir: 'desc' })
    return applySort(null)
  }

  const activate = (row: T) => onRowClick?.(row)
  const onKeyDown = (e: React.KeyboardEvent, row: T) => {
    if (!clickable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activate(row)
    }
  }

  if (isMobile) {
    const primary = columns.find((c) => c.primary) ?? columns[0]
    const rest = columns.filter((c) => c !== primary)
    return (
      <div>
        {sortableCols.length > 0 && (
          <div className={styles.sortBar}>
            <label className={styles.sortLabel} htmlFor="dt-sort">
              Ordenar
            </label>
            <select
              id="dt-sort"
              className={styles.sortSelect}
              value={sort?.key ?? ''}
              onChange={(e) =>
                applySort(
                  e.target.value
                    ? { key: e.target.value, dir: sort?.dir ?? 'asc' }
                    : null,
                )
              }
            >
              <option value="">Predefinido</option>
              {sortableCols.map((c) => (
                <option key={c.key} value={c.key}>
                  {typeof c.header === 'string' ? c.header : c.key}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.sortDir}
              disabled={!sort}
              onClick={() =>
                sort && applySort({ key: sort.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
              }
              aria-label={sort?.dir === 'desc' ? 'Descendente' : 'Ascendente'}
            >
              {sort?.dir === 'desc' ? '▼' : '▲'}
            </button>
          </div>
        )}
        <div className={styles.cards} role="list" aria-label={ariaLabel}>
          {sortedRows.map((row, index) => (
            <div
              key={rowKey(row, index)}
              role="listitem"
              className={cx(styles.card, clickable && styles.clickable)}
              onClick={clickable ? () => activate(row) : undefined}
              onKeyDown={(e) => onKeyDown(e, row)}
              tabIndex={clickable ? 0 : undefined}
            >
              <div className={styles.cardTitle}>{primary.render(row)}</div>
              <dl className={styles.cardList}>
                {rest.map((col) => (
                  <div key={col.key} className={styles.cardRow}>
                    {!col.hideLabelOnMobile && (
                      <dt className={styles.cardLabel}>{col.header}</dt>
                    )}
                    <dd className={styles.cardValue}>{col.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sort?.key === col.key
              const ariaSort = col.sortable
                ? active
                  ? sort!.dir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                : undefined
              return (
                <th
                  key={col.key}
                  className={cx(col.align === 'right' && styles.right)}
                  scope="col"
                  aria-sort={ariaSort}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className={cx(styles.sortBtn, col.align === 'right' && styles.sortBtnRight)}
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.header}
                      <span className={styles.sortInd} aria-hidden="true">
                        {active ? (sort!.dir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              className={cx(clickable && styles.clickableRow)}
              onClick={clickable ? () => activate(row) : undefined}
              onKeyDown={(e) => onKeyDown(e, row)}
              tabIndex={clickable ? 0 : undefined}
              role={clickable ? 'link' : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cx(col.align === 'right' && styles.right)}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
