import { getRepository } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { FileRelationship } from "../entities/file_relationships.entity";
import { applyNotLikeList, parsePathException } from "../utils/query-uteils";

export class ActiveFilesService {
    private activeFileRepo = getRepository(MonitoredFile)
    private relationRepo = getRepository(FileRelationship)

    private applyCommonFilters(
        qb: ReturnType<typeof this.activeFileRepo.createQueryBuilder>,
        filters: Partial<ActiveFileFilters>
    ) {
        if (filters.filePath) {
            qb.andWhere('file.filePath LIKE :filePath', { filePath: `%${filters.filePath}%` });
        }

        if (filters.inode) {
            qb.andWhere('file.inode = :inode', { inode: filters.inode });
        }

        const excludeFilePaths = parsePathException(filters.filePathException);
        applyNotLikeList(qb, 'file', `filePath`, excludeFilePaths, `both`)
    }

    private buildFilesBaseQuery(
        filters: Partial<ActiveFileFilters>,
        selectFields = true,
        statusesOverride?: Array<'active' | 'archived' | 'deleted'>
    ) {
        const qb = this.activeFileRepo.createQueryBuilder('file');

        if (selectFields) {
            qb.select([
                "file.id",
                "file.inode",
                "file.fileSize",
                "file.filePath",
                "file.minChainDepth",
                "file.maxChainDepth",
                "file.status"
            ]);
        }

        if (statusesOverride && statusesOverride.length > 0) {
            qb.andWhere('file.status IN (:...statuses)', { statuses: statusesOverride });
        }

        this.applyCommonFilters(qb, filters);

        return qb;
    }

    private toArray(exception: string): string[] {
        if (!exception || exception.trim() === '') return [];
        return exception.split(';').map(path => path.trim()).filter(Boolean);
    }

    async getActiveFiles(
        filters: Partial<ActiveFileFilters>,
        page: number = 1,
        limit: number = 6,
        statusesOverride?: Array<'active' | 'archived' | 'deleted'>
    ) {
        const qb = this.buildFilesBaseQuery(filters, true, statusesOverride);

        const skipAmount = (page - 1) * limit;
        qb.skip(skipAmount).take(limit);

        const [files, totalCount] = await qb.getManyAndCount();

        return {
            files,
            totalCount,
            page,
            totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 0,
            limit
        };
    }

    async getArchive(filters: Partial<ActiveFileFilters>, page: number = 1, limit: number = 30) {
        return this.getActiveFiles(filters, page, limit, ['archived', 'deleted']);
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

    async graph(filePath?: string, inode?: number, filePathException?: string) {
        const query = this.relationRepo
            .createQueryBuilder('relation')
            .leftJoinAndSelect('relation.parentFile', 'parentFile')
            .leftJoinAndSelect('relation.childFile', 'childFile');

        if (filePath) {
            query.andWhere('parentFile.filePath LIKE :filePath', {
                filePath: `%${filePath}%`
            });
        }

        if (inode) {
            query.andWhere('parentFile.inode = :inode', { inode });
        }

        const excludeFilePaths = parsePathException(filePathException);
        applyNotLikeList(query, 'parentFile', 'filePath', excludeFilePaths, 'both');
        applyNotLikeList(query, 'childFile', 'filePath', excludeFilePaths, 'both');


        const rels = await query.getMany();

        const groupedRelations = rels.reduce((acc, rel) => {
            const parentId = rel.parentFileId.toString();

            if (!acc[parentId]) {
                acc[parentId] = {
                    parentFile: rel.parentFile,
                    children: []
                };
            }

            acc[parentId].children.push({
                relationshipType: rel.relationshipType,
                childFile: rel.childFile,
                createdAt: rel.createdAt
            });

            return acc;
        }, {});

        return groupedRelations;
    }
}
