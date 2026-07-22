import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createUser, getUser, updateUser } from '../api'
import type { User, UserCreatePayload } from '../types'
import { useAuth } from '../../auth/AuthContext'
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ErrorState,
  Form,
  FormActions,
  FormGrid,
  Input,
  LoadingBlock,
  PageHeader,
  Select,
} from '../../../shared/components'
import {
  ENTITY_SIZE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  ROLE_OPTIONS,
} from '../../../shared/constants/domain'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { fieldErrorsFrom } from '../../../shared/utils/apiErrors'
import { ApiError } from '../../../api/client'
import type { Role } from '../../../shared/constants/domain'
import detail from '../../../shared/styles/detail.module.css'

interface FormState {
  username: string
  email: string
  role: string
  entity_type: string
  entity_size: string
  nif: string
  main_cae: string
  secondary_cae: string
  address: string
  region: string
  nuts_ii: string
  nuts_iii: string
}

const EMPTY: FormState = {
  username: '',
  email: '',
  role: 'client',
  entity_type: '',
  entity_size: '',
  nif: '',
  main_cae: '',
  secondary_cae: '',
  address: '',
  region: '',
  nuts_ii: '',
  nuts_iii: '',
}

function fromUser(u: User): FormState {
  return {
    username: u.username ?? '',
    email: u.email ?? '',
    role: u.role,
    entity_type: u.entity_type ?? '',
    entity_size: u.entity_size ?? '',
    nif: u.nif ?? '',
    main_cae: u.main_cae ?? '',
    secondary_cae: u.secondary_cae ?? '',
    address: u.address ?? '',
    region: u.region ?? '',
    nuts_ii: u.nuts_ii ?? '',
    nuts_iii: u.nuts_iii ?? '',
  }
}

export function UserForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const navigate = useNavigate()
  const { user: currentUser, hasRole, setUser } = useAuth()
  const isAdmin = hasRole('admin')

  const { data: existing, loading, error, reload } = useApiQuery(
    (signal) => (mode === 'edit' ? getUser(userId, signal) : Promise.resolve(null)),
    [userId, mode],
  )

  const [form, setForm] = useState<FormState>(EMPTY)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && existing) setForm(fromUser(existing))
  }, [mode, existing])

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const optionalKeys = [
    'entity_type',
    'entity_size',
    'nif',
    'main_cae',
    'secondary_cae',
    'address',
    'region',
    'nuts_ii',
    'nuts_iii',
  ] as const

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneral(null)
    setErrors({})

    if (mode === 'create') {
      const next: Record<string, string> = {}
      if (password.length <= 8)
        next.password = 'A palavra-passe deve ter mais de 8 caracteres.'
      if (confirm !== password) next.confirm = 'As palavras-passe não coincidem.'
      if (Object.keys(next).length) {
        setErrors(next)
        return
      }
    }

    setSubmitting(true)
    try {
      if (mode === 'create') {
        const payload: UserCreatePayload = {
          username: form.username.trim(),
          email: form.email.trim(),
          password,
        }
        for (const k of optionalKeys) if (form[k]) payload[k] = form[k]
        if (isAdmin) payload.role = form.role as Role
        const created = await createUser(payload)
        navigate(`/users/${created.id}`)
      } else {
        const changes: Record<string, unknown> = {}
        const base = existing ? fromUser(existing) : EMPTY
        for (const k of ['username', 'email', ...optionalKeys] as (keyof FormState)[]) {
          if (form[k] !== base[k]) changes[k] = form[k]
        }
        if (isAdmin && form.role !== base.role) changes.role = form.role
        const updated = await updateUser(userId, changes)
        // Keep the auth context fresh if editing own profile.
        if (currentUser?.id === userId) setUser(updated)
        navigate(`/users/${userId}`)
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...fieldErrorsFrom(err) }))
      setGeneral(err instanceof ApiError ? err.message : 'Não foi possível gravar.')
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'edit' && loading) return <LoadingBlock message="A carregar utilizador…" />
  if (mode === 'edit' && error) {
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

  const backTo = mode === 'edit' ? `/users/${userId}` : '/users'

  return (
    <div>
      <Link to={backTo} className={detail.back}>
        ← Voltar
      </Link>
      <PageHeader
        eyebrow={mode === 'create' ? 'Novo' : 'Edição'}
        title={mode === 'create' ? 'Criar utilizador' : 'Editar utilizador'}
      />
      <Card>
        <Form onSubmit={onSubmit} noValidate>
          {general && <Alert variant="danger">{general}</Alert>}

          <FormGrid>
            <Input
              label="Utilizador"
              value={form.username}
              onChange={set('username')}
              error={errors.username}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              required
            />

            {mode === 'create' && (
              <>
                <Input
                  label="Palavra-passe"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  hint="Mais de 8 caracteres, não trivial."
                  required
                />
                <Input
                  label="Confirmar palavra-passe"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={errors.confirm}
                  required
                />
              </>
            )}

            {isAdmin && (
              <Select
                label="Papel"
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={set('role')}
                error={errors.role}
              />
            )}

            <Select
              label="Tipo de entidade"
              placeholder="Selecionar…"
              options={ENTITY_TYPE_OPTIONS}
              value={form.entity_type}
              onChange={set('entity_type')}
              error={errors.entity_type}
            />
            <Select
              label="Dimensão"
              placeholder="Selecionar…"
              options={ENTITY_SIZE_OPTIONS}
              value={form.entity_size}
              onChange={set('entity_size')}
              error={errors.entity_size}
            />
            <Input label="NIF" value={form.nif} onChange={set('nif')} error={errors.nif} />
            <Input
              label="CAE principal"
              value={form.main_cae}
              onChange={set('main_cae')}
              error={errors.main_cae}
            />
            <Input
              label="CAE secundário"
              value={form.secondary_cae}
              onChange={set('secondary_cae')}
              error={errors.secondary_cae}
            />
            <Input
              label="Morada"
              value={form.address}
              onChange={set('address')}
              error={errors.address}
            />
            <Input
              label="Região"
              value={form.region}
              onChange={set('region')}
              error={errors.region}
            />
            <Input
              label="NUTS II"
              value={form.nuts_ii}
              onChange={set('nuts_ii')}
              error={errors.nuts_ii}
            />
            <Input
              label="NUTS III"
              value={form.nuts_iii}
              onChange={set('nuts_iii')}
              error={errors.nuts_iii}
            />
          </FormGrid>

          <FormActions>
            <ButtonLink to={backTo} variant="ghost">
              Cancelar
            </ButtonLink>
            <Button type="submit" loading={submitting}>
              {mode === 'create' ? 'Criar utilizador' : 'Gravar alterações'}
            </Button>
          </FormActions>
        </Form>
      </Card>
    </div>
  )
}
