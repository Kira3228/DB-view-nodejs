import { getRepository } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { FileRelationship } from "../entities/file_relationships.entity";
import { applyNotLikeList, parsePathExceptions } from "../utils/query-utils";
import { paginate } from "../utils/pagination";

import tableConfig from './config.json'
import { getPreset, TPreset } from "../utils/get-presets";
import { getFilters } from "../utils/get-exceptions";

export class ActiveFilesService {
    private activeFileRepo = getRepository(MonitoredFile)
    private relationRepo = getRepository(FileRelationship)
    private config = tableConfig

    async getHeaders(presetName?: string) {
        const preset = getPreset(this.config, presetName)
        return preset.headers
    }

    async getPresetNames() {
        const presetsName = this.config.presets.map(name => {
            return name.presetName
        })
        return presetsName
    }

    async getFilters(presetName: string) {
        const preset = getPreset(this.config, presetName)
        const filters = preset.default_filters
        return filters
    }

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
        const preset = getPreset(this.config, filters.presetName)

        const excludeFilePaths = getFilters(preset, `filePath`, `exceptions`)
        applyNotLikeList(qb, `file`, `filePath`, excludeFilePaths as string[], `both`)

        const excludeInode = getFilters(preset, 'inode', `exceptions`)
        applyNotLikeList(qb, `inode`, `inode`, excludeInode as string[], `both`)

        const configFilePathFilter = getFilters(preset, `filePath`, `default_filters`)
        const configFileInodeFilter = getFilters(preset, `inode`, `default_filters`)

        this.applyCommonFilters(qb, {});

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

    async relationGraph(filePath?: string, inode?: number, filePathException?: string, presetName?: string) {
        const qb = this.relationRepo
            .createQueryBuilder('rel')
            .leftJoinAndSelect('rel.parentFile', 'parent')
            .leftJoinAndSelect('rel.childFile', 'child')

        if (filePath) {
            qb.andWhere('parent.filePath LIKE :fp', { fp: `%${filePath}%` })
        }
        if (inode) {
            qb.andWhere('parent.inode = :inode', { inode })
        }

        const preset = getPreset(this.config, presetName)

        const excludeFilePaths = getFilters(preset, `filePath`, `exceptions`)

        applyNotLikeList(qb, 'parent', 'filePath', excludeFilePaths as string[], 'both')
        applyNotLikeList(qb, 'child', 'filePath', excludeFilePaths as string[], 'both')

        const relations = await qb.getMany()

        const nodes = new Map<number, MonitoredFile>()
        const edges: Edge[] = []
        const edgeKeys = new Set<string>()
        const hasParent = new Set<number>()

        const norm = (s?: string) => (s ?? '').trim().toLowerCase()

        for (const rel of relations) {
            const fromId = rel.parentFileId
            const toId = rel.childFileId

            if (!nodes.has(fromId)) nodes.set(fromId, rel.parentFile)
            if (!nodes.has(toId)) nodes.set(toId, rel.childFile)

            const key = `${fromId}-${toId}-${norm(rel.relationshipType)}`
            if (!edgeKeys.has(key)) {
                edges.push({
                    type: rel.relationshipType,
                    fromId,
                    toId,
                    createdAt: rel.createdAt,
                })
                edgeKeys.add(key)
                hasParent.add(toId)
            }
        }

        const roots = Array.from(nodes.keys()).filter(id => !hasParent.has(id))

        return {
            nodes: Array.from(nodes.values()),
            edges,
            roots,
        }
    }

}

type Edge = {
    type: string
    fromId: number
    toId: number
    createdAt: Date
}