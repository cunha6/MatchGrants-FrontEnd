import { Link, useParams } from 'react-router-dom'
import { getNotice } from '../api'
import type { Cpv, Lot } from '../types'
import { useAuth } from '../../auth/AuthContext'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { apiUrl } from '../../../api/client'
import {
  ActiveBadge,
  Badge,
  ButtonLink,
  Card,
  Chips,
  Deadline,
  DescriptionList,
  DetailHero,
  ErrorState,
  ExternalLinkButton,
  LoadingBlock,
  MetricsStrip,
  Section,
  Tag,
} from '../../../shared/components'
import { formatCurrency, formatDate, orDash } from '../../../shared/utils/format'
import { hasValue, toStringArray } from '../../../shared/utils/collections'
import detail from '../../../shared/styles/detail.module.css'
import styles from './AnuncioDetail.module.css'

/** cpvs arrive as {code,description} objects OR "CODE - Description" strings. */
function cpvLabel(cpv: Cpv | string): { code: string; description?: string } {
  if (typeof cpv === 'string') {
    const idx = cpv.indexOf(' - ')
    if (idx > 0) return { code: cpv.slice(0, idx).trim(), description: cpv.slice(idx + 3).trim() }
    return { code: cpv }
  }
  return { code: cpv.code ?? '', description: cpv.description }
}

interface ParsedLot {
  number: string
  title: string
  description?: string
  base_price?: number | null
  quantity?: number | null
  deadline?: string | null
}

/** Lots arrive as plain strings ("Lote 1 - …") or as {number,title,…} objects. */
function parseLot(lot: Lot, index: number): ParsedLot {
  if (typeof lot === 'string') {
    const m = lot.match(/^\s*lote\s*(\d+)\s*[-–:.]?\s*(.*)$/i)
    if (m) return { number: m[1], title: m[2].trim() || `Lote ${m[1]}` }
    return { number: String(index + 1), title: lot.trim() }
  }
  return {
    number: String(lot.number ?? index + 1),
    title: lot.title ?? '',
    description: lot.description,
    base_price: lot.base_price,
    quantity: lot.quantity,
    deadline: lot.deadline,
  }
}

