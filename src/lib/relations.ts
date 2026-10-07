/** Estrae l'id da un campo relationship, che può essere un id o un documento popolato. */
export function relId<T extends { id: number | string }>(
  value: T | number | string | null | undefined,
): number | string | undefined {
  if (value === null || value === undefined) return undefined
  return typeof value === 'object' ? value.id : value
}
