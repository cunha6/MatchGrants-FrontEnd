import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { activateUser, changePassword, deleteUser, getUser } from '../api'
import { useAuth } from '../../auth/AuthContext'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  ActiveBadge,
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  DescriptionList,
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
import detail from '../../../shared/styles/detail.module.css'
import styles from './UserDetail.module.css'

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const { user: currentUser, hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const isSelf = currentUser?.id === userId

  const { data: user, loading, error, reload } = useApiQuery(
    (signal) => getUser(userId, signal),
    [userId],
  )

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwOpen, setPwOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)

  const canEdit = isSelf || isAdmin
  const canManage = isAdmin

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
            {(isSelf || isAdmin) && (
              <Button variant="ghost" onClick={() => setPwOpen(true)}>
                {isAdmin && !isSelf ? 'Repor palavra-passe' : 'Alterar palavra-passe'}
              </Button>
            )}
            {canManage && !user.is_active && (
              <Button
                variant="secondary"
                onClick={() => act(() => activateUser(user.id), 'Utilizador ativado.')}
              >
                Ativar
              </Button>
            )}
            {canManage && user.is_active && (
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
        <DescriptionList
          items={[
            { label: 'ID', value: `#${user.id}`, mono: true },
            { label: 'Email', value: orDash(user.email) },
            { label: 'Papel', value: ROLE_LABELS[user.role] ?? user.role },
            { label: 'NIF', value: orDash(user.nif), mono: true },
            { label: 'Tipo de entidade', value: labelFor(ENTITY_TYPE_LABELS, user.entity_type) },
            { label: 'Dimensão', value: labelFor(ENTITY_SIZE_LABELS, user.entity_size) },
            { label: 'CAE principal', value: orDash(user.main_cae) },
            { label: 'CAE secundário', value: orDash(user.secondary_cae) },
            { label: 'Morada', value: orDash(user.address) },
            { label: 'Região', value: orDash(user.region) },
            { label: 'NUTS II', value: orDash(user.nuts_ii) },
            { label: 'NUTS III', value: orDash(user.nuts_iii) },
            { label: 'Data de constituição', value: formatDate(user.incorporation_date) },
            { label: 'Registo', value: formatDate(user.date_joined) },
          ]}
        />
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
