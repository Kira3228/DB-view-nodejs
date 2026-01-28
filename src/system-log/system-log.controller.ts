import { Request, Response, Router } from "express";
import { SystemLogService } from './system-log.service';
import { validate } from "../middleware/validate";
import { selectedLogsQueryRules } from "./system-log.validator";
import { asyncHandler } from "../shared/utils/async-handler";
import { BaseController } from "../shared/controllers/base.controller";
import { SystemEventDto } from "./dto/system-event.dto";

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
        this.router.get('/export.csv', validate(selectedLogsQueryRules), asyncHandler(this.getSelectedLogs.bind(this)));
        this.router.get('/export/all', asyncHandler(this.exportAllCSV.bind(this)));
        this.router.get('/options', asyncHandler(this.getAllEventTypes.bind(this)));
        this.router.get('/presets', asyncHandler(this.getPresetNames.bind(this)));
        this.router.get('/filters', asyncHandler(this.getFilters.bind(this)));
        this.router.get('/exceptions', asyncHandler(this.getExceptions.bind(this)));
        this.router.get('/types', this.getSystemEventsTypes.bind(this))
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

    async getAllSystemLogs(req: Request<any, any, any, SystemEventDto>, res: Response): Promise<void> {
        const result = await this.systemLogService.getSystemEvents(req.query);
        res.status(200).json(result);
    }

    async getSystemEventsTypes(req: Request, res: Response) {
        const result = await this.systemLogService.getSystemEventsTypes()
        res.status(200).json(result)
    }

    async getSelectedLogs(req: Request<any, any, any, { ids: number[] }>, res: Response): Promise<void> {
        const result = await this.systemLogService.getSelectedEvents(req.query.ids);
        this.sendCSVResponse(res, result, 'selected_logs.csv');
    }

    async exportAllCSV(req: Request, res: Response): Promise<void> {
        const result = await this.systemLogService.getAllCSV();
        this.sendCSVResponse(res, result, 'all_logs.csv');

    }

    async getAllEventTypes(req: Request, res: Response): Promise<void> {
        const result = await this.systemLogService.getAllEventTypeOption();
        res.status(200).json(result);
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
