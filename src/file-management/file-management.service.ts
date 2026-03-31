import { inject, injectable } from "tsyringe";
import { Repository } from "typeorm";
import { FileRepositoryToken } from "../constants/tokens";
import { EventFilterDto } from "../event/dto/event-filter.dto";
import { File } from "../entities";

@injectable()
export class FileManagementService {
  constructor(
    @inject(FileRepositoryToken)
    private readonly filesRepo: Repository<File>
  ) { }


  async getFiles(filter?: EventFilterDto) {
    const qb = this.filesRepo.createQueryBuilder("f")
      .leftJoinAndSelect("f.filesystem", "fs")
      .leftJoinAndSelect("f.originProcessVersion", "opv")
      .leftJoinAndSelect("opv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .leftJoinAndSelect("f.versions", "fv");

    if (filter?.status) {
      qb.andWhere("f.status = :status", { status: filter.status });
    }

    if (filter?.filesystemId) {
      qb.andWhere("fs.uuid = :fsId", { fsId: filter.filesystemId });
    }

    if (filter?.trackingStartedAt) {
      qb.andWhere("f.tracking_started_at = :tsa", { tsa: filter.trackingStartedAt });
    }

    if (filter?.birthTime) {
      qb.andWhere("f.birth_time = :bt", { bt: filter.birthTime });
    }

    if (filter?.fileType) {
      if (filter?.fileType === 'origin') {
        qb.andWhere("f.origin_process_version_id IS NULL");
      } else if (filter?.fileType === 'intermediate') {
        qb.andWhere("f.origin_process_version_id IS NOT NULL");
      }
    }

    if (filter?.versionNumber) {
      qb.andWhere("fv.version_number = :vnum", { vnum: filter.versionNumber });
    }

    if (filter?.osUserId) {
      qb.andWhere("u.username = :uname", { uname: filter.osUserId });
    }

    if (filter?.process) {
      qb.andWhere("p.executable_path LIKE :proc", { proc: `%${filter.process}%` });
    }

    if (filter?.searchTerm) {
      qb.andWhere(
        `(LOWER(f.full_path) LIKE LOWER(:search) 
      OR CAST(f.inoGen AS TEXT) LIKE :search)`,
        { search: `%${filter.searchTerm}%` }
      );
    }

    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 14;

    const [items, total] = await qb
      .orderBy("f.tracking_started_at", "DESC")
      .skip((page - 1) * limit)   
      .take(limit)
      .getManyAndCount();

    const mappedFile = items.map(file => this.mapFile(file));

    return {
      data: mappedFile,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapFile(file: File) {
    return {
      id: file.id,
      path: file.full_path,
      filesystem: file.filesystem?.uuid ?? null,
      status: file.status ?? null,
      trackingStartedAt: file.tracking_started_at,
      birthTime: file.birth_time,
      size: file.initial_size_bytes,
      originProcess: file.originProcessVersion?.process?.executable_path?.split("/").pop() ?? 'system',
      user: file.originProcessVersion?.process?.osUser?.username ?? 'root',
      inode: file.inoGen ?? null
    };
  }
}