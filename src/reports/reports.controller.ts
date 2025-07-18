import { Request, Response, Router } from "express";
import { ReportService } from "./reports.service";
import { log } from "console";
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
    }


    async exportPdf(req: Request, res: Response) {
        const pdfDoc = await this.reportService.getEvents()
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="system_logs.pdf"');
        pdfDoc.pipe(res)
        pdfDoc.end();
        // res.json(pdfDoc)
    }

    async exportDocx(req: Request, res: Response) {
    try {
        const docBuffer = await this.reportService.generateDocxReport();
        
        // Проверка (должно проходить теперь)
     

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            "Content-Disposition", 
            "attachment; filename=report.docx"
        );
        
        res.end(docBuffer);
    } catch (error) {
        console.error("Ошибка генерации DOCX:", error);
        res.status(500).send("Не удалось создать файл");
    }
}

    getRouter() {
        return this.router;
    }
}