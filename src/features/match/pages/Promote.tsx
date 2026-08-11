import { useState, type FormEvent } from 'react'
import { promoteViewer } from '../api'
import type { PromoteResponse } from '../types'
import {
  Alert,
  Button,
  Card,
  DescriptionList,
  Form,
  FormActions,
  Input,
  PageHeader,
} from '../../../shared/components'
import { ApiError } from '../../../api/client'

export function Promote() {
  const [nif, setNif] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PromoteResponse | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      setResult(await promoteViewer(nif.trim()))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível promover a entidade.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Gestão de acessos"
        title="Promover viewer"
        description="Promova uma entidade avaliada (por NIF) a cliente com acesso."
      />
      <Card>
        <Form onSubmit={onSubmit} noValidate>
          {error && <Alert variant="danger">{error}</Alert>}
          {result && (
            <Alert variant="success" title="Entidade promovida">
              <DescriptionList
                items={[
                  { label: 'Nome Utilizador', value: `#${result.user_id}`, mono: true },
                  { label: 'NIF', value: result.nif, mono: true },
                  { label: 'Papel', value: result.role },
                  { label: 'Ativo', value: result.is_active ? 'Sim' : 'Não' },
                  { label: 'Tem login', value: result.has_login ? 'Sim' : 'Não' },
                ]}
              />
            </Alert>
          )}
          <Input
            label="NIF"
            inputMode="numeric"
            placeholder="500000000"
            value={nif}
            onChange={(e) => setNif(e.target.value)}
            required
            autoFocus
          />
          <FormActions>
            <Button type="submit" loading={loading}>
              Promover
            </Button>
          </FormActions>
        </Form>
      </Card>
    </div>
  )
}
