import { getRepository, Like } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { log } from "console";
import { FileRelationship } from "../entities/file_relationships.entity";



export class ActiveFilesService {
    private activeFileRepo = getRepository(MonitoredFile)
    private relationRepo = getRepository(FileRelationship)

    async getActiveFiles(
        filters: ActiveFileFilters,
        page: number = 1,
        limit: number = 30
    ) {
        const where: any = {}
        if (filters.filePath) {
            where.filePath = Like(`%${filters.filePath}%`)
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
            status,
            ...this.buildWhereConditions(filters)
        }))

        const where = [...statusConditions];

        const [files, totalCount] = await this.activeFileRepo.findAndCount({
            where,
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit
        })
        log(files, totalCount, { totalPages: Math.ceil(totalCount / limit), }, page, limit)
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
            where.filePath = Like(`%${filters.filePath}%`)
        }
        log(filters.filePath)
        if (filters.inode) {
            where.inode = Like(`%${filters.inode}%`)
        }
        log(where)
        return where
    }

    async updateStatus(dto: UpdateStatusDto, id: number) {
        const { status } = dto
        log(status, id)
        const file = await this.activeFileRepo.update({ id }, { status })

        if (file.affected === 0) {
            throw new Error(`Файл с ID ${id} не найден`);
        }
        return this.activeFileRepo.findOne({
            where: { id: id }
        })
    }

    async graph(filePath?: string, inode?: number) {
        const query = this.relationRepo
            .createQueryBuilder('relation')
            .leftJoinAndSelect('relation.parentFile', 'parentFile')
            .leftJoinAndSelect('relation.childFile', 'childFile');

        // Добавляем условия фильтрации
        if (filePath) {
            query.andWhere('parentFile.filePath LIKE :filePath', {
                filePath: `%${filePath}%`
            });
        }

        if (inode) {
            query.andWhere('parentFile.inode = :inode', { inode });
        }


        log(query)
        // const rels = await this.relationRepo.find({
        //     relations: ['parentFile', 'childFile'],
        //     where
        // });
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

    async generatePDFreport() {

    }

}



