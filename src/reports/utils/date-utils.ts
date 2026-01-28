export const toSqlDateTime = (date: Date) => {
  return date.toISOString().replace('T', " ").replace(`.000Z`, "")
}

export const normalizeDate = (input?: string | Date): string | null => {
  if (!input) return null
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d.toISOString().replace(`T`, '').replace(`000Z`, '')
}

