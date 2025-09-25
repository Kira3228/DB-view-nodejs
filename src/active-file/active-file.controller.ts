import { Request, Response, Router } from "express";
import { ActiveFilesService } from "./active-file.service";
import { ActiveFileFilters } from "./interfaces/active-file.interface";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { validate } from "../middleware/validate";
import { graphQueryRules, listActiveFilesQueryRules, updateStatusRules } from "./active-file.validator";
import { asyncHandler } from "../shared/utils/async-handler";
import { BaseController } from "../shared/controllers/base.controller";
import { presetNameQueryRules } from "../shared/base.validator";

export class ActiveFileController extends BaseController {
    private readonly router: Router;
    private readonly activeFileService: ActiveFilesService;

    constructor() {
        super();
        this.router = Router();
        this.activeFileService = new ActiveFilesService();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/active', validate(listActiveFilesQueryRules), asyncHandler(this.getActive.bind(this)));
        this.router.get('/archive', validate(listActiveFilesQueryRules), asyncHandler(this.getArchive.bind(this)));
        this.router.patch('/:id/status', validate(updateStatusRules), asyncHandler(this.updateStatus.bind(this)));
        this.router.get('/graph', validate(graphQueryRules), asyncHandler(this.getRelationshipGraph.bind(this)));
        this.router.get('/headers', validate(presetNameQueryRules), asyncHandler(this.getHeaders.bind(this)));
        this.router.get('/presets', asyncHandler(this.getPresetNames.bind(this)));
        this.router.get('/filters', validate(presetNameQueryRules), asyncHandler(this.getFilters.bind(this)));
        this.router.get('/exceptions', validate(presetNameQueryRules), asyncHandler(this.getExceptions.bind(this)));
    }

    async getHeaders(req: Request, res: Response): Promise<void> {
        await this.handleGetHeaders(req, res, this.activeFileService);
    }

    async getFilters(req: Request, res: Response): Promise<void> {
        await this.handleGetFilters(req, res, this.activeFileService);
    }

    async getPresetNames(req: Request, res: Response): Promise<void> {
        await this.handleGetPresetNames(req, res, this.activeFileService);
    }

    async getExceptions(req: Request, res: Response): Promise<void> {
        await this.handleGetExceptions(req, res, this.activeFileService);
    }

    async getActive(req: Request, res: Response): Promise<void> {
        try {
            const filters: ActiveFileFilters = this.parseActiveFileFilters(req.query);
            const result = await this.activeFileService.getActiveFile(filters);
            res.status(200).json(result);
        } catch (error) {
        }
    }

    async getArchive(req: Request, res: Response): Promise<void> {
        try {
            const filters: ActiveFileFilters = this.parseActiveFileFilters(req.query);
            const result = await this.activeFileService.getArchivedFile(filters);
            res.status(200).json(result);
        } catch (error) {
        }
    }

    async updateStatus(req: Request, res: Response): Promise<void> {
        try {
            console.log(`начало`);

            const body: UpdateStatusDto = req.body;
            console.log(body);

            const id: number = parseInt(req.params.id);
            console.log(id);


            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    status: 400,
                    code: "INVALID_ID",
                    message: "Некорректный ID файла"
                });
                return;
            }

            const result = await this.activeFileService.updateStatus(body, id);
            res.status(200).json(result);
        } catch (error) {

        }
    }

    async getRelationshipGraph(req: Request, res: Response): Promise<void> {
        try {
            const { filePath, inode, filePathExceptions, preset } = req.query;

            const result = await this.activeFileService.relationGraph(
                filePath as string,
                inode ? parseInt(inode as string) : undefined,
                filePathExceptions as string,
                preset as string
            );

            res.status(200).json(result);
        } catch (error) {
        }
    }

    private parseActiveFileFilters(query: any): ActiveFileFilters {
        const { page, limit } = this.parsePaginationParams(query);

        return {
            page,
            limit,
            presetName: query.presetName as string,
            filePath: query.filePath as string,
            inode: query.inode ? parseInt(query.inode) : undefined,
            filePathException: this.parseArrayParam(query.filePathException),
            processPathException: this.parseArrayParam(query.processPathException)
        };
    }

    private parseArrayParam(param: any): string[] | undefined {
        if (!param) return undefined;
        if (typeof param === 'string') {
            return param.split(';').map(s => s.trim()).filter(Boolean);
        }
        if (Array.isArray(param)) {
            return param.map(s => String(s).trim()).filter(Boolean);
        }
        return undefined;
    }

    getRouter(): Router {
        return this.router;
    }
}
