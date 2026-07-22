import { useState, type ReactNode } from 'react'
import { scrapeGrants, type ScrapeSource } from '../../avisos/api'
import { importNotices } from '../../anuncios/api'
import {
  Alert,
  Button,
  Card,
  DescriptionList,
  Input,
  PageHeader,
  Select,
  Spinner,
} from '../../../shared/components'
import type { DescriptionItem } from '../../../shared/components'
import { humanizeKey } from '../../../shared/utils/collections'
import { ApiError } from '../../../api/client'
import styles from './Ingestion.module.css'

function summaryRows(result: unknown): DescriptionItem[] {
  if (!result || typeof result !== 'object') return []
  return Object.entries(result as Record<string, unknown>)
    .filter(([, v]) => typeof v !== 'object')
    .map(([k, v]) => ({ label: humanizeKey(k), value: String(v), mono: true }))
}

/** A card that runs one slow ingestion task and reports the outcome. */
function TaskCard({
  title,
  description,
  controls,
  actionLabel,
  run,
}: {
  title: string
  description: string
  controls?: ReactNode
  actionLabel: string
  run: () => Promise<unknown>
}) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const onClick = async () => {
    setStatus('running')
    setError(null)
    setResult(null)
    try {
      setResult(await run())
      setStatus('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'A operação falhou.')
      setStatus('error')
    }
  }

  const rows = summaryRows(result)

  return (
    <Card>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      {controls && <div className={styles.controls}>{controls}</div>}
      <Button onClick={onClick} loading={status === 'running'}>
        {actionLabel}
      </Button>

      {status === 'running' && (
        <div className={styles.running}>
          <Spinner size={16} />
          Em execução — pode demorar vários minutos.
        </div>
      )}
      {status === 'error' && error && (
        <div className={styles.result}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
      {status === 'done' && (
        <div className={styles.result}>
          <Alert variant="success" title="Concluído">
            {rows.length > 0 ? (
              <DescriptionList items={rows} />
            ) : (
              'Operação concluída com sucesso.'
            )}
          </Alert>
        </div>
      )}
    </Card>
  )
}

export function Ingestion() {
  const [source, setSource] = useState<ScrapeSource>('all')
  const [days, setDays] = useState('15')

  return (
    <div>
      <PageHeader
        eyebrow="Operações"
        title="Scrape de dados"
        description="Recolha de avisos (scraping) e importação de anúncios. Estas operações são demoradas."
      />

      <Alert variant="warning" title="Operações longas">
        A recolha e a importação podem demorar vários minutos. Evite iniciar a
        mesma operação em duplicado.
      </Alert>

      <div className={styles.grid}>
        <TaskCard
          title="Avisos — recolha (scraping)"
          description="Recolhe avisos das fontes selecionadas e grava na base de dados."
          controls={
            <Select
              label="Fonte"
              value={source}
              onChange={(e) => setSource(e.target.value as ScrapeSource)}
              options={[
                /*{ value: 'all', label: 'Todas as fontes' },
                { value: 'compete', label: 'Compete 2030' },*/
                { value: 'portugal', label: 'Portugal 2030' },
                /*{ value: 'prr', label: 'PRR' },*/
              ]}
            />
          }
          actionLabel="Iniciar recolha"
          run={() => scrapeGrants(source)}
        />

        <TaskCard
          title="Anúncios — importação"
          description="Importa anúncios de contratação pública dos últimos N dias (base.gov.pt)."
          controls={
            <Input
              label="Dias"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          }
          actionLabel="Importar anúncios"
          run={() => importNotices(days ? Number(days) : undefined)}
        />
      </div>
    </div>
  )
}
