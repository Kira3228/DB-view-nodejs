import { getRepository, Like } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { log } from "console";
import { FileRelationship } from "../entities/file_relationships.entity";
import * as PDFDocument from 'pdfkit';

export class ActiveFilesService {
    private activeFileRepo = getRepository(MonitoredFile)
    private relationRepo = getRepository(FileRelationship)

    async getActiveFiles(
        filters: Partial<ActiveFileFilters>,
        page: number = 1,
        limit: number = 6
    ) {
        let queryBuilder = this.activeFileRepo
            .createQueryBuilder('file')
            .select([
                "file.id",
                "file.inode",
                "file.fileSize",
                "file.filePath",
                "file.minChainDepth",
                "file.maxChainDepth",
                "file.status"
            ]);

        if (filters.filePath) {
            queryBuilder.andWhere('file.filePath LIKE :filePath', {
                filePath: `%${filters.filePath}%`
            });
        }

        if (filters.inode) {
            queryBuilder.andWhere('file.inode = :inode', {
                inode: filters.inode
            });
        }

        const excludeFilePaths = this.toArray(filters.filePathException);
        const allParams: Record<string, any> = {};

        if (excludeFilePaths && excludeFilePaths.length > 0) {
            const fileConds: string[] = [];

            excludeFilePaths.forEach((path, idx) => {
                const param = `filePathExclude${idx}`;
                allParams[param] = `%${path.trim()}%`;
                fileConds.push(`file.filePath NOT LIKE :${param}`);
            });

            queryBuilder.andWhere(
                `(${fileConds.join(' AND ')})`,
                allParams
            );
        }

        const skipAmount = (page - 1) * limit;
        queryBuilder.skip(skipAmount).take(limit);

        const [files, totalCount] = await queryBuilder.getManyAndCount();

        return {
            files,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            limit
        };
    }

    async getArchive(
        filters: Partial<ActiveFileFilters>,
        page: number = 1,
        limit: number = 30
    ) {
        let queryBuilder = this.activeFileRepo
            .createQueryBuilder('file')
            .where('file.status IN (:...statuses)', {
                statuses: ['archived', 'deleted']
            });

        if (filters.filePath) {
            queryBuilder.andWhere('file.filePath LIKE :filePath', {
                filePath: `%${filters.filePath}%`
            });
        }

        if (filters.inode) {
            queryBuilder.andWhere('file.inode = :inode', {
                inode: filters.inode
            });
        }

        const excludeFilePaths = this.toArray(filters.filePathException);
        const allParams: Record<string, any> = {};

        if (excludeFilePaths && excludeFilePaths.length > 0) {
            const fileConds: string[] = [];

            excludeFilePaths.forEach((path, idx) => {
                const param = `filePathExclude${idx}`;
                allParams[param] = `%${path.trim()}%`;
                fileConds.push(`file.filePath NOT LIKE :${param}`);
            });

            queryBuilder.andWhere(
                `(${fileConds.join(' AND ')})`,
                allParams
            );
        }

        const skipAmount = (page - 1) * limit;
        queryBuilder.skip(skipAmount).take(limit);

        const [files, totalCount] = await queryBuilder.getManyAndCount();

        return {
            files,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            limit
        };
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

        const excludeFilePaths = this.toArray(filePathException);
        const allParams: Record<string, any> = {};

        if (excludeFilePaths && excludeFilePaths.length > 0) {

            const parentFileConds: string[] = [];
            const childFileConds: string[] = [];

            excludeFilePaths.forEach((path, idx) => {
                const parentParam = `parentFileExclude${idx}`;
                const childParam = `childFileExclude${idx}`;

                allParams[parentParam] = `%${path.trim()}%`;
                allParams[childParam] = `%${path.trim()}%`;

                parentFileConds.push(`parentFile.filePath NOT LIKE :${parentParam}`);
                childFileConds.push(`childFile.filePath NOT LIKE :${childParam}`);
            });

            query.andWhere(
                `(${parentFileConds.join(' AND ')})`,
                allParams
            );

            query.andWhere(
                `(${childFileConds.join(' AND ')})`,
                allParams
            );
        }

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

    private toArray(exception: string): string[] {
        if (!exception || exception.trim() === '') {
            return [];
        }

        const normalizedPath = exception
            .split('/')
            .map(part => part.trim())
            .filter(part => part.length > 0)
            .join('/')

        const result = normalizedPath
            .trimEnd()
            .split(";")
            .map(path => path.trim())
            .filter(path => path !== '');

        return result
    }
}



