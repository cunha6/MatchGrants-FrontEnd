import { Badge, type BadgeVariant } from '../../../shared/components'
import { NOTICE_STATUS_LABELS } from '../../../shared/constants/domain'
import type { NoticeStatus } from '../types'

const VARIANTS: Record<NoticeStatus, BadgeVariant> = {
  active: 'success',
  inactive: 'neutral',
  to_fix: 'warning',
}

export function NoticeStatusBadge({ status }: { status: NoticeStatus }) {
  return (
    <Badge variant={VARIANTS[status] ?? 'neutral'} dot>
      {NOTICE_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
