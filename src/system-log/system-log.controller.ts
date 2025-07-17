import { Request, Response, Router } from "express";
import { SystemLogService } from './system-log.service'
import { FiltersDto } from "./dto/filters.dto";
import { log } from "console";

const express = require('express');

export class SystemLogController {
    constructor() {
        this.systemLogService = new SystemLogService();
        this.router = express.Router();
        this.initializeRoutes();
    }
    router: Router
    systemLogService: SystemLogService

    initializeRoutes() {
        this.router.get('/', this.getSystemLog.bind(this));
        this.router.get('/filtered', this.getFilteredSystemLog.bind(this));
        this.router.get('/export/selected', this.getSelectedLogs.bind(this));
        this.router.get('/export/all', this.exportCSV.bind(this));
        this.router.get('/get/options', this.getAllOptions.bind(this));
        this.router.get(`/get/pdf`, this.getPdfReport.bind(this))
    }

    async getSystemLog(req: Request, res: Response) {
        console.log('Fetching system logs...');
        try {
            const result = await this.systemLogService.getSystemEvents();
            return res.status(201).json(result);
        } catch (error) {
            console.error("Error in getSystemLog:", error);
            return res.status(500).json({ error: error.message || "Internal server error" });
        }
    }

    async getFilteredSystemLog(req: Request, res: Response) {
        try {
            const filters: FiltersDto = {
                ...req.query,
                ...req.body,
            };
            log(filters)
            const result = await this.systemLogService.getFilteredSystemEvents(filters, filters.page, filters.limit);
            return res.status(200).json(result);
        } catch (error) {
            console.error("Error in getFilteredSystem:", error);
            return res.status(500).json({
                error: error.message || "Internal server error"
            });
        }
    }

    async getSelectedLogs(req: Request, res: Response) {
        try {
            const ids = req.query.ids && typeof req.query.ids === 'string' ?
                req.query.ids.split(',').map(Number) : undefined;
            const result = await this.systemLogService.getSelectedEvents(ids);
            const csv = result.headers + '\n' + result.rows;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
            res.send(csv);
        } catch (error) {
            console.error("Error in getSelectedLogs:", error);
            return res.status(500).json({
                error: error.message || "Internal server error"
            });
        }
    }

    async exportCSV(req: Request, res: Response) {
        try {
            const result = await this.systemLogService.getAllCSV();
            const csv = result.headers + '\n' + result.rows;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
            res.send(csv);
        } catch (error) {
            console.error("Error in exportCSV:", error);
            return res.status(500).json({
                error: error.message || "Internal server error"
            });
        }
    }
    async getAllOptions(req: Request, res: Response) {
        try {
            const result = await this.systemLogService.getAllEventTypeOption()
            return res.json(result)
        }
        catch (error) {
            console.error("Error in exportCSV:", error);
            return res.status(500).json({
                error: error.message || "Internal server error"
            });
        }
    }
    async getPdfReport(req: Request, res: Response) {
        try {
            // Получаем PDF документ из сервиса
            const pdfDoc = await this.systemLogService.generatePdfReport();

            // Устанавливаем правильные заголовки для PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="system_logs.pdf"');

            pdfDoc.pipe(res)
            pdfDoc.end()


        } catch (error) {
            console.error('Ошибка при генерации PDF:', error);
            res.status(500).send('Ошибка при генерации отчета');
        }


    }
    getRouter() {
        return this.router;
    }
}

