import { inject, injectable, InjectionToken } from "tsyringe";
import { Repository } from "typeorm";
import {
  File,
  FileVersion,
  FileRead,
  FileWrite,
} from "../entities";


export const FileReadServiceToken: InjectionToken<FileReadService> =
  "FileReadServiceToken";

export const FileReadRepositoryToken: InjectionToken<Repository<FileRead>> =
  "FileReadRepositoryToken";

export const FileWriteRepositoryToken: InjectionToken<Repository<FileWrite>> =
  "FileWriteRepositoryToken";

export const FileRepositoryToken: InjectionToken<Repository<File>> =
  "FileRepositoryToken";

export const FileVersionRepositoryToken: InjectionToken<Repository<FileVersion>> =
  "FileVersionRepositoryToken";


export interface GetFilesFilter {
  filesystemId?: number;
  deleted?: boolean;
}

export interface GetFileVersionsFilter {
  fileId?: number;
  originProcessVersionId?: number;
  depth?: number;
}

export interface GetOpsFilter {
  fileId?: number;
  processVersionId?: number;
  from?: Date;
  to?: Date;
}


@injectable()
export class FileReadService {
  constructor(
    @inject(FileReadRepositoryToken)
    private readonly fileReadRepo: Repository<FileRead>,

    @inject(FileWriteRepositoryToken)
    private readonly fileWriteRepo: Repository<FileWrite>,

    @inject(FileRepositoryToken)
    private readonly fileRepo: Repository<File>,

    @inject(FileVersionRepositoryToken)
    private readonly fileVersionRepo: Repository<FileVersion>,
  ) { }


  async getFiles(filter: GetFilesFilter = {}) {
    const qb = this.fileRepo
      .createQueryBuilder("f")
      .leftJoinAndSelect("f.filesystem", "fs");

    if (filter.filesystemId !== undefined) {
      qb.andWhere("f.filesystem_id = :fsId", { fsId: filter.filesystemId });
    }

    if (filter.deleted === true) {
      qb.andWhere("f.deleted_at IS NOT NULL");
    } else if (filter.deleted === false) {
      qb.andWhere("f.deleted_at IS NULL");
    }

    qb.orderBy("f.tracking_started_at", "DESC");

    return qb.getMany();
  }

