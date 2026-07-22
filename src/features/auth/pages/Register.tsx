import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { createUser } from '../../users/api'
import { AuthCard } from '../components/AuthCard'
import {
  Alert,
  Button,
  Form,
  FormActions,
  FormGrid,
  Input,
  Select,
} from '../../../shared/components'
import {
  ENTITY_SIZE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
} from '../../../shared/constants/domain'
import { fieldErrorsFrom } from '../../../shared/utils/apiErrors'
import { ApiError } from '../../../api/client'

const EMPTY = {
  username: '',
  email: '',
  password: '',
  confirm: '',
  entity_type: '',
  entity_size: '',
  nif: '',
  main_cae: '',
  address: '',
  region: '',
  nuts_ii: '',
  nuts_iii: '',
}

export function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (form.password.length <= 8)
      next.password = 'A palavra-passe deve ter mais de 8 caracteres.'
    else if (/^\d+$/.test(form.password))
      next.password = 'A palavra-passe não pode ser apenas números.'
    if (form.confirm !== form.password)
      next.confirm = 'As palavras-passe não coincidem.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneral(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await createUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        entity_type: form.entity_type || undefined,
        entity_size: form.entity_size || undefined,
        nif: form.nif || undefined,
        main_cae: form.main_cae || undefined,
        address: form.address || undefined,
        region: form.region || undefined,
        nuts_ii: form.nuts_ii || undefined,
        nuts_iii: form.nuts_iii || undefined,
      })
      // Try to sign in immediately; fall back to the login page.
      try {
        await login(form.username.trim(), form.password)
        navigate('/avisos', { replace: true })
      } catch {
        navigate('/login', { replace: true, state: { registered: true } })
      }
    } catch (err) {
      setErrors(fieldErrorsFrom(err))
      setGeneral(
        err instanceof ApiError ? err.message : 'Não foi possível criar a conta.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      wide
      title="Criar conta"
      subtitle="Registe-se como cliente para avaliar a elegibilidade da sua entidade."
      footer={
        <>
          Já tem conta? <Link to="/login">Entrar</Link>
        </>
      }
    >
      <Form onSubmit={onSubmit} noValidate>
        {general && <Alert variant="danger">{general}</Alert>}

        <FormGrid>
          <Input
            label="Utilizador"
            autoComplete="username"
            value={form.username}
            onChange={set('username')}
            error={errors.username}
            required
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
          />
          <Input
            label="Palavra-passe"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="Mais de 8 caracteres, não trivial."
            required
          />
          <Input
            label="Confirmar palavra-passe"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
            required
          />
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
          <Input
            label="NIF"
            inputMode="numeric"
            value={form.nif}
            onChange={set('nif')}
            error={errors.nif}
          />
          <Input
            label="CAE principal"
            value={form.main_cae}
            onChange={set('main_cae')}
            error={errors.main_cae}
          />
          <Input
            label="Região"
            value={form.region}
            onChange={set('region')}
            error={errors.region}
          />
          <Input
            label="Morada"
            value={form.address}
            onChange={set('address')}
            error={errors.address}
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
          <Button type="submit" fullWidth loading={submitting}>
            Criar conta
          </Button>
        </FormActions>
      </Form>
    </AuthCard>
  )
}
