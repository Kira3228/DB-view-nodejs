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
exports.ReportService = void 0;
const globals_js_1 = require("typeorm/globals.js");
const system_events_entity_1 = require("../entities/system_events.entity");
const path = __importStar(require("path"));
const pdfmake_1 = __importDefault(require("pdfmake"));
const docx_1 = require("docx");
const xlsx_1 = __importDefault(require("xlsx"));
const console_1 = require("console");
const monitored_file_entity_1 = require("../entities/monitored_file.entity");
const file_relationships_entity_1 = require("../entities/file_relationships.entity");
class ReportService {
    constructor() {
        this.reportRepo = (0, globals_js_1.getRepository)(system_events_entity_1.SystemEvent);
        this.filesRepo = (0, globals_js_1.getRepository)(monitored_file_entity_1.MonitoredFile);
        this.relationRepo = (0, globals_js_1.getRepository)(file_relationships_entity_1.FileRelationship);
        this.robotoFontPath = path.resolve(__dirname, '../assets/Roboto.ttf');
    }
    getPdfReport(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { selectFields, fieldNames } = this.buildEventSelect(filters);
            const events = yield this.getEvents(selectFields);
            const flattenedData = this.preparePdfData(events, fieldNames);
            return this.generatePdf(flattenedData, fieldNames);
        });
    }
    getDocxReport(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { selectFields, fieldNames } = this.buildEventSelect(filters);
            const events = yield this.getEvents(selectFields);
            (0, console_1.log)(events);
            const flattenedData = this.preparePdfData(events, fieldNames);
            return this.generateDocx(flattenedData, fieldNames);
        });
    }
    getXlsxReport(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { selectFields, fieldNames } = this.buildEventSelect(filters);
            const events = yield this.getEvents(selectFields);
            const flattenedData = this.preparePdfData(events, fieldNames);
            return this.generateXlsx(flattenedData, fieldNames);
        });
    }
    getEvents(selectFields) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const events = yield this.reportRepo
                    .createQueryBuilder('event')
                    .leftJoinAndSelect('event.relatedFileId', 'file')
                    .leftJoinAndSelect('event.relatedProcessId', 'process')
                    .select(selectFields)
                    .getMany();
                return events;
            }
            catch (error) {
                console.error('Error in getEvents:', error);
                throw error;
            }
        });
    }
    preparePdfData(events, fieldNames) {
        return events.map(event => {
            const flatEvent = this.flattenObj(event);
            const row = [];
            fieldNames.forEach(field => {
                const originalFieldName = this.getOriginalFieldName(field.text);
                let value = '';
                for (const key in flatEvent) {
                    if (key.toLowerCase().endsWith(originalFieldName.toLowerCase())) {
                        value = flatEvent[key];
                        break;
                    }
                }
                row.push(value);
            });
            return row;
        });
    }
    getOriginalFieldName(displayName) {
        const fieldMap = {
            'ID события': 'id',
            'Тип события': 'eventType',
            'Данные события': 'eventData',
            'Важность': 'severity',
            'Источник': 'source',
            'Время события': 'timestamp',
            'ID процесса': 'ProcessId_id',
            'PID процесса': 'pid',
            'Путь к исполняемому файлу': 'executablePath',
            'Командная строка': 'commandLine',
            'Родительский PID': 'parentPid',
            'ID группы': 'groupId',
            'Дата создания процесса': 'ProcessId_createdAt',
            'Время запуска': 'processStartTime',
            'ID файла': 'FileId_id',
            'ID файловой системы': 'fileSystemId',
            'Inode': 'inode',
            'Путь к файлу': 'filePath',
            'Имя файла': 'fileName',
            'Размер файла': 'fileSize',
            'Дата создания файла': 'FileId_createdAt',
            'Дата изменения': 'modifiedAt',
            'Родоначальник': 'isOriginalMarked',
            'Макс. глубина цепочки': 'maxChainDepth',
            'Мин. глубина цепочки': 'minChainDepth',
            'Статус файла': 'status',
            'Дополнительные атрибуты': 'extendedAttributes'
        };
        return fieldMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '');
    }
    flattenObj(obj, prefix = '') {
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}_${key}` : key;
                if (value instanceof Date) {
                    result[newKey] = value.toISOString().replace('T', ' ').replace('.000Z', '');
                }
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    Object.assign(result, this.flattenObj(value, newKey));
                }
                else {
                    result[newKey] = value;
                }
            }
        }
        return result;
    }
    buildEventSelect(field) {
        const selectFields = [];
        const fieldNames = [];
        this.addFieldConditionally(field, 'id', 'event', 'ID события', selectFields, fieldNames);
        this.addFieldConditionally(field, 'eventType', 'event', 'Тип события', selectFields, fieldNames);
        this.addFieldConditionally(field, 'eventData', 'event', 'Данные события', selectFields, fieldNames);
        this.addFieldConditionally(field, 'severity', 'event', 'Важность', selectFields, fieldNames);
        this.addFieldConditionally(field, 'source', 'event', 'Источник', selectFields, fieldNames);
        this.addFieldConditionally(field, 'timestamp', 'event', 'Время события', selectFields, fieldNames);
        if (field.relatedProcessId) {
            this.addFieldConditionally(field.relatedProcessId, 'id', 'process', 'ID процесса', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedProcessId, 'pid', 'process', 'PID процесса', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedProcessId, 'executablePath', 'process', 'Путь к исполняемому файлу', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedProcessId, 'commandLine', 'process', 'Командная строка', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedProcessId, 'parentPid', 'process', 'Родительский PID', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedProcessId, 'groupId', 'process', 'ID группы', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedProcessId, 'createdAt', 'process', 'Дата создания процесса', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedProcessId, 'processStartTime', 'process', 'Время запуска', selectFields, fieldNames);
        }
        if (field.relatedFileId) {
            this.addFieldConditionally(field.relatedFileId, 'id', 'file', 'ID файла', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'fileSystemId', 'file', 'ID файловой системы', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'inode', 'file', 'Inode', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'filePath', 'file', 'Путь к файлу', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'fileName', 'file', 'Имя файла', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'fileSize', 'file', 'Размер файла', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'createdAt', 'file', 'Дата создания файла', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'modifiedAt', 'file', 'Дата изменения', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'isOriginalMarked', 'file', 'Родоначальник', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'maxChainDepth', 'file', 'Макс. глубина цепочки', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'minChainDepth', 'file', 'Мин. глубина цепочки', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'status', 'file', 'Статус файла', selectFields, fieldNames);
            this.addFieldConditionally(field.relatedFileId, 'extendedAttributes', 'file', 'Дополнительные атрибуты', selectFields, fieldNames);
        }
        return { selectFields, fieldNames };
    }
    addFieldConditionally(fieldConfig, fieldName, entityPrefix, displayName, selectFields, fieldNames) {
        if (fieldConfig[fieldName]) {
            selectFields.push(`${entityPrefix}.${fieldName}`);
            fieldNames.push({ text: displayName, style: 'tableHeader' });
        }
    }
    generatePdf(flattenDatd, fieldNames) {
        const fonts = {
            Roboto: {
                normal: this.robotoFontPath,
                bold: this.robotoFontPath,
                italics: this.robotoFontPath,
                bolditalics: this.robotoFontPath
            }
        };
        const printer = new pdfmake_1.default(fonts);
        const headers = fieldNames.map(f => f.text);
        const tableBody = [
            headers,
            ...flattenDatd
        ];
        const columnCount = fieldNames.length;
        const widths = new Array(columnCount).fill('*');
        const docDefinition = {
            content: [
                { text: 'Отчёт по событиям системы', style: 'header' },
                { text: `Сгенерировано: ${new Date().toLocaleString()}`, style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: widths,
                        dontBreakRows: true,
                        body: tableBody
                    },
                    layout: {
                        fillColor: (rowIndex) => {
                            return rowIndex === 0 ? '#CCCCCC' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
                        }
                    }
                }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 10],
                    alignment: 'center'
                },
                subheader: {
                    fontSize: 10,
                    margin: [0, 0, 0, 10],
                    alignment: 'center',
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: 'black'
                }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 5
            },
            pageSize: 'A4',
        };
        return printer.createPdfKitDocument(docDefinition);
    }
    generateDocx(flattenDatd, fieldNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = new docx_1.Document();
            const header = new docx_1.Paragraph({
                children: [
                    new docx_1.TextRun({
                        bold: true,
                        size: 48,
                        text: `Отчёт по событиям системы`,
                    })
                ],
                alignment: docx_1.AlignmentType.CENTER
            });
            const subHeader = new docx_1.Paragraph({
                children: [
                    new docx_1.TextRun({
                        size: 28,
                        text: `Сгенерировано: ${new Date().toLocaleString()}`,
                    })
                ],
                alignment: docx_1.AlignmentType.CENTER
            });
            const tableHeaders = fieldNames.map((field) => {
                return new docx_1.TableCell({
                    width: {
                        size: 5000,
                        type: docx_1.WidthType.DXA
                    },
                    children: [
                        new docx_1.Paragraph(field.text)
                    ]
                });
            });
            const headerRow = new docx_1.TableRow({
                children: tableHeaders
            });
            const tableBody = flattenDatd.map((row) => {
                const cells = row.map(cell => {
                    return new docx_1.TableCell({
                        width: {
                            size: 5000,
                            type: docx_1.WidthType.DXA
                        },
                        children: [
                            new docx_1.Paragraph(String(cell))
                        ]
                    });
                });
                return new docx_1.TableRow({ children: cells });
            });
            const table = new docx_1.Table({
                rows: [headerRow, ...tableBody]
            });
            doc.addSection({
                children: [header, subHeader, table]
            });
            try {
                const buffer = yield docx_1.Packer.toBuffer(doc);
                return Buffer.from(buffer);
            }
            catch (error) {
                console.error('DOCX generation error:', error);
                throw new Error('Failed to generate DOCX file');
            }
        });
    }
    generateXlsx(flattenData, fieldNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const arrayOfHeaders = fieldNames.map(field => {
                return field.text;
            });
            const data = [arrayOfHeaders, ...flattenData];
            const workbook = xlsx_1.default.utils.book_new();
            const worksheet = xlsx_1.default.utils.aoa_to_sheet(data);
            xlsx_1.default.utils.book_append_sheet(workbook, worksheet, `Sheet1`);
            const buffer = xlsx_1.default.write(workbook, {
                type: 'buffer',
                bookType: 'xlsx',
            });
            return buffer;
        });
    }
    distributionChainsExport() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield this.filesRepo.find();
            const rels = yield this.relationRepo.find();
            const fileMap = new Map();
            files.map((file) => { fileMap.set(file.id, file); });
            const childrenMap = new Map();
            rels.forEach(rel => {
                var _a;
                const parent = rel.parentFileId;
                const child = rel.childFileId;
                if (!childrenMap.has(parent)) {
                    childrenMap.set(parent, []);
                }
                (_a = childrenMap.get(parent)) === null || _a === void 0 ? void 0 : _a.push(child);
            });
            (0, console_1.log)(fileMap);
            const originalFiles = yield this.filesRepo.find({
                where: { isOriginalMarked: true }
            });
            const chains = [];
            const visitedGlobal = new Set();
            for (const origin of originalFiles) {
                const originalId = origin.id;
                const dfs = (currentId, path, depth) => {
                    if (visitedGlobal.has(currentId)) {
                        return;
                    }
                    visitedGlobal.add(currentId);
                    const currentFile = fileMap.get(currentId);
                    if (!currentFile) {
                        return;
                    }
                    const chainPath = path.map(id => { var _a; return ((_a = fileMap.get(id)) === null || _a === void 0 ? void 0 : _a.filePath) || `unknown`; });
                    chains.push({
                        ancestorId: origin.id,
                        ancestorPath: origin.filePath,
                        pathChain: [...chainPath],
                        chainDepth: depth,
                        createdAt: currentFile.createdAt.toISOString().replace('.000Z', '').replace(`T`, ' '),
                    });
                    const children = childrenMap.get(currentId) || [];
                    for (const childId of children) {
                        dfs(childId, [...path, childId], depth + 1);
                    }
                };
                dfs(originalId, [originalId], 0);
            }
            const pdf = this.genearteChainsPdf(chains);
            return pdf;
        });
    }
    toArray(chainsArray) {
        return chainsArray.map((chain) => [
            chain.ancestorId,
            chain.ancestorPath,
            chain.chainDepth,
            chain.pathChain,
            chain.createdAt,
        ]);
    }
    genearteChainsPdf(body) {
        const fonts = {
            Roboto: {
                normal: this.robotoFontPath,
                bold: this.robotoFontPath,
                italics: this.robotoFontPath,
                bolditalics: this.robotoFontPath
            }
        };
        const printer = new pdfmake_1.default(fonts);
        const fieldNames = [`Глубина`, `Цепочка`, `Дата создания`];
        const data = this.toArray(body);
        const tableBody = [
            fieldNames,
            ...data
        ];
        const widths = new Array(data.length).fill('*');
        const docDefinition = {
            content: [
                { text: 'Отчёт по событиям системы', style: 'header' },
                { text: `Сгенерировано: ${new Date().toLocaleString()}`, style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: widths,
                        dontBreakRows: true,
                        body: tableBody
                    },
                    layout: {
                        fillColor: (rowIndex) => {
                            return rowIndex === 0 ? '#CCCCCC' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
                        }
                    }
                }
            ],
        };
        return printer.createPdfKitDocument(docDefinition);
    }
    genearteChainsDocx() {
    }
    genearteChainsXlsx() {
    }
}
exports.ReportService = ReportService;
