import { Request, Response, Router } from "express";
import { SystemLogService } from './system-log.service'
import { FiltersDto } from "./dto/filters.dto";
import { log } from "console";
import { validate } from "../middleware/validate";
import { filteredSystemLogQueryRules, selectedLogsQueryRules } from "./system-log.validator";
import { asyncHandler } from "../utils/async-handler";

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
        this.router.get('/headers', validate(filteredSystemLogQueryRules), asyncHandler(this.getHeaders.bind(this)));
        this.router.get('/search', validate(filteredSystemLogQueryRules), asyncHandler(this.getFilteredSystemLog.bind(this)));
        this.router.get('/export.csv', validate(selectedLogsQueryRules), asyncHandler(this.getSelectedLogs.bind(this)));
        this.router.get('/export/all', asyncHandler(this.exportCSV.bind(this)));
        this.router.get('/options', asyncHandler(this.getAllOptions.bind(this)));
        this.router.get('/presets', asyncHandler(this.getPresetNames.bind(this)));

    }

    async getHeaders(req: Request, res: Response) {
        try {
            const presetName = req.query.preset as string

            const result = await this.systemLogService.getHeaders(presetName);
            return res.status(201).json(result);
        }
        catch (err) {

        }
    }

    async getPresetNames(req: Request, res: Response) {
        try {
            const names = await this.systemLogService.getPresetNames()
            res.status(200).json(names)
        }
        catch (err) {

        }
    }


    async getSystemLog(req: Request, res: Response) {

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
            };
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

    getRouter() {
        return this.router;
    }
}

