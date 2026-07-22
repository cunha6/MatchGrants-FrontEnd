import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { AuthCard } from '../components/AuthCard'
import { Alert, Button, Form, FormActions, Input } from '../../../shared/components'
import { ApiError } from '../../../api/client'

interface LocationState {
  from?: { pathname: string }
  registered?: boolean
}

export function Login() {
  const { login, isAuthenticated, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const from = state?.from?.pathname ?? '/avisos'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in → skip the form.
  if (status === 'authenticated' && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível iniciar sessão.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Entrar"
      subtitle="Aceda à sua conta MatchGrants."
      footer={
        <>
          Ainda não tem conta? <Link to="/registar">Criar conta</Link>
        </>
      }
    >
      {state?.registered && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="success" title="Conta criada">
            Já pode iniciar sessão com as suas credenciais.
          </Alert>
        </div>
      )}
      <Form onSubmit={onSubmit} noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <Input
          label="Utilizador"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Palavra-passe"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FormActions>
          <Button type="submit" fullWidth loading={submitting}>
            Entrar
          </Button>
        </FormActions>
      </Form>
    </AuthCard>
  )
}
