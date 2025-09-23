import { getRepository } from "typeorm";
import { SystemEvent } from "../entities/system_events.entity";
import { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";
import * as path from 'path';
import PdfPrinter from "pdfmake";
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import XLSX from 'xlsx'
import { ReportDto, ExceptionsDto } from "./report.dto";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { FileRelationship } from "../entities/file_relationships.entity";
import { Between } from "typeorm";
import { log } from "console";
import { DeepPartialFlags, TableData, TableHeader, TChains } from "./report.types";
import { buildEventSelectHelper } from "./utils/build-event-select-helper";
import { getOriginalFieldNameHelper } from "./utils/get-original-field-name";

export class ReportService {
    private reportRepo = getRepository(SystemEvent);
    private filesRepo = getRepository(MonitoredFile)
    private relationRepo = getRepository(FileRelationship)
    private readonly robotoFontPath = path.resolve(__dirname, '../assets/Roboto.ttf');

    async getPdfReport(filters: Partial<ReportDto>) {
        return this.generateReport(filters, (data, headers) => this.generatePdf(data, headers))
    }

    async getDocxReport(filters: Partial<ReportDto>) {
        return this.generateReport(filters, (data, headers) => this.generateDocx(data, headers))
    }

    async getXlsxReport(filters: Partial<ReportDto>) {
        return this.generateReport(filters, (data, headers) => this.generateXlsx(data, headers))
    }

    async getChainsPdf(filters: Partial<ExceptionsDto>) {
        const dateParams = {
            startDate: filters.startDate ? new Date(filters.startDate).toISOString().replace('T', ' ').replace('.000Z', '') : null,
            endDate: filters.endDate ? new Date(filters.endDate).toISOString().replace('T', ' ').replace('.000Z', '') : null
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (!isNaN(startDate.getTime())) {
                dateParams.startDate = startDate.toISOString().replace('T', ' ').replace('.000Z', '');
            }
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            if (!isNaN(endDate.getTime())) {
                dateParams.endDate = endDate.toISOString().replace('T', ' ').replace('.000Z', '');
            }
        }

        const chains = await this.getChains(filters.startDate, filters.endDate, filters.minDepth, filters.maxDepth)
        return this.genearteChainsPdf(chains)
    };

    async getChainsDocx(filters: Partial<ExceptionsDto>) {
        const dateParams = {
            startDate: filters.startDate ? new Date(filters.startDate).toISOString().replace('T', ' ').replace('.000Z', '') : null,
            endDate: filters.endDate ? new Date(filters.endDate).toISOString().replace('T', ' ').replace('.000Z', '') : null
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (!isNaN(startDate.getTime())) {
                dateParams.startDate = startDate.toISOString().replace('T', ' ').replace('.000Z', '');
            }
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            if (!isNaN(endDate.getTime())) {
                dateParams.endDate = endDate.toISOString().replace('T', ' ').replace('.000Z', '');
            }
        }
        const chains = await this.getChains(dateParams.startDate, dateParams.endDate, filters.minDepth, filters.maxDepth)
        return await this.genearteChainsDocx(chains)
    };

    async getChainsXlsx(filters: Partial<ExceptionsDto>) {
        const dateParams = {
            startDate: filters.startDate ? new Date(filters.startDate).toISOString().replace('T', ' ').replace('.000Z', '') : null,
            endDate: filters.endDate ? new Date(filters.endDate).toISOString().replace('T', ' ').replace('.000Z', '') : null
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (!isNaN(startDate.getTime())) {
                dateParams.startDate = startDate.toISOString().replace('T', ' ').replace('.000Z', '');
            }
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            if (!isNaN(endDate.getTime())) {
                dateParams.endDate = endDate.toISOString().replace('T', ' ').replace('.000Z', '');
            }
        }
        const chains = await this.getChains(dateParams.startDate, dateParams.endDate, filters.minDepth, filters.maxDepth)
        return this.genearteChainsXlsx(chains)
    };

    private normalizeDate(input?: string | Date): string | null {
        if (!input) return null
        const d = new Date(input)
        return isNaN(d.getTime()) ? null : d.toISOString().replace(`T`, '').replace(`000Z`, '')
    }

    private normalizeDateRange<T extends { startDate?: any, endDate: any }>(filters: T) {
        return {
            startDate: this.normalizeDate(filters.startDate),
            endDate: this.normalizeDate(filters.endDate)
        }
    }

    private async generateReport(filters: Partial<ReportDto>, generator: (data: string[][], headers: TableHeader[]) => Promise<Buffer> | PDFKit.PDFDocument) {
        const { selectFields, fieldNames } = this.buildEventSelect(filters);

        const safeFormatDate = (dateString: any): string | null => {
            if (!dateString) return null;

            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateString);
                return null;
            }

            return date.toISOString().replace('T', ' ').replace('.000Z', '');
        };

        const dateRange = {
            startDate: safeFormatDate(filters.startDate),
            endDate: safeFormatDate(filters.endDate)
        };

        const excludeFilePaths = this.exceptionsToArray(filters.fileExceptions);
        const excludeProcessPaths = this.exceptionsToArray(filters.processExceptions);

        const events = await this.getEvents(
            selectFields,
            excludeFilePaths,
            excludeProcessPaths,
            dateRange.startDate,
            dateRange.endDate
        );

        const flattenData = this.preparePdfData(events, fieldNames);
        return generator(flattenData, fieldNames);
    }

    private exceptionsToArray(exceptions?: string): string[] {
        return exceptions ? exceptions.split('\n').map(s => s.trim()).filter(Boolean) : [];
    }

    private async getEvents(
        selectFields: string[],
        excludeFilePaths: string[] = [],
        excludeProcessPaths: string[] = [],
        startDate?: string,
        endDate?: string
    ) {
        try {
            let query = this.reportRepo
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.relatedFileId', 'file')
                .leftJoinAndSelect('event.relatedProcessId', 'process');

            if (excludeFilePaths && excludeFilePaths.length > 0) {
                const fileConds: string[] = [];
                const params: Record<string, any> = {};
                excludeFilePaths.forEach((path, idx) => {
                    const param = `filePathExclude${idx}`;
                    params[param] = path.endsWith('%') ? path : `${path}%`;
                    fileConds.push(`file.filePath NOT LIKE :${param}`);
                });

                query = query.andWhere(
                    `(file.filePath IS NULL OR (${fileConds.join(' AND ')}))`,
                    params
                );
            }

            if (excludeProcessPaths && excludeProcessPaths.length > 0) {
                const procConds: string[] = [];
                const params: Record<string, any> = {};
                excludeProcessPaths.forEach((path, idx) => {
                    const param = `processPathExclude${idx}`;
                    params[param] = path.endsWith('%') ? path : `${path}%`;
                    procConds.push(`process.executablePath NOT LIKE :${param}`);
                });

                query = query.andWhere(
                    `(process.executablePath IS NULL OR (${procConds.join(' AND ')}))`,
                    params
                );
            }

            if (startDate && endDate) {
                query = query.andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });
            }

            const events = await query.select(selectFields).getMany();
            return events;
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
        return getOriginalFieldNameHelper(displayName)
    }

    private flattenObj(obj: any, prefix: string = ''): any {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value === undefined) continue;
            const newKey = prefix ? `${prefix}_${key}` : key;

            if (value instanceof Date) {
                result[newKey] = value.toISOString().replace('T', ' ').replace('.000Z', '');
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(result, this.flattenObj(value, newKey));
            } else {
                result[newKey] = value;
            }
        }
        return result;
    }


    private buildEventSelect(field: DeepPartialFlags<SystemEvent>) {
        return buildEventSelectHelper(field)
    }

    private generatePdf(flattenDatd: string[][], fieldNames: TableHeader[]): Promise<Buffer> {
        const fonts: TFontDictionary = {
            Roboto: {
                normal: this.robotoFontPath,
                bold: this.robotoFontPath,
                italics: this.robotoFontPath,
                bolditalics: this.robotoFontPath,
            },
        };

        const printer = new PdfPrinter(fonts);
        const headers = fieldNames.map(f => f.text);
        const tableBody = [headers, ...flattenDatd];

        const widths = new Array(fieldNames.length).fill('auto');

        const docDefinition: TDocumentDefinitions = {
            content: [
                { text: 'Отчёт по событиям системы', style: 'header' },
                { text: `Сгенерировано: ${new Date().toLocaleString()}`, style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths,
                        dontBreakRows: true,
                        body: tableBody,
                    },
                    layout: {
                        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#CCCCCC' : rowIndex % 2 === 0 ? '#F5F5F5' : null),
                    },
                },
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10], alignment: 'center' },
                subheader: { fontSize: 10, margin: [0, 0, 0, 10], alignment: 'center' },
                tableHeader: { bold: true, fontSize: 8, color: 'black' },
            },
            defaultStyle: { font: 'Roboto', fontSize: 5 },
            pageSize: 'A4',
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err: Error) => reject(err));
            pdfDoc.end();
        });
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

    private async getChains(startDate: string, endDate: string, minDepth: number, maxDepth: number) {
        log(...arguments)
        const files = await this.filesRepo.find({
            where: {
                createdAt: Between(startDate, endDate)
            }
        })
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
                if (depth >= minDepth && depth <= maxDepth) {
                    chains.push({
                        ancestorId: origin.id,
                        ancestorPath: origin.filePath,
                        pathChain: [...chainPath],
                        chainDepth: depth,
                        createdAt: currentFile.createdAt.toISOString().replace('.000Z', '').replace(`T`, ' '),
                    });
                }
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

    private toTableData(headers: string[], rows: string[]): TableData {
        return { headers, rows }
    }
}