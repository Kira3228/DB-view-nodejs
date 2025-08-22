export class QueryConfig {
  mainTable: string
  mainFields: string[]
  joins: JoinConfig[]
  selectOrder: SelectOrder[]
}

class JoinConfig {
  table: string
  fields: string[]
  on?: string
}

class SelectOrder {
  table: string
  field: string
}
