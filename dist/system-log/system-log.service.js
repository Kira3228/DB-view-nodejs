"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemLogService = void 0;
const typeorm_1 = require("typeorm");
const system_events_entity_1 = require("../entities/system_events.entity");
const console_1 = require("console");
const pdfmake_1 = __importDefault(require("pdfmake"));
const path = __importStar(require("path"));
class SystemLogService {
    constructor() {
        this.systemLogRepo = (0, typeorm_1.getRepository)(system_events_entity_1.SystemEvent);
        this.russianFontPath = path.resolve(__dirname, '../../assets/timesnewromanpsmt.ttf');
        this.robotoFontPath = path.resolve(__dirname, '../../assets/Roboto.ttf');
    }
    getSystemEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.systemLogRepo
                    .createQueryBuilder("event")
                    .leftJoinAndSelect("event.relatedFileId", "file")
                    .leftJoinAndSelect("event.relatedProcessId", "process")
                    .leftJoinAndSelect("process.user", "user")
                    .select([
                    "event.id",
                    "event.eventData",
                    "event.timestamp",
                    "event.eventType",
                    "event.source",
                    "file.id", "file.filePath", "file.fileName",
                    "file.status", "file.fileSystemId",
                    "process.id", "process.pid",
                    "user.id", "user.userName"
                ])
                    .getMany();
            }
            catch (error) {
                throw error;
            }
        });
    }
    getFilteredSystemEvents(filters, page = 1, limit = 30) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryBuilder = this.systemLogRepo
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.relatedFileId', 'file')
                .leftJoinAndSelect('event.relatedProcessId', 'process')
                .select([
                'event.id',
                'event.eventData',
                'event.timestamp',
                'event.eventType',
                'event.source',
                'file.id',
                'file.filePath',
                'file.fileName',
                'file.status',
                'file.fileSystemId',
                'process.id',
                'process.pid',
            ]);
            if (filters.eventType) {
                queryBuilder.andWhere('event.eventType = :eventType', {
                    eventType: filters.eventType,
                });
            }
            this.applyDateFilters(queryBuilder, filters);
            this.applyFileFilters(queryBuilder, filters);
            if (filters.relatedFileId) {
                this.applyRelatedFileFilters(queryBuilder, filters.relatedFileId);
            }
            const skipAmount = (page - 1) * limit;
            queryBuilder.skip(skipAmount).take(limit);
            const [events, totalCount] = yield queryBuilder.getManyAndCount();
            return {
                events,
                totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit),
                limit,
            };
        });
    }
    applyDateFilters(queryBuilder, filters) {
        if (filters.startDate && filters.endDate) {
            const startDate = new Date(filters.startDate).toISOString().replace('T', ' ').slice(0, 19);
            const endDate = new Date(filters.endDate).toISOString().replace('T', ' ').slice(0, 19);
            (0, console_1.log)(startDate.toString(), endDate);
            queryBuilder.andWhere('event.timestamp BETWEEN :startDate AND :endDate', {
                startDate: `${startDate}`,
                endDate: `${endDate}`
            });
            (0, console_1.log)(queryBuilder.getSql());
        }
        else {
            if (filters.startDate) {
                const startDate = new Date(filters.startDate).toISOString().replace('T', ' ').slice(0, 19);
                queryBuilder.andWhere('event.timestamp >= :startDate', {
                    startDate: `'${startDate}'`
                });
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate).toISOString().replace('T', ' ').slice(0, 19);
                queryBuilder.andWhere('event.timestamp <= :endDate', {
                    endDate: `'${endDate}'`
                });
            }
        }
    }
    applyFileFilters(queryBuilder, filters) {
        if (filters.status || filters.filePath || filters.fileSystemId) {
            if (filters.status) {
                queryBuilder.andWhere('file.status = :status', {
                    status: filters.status,
                });
                (0, console_1.log)(queryBuilder.getSql());
            }
            if (filters.filePath) {
                queryBuilder.andWhere('file.filePath LIKE :filePath', {
                    filePath: `%${filters.filePath}%`,
                });
            }
            if (filters.fileSystemId) {
                queryBuilder.andWhere('file.fileSystemId = :fileSystemId', {
                    fileSystemId: filters.fileSystemId,
                });
            }
        }
    }
    applyRelatedFileFilters(queryBuilder, relatedFile) {
        if (relatedFile.status) {
            queryBuilder.andWhere('file.status = :fileStatus', {
                fileStatus: relatedFile.status,
            });
            (0, console_1.log)(queryBuilder.getSql());
        }
        if (relatedFile.filePath) {
            queryBuilder.andWhere('file.filePath LIKE :filePath', {
                filePath: `%${relatedFile.filePath}%`,
            });
        }
        if (relatedFile.fileSystemId) {
            queryBuilder.andWhere('file.fileSystemId = :fileSystemId', {
                fileSystemId: relatedFile.fileSystemId,
            });
        }
    }
    getSelectedEvents(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            if (ids && ids.length) {
                where.id = (0, typeorm_1.In)(ids);
            }
            const data = yield this.systemLogRepo.find({
                where
            });
            return this.exportCSV(data);
        });
    }
    getAllEventTypeOption() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = this.systemLogRepo.find({
                select: ["eventType"]
            });
            return options;
        });
    }
    getAllCSV() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.systemLogRepo.find();
            return this.exportCSV(data);
        });
    }
    exportCSV(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data || data.length === 0) {
                return { data: [], headers: '', rows: '' };
            }
            console.log(`до хедера`);
            console.log(`data[0]`, data[0]);
            const headers = Object.keys(data[0]).join(',');
            console.log(`ПОСЛЕ  хедера`);
            const rows = data
                .map((row) => Object.values(row)
                .map((val) => {
                const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                return `"${stringVal.replace(/"/g, '""')}"`;
            })
                .join(',')).join('\n');
            return {
                data,
                headers,
                rows
            };
        });
    }
    generatePdfReport() {
        return __awaiter(this, void 0, void 0, function* () {
            const fonts = {
                Roboto: {
                    normal: this.robotoFontPath,
                }
            };
            const printer = new pdfmake_1.default({
                Roboto: {
                    normal: this.robotoFontPath
                }
            });
            const docDefinition = {
                content: [
                    { text: 'Отчёт по событиям', style: 'header' },
                    {
                        table: {
                            headerRows: 2,
                            widths: ['auto', 'auto', `auto`],
                            body: [
                                ['Дата', 'Тип', 'Статус'],
                                ['2023-01-01', 'Ошибка', 'Критично'],
                                ['2023-01-02', 'Предупреждение', 'Нормально']
                            ]
                        }
                    }
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        margin: [0, 0, 0, 0],
                    }
                }
            };
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            return pdfDoc;
        });
    }
}
exports.SystemLogService = SystemLogService;
