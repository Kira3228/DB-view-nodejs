// import { SystemEvent } from "../entities/system_events.entity";
import * as path from 'path';
import { ExceptionsDto, ReportData, ReportHeader } from "./report.dto";
import { TableHeader, TChains } from "./report.types";
import { getOriginalFieldNameHelper } from "./utils/get-original-field-name";
import { normalizeDate } from "./utils/date-utils";
import { generatePdf } from "./renders/events-reports/pdf.render";
import { generateDocx } from "./renders/events-reports/docx.render";
import { generateXlsx } from "./renders/events-reports/xlsx.render";
import { genearteChainsPdf } from "./renders/chains-reports/pdf.render";
import { genearteChainsDocx } from "./renders/chains-reports/docx.render";
import { genearteChainsXlsx } from "./renders/chains-reports/xlsx.render";
import { ChainsService } from "./chains.service";
import { EventService } from "./event.service";
import { toFlattenObject } from "./utils/to-flatten-object";
import { log } from "console";
// import { loadEnvFile } from "process";

export class ReportService {
    private chainService: ChainsService
    private eventService: EventService
    private readonly robotoFontPath = path.resolve(__dirname, '../assets/Roboto.ttf');
    private readonly chainsHeaders = [`Глубина`, `Цепочка`, `Дата создания`]
    constructor() {
        this.chainService = new ChainsService()
        this.eventService = new EventService()
    }

    async getChainsPdf(filters: Partial<ExceptionsDto>,) {
        return this.generateChainsReport(filters, (chains) => genearteChainsPdf(chains, this.robotoFontPath, this.chainsHeaders))
    };

    async getChainsDocx(filters: Partial<ExceptionsDto>) {
        return this.generateChainsReport(filters, (chains) => genearteChainsDocx(chains, this.chainsHeaders))
    };

    async getChainsXlsx(filters: Partial<ExceptionsDto>) {
        return this.generateChainsReport(filters, (chains) => genearteChainsXlsx(chains, this.chainsHeaders))

    };

    private async generateChainsReport(filters: Partial<ExceptionsDto>, generator: (chains: TChains[]) => Promise<Buffer> | PDFKit.PDFDocument) {
        const chains = await this.chainService.getChains(filters.startDate, filters.endDate)
        return generator(chains)
    }

    private formattingData(events: any[], fieldNames: { text: string, style: string }[]): string[][] {
        return events.map(event => {
            const flatEvent = toFlattenObject(event)
            const row: string[] = [];
            fieldNames.forEach(field => {
                const originalFieldName = getOriginalFieldNameHelper(field.text);
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

    async getReport(dto: ReportData) {
        switch (dto.format) {
            case `pdf`: {
                return await this.prepareData(dto.headers, dto.startDate, dto.endDate, (data, headers) => generatePdf(data, headers, this.robotoFontPath))
            }
            case `docx`: {
                return await this.prepareData(dto.headers, dto.startDate, dto.endDate, (data, headers) => generateDocx(data, headers))
            }
            case `xlsx`: {
                return await this.prepareData(dto.headers, dto.startDate, dto.endDate, (data, headers) => generateXlsx(data, headers))
            }
        }
    }

    private async prepareData(headers: ReportHeader[], startDate: string, endDate: string, generator: (data: string[][], headers: TableHeader[]) => Promise<Buffer> | PDFKit.PDFDocument) {

        const tableFields = headers.map(header => {
            const parts = header.value.split('.');
            if (parts[0] === 'relatedFileId') {
                return `file.${parts[1]}`;
            }
            else if (parts[0] === 'relatedProcessId') {
                return `process.${parts[1]}`;
            }
            else if (parts.length > 1) {
                return header.value;
            }
            else {
                return `event.${header.value}`;
            }
        })

        const tableHeaders = headers.map(header => {
            return {
                text: header.text,
                style: 'tableHeader'
            }
        })

        const events = await this.eventService.getEvents({
            selectFields: tableFields,
            startDate: startDate,
            endDate: endDate
        });

        const flattenData = this.formattingData(events, tableHeaders);
        return generator(flattenData, tableHeaders);
    }
}