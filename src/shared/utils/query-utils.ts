import { SelectQueryBuilder } from "typeorm"

export const parsePathExceptions = (raw?: string): string[] => {
  console.log(raw);

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
  let normalizedValues: string[] = [];

  if (!values) { return qb }

  if (Array.isArray(values)) {
    normalizedValues = values.filter(Boolean)
  }
  else if (typeof values === `string`) {
    normalizedValues = (values as string).split(/[;,]/).map(v => v.trim()).filter(Boolean);
  } else {
    return qb
  }

  if (normalizedValues.length === 0) {
    return qb
  }

  const params: Record<string, any> = {}
  const conds: string[] = []

  normalizedValues.forEach((val, idx) => {
    if (!val) {
      return
    }

    const paramName = `${field}_exclude_${idx}`
    let pattern = val

    if (wildcard === `both`) pattern = `%${val}%`
    else if (wildcard === `prefix`) pattern = `%${val}`
    else if (wildcard === `suffix`) pattern = `${val}%`

    params[paramName] = pattern
    conds.push(`${alias}.${field} NOT LIKE :${paramName}`)
  })

  if (conds.length === 0) {
    return qb
  }

  if (allowNull) {
    qb.andWhere(`(${alias}.${field} IS NULL OR (${alias}.${field} IS NOT NULL AND ${conds.join(` AND `)}))`, params)
  } else {
    qb.andWhere(`${alias}.${field} IS NOT NULL AND (${conds.join(` AND `)})`, params)
  }

  return qb
}