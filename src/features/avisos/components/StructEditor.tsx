import { useState } from 'react'
import { Button, Input, Select, Textarea } from '../../../shared/components'
import { humanizeKey } from '../../../shared/utils/collections'
import { cx } from '../../../shared/utils/cx'
import styles from './StructEditor.module.css'

/**
 * Field-level editor for the grant's nested collections — attribute on the
 * label, editable control for the value. No raw JSON.
 *
 * Everything is derived from the data itself: the API returns these arrays
 * heterogeneously (the same collection holds plain strings on one aviso and
 * objects on another, and objects don't always carry the same keys), so each
 * item is rendered from its OWN keys instead of a fixed schema. Nothing the
 * backend sent is dropped, and new API fields show up automatically.
 */

/**
 * Identifier keys (`id`, `phase_id`, `area_id`, …). They're database handles,
 * not content, so they're never offered as inputs — but the values stay in the
 * payload untouched, since items are edited by spreading the original object.
 */
function isIdKey(key: string): boolean {
  return /(^|_)id$/i.test(key)
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** A blank item shaped like the ones already in the array. */
function blankItem(items: unknown[]): unknown {
  const model = items.find(isPlainObject)
  if (!model) return ''
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(model)) {
    if (isIdKey(k)) continue
    out[k] = Array.isArray(v) ? [] : isPlainObject(v) ? {} : typeof v === 'boolean' ? false : ''
  }
  return out
}

/** One attribute: the control follows the value's actual type. */
function ValueField({
  label,
  value,
  onChange,
}: {
  label: string
  value: unknown
  onChange: (next: unknown) => void
}) {
  if (typeof value === 'boolean') {
    return (
      <Select
        label={label}
        value={value ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value === 'true')}
        options={[
          { value: 'true', label: 'Sim' },
          { value: 'false', label: 'Não' },
        ]}
      />
    )
  }

  if (typeof value === 'number') {
    return (
      <Input
        label={label}
        type="number"
        value={String(value)}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    )
  }

  if (Array.isArray(value)) {
    // Objects inside → nested cards; plain values (or empty) → one per line.
    if (value.some(isPlainObject)) {
      return <CollectionEditor label={label} value={value} onChange={onChange} />
    }
    return (
      <Textarea
        label={label}
        hint="Um item por linha"
        rows={3}
        value={value.map(String).join('\n')}
        onChange={(e) => onChange(linesOf(e.target.value))}
      />
    )
  }

  if (isPlainObject(value)) {
    return (
      <div className={styles.nested}>
        <span className={styles.nestedLabel}>{label}</span>
        <ObjectFields obj={value} onChange={onChange} />
      </div>
    )
  }

  // string | null
  const text = value == null ? '' : String(value)
  const isLong = text.length > 80 || text.includes('\n')
  return isLong ? (
    <Textarea label={label} rows={3} value={text} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <Input label={label} value={text} onChange={(e) => onChange(e.target.value)} />
  )
}

/** Every attribute of an object, in the order the API sent them. */
function ObjectFields({
  obj,
  onChange,
}: {
  obj: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const keys = Object.keys(obj).filter((k) => !isIdKey(k))
  if (keys.length === 0) return <p className={styles.empty}>Sem campos.</p>

  return (
    <div className={styles.fields}>
      {keys.map((k) => (
        <ValueField
          key={k}
          label={humanizeKey(k)}
          value={obj[k]}
          onChange={(next) => onChange({ ...obj, [k]: next })}
        />
      ))}
    </div>
  )
}

interface CollectionEditorProps {
  label: string
  /** The raw array from the API (or null). */
  value: unknown
  onChange: (next: unknown[]) => void
}

/**
 * Repeatable list of records — each rendered as attribute/value fields.
 * Collapsed by default: these nest recursively (criteria → subcriteria → …),
 * so expanding everything at once would bury the form in thousands of inputs.
 */
export function CollectionEditor({ label, value, onChange }: CollectionEditorProps) {
  const items: unknown[] = Array.isArray(value) ? value : []
  const [open, setOpen] = useState(false)

  const setItem = (i: number, next: unknown) =>
    onChange(items.map((it, idx) => (idx === i ? next : it)))
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const addItem = () => {
    onChange([...items, blankItem(items)])
    setOpen(true)
  }

  return (
    <section className={styles.collection}>
      <header className={styles.head}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className={cx(styles.chev, open && styles.chevOpen)} aria-hidden="true">
            ›
          </span>
          <span className={styles.label}>{label}</span>
          <span className={styles.count}>
            {items.length} {items.length === 1 ? 'registo' : 'registos'}
          </span>
        </button>
        <Button type="button" variant="ghost" size="sm" onClick={addItem}>
          + Adicionar
        </Button>
      </header>

      {open &&
        (items.length === 0 ? (
          <p className={styles.empty}>Sem registos.</p>
        ) : (
          <ol className={styles.items}>
            {items.map((item, i) => (
              <li key={i} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.itemNum}>#{i + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(i)}
                    aria-label={`Remover registo ${i + 1} de ${label}`}
                  >
                    Remover
                  </Button>
                </div>

                {isPlainObject(item) ? (
                  <ObjectFields obj={item} onChange={(next) => setItem(i, next)} />
                ) : (
                  <ValueField label="Valor" value={item} onChange={(next) => setItem(i, next)} />
                )}
              </li>
            ))}
          </ol>
        ))}
    </section>
  )
}
