import { getRepository } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { FileRelationship } from "../entities/file_relationships.entity";
import { applyNotLikeList, parsePathExceptions } from "../utils/query-utils";
import { paginate } from "../utils/pagination";
import { INode } from "./graph.type";

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

        const excludeFilePaths = parsePathExceptions(filters.filePathException);
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

    async getActiveFiles(
        filters: Partial<ActiveFileFilters>,
        page: number = 1,
        limit: number = 30,
        statusesOverride?: Array<'active' | 'archived' | 'deleted'>
    ) {
        const qb = this.buildFilesBaseQuery(filters, true, statusesOverride);
        return paginate(qb, page, limit, `files`);
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

        const excludeFilePaths = parsePathExceptions(filePathException);
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

    async relationGraph(filePath?: string, inode?: number, filePathException?: string) {
        const qb = this.relationRepo
            .createQueryBuilder(`rel`)
            .leftJoinAndSelect(`rel.parentFile`, `parent`)
            .leftJoinAndSelect(`rel.childFile`, `child`)

        if (filePath) {
            qb.andWhere(`parent.filePath LIKE :fp`, { fp: `%${filePath}` })
        }
        if (inode) {
            qb.andWhere(`parent.inode = :inode`, { inode })
        }

        const excl = parsePathExceptions(filePathException)
        applyNotLikeList(qb, `parent`, `filePath`, excl, `both`)
        applyNotLikeList(qb, `child`, `filePath`, excl, `both`)

        const relations = await qb.getMany()

        const nodes = new Map<number, INode>()

        const getNode = (file: MonitoredFile): INode => {
            let n = nodes.get(file.id)
            if (!n) {
                n = { file: file, edges: [] }
                nodes.set(file.id, n);
            }
            return n
        }

        const hasParent = new Set<number>()

        for (const rel of relations) {
            const from = getNode(rel.parentFile)
            const to = getNode(rel.childFile)

            from.edges.push(
                {
                    type: rel.relationshipType,
                    to: to,
                    createdAt: rel.createdAt
                }
            )
            hasParent.add(rel.childFileId);

        }

        const resultRelations = [...nodes.values()].filter(n => !hasParent.has(n.file.id));
        return {
            relations,
            resultRelations
        }

    }
}
