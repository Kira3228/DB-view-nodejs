import { SystemEvent } from "../entities/system_events.entity";
import * as path from 'path';
import { ReportDto, ExceptionsDto } from "./report.dto";
import { TableHeader, TChains } from "./report.types";
import { buildEventSelectHelper } from "./utils/build-event-select-helper";
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
import { exceptionsToArray } from "./utils/exceptions-to-array";

export class ReportService {
    private chainService: ChainsService
    private eventService: EventService
    private readonly robotoFontPath = path.resolve(__dirname, '../assets/Roboto.ttf');
    private readonly chainsHeaders = [`Глубина`, `Цепочка`, `Дата создания`]
    constructor() {
        this.chainService = new ChainsService()
        this.eventService = new EventService()
    }
    async getPdfReport(filters: Partial<ReportDto>) {
        return this.generateReport(filters, (data, headers) => generatePdf(data, headers, this.robotoFontPath))
    }

    async getDocxReport(filters: Partial<ReportDto>) {
        return this.generateReport(filters, (data, headers) => generateDocx(data, headers))
    }

    async getXlsxReport(filters: Partial<ReportDto>) {
        return this.generateReport(filters, (data, headers) => generateXlsx(data, headers))
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
        const dateParams = {
            startDate: filters.startDate ? normalizeDate(filters.startDate) : null,
            endDate: filters.endDate ? normalizeDate(filters.endDate) : null
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (!isNaN(startDate.getTime())) {
                dateParams.startDate = normalizeDate(filters.startDate)
            }
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            if (!isNaN(endDate.getTime())) {
                dateParams.endDate = normalizeDate(filters.endDate)
            }
        }

        const chains = await this.chainService.getChains(dateParams.startDate, dateParams.endDate, filters.minDepth, filters.maxDepth)

        return generator(chains)
    }

    private async generateReport(filters: Partial<ReportDto>, generator: (data: string[][], headers: TableHeader[]) => Promise<Buffer> | PDFKit.PDFDocument) {
        const { selectFields, fieldNames } = buildEventSelectHelper(filters);
        const safeFormatDate = (dateString: string): string | null => {
            if (!dateString) return null;

            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateString);
                return null;
            }

            return normalizeDate(date)
        };

        const dateRange = {
            startDate: safeFormatDate(filters.startDate),
            endDate: safeFormatDate(filters.endDate)
        };

        const excludeFilePaths = exceptionsToArray(filters.fileExceptions);
        const excludeProcessPaths = exceptionsToArray(filters.processExceptions);

        const events = await this.eventService.getEvents(
            selectFields,
            excludeFilePaths,
            excludeProcessPaths,
            dateRange.startDate,
            dateRange.endDate
        );

        const flattenData = this.preparePdfData(events, fieldNames);

        return generator(flattenData, fieldNames);
    }

    private preparePdfData(events: SystemEvent[], fieldNames: { text: string, style: string }[]): string[][] {
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
}