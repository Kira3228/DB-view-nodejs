import { getRepository, Repository, SelectQueryBuilder } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { FileRelationship } from "../entities/file_relationships.entity";
import { applyNotLikeList } from "../shared/utils/query-utils";
import { ActiveFileConfigService } from "./active-file-config.service";
import { ActiveFileFilters, GraphEdge, RelationshipGraph } from "./interfaces/active-file.interface";
import { IHeader, PaginatedResult } from "../shared/interfaces/common.interface";
import { paginate } from "../shared/utils/pagination";

export class ActiveFilesService {
    private readonly activeFileRepo: Repository<MonitoredFile>
    private readonly relationRepo: Repository<FileRelationship>
    private readonly configService: ActiveFileConfigService

    constructor() {
        this.activeFileRepo = getRepository(MonitoredFile)
        this.relationRepo = getRepository(FileRelationship)
        this.configService = new ActiveFileConfigService()
    }

    async getHeaders(presetName?: string): Promise<IHeader[]> {
        return this.configService.getHeaders(presetName)
    }

    async getPresetNames(): Promise<string[]> {
        return this.configService.getPresetNames()
    }

    async getFilters(presetName: string): Promise<Record<string, any>> {
        return this.configService.getFilters(presetName)
    }

    async getExceptions(presetName: string) {
        try {
            const preset = this.configService.getPreset(presetName)
            return preset?.exceptions || {}
        }
        catch (error) {
            console.error(error);
            return {}
        }
    }

    async getActiveFile(filters: ActiveFileFilters): Promise<PaginatedResult<MonitoredFile>> {
        try {
            const qb = this.createBaseQuery()
            this.applyFilters(qb, filters)
            this.applyStatusFilter(qb, [`active`])
            return await this.paginateQuery(qb, filters)
        }
        catch (error) {
            console.error(error);
        }
    }

    async getArchivedFile(filters: ActiveFileFilters): Promise<PaginatedResult<MonitoredFile>> {
        try {
            const qb = this.createBaseQuery()
            this.applyFilters(qb, filters)
            this.applyStatusFilter(qb, [`archived`, "deleted"])
            return await this.paginateQuery(qb, filters)
        }
        catch (error) {
            console.error(error);
        }
    }

    async updateStatus(dto: UpdateStatusDto, id: number): Promise<MonitoredFile> {
        try {
            const result = await this.activeFileRepo.update({ id }, { status: dto.status })

            if (result.affected === 0) {
                throw new Error
            }

            const updatedFile = await this.activeFileRepo.findOne({ where: { id } })
            if (!updatedFile) {
                throw new Error
            }

            return updatedFile
        }
        catch (error) {
            console.error(error);
        }
    }

    async relationGraph(
        filePath?: string,
        inode?: number,
        filePathException?: string,
        presetName?: string): Promise<RelationshipGraph> {
        try {
            const qb = this.createRelationshipQuery()
            this.applyRelationshipFilters(qb, { filePath, inode, presetName, filePathException })

            const relations = await qb.getMany()
            return this.processRelations(relations)
        } catch (error) {
            console.error(error);
        }
    }

    private createRelationshipQuery(): SelectQueryBuilder<FileRelationship> {
        return this.relationRepo
            .createQueryBuilder(`rel`)
            .leftJoinAndSelect(`rel.parentFile`, `parent`)
            .leftJoinAndSelect(`rel.childFile`, `child`)
    }

    private createBaseQuery(): SelectQueryBuilder<MonitoredFile> {
        return this.activeFileRepo.createQueryBuilder(`file`)
            .select([
                "file.id",
                "file.inode",
                "file.fileSize",
                "file.filePath",
                "file.minChainDepth",
                "file.maxChainDepth",
                "file.status"
            ])
    }

    private applyFilters(qb: SelectQueryBuilder<MonitoredFile>, filters: ActiveFileFilters): void {
        if (filters.filePath?.trim()) {
            qb.andWhere(`file.filePath LIKE :filePath`, {
                filePath: `%${filters.filePath.trim()}%`
            })
        }

        if (filters.inode && Number.isFinite(filters.inode)) {
            qb.andWhere(`file.inode = :inode`, { inode: filters.inode })
        }

        this.applyPresetExceptions(qb, filters.presetName)

        if (filters.filePathException?.length) {
            applyNotLikeList(qb, `file`, `filePath`, filters.filePathException, `both`)
        }

        if (filters.processPathException?.length) {
            applyNotLikeList(qb, `file`, `processPath`, filters.processPathException, `both`)
        }

    }

