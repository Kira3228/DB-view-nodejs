import { getConnection } from "typeorm";

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

  async getFieldsName() {
    const connection = getConnection()
    const fields = await connection.query(`PRAGMA table_info('system_events')`)
    return fields.map(col => col.name)
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
}