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
    }


    async exportPdf(req: Request, res: Response) {
        const pdfDoc = await this.reportService.getEvents()
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="system_logs.pdf"');
        pdfDoc.pipe(res)
        pdfDoc.end();
        // res.json(pdfDoc)
    }

 
    getRouter() {
        return this.router;
    }
}