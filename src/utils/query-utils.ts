import { SelectQueryBuilder } from "typeorm"

export const parsePathExceptions = (raw?: string): string[] => {
  if (!raw || typeof raw !== `string`) return []
  return raw.split(';').map(s => s.trim()).filter(Boolean)
}

export const applyNotLikeList = <T>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  field: string,
  values: string[],
  wildcard: `prefix` | `suffix` | `both` | `none` = `both`,
  allowNull = false
) => {
  if (!values || values.length === 0) return qb

  const params: Record<string, any> = {}
  const conds: string[] = []

  values.forEach((val, idx) => {
    const paramName = `${field}_exclude_${idx}`
    let pattern = val
    if (wildcard === `both`) pattern = `%${val}%`
    else if (wildcard === `prefix`) pattern = `%${val}`
    else if (wildcard === `suffix`) pattern = `${val}%`

    params[paramName] = pattern
    conds.push(`${alias}.${field} NOT LIKE :${paramName}`)
  })

  if (allowNull) {
    qb.andWhere(`(${alias}.${field} IS NULL OR (${conds.join(` AND `)}))`, params)
  } else {
    qb.andWhere(`(${conds.join(` AND `)})`, params)
  }

  return qb.andWhere(`(${conds.join(` AND `)})`, params)
}