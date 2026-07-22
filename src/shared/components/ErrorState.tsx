import { Alert } from './Alert'
import { Button } from './Button'
import type { ApiError } from '../../api/client'

interface ErrorStateProps {
  error: ApiError | Error
  onRetry?: () => void
  title?: string
}

/** Consistent error presentation with an optional retry action. */
export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  return (
    <Alert
      variant="danger"
      title={title ?? 'Ocorreu um erro'}
      action={
        onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry}>
            Tentar novamente
          </Button>
        )
      }
    >
      {error.message}
    </Alert>
  )
}
