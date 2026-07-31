import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api'
import { AuthCard } from '../components/AuthCard'
import { Alert, Button, Form, FormActions, Input } from '../../../shared/components'
import { ApiError } from '../../../api/client'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // The API always answers 200 with the same generic message, whether
      // or not the email matches an account — so this always leads to `sent`.
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível enviar o link.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Verifique o seu email"
        subtitle="Se existir uma conta com esse email, foi enviado um link para redefinir a palavra-passe."
        footer={<Link to="/login">Voltar ao login</Link>}
      >
        <Alert variant="success">
          Verifique a sua caixa de entrada (e a pasta de spam).
        </Alert>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Esqueceu-se da palavra-passe?"
      subtitle="Indique o seu email e enviamos-lhe um link para a redefinir."
      footer={<Link to="/login">Voltar ao login</Link>}
    >
      <Form onSubmit={onSubmit} noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <FormActions>
          <Button type="submit" fullWidth loading={submitting}>
            Enviar link
          </Button>
        </FormActions>
      </Form>
    </AuthCard>
  )
}
