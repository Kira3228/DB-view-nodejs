import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  name: "v_file_chains",
  synchronize: false
})
export class FileChainsView {
  @ViewColumn()
  file_id: number

  @ViewColumn()
  ancestor_id: number;

  @ViewColumn()
  depth: number;

  @ViewColumn()
  path_chain: string;
}