    private applyPresetExceptions(qb: SelectQueryBuilder<MonitoredFile>, presetName?: string): void {
        if (!presetName) { return }

        try {
            const filePathExceptions = this.configService.getFieldExceptions(presetName, `filePath`)
            if (filePathExceptions.length > 0) {
                applyNotLikeList(qb, `file`, `filePath`, filePathExceptions, `both`)
            }

            const inodeExceptions = this.configService.getFieldExceptions(presetName, `inode`)
            if (inodeExceptions.length > 0) {
                applyNotLikeList(qb, `file`, `inode`, inodeExceptions, `both`)
            }
        }
        catch (error) {
            console.error(error);

        }
    }
    private applyCommonFilters(
        qb: ReturnType<typeof this.activeFileRepo.createQueryBuilder>,
        filters: Partial<ActiveFileFilters>
    ): void {
        if (filters.filePath) {
            qb.andWhere('file.filePath LIKE :filePath', { filePath: `%${filters.filePath}%` });
        }

        if (filters.inode) {
            qb.andWhere('file.inode = :inode', { inode: filters.inode });
        }
    }

    private applyStatusFilter(
        qb: SelectQueryBuilder<MonitoredFile>,
        statuses: Array<'active' | 'archived' | 'deleted'>
    ): void {
        if (statuses.length > 0) {
            qb.andWhere(`file.status IN (:...statuses)`, { statuses })
        }
    }

    private applyRelationshipFilters(
        qb: SelectQueryBuilder<FileRelationship>,
        params: { filePath?: string; inode?: number; filePathException?: string; presetName?: string }
    ): void {
        if (params.filePath?.trim()) {
            qb.andWhere(`parent.filePath LIKE :fp`, { fp: `%${params.filePath.trim()}%` })
        }

        if (params.inode && Number.isFinite(params.inode)) {
            qb.andWhere(`parant.inode = :inode`, { inode: params.inode })
        }

        if (params.presetName) {
            const excludeFilePaths = this.configService
                .getFieldExceptions(params.presetName, `filePath`)
            if (excludeFilePaths.length > 0) {
                applyNotLikeList(qb, `parent`, `filePath`, excludeFilePaths, `both`)
                applyNotLikeList(qb, `child`, `filePath`, excludeFilePaths, `both`)
            }
        }

        if (params.filePathException) {
            const exceptions = params.filePathException.split(`;`).filter(Boolean)
            if (exceptions.length > 0) {
                applyNotLikeList(qb, 'parent', 'filePath', exceptions, 'both');
                applyNotLikeList(qb, 'child', 'filePath', exceptions, 'both');
            }
        }
    }

    private async paginateQuery(
        qb: SelectQueryBuilder<MonitoredFile>,
        filters: ActiveFileFilters
    ): Promise<PaginatedResult<MonitoredFile>> {
        const page = Math.max(1, filters.page || 1)
        const limit = Math.min(100, Math.max(1, filters.limit || 30))

        return await paginate(qb, page, limit, `files`)
    }

    private processRelations(relations: FileRelationship[]): RelationshipGraph {
        const nodes = new Map<number, any>
        const edges: GraphEdge[] = []
        const edgeKeys = new Set<string>()
        const hasParent = new Set<number>()

        const normalizedString = (s?: string) => (s ?? ``).trim().toLowerCase()

        for (const rel of relations) {
            const fromId = rel.parentFileId
            const toId = rel.childFileId

            if (!nodes.has(fromId)) {
                nodes.set(fromId, rel.parentFile)
            }

            if (!nodes.has(toId)) {
                nodes.set(toId, rel.childFile)
            }

            const key = `${fromId}-${toId}-${normalizedString(rel.relationshipType)}`;
            if (!edgeKeys.has(key)) {
                edges.push({
                    type: rel.relationshipType,
                    fromId,
                    toId,
                    createdAt: rel.createdAt
                })
                edgeKeys.add(key)
                hasParent.add(toId)
            }
        }

        const roots = Array.from(nodes.keys()).filter(id => !hasParent.has(id))

        return {
            nodes: Array.from(nodes.values()),
            edges,
            roots
        }
    }
}

