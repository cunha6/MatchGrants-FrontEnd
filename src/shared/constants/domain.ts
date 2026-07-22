/**
 * Shared domain vocabulary (roles, entity types/sizes) with Portuguese labels.
 * These mirror the values accepted/returned by the Django API.
 */

export const ROLES = [
  'admin',
  'commercial',
  'composer',
  'client',
  'viewer',
] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  commercial: 'Comercial',
  composer: 'Redator',
  client: 'Cliente',
  viewer: 'Visitante',
}

export const ENTITY_TYPES = [
  'empresa',
  'associacao',
  'cooperativa',
  'fundacao',
  'municipio',
  'intermunicipio',
  'multimunicipio',
  'junta_freguesia',
  'misericordia',
  'ensino',
  'ong',
  'outro',
] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  empresa: 'Empresa',
  associacao: 'Associação',
  cooperativa: 'Cooperativa',
  fundacao: 'Fundação',
  municipio: 'Município',
  intermunicipio: 'Comunidade intermunicipal',
  multimunicipio: 'Entidade multimunicipal',
  junta_freguesia: 'Junta de freguesia',
  misericordia: 'Misericórdia',
  ensino: 'Ensino',
  ong: 'ONG',
  outro: 'Outro',
}

export const ENTITY_SIZES = ['micro', 'pequena', 'media', 'grande'] as const
export type EntitySize = (typeof ENTITY_SIZES)[number]

export const ENTITY_SIZE_LABELS: Record<EntitySize, string> = {
  micro: 'Micro',
  pequena: 'Pequena',
  media: 'Média',
  grande: 'Grande',
}

/** Pre-built {value,label} option lists for <Select> controls. */
export const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))
export const ENTITY_TYPE_OPTIONS = ENTITY_TYPES.map((t) => ({
  value: t,
  label: ENTITY_TYPE_LABELS[t],
}))
export const ENTITY_SIZE_OPTIONS = ENTITY_SIZES.map((s) => ({
  value: s,
  label: ENTITY_SIZE_LABELS[s],
}))

/** Ordering options accepted by GET /anuncios/. */
export const NOTICE_ORDER_OPTIONS = [
  { value: 'publication_recent', label: 'Publicação (mais recente)' },
  { value: 'publication_oldest', label: 'Publicação (mais antiga)' },
  { value: 'deadline_earliest', label: 'Prazo (mais próximo)' },
  { value: 'deadline_latest', label: 'Prazo (mais distante)' },
  { value: 'price_highest', label: 'Preço base (mais alto)' },
  { value: 'price_lowest', label: 'Preço base (mais baixo)' },
] as const

/** Ordering options accepted by GET /avisos/list/. */
export const GRANT_ORDER_OPTIONS = [
  { value: 'publication_recent', label: 'Publicação (mais recente)' },
  { value: 'publication_oldest', label: 'Publicação (mais antiga)' },
  { value: 'closing_earliest', label: 'Data final (mais próxima)' },
  { value: 'closing_latest', label: 'Data final (mais distante)' },
  { value: 'allocation_highest', label: 'Dotação (maior primeiro)' },
  { value: 'allocation_lowest', label: 'Dotação (menor primeiro)' },
  { value: 'rate_highest', label: 'Taxa (maior primeiro)' },
  { value: 'rate_lowest', label: 'Taxa (menor primeiro)' },
] as const

/** Helper: map an unknown role/type/size code to a friendly label. */
export function labelFor(
  map: Record<string, string>,
  value: string | null | undefined,
): string {
  if (!value) return '—'
  return map[value] ?? value
}
