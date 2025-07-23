import { getRepository } from "typeorm/globals.js";
import { SystemEvent } from "../entities/system_events.entity";
import { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";
import * as path from 'path';
import PdfPrinter from "pdfmake";
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import XLSX from 'xlsx'
import { ReportDto, ReportFilters } from "./report.dto";
import { log } from "console";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { FileRelationship } from "../entities/file_relationships.entity";
import { endianness } from "os";

type TableHeader = {
    text: string
    style: string
};


type DeepPartialFlags<T> = {
    [K in keyof T]?:
    T[K] extends object
    ? DeepPartialFlags<T[K]>
    : boolean | string;
};

type TChains = {
    ancestorId: number;
    ancestorPath: string;
    pathChain: string[];
    chainDepth: number;
    createdAt: string;
}

export class ReportService {
    private reportRepo = getRepository(SystemEvent);
    private filesRepo = getRepository(MonitoredFile)
    private relationRepo = getRepository(FileRelationship)
    private readonly robotoFontPath = path.resolve(__dirname, '../assets/Roboto.ttf');

    async getPdfReport(filters: Partial<ReportDto>) {
        const { selectFields, fieldNames } = this.buildEventSelect(filters);
        const events = await this.getEvents(selectFields)
        const flattenedData = this.preparePdfData(events, fieldNames);
        return this.generatePdf(flattenedData, fieldNames);
    }

    async getDocxReport(filters: Partial<ReportDto>) {
        const { selectFields, fieldNames } = this.buildEventSelect(filters);
        const events = await this.getEvents(selectFields)
        log(events)
        const flattenedData = this.preparePdfData(events, fieldNames);
        return this.generateDocx(flattenedData, fieldNames)
    }

    async getXlsxReport(filters: Partial<ReportDto>) {
        const { selectFields, fieldNames } = this.buildEventSelect(filters);
        const events = await this.getEvents(selectFields)
        const flattenedData = this.preparePdfData(events, fieldNames);
        return this.generateXlsx(flattenedData, fieldNames)
    }

    async getChainsPdf(filters: Partial<ReportFilters>) {
        const formatedDates = {
            startDate: filters.startDate.replace("T", '').replace('.000Z', ''),
            endDate: filters.endDate.replace("T", '').replace('.000Z', '')
        }
        const chains = await this.getChains()
        return this.genearteChainsPdf(chains)

    };

    async getChainsDocx(filters: Partial<ReportFilters>) {
        const formatedDates = {
            startDate: filters.startDate.replace("T", '').replace('.000Z', ''),
            endDate: filters.endDate.replace("T", '').replace('.000Z', '')
        }
        const chains = await this.getChains()
        return await this.genearteChainsDocx(chains)
    };

    async getChainsXlsx(filters: Partial<ReportFilters>) {
        const formatedDates = {
            startDate: filters.startDate.replace("T", '').replace('.000Z', ''),
            endDate: filters.endDate.replace("T", '').replace('.000Z', '')
        }
        const chains = await this.getChains()
        return this.genearteChainsXlsx(chains)
    };

    private async getEvents(selectFields: string[]) {
        try {
            const events = await this.reportRepo
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.relatedFileId', 'file')
                .leftJoinAndSelect('event.relatedProcessId', 'process')
                .select(selectFields)
                .andWhere('event.timestamp BETWEEN :from AND :to', {})
                .getMany();
            return events
        } catch (error) {
            console.error('Error in getEvents:', error);
            throw error;
        }
    }

    private preparePdfData(events: SystemEvent[], fieldNames: { text: string, style: string }[]): string[][] {
        return events.map(event => {
            const flatEvent = this.flattenObj(event)
            const row: string[] = [];
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

    private getOriginalFieldName(displayName: string): string {
        const fieldMap: Record<string, string> = {
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

    private flattenObj(obj: any, prefix: string = ''): any {
        const result: any = {};

        for (const key in obj) {

            if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}_${key}` : key;
                if (value instanceof Date) {
                    result[newKey] = value.toISOString().replace('T', ' ').replace('.000Z', '');
                }
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    Object.assign(result, this.flattenObj(value, newKey));
                } else {
                    result[newKey] = value;
                }
            }
        }
        return result;
    }

    private buildEventSelect(field: DeepPartialFlags<SystemEvent>) {
        const selectFields: string[] = [];
        const fieldNames: TableHeader[] = [];

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

    private addFieldConditionally(
        fieldConfig: DeepPartialFlags<SystemEvent>,
        fieldName: string,
        entityPrefix: string,
        displayName: string,
        selectFields: string[],
        fieldNames: { text: string; style: string }[]
    ) {
        if (fieldConfig[fieldName]) {
            selectFields.push(`${entityPrefix}.${fieldName}`);
            fieldNames.push({ text: displayName, style: 'tableHeader' });
        }
    }

    private generatePdf(flattenDatd: string[][], fieldNames: TableHeader[]): PDFKit.PDFDocument {
        const fonts: TFontDictionary = {
            Roboto: {
                normal: this.robotoFontPath,
                bold: this.robotoFontPath,
                italics: this.robotoFontPath,
                bolditalics: this.robotoFontPath
            }
        };

        const printer = new PdfPrinter(fonts);
        const headers = fieldNames.map(f => f.text);

        const tableBody = [
            headers,
            ...flattenDatd
        ];

        const columnCount = fieldNames.length;

        const widths = new Array(columnCount).fill('*');

        const docDefinition: TDocumentDefinitions = {
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

    private async generateDocx(flattenData: string[][], fieldNames: TableHeader[]) {
        const doc = new Document()
        const header = new Paragraph({
            children: [
                new TextRun({
                    bold: true,
                    size: 48,
                    text: `Отчёт по событиям системы`,
                })
            ],
            alignment: AlignmentType.CENTER
        })
        const subHeader = new Paragraph({
            children: [
                new TextRun({
                    size: 28,
                    text: `Сгенерировано: ${new Date().toLocaleString()}`,
                })
            ],
            alignment: AlignmentType.CENTER
        })

        const tableHeaders = fieldNames.map((field) => {
            return new TableCell({
                width: {
                    size: 5000,
                    type: WidthType.DXA
                },
                children: [
                    new Paragraph(field.text)
                ]
            })
        })

        const headerRow = new TableRow({
            children: tableHeaders
        })

        const tableBody = flattenData.map((row) => {
            const cells = row.map(cell => {
                return new TableCell({
                    width: {
                        size: 5000,
                        type: WidthType.DXA
                    },
                    children: [
                        new Paragraph(String(cell))
                    ]
                })
            })

            return new TableRow({ children: cells })
        })

        const table = new Table({
            rows: [headerRow, ...tableBody]
        })

        doc.addSection({

            children: [header, subHeader, table]
        })

        try {
            const buffer = await Packer.toBuffer(doc);
            return Buffer.from(buffer);
        } catch (error) {
            console.error('DOCX generation error:', error);
            throw new Error('Failed to generate DOCX file');
        }
    }

    private async generateXlsx(flattenData: string[][], fieldNames: TableHeader[],) {
        const arrayOfHeaders: string[] = fieldNames.map(field => field.text)

        const data: string[][] = [arrayOfHeaders, ...flattenData]
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.aoa_to_sheet(data)

        XLSX.utils.book_append_sheet(workbook, worksheet, `Sheet1`)

        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
        }) as Buffer;

        return buffer
    }

    private async getChains(filters: Partial<ReportFilters>) {
        const files = await this.filesRepo.find()
        const rels = await this.relationRepo.find()
        const fileMap = new Map<number, MonitoredFile>();
        const childrenMap = new Map<number, number[]>()
        const chains: TChains[] = []
        const visitedGlobal = new Set<number>();

        files.map((file) => { fileMap.set(file.id, file) })

        rels.forEach(rel => {
            const parent = rel.parentFileId
            const child = rel.childFileId
            if (!childrenMap.has(parent)) {
                childrenMap.set(parent, []);
            }
            childrenMap.get(parent)?.push(child)
        });

        const originalFiles = await this.filesRepo.find({
            where: { isOriginalMarked: true }
        })

        for (const origin of originalFiles) {
            const originalId = origin.id

            const dfs = (currentId: number, path: number[], depth: number) => {
                if (visitedGlobal.has(currentId)) {
                    return
                }
                visitedGlobal.add(currentId)

                const currentFile = fileMap.get(currentId)

                if (!currentFile) {
                    return
                }

                const chainPath = path.map(id => fileMap.get(id)?.filePath || `unknown`);

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

        return chains
    }

    private toArray(chainsArray: TChains[]) {
        return chainsArray.map((chain) => [
            String(chain.chainDepth),
            chain.pathChain.join(' -> '),
            chain.createdAt,
        ])
    }

    private genearteChainsPdf(body: TChains[]) {
        const fonts: TFontDictionary = {
            Roboto: {
                normal: this.robotoFontPath,
                bold: this.robotoFontPath,
                italics: this.robotoFontPath,
                bolditalics: this.robotoFontPath
            }
        };

        const printer = new PdfPrinter(fonts);
        const fieldNames = [`Глубина`, `Цепочка`, `Дата создания`]
        const data = this.toArray(body)
        const betterData = [...data]

        const tableBody = [
            fieldNames,
            ...betterData,
        ];

        const docDefinition: TDocumentDefinitions = {
            content: [
                { text: 'Отчёт по событиям системы', style: 'header' },
                { text: `Сгенерировано: ${new Date().toLocaleString()}`, style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: [`auto`, `auto`, `auto`],
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
        }

        return printer.createPdfKitDocument(docDefinition);
    }

    private async genearteChainsDocx(body: TChains[]) {
        const doc = new Document()
        const flattenData = this.toArray(body)

        const header = new Paragraph({
            children: [
                new TextRun({
                    bold: true,
                    size: 48,
                    text: ``,
                })
            ],
            alignment: AlignmentType.CENTER
        })

        const subHeader = new Paragraph({
            children: [
                new TextRun({
                    size: 28,
                    text: `Сгенерировано: ${new Date().toLocaleString()}`,
                })
            ],
            alignment: AlignmentType.CENTER
        })

        const fieldNames: string[] = [`Глубина`, `Цепочка`, `Дата создания`]

        const tableHeaders = fieldNames.map((field) => {
            return new TableCell({
                width: {
                    size: 5000,
                    type: WidthType.DXA
                },
                children: [
                    new Paragraph(field)
                ]
            })
        })

        const headerRow = new TableRow({
            children: tableHeaders
        })

        const tableBody = flattenData.map((row) => {
            const cells = row.map(cell => {
                return new TableCell({
                    width: {
                        size: 5000,
                        type: WidthType.DXA
                    },
                    children: [
                        new Paragraph(String(cell))
                    ]
                })
            })

            return new TableRow({ children: cells })
        })
        const table = new Table({
            rows: [headerRow, ...tableBody]
        })
        doc.addSection({
            children: [header, subHeader, table]
        })

        try {
            const buffer = await Packer.toBuffer(doc);
            return Buffer.from(buffer);
        } catch (error) {
            console.error('DOCX generation error:', error);
            throw new Error('Failed to generate DOCX file');
        }
    }

    private genearteChainsXlsx(body: TChains[]) {
        const arrayOfHeaders: string[] = [`Глубина`, `Цепочка`, `Дата создания`]
        const flattenData = this.toArray(body)
        const data: string[][] = [arrayOfHeaders, ...flattenData]
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.aoa_to_sheet(data)

        XLSX.utils.book_append_sheet(workbook, worksheet, `Sheet1`)

        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
        }) as Buffer;

        return buffer
    }
}