  async getFileById(id: number) {
    return this.fileRepo
      .createQueryBuilder("f")
      .leftJoinAndSelect("f.filesystem", "fs")
      .leftJoinAndSelect("f.versions", "fv")
      .leftJoinAndSelect("fv.originProcessVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .where("f.id = :id", { id })
      .getOne();
  }

  async getFileVersions(filter: GetFileVersionsFilter = {}) {
    const qb = this.fileVersionRepo
      .createQueryBuilder("fv")
      .leftJoinAndSelect("fv.file", "f")
      .leftJoinAndSelect("fv.originProcessVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u");

    if (filter.fileId !== undefined) {
      qb.andWhere("fv.file_id = :fileId", { fileId: filter.fileId });
    }

    if (filter.originProcessVersionId !== undefined) {
      qb.andWhere("fv.origin_process_version_id = :pvId", {
        pvId: filter.originProcessVersionId,
      });
    }

    if (filter.depth !== undefined) {
      qb.andWhere("fv.depth <= :depth", { depth: filter.depth });
    }

    qb.orderBy("fv.created_at", "DESC");

    return qb.getMany();
  }

  async getFileVersionById(id: number) {
    return this.fileVersionRepo
      .createQueryBuilder("fv")
      .leftJoinAndSelect("fv.file", "f")
      .leftJoinAndSelect("fv.originProcessVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .where("fv.id = :id", { id })
      .getOne();
  }

  async getFileRead(filter: GetOpsFilter = {}) {
    const qb = this.fileReadRepo
      .createQueryBuilder("fr")
      .leftJoinAndSelect("fr.file", "f")
      .leftJoinAndSelect("f.filesystem", "f_fs")
      .leftJoinAndSelect("f.originProcessVersion", "f_opv")
      .leftJoinAndSelect("fr.fileVersion", "fv")
      .leftJoinAndSelect("fr.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .leftJoinAndSelect("pv.originFile", "pv_of")
      .leftJoinAndSelect("pv_of.filesystem", "pv_of_fs");


    console.log(qb.getSql());

    if (filter.fileId !== undefined) {
      qb.andWhere("fr.file_id = :fileId", { fileId: filter.fileId });
    }

    if (filter.processVersionId !== undefined) {
      qb.andWhere("fr.process_version_id = :pvId", {
        pvId: filter.processVersionId,
      });
    }

    if (filter.from !== undefined) {
      qb.andWhere("fr.first_at >= :from", { from: filter.from });
    }

    if (filter.to !== undefined) {
      qb.andWhere("fr.first_at <= :to", { to: filter.to });
    }

    qb.orderBy("fr.first_at", "DESC");

    return qb.getMany();
  }

  async debug(fileId: number, processVersionId: number) {
    // Проверяем что лежит в БД по FK
    const manager = this.fileRepo.manager;
    return manager.query(`
    SELECT
      f.filesystem_id,
      pv.process_id,
      pv.origin_file_id,
      p.os_user_id
    FROM file_reads fr
    LEFT JOIN files f ON f.id = fr.file_id
    LEFT JOIN process_versions pv ON pv.id = fr.process_version_id
    LEFT JOIN processes p ON p.id = pv.process_id
    WHERE fr.file_id = ? AND fr.process_version_id = ?
  `, [fileId, processVersionId]);
  }

  async debugSchema() {
    const manager = this.fileRepo.manager;

    const pvCols = await manager.query(`PRAGMA table_info(process_versions)`);
    const procCols = await manager.query(`PRAGMA table_info(processes)`);
    const filesCols = await manager.query(`PRAGMA table_info(files)`);

    return { process_versions: pvCols, processes: procCols, files: filesCols };
  }

  async debugInsert() {
    const manager = this.fileRepo.manager;

    // Пишем одну запись напрямую
    await manager.query(
      `UPDATE files SET filesystem_id = 1 WHERE id = 1`
    );
    await manager.query(
      `UPDATE processes SET os_user_id = 1 WHERE id = 1`
    );
    await manager.query(
      `UPDATE process_versions SET process_id = 1, origin_file_id = 1 WHERE id = 1`
    );

    // Проверяем
    return manager.query(`
    SELECT f.id, f.filesystem_id, p.os_user_id, pv.process_id, pv.origin_file_id
    FROM files f, processes p, process_versions pv
    WHERE f.id = 1 AND p.id = 1 AND pv.id = 1
  `);
  }

  async getFileReadByPk(fileId: number, processVersionId: number) {
    return this.fileReadRepo
      .createQueryBuilder("fr")
      .leftJoinAndSelect("fr.file", "f")
      .leftJoinAndSelect("fr.fileVersion", "fv")
      .leftJoinAndSelect("fr.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .where("fr.file_id = :fileId", { fileId })
      .andWhere("fr.process_version_id = :pvId", { pvId: processVersionId })
      .getOne();
  }

  async getFileWrite(filter: GetOpsFilter = {}) {
    const qb = this.fileWriteRepo
      .createQueryBuilder("fw")
      .leftJoinAndSelect("fw.file", "f")
      .leftJoinAndSelect("fw.fileVersion", "fv")
      .leftJoinAndSelect("fw.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u");

    if (filter.fileId !== undefined) {
      qb.andWhere("fw.file_id = :fileId", { fileId: filter.fileId });
    }

    if (filter.processVersionId !== undefined) {
      qb.andWhere("fw.process_version_id = :pvId", {
        pvId: filter.processVersionId,
      });
    }

    if (filter.from !== undefined) {
      qb.andWhere("fw.first_at >= :from", { from: filter.from });
    }

    if (filter.to !== undefined) {
      qb.andWhere("fw.first_at <= :to", { to: filter.to });
    }

    qb.orderBy("fw.first_at", "DESC");

    return qb.getMany();
  }

  async getFileWriteByPk(fileId: number, processVersionId: number) {
    return this.fileWriteRepo
      .createQueryBuilder("fw")
      .leftJoinAndSelect("fw.file", "f")
      .leftJoinAndSelect("fw.fileVersion", "fv")
      .leftJoinAndSelect("fw.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .where("fw.file_id = :fileId", { fileId })
      .andWhere("fw.process_version_id = :pvId", { pvId: processVersionId })
      .getOne();
  }

  async getFileChain(rootFileId: number, maxDepth?: number) {
    const rootFile = await this.fileRepo.findOne(rootFileId);
    if (!rootFile) return null;

    const queue: Array<{ fileId: number; depth: number }> = [
      { fileId: rootFileId, depth: 0 },
    ];
    const visitedFiles = new Set<number>([rootFileId]);

    const nodes: Array<{
      type: "file" | "process_version";
      id: number;
      depth: number;
      data: unknown;
    }> = [];

    const edges: Array<{
      from: string;
      to: string;
      relation: "read" | "write";
    }> = [];

    while (queue.length > 0) {
      const { fileId, depth } = queue.shift()!;

      if (maxDepth !== undefined && depth >= maxDepth) continue;

      const reads = await this.fileReadRepo
        .createQueryBuilder("fr")
        .leftJoinAndSelect("fr.processVersion", "pv")
        .leftJoinAndSelect("pv.process", "p")
        .leftJoinAndSelect("p.osUser", "u")
        .where("fr.file_id = :fileId", { fileId })
        .getMany();

      for (const read of reads) {
        const pv = read.processVersion;
        const pvNodeId = `pv_${pv.id}`;
        nodes.push({ type: "process_version", id: pv.id, depth: depth + 1, data: pv });
        edges.push({ from: `f_${fileId}`, to: pvNodeId, relation: "read" });

        const writtenVersions = await this.fileVersionRepo
          .createQueryBuilder("fv")
          .leftJoinAndSelect("fv.file", "f")
          .where("fv.origin_process_version_id = :pvId", { pvId: pv.id })
          .getMany();

        for (const fv of writtenVersions) {
          const childFileId = fv.file.id;
          edges.push({ from: pvNodeId, to: `f_${childFileId}`, relation: "write" });

          if (!visitedFiles.has(childFileId)) {
            visitedFiles.add(childFileId);
            nodes.push({
              type: "file",
              id: childFileId,
              depth: depth + 2,
              data: fv.file,
            });
            queue.push({ fileId: childFileId, depth: depth + 2 });
          }
        }
      }
    }



    return {
      root: rootFile,
      nodes,
      edges,
    };
  }

  async seedDatabase(count: number = 1000) {
    const manager = this.fileRepo.manager;
    await manager.query('PRAGMA foreign_keys = OFF');

    try {
      console.time("Seed Duration");

      // Чистим
      await manager.query('DELETE FROM file_writes');
      await manager.query('DELETE FROM file_reads');
      await manager.query('DELETE FROM file_versions');
      await manager.query('DELETE FROM process_versions');
      await manager.query('DELETE FROM processes');
      await manager.query('DELETE FROM files');
      await manager.query('DELETE FROM os_users');
      await manager.query('DELETE FROM filesystems');

      // 1. Filesystems
      await manager.query(`INSERT INTO filesystems (id, uuid) VALUES (1, '550e8400-e29b-41d4-a716-446655440000')`);
      await manager.query(`INSERT INTO filesystems (id, uuid) VALUES (2, '6ba7b811-9dad-11d1-80b4-00c04fd430c8')`);

      // 2. OS Users
      await manager.query(`INSERT INTO os_users (id, uid, gid, username, home_directory, shell, full_name) VALUES (1, 0, 0, 'root', '/root', '/bin/bash', 'Superuser')`);
      await manager.query(`INSERT INTO os_users (id, uid, gid, username, home_directory, shell, full_name) VALUES (2, 1000, 1000, 'node_user', '/home/node', '/bin/sh', 'App Runner')`);

      // 3. Files
      for (let i = 1; i <= count; i++) {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(i, 0);
        await manager.query(
          `INSERT INTO files
           (id, filesystem_id, filehandle, full_path, initial_size_bytes, birth_time, tracking_started_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            i,
            (i % 2) + 1,
            buf,
            `/var/www/uploads/doc_${i}.pdf`,
            Math.floor(Math.random() * 5000000),
            new Date().toISOString(),
            new Date().toISOString(),
            i % 50 === 0 ? new Date().toISOString() : null,
          ]
        );
      }

      // 4. Processes
      for (let i = 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO processes
           (id, pid, executable_path, arguments, parent_pid, os_user_id, group_id, environment, process_start_time, process_exit_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            i,
            Math.floor(Math.random() * 60000) + 1,
            `/usr/local/bin/worker-${i % 5}`,
            `--mode=active --thread=${i}`,
            1,
            (i % 2) + 1,
            1000,
            'NODE_ENV=production;DEBUG=false',
            new Date().toISOString(),
            null,
          ]
        );
      }

      // 5. Process Versions
      for (let i = 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO process_versions
           (id, process_id, version_number, origin_file_id, working_directory, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            i,
            i,
            1,
            Math.floor(Math.random() * count) + 1,
            `/home/user/project_${i}`,
            new Date().toISOString(),
          ]
        );
      }

      // 6. File Versions
      for (let i = 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO file_versions
           (id, file_id, version_number, origin_process_version_id, depth, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            i,
            i,
            1,
            Math.floor(Math.random() * count) + 1,
            Math.floor(Math.random() * 10),
            new Date().toISOString(),
          ]
        );
      }

      // 7. File Reads
      for (let i = 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO file_reads
           (file_id, process_version_id, file_version_id, count, first_at, last_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            i,
            Math.floor(Math.random() * count) + 1,
            i,
            Math.floor(Math.random() * 100) + 1,
            new Date(Date.now() - Math.random() * 86400000).toISOString(),
            new Date().toISOString(),
          ]
        );
      }

      // 8. File Writes
      for (let i = 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO file_writes
           (file_id, process_version_id, file_version_id, count, first_at, last_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            Math.floor(Math.random() * count) + 1,
            i,
            i,
            Math.floor(Math.random() * 20) + 1,
            new Date(Date.now() - Math.random() * 86400000).toISOString(),
            new Date().toISOString(),
          ]
        );
      }

      console.timeEnd("Seed Duration");
      console.log(`✅ Seeded ${count * 7} records.`);

    } finally {
      await manager.query('PRAGMA foreign_keys = ON');
    }
  }

  private async batchUpdate(manager: any, sql: string, data: any[], size = 500) {
    for (let i = 0; i < data.length; i += size) {
      const chunk = data.slice(i, i + size);
      for (const row of chunk) {
        await manager.query(sql, row);
      }
    }
  }

  private async batchInsert(manager: any, table: string, data: any[], size = 500) {
    for (let i = 0; i < data.length; i += size) {
      const chunk = data.slice(i, i + size);
      for (const row of chunk) {
        const keys = Object.keys(row);
        const cols = keys.join(", ");
        const params = keys.map(() => `?`).join(", ");
        const vals = keys.map(k => {
          const v = row[k];
          if (v instanceof Buffer) return v;
          if (v instanceof Date) return v.toISOString();
          return v;
        });
        await manager.query(
          `INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${params})`,
          vals,
        );
      }
    }
  }
}