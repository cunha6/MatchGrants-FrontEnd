import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../api'
import { AuthCard } from '../components/AuthCard'
import {
  Alert,
  Button,
  Form,
  FormActions,
  PasswordInput,
} from '../../../shared/components'
import { ApiError } from '../../../api/client'

export function ResetPassword() {
  const [params] = useSearchParams()
  const uid = params.get('uid')
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!uid || !token) {
    return (
      <AuthCard title="Link inválido" subtitle="Este link de redefinição está incompleto.">
        <Alert variant="danger">
          Falta informação no link. Peça um novo link de redefinição.
        </Alert>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Link to="/esqueci-password">Pedir novo link</Link>
        </div>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard title="Palavra-passe alterada" subtitle="Já pode iniciar sessão.">
        <Alert variant="success">A sua palavra-passe foi redefinida com sucesso.</Alert>
        <FormActions>
          <Button fullWidth onClick={() => (window.location.href = '/login')}>
            Ir para o login
          </Button>
        </FormActions>
      </AuthCard>
    )
  }

  const validate = (): boolean => {
    const next: { password?: string; confirm?: string } = {}
    if (password.length <= 8)
      next.password = 'A palavra-passe deve ter mais de 8 caracteres.'
    if (confirm !== password) next.confirm = 'As palavras-passe não coincidem.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneral(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await confirmPasswordReset({ uid, token, password })
      setDone(true)
    } catch (err) {
      setGeneral(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível redefinir a palavra-passe.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Nova palavra-passe"
      subtitle="Escolha uma nova palavra-passe para a sua conta."
    >
      <Form onSubmit={onSubmit} noValidate>
        {general && <Alert variant="danger">{general}</Alert>}
        <PasswordInput
          label="Nova palavra-passe"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="Mais de 8 caracteres."
          required
          autoFocus
        />
        <PasswordInput
          label="Confirmar palavra-passe"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          required
        />
        <FormActions>
          <Button type="submit" fullWidth loading={submitting}>
            Redefinir palavra-passe
          </Button>
        </FormActions>
      </Form>
    </AuthCard>
  )
}
