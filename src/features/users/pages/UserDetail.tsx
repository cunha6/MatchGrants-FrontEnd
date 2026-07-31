import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { activateUser, changePassword, deleteUser, getUser } from '../api'
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
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
} from '../../../shared/components'
import {
  ENTITY_SIZE_LABELS,
  ENTITY_TYPE_LABELS,
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
  const [pwOpen, setPwOpen] = useState(false)
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
              <Button
                variant="ghost"
                onClick={() =>
                  canManageTarget && !isSelf
                    ? act(
                        () => requestPasswordReset(user.email),
                        'Email de redefinição de palavra-passe enviado.',
                      )
                    : setPwOpen(true)
                }
              >
                {canManageTarget && !isSelf ? 'Repor palavra-passe' : 'Alterar palavra-passe'}
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
            <Field label="Função" value={orDash(user.job_title)} />
            <Field label="Email" value={orDash(user.email)} />
            <Field label="Papel" value={ROLE_LABELS[user.role] ?? user.role} />
            <Field label="ID" value={`#${user.id}`} mono />
            <Field label="NIF" value={orDash(user.nif)} mono />
          </ProfileSection>

          <ProfileSection title="Entidade">
            <Field
              label="Tipo de entidade"
              value={labelFor(ENTITY_TYPE_LABELS, user.entity_type)}
            />
            <Field label="Dimensão" value={labelFor(ENTITY_SIZE_LABELS, user.entity_size)} />
            <Field label="CAE principal" value={orDash(user.main_cae)} />
            <Field label="CAE secundário" value={orDash(user.secondary_cae)} />
          </ProfileSection>

          <ProfileSection title="Localização">
            <Field label="Morada" value={orDash(user.address)} />
            <Field label="Região" value={orDash(user.region)} />
            <Field label="NUTS II" value={orDash(user.nuts_ii)} />
            <Field label="NUTS III" value={orDash(user.nuts_iii)} />
          </ProfileSection>

          <ProfileSection title="Datas">
            <Field
              label="Data de constituição"
              value={formatDate(user.incorporation_date)}
              mono
            />
            <Field label="Registo" value={formatDate(user.date_joined)} mono />
          </ProfileSection>
        </div>
      </Card>

      <PasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        requireCurrent={isSelf && !isAdmin}
        onSubmit={async (payload) => {
          await changePassword(user.id, payload)
          setPwOpen(false)
          setFeedback({ ok: true, text: 'Palavra-passe alterada.' })
        }}
      />

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

interface PasswordModalProps {
  open: boolean
  onClose: () => void
  requireCurrent: boolean
  onSubmit: (payload: { current_password?: string; password: string }) => Promise<void>
}

function PasswordModal({ open, onClose, requireCurrent, onSubmit }: PasswordModalProps) {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length <= 8) {
      setError('A palavra-passe deve ter mais de 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As palavras-passe não coincidem.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        password,
        ...(requireCurrent ? { current_password: current } : {}),
      })
      setCurrent('')
      setPassword('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível alterar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Palavra-passe">
      <form id="pw-form" onSubmit={submit} noValidate>
        {error && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Alert variant="danger">{error}</Alert>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {requireCurrent && (
            <Input
              label="Palavra-passe atual"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          )}
          <Input
            label="Nova palavra-passe"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmar"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
        <Button variant="ghost" onClick={onClose} type="button">
          Cancelar
        </Button>
        <Button type="submit" form="pw-form" loading={submitting}>
          Guardar
        </Button>
      </div>
    </Modal>
  )
}
