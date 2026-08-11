import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  entity_type: '',
  entity_size: '',
  nif: '',
  main_cae: '',
  address: '',
  postal_code: ''
}

export function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneral(null)
    setErrors({})

    setSubmitting(true)
    try {
      await createUser({
        username: form.username.trim(),
        email: form.email.trim(),
        entity_type: form.entity_type || undefined,
        entity_size: form.entity_size || undefined,
        nif: form.nif || undefined,
        main_cae: form.main_cae || undefined,
        address: form.address || undefined,
        postal_code: form.postal_code || undefined
      })
      // No password is set at registration — the account gets an email with
      // a link to set one, so there's no session to start here.
      navigate('/login', { replace: true, state: { registered: true } })
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
      subtitle="Registe-se como cliente para ter acesso a todos os Incentivos."
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
            label="Nome Utilizador"
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
          <Select
            label="Tipo de entidade"
            placeholder="Selecionar…"
            options={ENTITY_TYPE_OPTIONS}
            value={form.entity_type}
            onChange={set('entity_type')}
            error={errors.entity_type}
            required
          />
          <Select
            label="Dimensão"
            placeholder="Selecionar…"
            options={ENTITY_SIZE_OPTIONS}
            value={form.entity_size}
            onChange={set('entity_size')}
            error={errors.entity_size}
            required
          />
          <Input
            label="NIF"
            inputMode="numeric"
            value={form.nif}
            onChange={set('nif')}
            error={errors.nif}
            required
          />
          <Input
            label="CAE principal"
            value={form.main_cae}
            onChange={set('main_cae')}
            error={errors.main_cae}
            required
          />
          <Input
            label="Morada"
            value={form.address}
            onChange={set('address')}
            error={errors.address}
            required
          />
          <Input
            label="Código Postal"
            value={form.postal_code}
            onChange={set('postal_code')}
            error={errors.postal_code}
            required
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
