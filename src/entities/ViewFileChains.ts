import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  name: `v_file_chains`,
  expression:
    `
        WITH RECURSIVE file_chain(file_id, ancestor_id, depth, path_chain) AS (
        SELECT id, id, 0, file_path
        FROM monitored_files
        WHERE is_original_marked = 1

        UNION ALL

        -- Рекурсивный случай: потомки
        SELECT
            fr.child_file_id,
            fc.ancestor_id,
            fc.depth + 1,
            fc.path_chain || ' -> ' || mf.file_path
        FROM file_chain fc
        JOIN file_relationships fr ON fc.file_id = fr.parent_file_id
        JOIN monitored_files mf ON fr.child_file_id = mf.id
    )
    SELECT * FROM file_chain;
`
})
export class FileChainView {
  @ViewColumn({ name: 'file_id' })
  fileId: number;

  @ViewColumn({ name: 'ancestor_id' })
  ancestorId: number;

  @ViewColumn()
  depth: number;

  @ViewColumn({ name: 'path_chain' })
  pathChain: string;
}