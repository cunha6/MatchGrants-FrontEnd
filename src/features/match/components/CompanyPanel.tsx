import { Card, DescriptionList } from '../../../shared/components'
import type { DescriptionItem } from '../../../shared/components'
import {
  ENTITY_SIZE_LABELS,
  ENTITY_TYPE_LABELS,
  labelFor,
} from '../../../shared/constants/domain'
import type { Company } from '../types'
import styles from './CompanyPanel.module.css'

function str(value: unknown): string | null {
  if (value == null || value === '') return null
  if (Array.isArray(value)) return value.map(String).join(', ') || null
  return String(value)
}

/** Resolved company card shown above the match results. */
export function CompanyPanel({ company, nif }: { company: Company; nif: string }) {
  const name = str(company.name) ?? `NIF ${nif}`

  const rows: DescriptionItem[] = [
    { label: 'NIF', value: str(company.nif) ?? nif, mono: true },
    { label: 'Atividade', value: str(company.activity) },
    { label: 'CAE', value: str(company.cae_codes) },
    {
      label: 'Dimensão',
      value: company.dimension
        ? labelFor(ENTITY_SIZE_LABELS, String(company.dimension))
        : null,
    },
    {
      label: 'Tipo de entidade',
      value: company.entity_type
        ? labelFor(ENTITY_TYPE_LABELS, String(company.entity_type))
        : null,
    },
    { label: 'Morada', value: str(company.address) },
    { label: 'Concelho', value: str(company.concelho) ?? str(company.cidade) },
    { label: 'Região', value: str(company.region) },
    { label: 'NUTS II', value: str(company.nuts_ii) },
    { label: 'NUTS III', value: str(company.nuts_iii) },
  ].filter((r) => r.value != null)

  return (
    <Card>
      <div className={styles.head}>
        <span className={styles.seal} aria-hidden="true">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <div className={styles.eyebrow}>Empresa avaliada</div>
          <h2 className={styles.name}>{name}</h2>
        </div>
      </div>
      <DescriptionList items={rows} />
    </Card>
  )
}
