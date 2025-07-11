import { getRepository, Like } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";

export class ActiveFilesService {
    private activeFileRepo = getRepository(MonitoredFile)

    async getActiveFiles(
        filters: ActiveFileFilters,
        page: number = 1,
        limit: number = 30
    ) {
        const where: any = {}
        if (filters.filePath) {
            where.filePath = filters.filePath
        }
        if (filters.inode) {
            where.inode = filters.inode
        }

        const [files, totalCount] = await this.activeFileRepo.findAndCount({
            where,
            select: [
                "id",
                "inode",
                "fileSize",
                "filePath",
                "minChainDepth",
                "maxChainDepth",
                "status"
            ],
            skip: (page - 1) * limit,
            take: limit
        })
        return {
            files,
            totalCount,
            page,
            totalPage: Math.ceil(totalCount / limit),
            limit
        }
    }

    async getArchive(filters: ActiveFileFilters,
        page: number = 1,
        limit: number = 30) {
        const statusConditions = ['archived', 'deleted'].map((status) => ({
            ...this.buildWhereConditions(filters)
        }))
        const where = [...statusConditions]

        const [files, totalCount] = await this.activeFileRepo.findAndCount({
            where,
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit
        })
        return {
            files,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            limit
        }
    }

    private buildWhereConditions(filters: ActiveFileFilters) {
        const where: any = {}

        if (filters.filePath) {
            where.filePath = Like(`%${filters.filePath}`)
        }

        if (filters.inode) {
            where.inode = Like(`%${filters.inode}`)
        }

        return where
    }

    async updateStatus(dto: UpdateStatusDto, id: number) {
        const { status } = dto
        const file = await this.activeFileRepo.update({ id }, { status })

        if (file.affected === 0) {
            throw new Error(`Файл с ID ${id} не найден`);
        }
        return this.activeFileRepo.findOne({
            where: { id: id }
        })
    }
}