export function AnuncioDetail() {
  const { id } = useParams<{ id: string }>()
  const noticeId = Number(id)
  const { hasRole } = useAuth()
  const canEdit = hasRole('admin', 'commercial')

  const { data: notice, loading, error, reload } = useApiQuery(
    (signal) => getNotice(noticeId, signal),
    [noticeId],
  )

  if (loading) return <LoadingBlock message="A carregar anúncio…" />
  if (error) {
    return (
      <div>
        <Link to="/anuncios" className={detail.back}>
          ← Voltar aos anúncios
        </Link>
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }
  if (!notice) return null

  const contractTypes = toStringArray(notice.contract_types)
  const cpvs = notice.cpvs ?? []
  const lots = notice.lots ?? []

  const documents: { label: string; sub: string; url: string; variant: string }[] = []
  if (notice.url) {
    documents.push({
      label: 'Anúncio no Diário da República',
      sub: 'files.diariodarepublica.pt',
      url: apiUrl(notice.url),
      variant: 'gov',
    })
  }
  // Only show the caderno when the backend confirms the file exists on disk.
  if (notice.specifications_url) {
    documents.push({
      label: 'Caderno de Encargos',
      sub: notice.specifications_path?.split('/').pop() ?? 'Abrir ficheiro',
      url: apiUrl(notice.specifications_url),
      variant: 'doc',
    })
  }
  if (notice.procedure_documents_url) {
    documents.push({
      label: 'Peças do procedimento',
      sub: 'Plataforma eletrónica',
      url: apiUrl(notice.procedure_documents_url),
      variant: 'ac',
    })
  }

  const drLine =
    hasValue(notice.series) || hasValue(notice.dr_number)
      ? `${orDash(notice.series)}.ª série · n.º ${orDash(notice.dr_number)}`
      : '—'

  return (
    <div>
      <Link to="/anuncios" className={detail.back}>
        ← Voltar aos anúncios
      </Link>

      <DetailHero
        eyebrow={notice.act_type ?? 'Anúncio de contratação pública'}
        badges={
          <>
            <ActiveBadge active={notice.active} />
            {notice.notice_number && (
              <Badge variant="primary">N.º {notice.notice_number}</Badge>
            )}
          </>
        }
        title={notice.entity_name}
        meta={notice.entity_nif ? `NIF ${notice.entity_nif}` : undefined}
        actions={
          notice.specifications_url || canEdit ? (
            <>
              {notice.specifications_url && (
                <ExternalLinkButton
                  href={apiUrl(notice.specifications_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                >
                  Abrir caderno de encargos
                </ExternalLinkButton>
              )}
              {canEdit && (
                <ButtonLink
                  to={`/anuncios/${notice.id}/edit`}
                  variant="secondary"
                  size="sm"
                >
                  Editar anúncio
                </ButtonLink>
              )}
            </>
          ) : undefined
        }
        aside={
          <Deadline
            label="Prazo para propostas"
            date={notice.proposal_deadline}
            start={notice.publication_date}
            sub={
              notice.proposal_period_days && notice.publication_date
                ? `Período de ${notice.proposal_period_days} dias · desde ${formatDate(notice.publication_date)}`
                : notice.publication_date
                  ? `Publicação: ${formatDate(notice.publication_date)}`
                  : undefined
            }
          />
        }
      />

      <MetricsStrip
        items={[
          { label: 'Preço base', value: formatCurrency(notice.base_price) },
          {
            label: 'Procedimento',
            value: <span className={styles.metricText}>{orDash(notice.procedure_type)}</span>,
          },
          { label: 'Lotes', value: String(lots.length) },
          {
            label: 'Tipo de contrato',
            value: (
              <span className={styles.metricText}>
                {contractTypes.length ? contractTypes[0] : '—'}
              </span>
            ),
          },
        ]}
      />

      <div className={detail.cols}>
        <div>
          {hasValue(notice.description) && (
            <Section eyebrow="Objeto do procedimento" title="Descrição">
              <p className={detail.lead}>{notice.description}</p>
            </Section>
          )}

          {lots.length > 0 && (
            <Section eyebrow="Divisão em lotes" title="Lotes">
              <div className={styles.lots}>
                {lots.map((raw, i) => {
                  const lot = parseLot(raw, i)
                  const hasMeta =
                    hasValue(lot.base_price) ||
                    hasValue(lot.quantity) ||
                    hasValue(lot.deadline)
                  return (
                    <div key={i} className={styles.lot}>
                      <span className={styles.lotTag}>LOTE {lot.number}</span>
                      <div className={styles.lotInfo}>
                        {lot.title && <div className={styles.lotTitle}>{lot.title}</div>}
                        {lot.description && (
                          <p className={styles.lotDesc}>{lot.description}</p>
                        )}
                        {hasMeta && (
                          <div className={styles.lotMeta}>
                            {hasValue(lot.base_price) && (
                              <span>
                                Preço base <b>{formatCurrency(lot.base_price)}</b>
                              </span>
                            )}
                            {hasValue(lot.quantity) && (
                              <span>
                                Quantidade <b>{lot.quantity}</b>
                              </span>
                            )}
                            {hasValue(lot.deadline) && (
                              <span>
                                Prazo <b>{formatDate(lot.deadline)}</b>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {cpvs.length > 0 && (
            <Section eyebrow="Classificação" title="Códigos CPV">
              <Chips>
                {cpvs.map((c, i) => {
                  const { code, description } = cpvLabel(c)
                  return (
                    <Tag key={i} code={code}>
                      {description}
                    </Tag>
                  )
                })}
              </Chips>
            </Section>
          )}

          {contractTypes.length > 0 && (
            <Section eyebrow="Contrato" title="Tipos de contrato">
              <Chips>
                {contractTypes.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </Chips>
            </Section>
          )}

          <Section eyebrow="Ficha do anúncio" title="Detalhes da publicação">
            <Card>
              <DescriptionList
                items={[
                  { label: 'Entidade adjudicante', value: orDash(notice.entity_name) },
                  { label: 'NIF', value: orDash(notice.entity_nif), mono: true },
                  { label: 'Ato', value: orDash(notice.act_type) },
                  { label: 'Procedimento', value: orDash(notice.procedure_type) },
                  { label: 'Diário da República', value: drLine, mono: true },
                  {
                    label: 'Data de publicação',
                    value: formatDate(notice.publication_date),
                    mono: true,
                  },
                  {
                    label: 'Critérios ambientais',
                    value:
                      notice.environmental_criteria == null
                        ? '—'
                        : notice.environmental_criteria
                          ? 'Sim'
                          : 'Não',
                  },
                ]}
              />
            </Card>
          </Section>
        </div>

        <aside className={detail.aside}>
          {documents.length > 0 && (
            <Card>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Documentos</h3>
              <div className={styles.docs}>
                {documents.map((d) => (
                  <a
                    key={d.label}
                    className={styles.docLink}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span
                      className={`${styles.docIcon} ${
                        d.variant === 'gov'
                          ? styles.icGov
                          : d.variant === 'doc'
                            ? styles.icDoc
                            : ''
                      }`}
                      aria-hidden="true"
                    >
                      {d.variant === 'gov' ? 'DR' : d.variant === 'doc' ? 'CE' : 'AC'}
                    </span>
                    <span className={styles.docText}>
                      <span className={styles.docTitle}>{d.label}</span>
                      <span className={styles.docSub}>{d.sub}</span>
                    </span>
                    <span className={styles.docArrow} aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
