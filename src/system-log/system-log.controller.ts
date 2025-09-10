// system-log/system-log.controller.ts
import { Request, Response, Router } from "express";
import { SystemLogService } from './system-log.service';
import { SystemLogFilters } from "./interfaces/system-log.interface";
import { validate } from "../middleware/validate";
import { filteredSystemLogQueryRules, selectedLogsQueryRules } from "./system-log.validator";
import { asyncHandler } from "../shared/utils/async-handler";
import { BaseController } from "../shared/controllers/base.controller";

export class SystemLogController extends BaseController {
    private readonly router: Router;
    private readonly systemLogService: SystemLogService;

    constructor() {
        super();
        this.router = Router();
        this.systemLogService = new SystemLogService();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', asyncHandler(this.getAllSystemLogs.bind(this)));
        this.router.get('/headers', asyncHandler(this.getHeaders.bind(this)));
        this.router.get('/search', validate(filteredSystemLogQueryRules), asyncHandler(this.getFilteredSystemLog.bind(this)));
        this.router.get('/export.csv', validate(selectedLogsQueryRules), asyncHandler(this.getSelectedLogs.bind(this)));
        this.router.get('/export/all', asyncHandler(this.exportAllCSV.bind(this)));
        this.router.get('/options', asyncHandler(this.getAllEventTypes.bind(this)));
        this.router.get('/presets', asyncHandler(this.getPresetNames.bind(this)));
        this.router.get('/filters', asyncHandler(this.getFilters.bind(this)));
        this.router.get('/exceptions', asyncHandler(this.getExceptions.bind(this)));
    }

    async getHeaders(req: Request, res: Response): Promise<void> {
        await this.handleGetHeaders(req, res, this.systemLogService);
    }

    async getFilters(req: Request, res: Response): Promise<void> {
        await this.handleGetFilters(req, res, this.systemLogService);
    }

    async getPresetNames(req: Request, res: Response): Promise<void> {
        await this.handleGetPresetNames(req, res, this.systemLogService);
    }

    async getExceptions(req: Request, res: Response): Promise<void> {
        await this.handleGetExceptions(req, res, this.systemLogService);
    }

    async getAllSystemLogs(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.systemLogService.getSystemEvents();
            res.status(200).json(result);
        } catch (error) {

        }
    }

    async getFilteredSystemLog(req: Request, res: Response): Promise<void> {
        try {
            const filters: SystemLogFilters = this.parseSystemLogFilters(req.query);
            const result = await this.systemLogService.getFilteredSystemEvents(filters);
            res.status(200).json(result);
        } catch (error) {
        }
    }

    async getSelectedLogs(req: Request, res: Response): Promise<void> {
        try {
            const ids = this.parseIdsParam(req.query.ids);
            if (!ids || ids.length === 0) {
                res.status(400).json({
                    status: 400,
                    code: "INVALID_PARAMS",
                    message: "Не указаны ID событий для экспорта"
                });
                return;
            }

            const result = await this.systemLogService.getSelectedEvents(ids);
            this.sendCSVResponse(res, result, 'selected_logs.csv');
        } catch (error) {

        }
    }

    async exportAllCSV(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.systemLogService.getAllCSV();
            this.sendCSVResponse(res, result, 'all_logs.csv');
        } catch (error) {

        }
    }

    async getAllEventTypes(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.systemLogService.getAllEventTypeOption();
            res.status(200).json(result);
        } catch (error) {
        }
    }

    private parseSystemLogFilters(query: any): SystemLogFilters {
        const { page, limit } = this.parsePaginationParams(query);

        return {
            page,
            limit,
            presetName: query.presetName as string,
            eventType: query.eventType as string,
            status: query.status as string,
            filePath: query.filePath as string,
            fileSystemId: query.fileSystemId as string,
            startDate: query.startDate as string,
            endDate: query.endDate as string,
            relatedFileId: query.relatedFileId ? {
                status: query.relatedFileId.status as string,
                filePath: query.relatedFileId.filePath as string,
                fileSystemId: query.relatedFileId.fileSystemId as string
            } : undefined
        };
    }

    private parseIdsParam(idsParam: any): number[] | undefined {
        if (!idsParam) return undefined;

        if (typeof idsParam === 'string') {
            return idsParam.split(',')
                .map(id => parseInt(id.trim()))
                .filter(id => !isNaN(id) && id > 0);
        }

        if (Array.isArray(idsParam)) {
            return idsParam
                .map(id => parseInt(String(id).trim()))
                .filter(id => !isNaN(id) && id > 0);
        }

        return undefined;
    }

    private sendCSVResponse(res: Response, csvData: any, filename: string): void {
        const csv = csvData.headers + '\n' + csvData.rows;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    getRouter(): Router {
        return this.router;
    }
}
