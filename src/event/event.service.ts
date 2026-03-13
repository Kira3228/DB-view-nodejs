import { inject, injectable, InjectionToken } from "tsyringe";
import { Repository } from "typeorm";
import {
  File,
  FileVersion,
  FileRead,
  FileWrite,
} from "../entities";
import { EventFilterDto } from "./dto/event-filter.dto";
import { FileReadRepositoryToken, FileRepositoryToken, FileVersionRepositoryToken, FileWriteRepositoryToken } from "../constants/tokens";





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
export class EventService {
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

  async getEvents(filter: EventFilterDto) {
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

    const wQb = this.fileWriteRepo
      .createQueryBuilder("fw")
      .leftJoinAndSelect("fw.file", "f")
      .leftJoinAndSelect("f.filesystem", "f_fs")
      .leftJoinAndSelect("f.originProcessVersion", "f_opv")
      .leftJoinAndSelect("fw.fileVersion", "fv")
      .leftJoinAndSelect("fw.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .leftJoinAndSelect("pv.originFile", "pv_of")
      .leftJoinAndSelect("pv_of.filesystem", "pv_of_fs");

    const applyFilters = (query: any, alias: string) => {
      if (filter.birthTime) query.andWhere("f.birth_time = :bt", { bt: filter.birthTime });
      if (filter.status) query.andWhere("f.status = :st", { st: filter.status });
      if (filter.filesystemId) query.andWhere("f_fs.uuid = :fsId", { fsId: filter.filesystemId });
      if (filter.trackingStartedAt) query.andWhere("f.tracking_started_at = :tsa", { tsa: filter.trackingStartedAt });
      if (filter.osUserId) query.andWhere("u.username = :uname", { uname: filter.osUserId });
      if (filter.process) query.andWhere("p.executable_path LIKE :proc", { proc: `%${filter.process}%` });
      if (filter.versionNumber) query.andWhere("fv.version_number = :vnum", { vnum: filter.versionNumber });
      if (filter.firstAt) query.andWhere(`${alias}.first_at >= :first`, { first: filter.firstAt });
      if (filter.executablePath) query.andWhere(`${alias}.executable_path LIKE :epath`, { epath: `%${filter.executablePath}%` });
    };

    applyFilters(qb, "fr");
    applyFilters(wQb, "fw");

    const [reads, writes] = await Promise.all([
      (!filter.operationType || filter.operationType === 'read') ? qb.getMany() : Promise.resolve([]),
      (!filter.operationType || filter.operationType === 'write') ? wQb.getMany() : Promise.resolve([]),
    ]);

    return [
      ...reads.map(r => ({ type: "read" as const, ...this.mapFileRead(r) })),
      ...writes.map(w => ({ type: "write" as const, ...this.mapFileRead(w as any) })),
    ].sort((a, b) => new Date(b.firstAt).getTime() - new Date(a.firstAt).getTime());
  }

  private mapFileRead(row: FileRead | FileWrite) {
    return {
      fileId: row.file?.id ?? null,
      filePath: row.file?.full_path ?? null,
      fileVersion: row.fileVersion?.version_number ?? null,
      processVersionId: row.processVersion?.id ?? null,
      process: row.processVersion?.process?.executable_path
        ?.split("/").pop() ?? null,
      processVersion: row.processVersion?.version_number ?? null,
      user: row.processVersion?.process?.osUser?.username ?? null,
      uid: row.processVersion?.process?.osUser?.uid ?? null,
      originFile: row.processVersion?.originFile?.full_path ?? null,
      filesystem: row.file?.filesystem?.uuid ?? null,
      depth: row.fileVersion?.depth ?? null,
      firstAt: row.first_at,
      lastAt: row.last_at ?? null,
      count: row.count,
      initialSizeBytes: row.file.initial_size_bytes,
      trackingStartAt: row.file.tracking_started_at,
      deletedAt: row.file.deleted_at,
      iNode: row.file.inoGen,
    };
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


}