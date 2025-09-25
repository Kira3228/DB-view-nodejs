import { Request, Response, Router } from "express";
import { ReportService } from "./reports.service";
import { ExceptionsDto, ReportDto } from "./report.dto";
import { validate } from "../middleware/validate";
import { eventsReportQueryRules, exceptionsQueryRules } from "./report.validator";
import { asyncHandler } from "../shared/utils/async-handler";
const express = require('express');

export class ReportController {
    constructor() {
        this.reportService = new ReportService()
        this.router = express.Router();
        this.initializeRoutes()
    }
    router: Router
    reportService: ReportService
    initializeRoutes() {
        this.router.get(`/events.pdf`, validate(eventsReportQueryRules), asyncHandler(this.exportPdf.bind(this)))
        this.router.get(`/events.docx`, validate(eventsReportQueryRules), asyncHandler(this.exportDocx.bind(this)))
        this.router.get(`/events.xlsx`, validate(eventsReportQueryRules), asyncHandler(this.exportXlsx.bind(this)))
        this.router.get(`/chains.pdf`, validate(exceptionsQueryRules), asyncHandler(this.distributionChainsExportPdf.bind(this)))
        this.router.get(`/chains.docx`, validate(exceptionsQueryRules), asyncHandler(this.distributionChainsExportDocx.bind(this)))
        this.router.get(`/chains.xlsx`, validate(exceptionsQueryRules), asyncHandler(this.distributionChainsExportXlsx.bind(this)))
    }

    async exportPdf(req: Request, res: Response) {
        try {
            const filters: Partial<ReportDto> = { ...req.query };
            const buffer = await this.reportService.getPdfReport(filters);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="system_logs.pdf"',
                'Content-Length': buffer.length
            });
            res.end(buffer);
        } catch (error) {
            console.error('Ошибка генерации PDF:', error);
            res.status(500).send('Не удалось создать файл');
        }
    }

    async exportDocx(req: Request, res: Response) {
        try {
            const filters = { ...req.query }
            const buffer = await this.reportService.getDocxReport(filters);
            if (!Buffer.isBuffer(buffer)) {
                throw new Error('Generated content is not a valid Buffer');
            }
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename=report.docx',
                'Content-Length': buffer.length
            });
            res.end(buffer);
        } catch (error) {
            console.error("Ошибка генерации DOCX:", error);
            res.status(500).send("Не удалось создать файл");
        }
    }

    async exportXlsx(req: Request, res: Response) {
        try {
            const filters: Partial<ReportDto> = { ...req.query }
            const buffer = await this.reportService.getXlsxReport(filters)
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=report.xlsx`);
            res.send(buffer);
            res.end();
        } catch (error) {
            console.error("Ошибка генерации XLSX:", error);
            res.status(500).send("Не удалось создать файл");
        }
    }

    async distributionChainsExportPdf(req: Request, res: Response) {
        try {
            const filters: Partial<ExceptionsDto> = { ...req.query }
            const buffer = await this.reportService.getChainsPdf(filters)
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="chains.pdf"',
                'Content-Length': buffer.length
            });
            res.end(buffer);
        }
        catch (error) {
            console.error("Ошибка генерации PDF:", error);
            res.status(500).send("Не удалось создать файл");
        }
    }

    async distributionChainsExportDocx(req: Request, res: Response) {
        const filters: Partial<ExceptionsDto> = { ...req.query }
        try {
            const buffer = await this.reportService.getChainsDocx(filters);
            if (!Buffer.isBuffer(buffer)) {
                throw new Error('Generated content is not a valid Buffer');
            }
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename=report.docx',
                'Content-Length': buffer.length
            });
            res.end(buffer);
        } catch (error) {
            console.error("Ошибка генерации DOCX:", error);
            res.status(500).send("Не удалось создать файл");
        }
    }
    async distributionChainsExportXlsx(req: Request, res: Response) {
        try {
            const filters: Partial<ExceptionsDto> = { ...req.query }
            const buffer = await this.reportService.getChainsXlsx(filters)
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=report.xlsx`);
            res.send(buffer);
            res.end();
        } catch (error) {
            console.error("Ошибка генерации XLSX:", error);
            res.status(500).send("Не удалось создать файл");
        }
    }
    getRouter() {
        return this.router;
    }
}