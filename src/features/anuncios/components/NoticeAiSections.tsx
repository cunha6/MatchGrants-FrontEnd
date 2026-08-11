import type { NoticeAiContent } from '../types'
import type { NoticeAiDetailHookState } from '../useNoticeAiDetail'
import { Alert, Card, Section, Spinner } from '../../../shared/components'
import detail from '../../../shared/styles/detail.module.css'
import styles from './NoticeAiSections.module.css'

/**
 * The AI reading isn't shown as one block: each part slots into the page next
 * to the matching scraped section (descrição, tipos de contrato, …). These
 * pieces all read the same `state`, and each renders nothing until the user
 * has generated the detail and that particular field came back non-empty.
 */

/** Notes can arrive with blank entries; treat those as absent. */
function notes(d: NoticeAiContent | null | undefined): string[] {
  return (d?.observacoes ?? []).filter((o) => o.trim())
}

function isEmpty(d: NoticeAiContent): boolean {
  return !d.descricao_detalhada.trim() && !d.avaliacao.trim() && notes(d).length === 0
}

/** Loading / error / "nothing found" feedback for the whole generation.
 *  Sits where the first AI section would appear. */
export function NoticeAiStatus({ state }: { state: NoticeAiDetailHookState }) {
  const { status, detail: data, error } = state

  if (status === 'loading') {
    return (
      <Card className={styles.statusCard}>
        <div className={styles.loading}>
          <Spinner size={18} />A gerar o detalhe com IA — a geração corre em segundo
          plano e pode demorar até 1-2 minutos.
        </div>
      </Card>
    )
  }

  if (status === 'error' && error) {
    return (
      <div className={styles.statusCard}>
        <Alert variant={error.missingDocument ? 'info' : 'danger'}>{error.message}</Alert>
      </div>
    )
  }

  // Generated fine, but the document carried none of the fields.
  if (status === 'done' && data && isEmpty(data)) {
    return (
      <div className={styles.statusCard}>
        <Alert variant="info">
          Não foi possível extrair informação adicional do caderno de encargos.
        </Alert>
      </div>
    )
  }

  return null
}

export function NoticeAiDescription({ state }: { state: NoticeAiDetailHookState }) {
  const text = state.detail?.descricao_detalhada.trim()
  if (state.status !== 'done' || !text) return null

  return (
    <Section eyebrow="Caderno de encargos (IA)" title="Descrição detalhada">
      <p className={detail.lead}>{text}</p>
    </Section>
  )
}

export function NoticeAiEvaluation({ state }: { state: NoticeAiDetailHookState }) {
  const text = state.detail?.avaliacao.trim()
  if (state.status !== 'done' || !text) return null

  return (
    <Section eyebrow="Caderno de encargos (IA)" title="Avaliação">
      <p className={detail.lead}>{text}</p>
    </Section>
  )
}

export function NoticeAiObservations({ state }: { state: NoticeAiDetailHookState }) {
  const items = notes(state.detail)
  if (state.status !== 'done' || items.length === 0) return null

  return (
    <Section eyebrow="Caderno de encargos (IA)" title="Observações">
      <ul className={styles.notes}>
        {items.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>
    </Section>
  )
}
