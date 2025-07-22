import { Request, Response, Router } from "express";
import { ReportService } from "./reports.service";
import { log } from "console";
import { ReportDto } from "./report.dto";
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
        this.router.get(`/pdf`, this.exportPdf.bind(this))
        this.router.get(`/docx`, this.exportDocx.bind(this))
        this.router.get(`/xlsx`, this.exportXlsx.bind(this))
    }

    async exportPdf(req: Request, res: Response) {
        const filters: Partial<ReportDto> = { ...req.query }

        const pdfDoc = await this.reportService.getPdfReport(filters)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="system_logs.pdf"');
        pdfDoc.pipe(res)
        pdfDoc.end();
    }

    async exportDocx(req: Request, res: Response) {
        try {
            // const filters: Partial<ReportDto> = { ...req.query }
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
    getRouter() {
        return this.router;
    }
}