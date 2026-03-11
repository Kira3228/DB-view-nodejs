import { Brackets, getRepository, Repository, SelectQueryBuilder } from "typeorm";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { ActiveFileConfigService } from "./active-file-config.service";
import { IDefaultFilters, IHeader } from "../shared/interfaces/common.interface";
import { ActiveFileDtoFilter } from "./dto/acrive-file.dto";
import { ChainsDto } from "./dto/chains.dto";
import { injectable, InjectionToken } from "tsyringe";


@injectable()
export class ActiveFilesService {
    constructor(
    ) {

    }

    // async getHeaders(presetName?: string): Promise<IHeader[]> {
    //     return this.configService.getHeaders(presetName)
    // }

    // async getPresetNames(): Promise<string[]> {
    //     return this.configService.getPresetNames()
    // }

    // async getFilters(presetName: string): Promise<IDefaultFilters> {
    //     return this.configService.getFilters(presetName)
    // }

    // async getExceptions(presetName: string) {
    //     try {
    //         const preset = this.configService.getPreset(presetName)
    //         return preset?.exceptions || {}
    //     }
    //     catch (error) {
    //         console.error(error);
    //         return {}
    //     }
    // }

    // async getActiveFile(dto: ActiveFileDtoFilter) {
    //     try {
    //         const skip = (Number(dto.page) - 1) * dto.limit

    //         const query = await this
    //             .activeFileRepo
    //             .createQueryBuilder(`file`)
    //             .skip(skip)
    //             .take(dto.limit)
    //             .select([
    //                 "file.id",
    //                 "file.inode",
    //                 "file.fileSize",
    //                 "file.filePath",
    //                 "file.minChainDepth",
    //                 "file.maxChainDepth",
    //                 "file.status"
    //             ])

    //         if (dto.isArchived === "archived") {
    //             query.where(`(file.status = :archived OR file.status = :deleted)`, {
    //                 archived: dto.isArchived,
    //                 deleted: `deleted`
    //             })
    //         }
    //         if (dto.search && dto.search.trim() !== '') {
    //             query.andWhere(
    //                 new Brackets((qb) => {
    //                     qb.where('file.filePath LIKE :search', { search: `${dto.search}%` })
    //                         .orWhere('CAST(file.inode AS TEXT) LIKE :search', { search: `${dto.search}%` });
    //                 })
    //             );
    //         }

    //         const [files, filesCount] = await query.getManyAndCount()

    //         const headers = await this.getHeaders(dto.presetName)

    //         return {
    //             headers,
    //             files,
    //             filesCount,
    //             totalPage: dto.limit > 0 ? Math.ceil(filesCount / dto.limit) : 0,
    //         }
    //     }
    //     catch (error) {
    //         console.error(error);
    //     }
    // }


    // async updateStatus(dto: UpdateStatusDto, id: number): Promise<MonitoredFile> {
    //     try {
    //         const result = await this.activeFileRepo.update({ id }, { status: dto.status })

    //         if (result.affected === 0) {
    //             throw new Error
    //         }

    //         const updatedFile = await this.activeFileRepo.findOne({ where: { id } })
    //         if (!updatedFile) {
    //             throw new Error
    //         }

    //         return updatedFile
    //     }
    //     catch (error) {
    //         console.error(error);
    //     }
    // }

    // async getFileChains() {
    //     const allChains = await this.fileChainsRepo.find()
    //     return allChains;

    // }

    // async getTreeNode(params: ChainsDto) {
    //     const qb = this.activeFileRepo.createQueryBuilder(`file`)

    //     if (params.id === 'all') {
    //         qb.where(`file.isOriginalMarked = :isOriginal`, { isOriginal: true })
    //     }
    //     else {
    //         qb.innerJoin(`file_relationships`, `rel`, `rel.child_file_id = file.id`)
    //             .where(`rel.parent_file_id = :pid`, { pid: params.id })
    //             .addSelect(`rel.relationship_type`, `relType`)
    //     }
    //     const files = await qb.getMany()

    //     const result = await Promise.all(files.map(async (file) => {
    //         const childrenCount = await this.relationRepo.count({
    //             where: { parentFileId: file.id }
    //         })

    //         return {
    //             id: file.id,
    //             name: file.filePath,
    //             hasChildren: childrenCount > 0,
    //             fileData: file
    //         };
    //     }))
    //     return { roots: result }
    // }
}