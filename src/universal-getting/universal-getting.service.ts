import { createQueryBuilder, getConnection } from "typeorm";
import { QueryConfig } from "./dto/query-config";

export class UniversalGettingService {
  async getTablesName() {
    const connection = getConnection()
    const table = connection.query(
      `
        SELECT name 
        FROM sqlite_master 
        WHERE type IN ('table') 
        AND name NOT LIKE 'sqlite_%' 
        ORDER BY name
      `
    )
    return table
  }

  async getUsers() {
    const connection = getConnection()
    const mainTable = `system_events`
    const mainAlias = `se`
    const join = `left`
    const fields = [`*`]
    let qb = connection.createQueryBuilder()
    
    qb.select([`se.id`, `mf.id`, `se.event_type`])
    qb.from(mainTable, mainAlias)

    qb.leftJoin(`monitored_files`, `mf`, `mf.id = se.related_file_id`)

    return await qb.getRawMany()
  }

  async getFieldsName(tableName: string) {
    const connection = getConnection()
    const fields = await connection.query(`PRAGMA table_info('${tableName}')`)
    const allFieldNames = fields.map(col => col.name);

    return allFieldNames
  }


  async getData(queryConfig: QueryConfig) {
    const connection = getConnection()
    const qb = connection.createQueryBuilder()
    const selectItems = []


    return this.generateSelectItems(queryConfig.selectOrder)
    return this.generateAlias(queryConfig.mainTable)

  }

  private generateAlias(tableName: string) {
    const existingAliases = new Set<string>
    let baseAlias = tableName.split(`_`).map(word => word[0]).join(``).toLowerCase()

    if (baseAlias.length < 2) {
      baseAlias = tableName.substring(0, 2).toLowerCase()
    }

    let alias = baseAlias
    let i = 1
    while (existingAliases.has(alias)) {
      alias = `${baseAlias}${i}`
      i++
    }

    existingAliases.add(alias)
    return alias

  }

  private generateSelectItems(selectItems: { table: string, field: string }[]) {
    return selectItems.map((i) => {
      const alias = this.generateAlias(i.table)
      const finalSelectItem = `${alias}.${i.field}`
      return finalSelectItem
    })
  }
}