import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { activateUser, deleteUser, getUser, sendPasswordResetEmail } from '../api'
import { requestPasswordReset } from '../../auth/api'
import { useAuth } from '../../auth/AuthContext'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  ActiveBadge,
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  ErrorState,
  LoadingBlock,
  Modal,
  PageHeader,
} from '../../../shared/components'
import {
  ENTITY_SIZE_LABELS,
  ENTITY_TYPE_LABELS,
  isStaffRole,
  ROLE_LABELS,
  labelFor,
} from '../../../shared/constants/domain'
import { formatDate, orDash } from '../../../shared/utils/format'
import { ApiError } from '../../../api/client'
import { cx } from '../../../shared/utils/cx'
import detail from '../../../shared/styles/detail.module.css'
import styles from './UserDetail.module.css'

interface FieldProps {
  label: string
  value: ReactNode
  mono?: boolean
}

function Field({ label, value, mono }: FieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={cx(styles.fieldValue, mono && styles.mono)}>{value}</div>
    </div>
  )
}

interface ProfileSectionProps {
  title: string
  children: ReactNode
}

function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.fieldGrid}>{children}</div>
    </div>
  )
}

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const { user: currentUser, hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const isManager = hasRole('commercial_grants', 'commercial_public')
  const isSelf = currentUser?.id === userId

  const { data: user, loading, error, reload } = useApiQuery(
    (signal) => getUser(userId, signal),
    [userId],
  )

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const [delOpen, setDelOpen] = useState(false)

  /** admin manages anyone; commercial_grants/commercial_public only manage
   *  viewer/client targets (matches the API's /users/<id>/ author check). */
  const canManageTarget =
    isAdmin || (isManager && (user?.role === 'viewer' || user?.role === 'client'))
  const canEdit = isSelf || canManageTarget
  /** Only /activate/ is open to commercial_grants/commercial_public; the
   *  deactivate (DELETE) endpoint stays admin-only. */
  const canActivate = canManageTarget
  const canDeactivate = isAdmin

  const act = async (fn: () => Promise<unknown>, okText: string) => {
    try {
      await fn()
      setFeedback({ ok: true, text: okText })
      reload()
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof ApiError ? err.message : 'A operação falhou.',
      })
    }
  }

  // Both branches now just trigger an email with a reset link — no password
  // fields collected here anymore (that happens on the /reset-password page).
  const onSendPasswordEmail = async () => {
    if (!user) return
    try {
      const res =
        canManageTarget && !isSelf
          ? await requestPasswordReset(user.email)
          : await sendPasswordResetEmail(user.id)
      setFeedback({ ok: true, text: res.message })
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof ApiError ? err.message : 'A operação falhou.',
      })
    }
  }

  if (loading) return <LoadingBlock message="A carregar utilizador…" />
  if (error) {
    return (
      <div>
        {isAdmin && (
          <Link to="/users" className={detail.back}>
            ← Voltar aos utilizadores
          </Link>
        )}
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }
  if (!user) return null
  const isStaff = isStaffRole(user.role)

  return (
    <div>
      {isAdmin && (
        <Link to="/users" className={detail.back}>
          ← Voltar aos utilizadores
        </Link>
      )}

      <PageHeader
        eyebrow="Utilizador"
        title={user.username}
        actions={
          <>
            {canEdit && (
              <ButtonLink to={`/users/${user.id}/edit`} variant="ghost">
                Editar
              </ButtonLink>
            )}
            {(isSelf || canManageTarget) && (
              <Button variant="ghost" onClick={onSendPasswordEmail}>
                {canManageTarget && !isSelf
                  ? 'Repor palavra-passe'
                  : 'Enviar email para definir password'}
              </Button>
            )}
            {canActivate && !user.is_active && (
              <Button
                variant="secondary"
                onClick={() => act(() => activateUser(user.id), 'Utilizador ativado.')}
              >
                Ativar
              </Button>
            )}
            {canDeactivate && user.is_active && (
              <Button variant="danger" onClick={() => setDelOpen(true)}>
                Desativar
              </Button>
            )}
          </>
        }
      />

      {feedback && (
        <div className={styles.feedback}>
          <Alert
            variant={feedback.ok ? 'success' : 'danger'}
            onClose={() => setFeedback(null)}
          >
            {feedback.text}
          </Alert>
        </div>
      )}

      <div className={styles.badges}>
        <Badge variant="primary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
        <ActiveBadge active={user.is_active} />
        {user.is_staff && <Badge variant="info">Staff</Badge>}
      </div>

      <Card>
        <div className={styles.profile}>
          <ProfileSection title="Conta">
            <Field label="Nome" value={orDash(user.first_name)} />
            {!isStaff && <Field label="Função" value={orDash(user.job_title)} />}
            <Field label="Email" value={orDash(user.email)} />
            <Field label="Papel" value={ROLE_LABELS[user.role] ?? user.role} />
            <Field label="ID" value={`#${user.id}`} mono />
            {!isStaff && <Field label="NIF" value={orDash(user.nif)} mono />}
          </ProfileSection>

          {!isStaff && (
            <ProfileSection title="Entidade">
              <Field
                label="Tipo de entidade"
                value={labelFor(ENTITY_TYPE_LABELS, user.entity_type)}
              />
              <Field label="Dimensão" value={labelFor(ENTITY_SIZE_LABELS, user.entity_size)} />
              <Field label="CAE principal" value={orDash(user.main_cae)} />
              <Field label="CAE secundário" value={orDash(user.secondary_cae?.join(', '))} />
            </ProfileSection>
          )}

          {!isStaff && (
            <ProfileSection title="Localização">
              <Field label="Morada" value={orDash(user.address)} />
              <Field label="Código Postal" value={orDash(user.postal_code)} />
              <Field label="Cidade" value={orDash(user.city)} />
              <Field label="Concelho" value={orDash(user.county)} />
              <Field label="Região" value={orDash(user.region)} />
            </ProfileSection>
          )}

          {!isStaff && user.matched_grants && user.matched_grants.length > 0 && (
            <ProfileSection title="Últimos avisos correspondentes">
              <ul className={styles.matchedList}>
                {user.matched_grants.map((g) => (
                  <li key={g.id}>
                    <Link to={`/avisos/${g.id}`} className={styles.matchedItem}>
                      {g.grant_code && (
                        <span className={styles.matchedCode}>{g.grant_code}</span>
                      )}
                      <span className={styles.matchedTitle}>
                        {g.title ?? `Aviso #${g.id}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </ProfileSection>
          )}

          <ProfileSection title="Datas">
            {!isStaff && (
              <Field
                label="Data de constituição"
                value={formatDate(user.incorporation_date)}
                mono
              />
            )}
            <Field label="Registo" value={formatDate(user.date_joined)} mono />
          </ProfileSection>
        </div>
      </Card>

      <Modal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        title="Desativar utilizador"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDelOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDelOpen(false)
                act(() => deleteUser(user.id), 'Utilizador desativado.')
              }}
            >
              Desativar
            </Button>
          </>
        }
      >
        Tem a certeza que quer desativar <strong>{user.username}</strong>? A conta
        deixa de poder iniciar sessão (desativação reversível).
      </Modal>
    </div>
  )
}
