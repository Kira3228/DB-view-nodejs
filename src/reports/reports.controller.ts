import { Request, Response, Router } from "express";
import { ReportService } from "./reports.service";
import { ExceptionsDto, ReportData } from "./report.dto";
import { validate } from "../middleware/validate";
import { exceptionsQueryRules } from "./report.validator";
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
        this.router.get(`/chains.pdf`, validate(exceptionsQueryRules), asyncHandler(this.distributionChainsExportPdf.bind(this)))
        this.router.get(`/chains.docx`, validate(exceptionsQueryRules), asyncHandler(this.distributionChainsExportDocx.bind(this)))
        this.router.get(`/chains.xlsx`, validate(exceptionsQueryRules), asyncHandler(this.distributionChainsExportXlsx.bind(this)))
        this.router.post(`/events`, this.getReport.bind(this))
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

    async getReport(req: Request<any, any, ReportData, any>, res: Response) {
        const buffer = await this.reportService.getReport(req.body)
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="system_logs.pdf"',
            'Content-Length': buffer.length
        });
        res.end(buffer);
    }
    getRouter() {
        return this.router;
    }
}   