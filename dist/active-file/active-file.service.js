"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveFilesService = void 0;
const typeorm_1 = require("typeorm");
const monitored_file_entity_1 = require("../entities/monitored_file.entity");
const console_1 = require("console");
const file_relationships_entity_1 = require("../entities/file_relationships.entity");
class ActiveFilesService {
    constructor() {
        this.activeFileRepo = (0, typeorm_1.getRepository)(monitored_file_entity_1.MonitoredFile);
        this.relationRepo = (0, typeorm_1.getRepository)(file_relationships_entity_1.FileRelationship);
    }
    getActiveFiles(filters, page = 1, limit = 30) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            if (filters.filePath) {
                where.filePath = (0, typeorm_1.Like)(`%${filters.filePath}%`);
            }
            if (filters.inode) {
                where.inode = filters.inode;
            }
            const [files, totalCount] = yield this.activeFileRepo.findAndCount({
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
            });
            return {
                files,
                totalCount,
                page,
                totalPage: Math.ceil(totalCount / limit),
                limit
            };
        });
    }
    getArchive(filters, page = 1, limit = 30) {
        return __awaiter(this, void 0, void 0, function* () {
            const statusConditions = ['archived', 'deleted'].map((status) => (Object.assign({ status }, this.buildWhereConditions(filters))));
            const where = [...statusConditions];
            const [files, totalCount] = yield this.activeFileRepo.findAndCount({
                where,
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            });
            (0, console_1.log)(files, totalCount, { totalPages: Math.ceil(totalCount / limit), }, page, limit);
            return {
                files,
                totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit),
                limit
            };
        });
    }
    buildWhereConditions(filters) {
        const where = {};
        if (filters.filePath) {
            where.filePath = (0, typeorm_1.Like)(`%${filters.filePath}%`);
        }
        (0, console_1.log)(filters.filePath);
        if (filters.inode) {
            where.inode = (0, typeorm_1.Like)(`%${filters.inode}%`);
        }
        (0, console_1.log)(where);
        return where;
    }
    updateStatus(dto, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { status } = dto;
            (0, console_1.log)(status, id);
            const file = yield this.activeFileRepo.update({ id }, { status });
            if (file.affected === 0) {
                throw new Error(`Файл с ID ${id} не найден`);
            }
            return this.activeFileRepo.findOne({
                where: { id: id }
            });
        });
    }
    graph(filePath, inode) {
        return __awaiter(this, void 0, void 0, function* () {
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
            (0, console_1.log)(query);
            // const rels = await this.relationRepo.find({
            //     relations: ['parentFile', 'childFile'],
            //     where
            // });
            const rels = yield query.getMany();
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
        });
    }
    generatePDFreport() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.ActiveFilesService = ActiveFilesService;
