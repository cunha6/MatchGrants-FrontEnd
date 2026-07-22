import { PageHeader, Alert, ButtonLink } from '../shared/components'

/** 403 — authenticated but not allowed. */
export function Forbidden() {
  return (
    <div>
      <PageHeader eyebrow="Erro 403" title="Acesso negado" />
      <Alert
        variant="danger"
        title="Sem permissão"
        action={
          <ButtonLink to="/avisos" size="sm" variant="ghost">
            Voltar aos avisos
          </ButtonLink>
        }
      >
        A sua conta não tem permissão para aceder a esta área.
      </Alert>
    </div>
  )
}

/** 404 — unknown route. */
export function NotFound() {
  return (
    <div>
      <PageHeader eyebrow="Erro 404" title="Página não encontrada" />
      <Alert
        variant="warning"
        title="Nada por aqui"
        action={
          <ButtonLink to="/avisos" size="sm" variant="ghost">
            Voltar aos avisos
          </ButtonLink>
        }
      >
        O endereço que procura não existe ou foi movido.
      </Alert>
    </div>
  )
}
