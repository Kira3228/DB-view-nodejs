import { Request, Response, Router } from "express";
import { ActiveFilesService } from "./active-file.service";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { validate } from "../middleware/validate";
import { graphQueryRules, listActiveFilesQueryRules, updateStatusRules } from "./active-file.validator";
import { asyncHandler } from "../shared/utils/async-handler";
import { log } from "console";
import { BaseController } from "../shared/controllers/base.controller";
import { ActiveFileFilters } from "./interfaces/active-file.interface";

export class ActiveFileController extends BaseController {
    private readonly router: Router
    private readonly activeFileService: ActiveFilesService

    constructor() {
        super()
        this.router = Router()
        this.initializeRoutes()
        this.activeFileService = new ActiveFilesService()
    }

    initializeRoutes() {
        this.router.get('/active', validate(listActiveFilesQueryRules), asyncHandler(this.getActive.bind(this)));
        this.router.get('/archive', validate(listActiveFilesQueryRules), asyncHandler(this.getArchive.bind(this)));
        this.router.patch('/:id/status', validate(updateStatusRules), asyncHandler(this.updateStatus.bind(this)));
        this.router.get('/graph', validate(graphQueryRules), asyncHandler(this.getRelationshipGraph.bind(this)));
        this.router.get('/headers', validate(listActiveFilesQueryRules), asyncHandler(this.getHeaders.bind(this)));
        this.router.get('/presets', validate(graphQueryRules), asyncHandler(this.getPresetNames.bind(this)));
        this.router.get(`/filters`, this.getFilters.bind(this))
    }

    async getFilters(req: Request, res: Response): Promise<void> {
        await this.handleGetFilters(req, res, this.activeFileService)
    }

    async getHeaders(req: Request, res: Response): Promise<void> {
        await this.handleGetHeaders(req, res, this.activeFileService)
    }

    async getPresetNames(req: Request, res: Response): Promise<void> {
        await this.handleGetPresetNames(req, res, this.activeFileService)
    }

    async getActive(req: Request, res: Response): Promise<void> {
        try {
            const filters: ActiveFileFilters = { ...req.query }
            const result = await this.activeFileService.getActiveFile(filters)
            res.status(200).json(result)
        }
        catch (err) {
            console.error(err)
        }
    }

    async getArchive(req: Request, res: Response): Promise<void> {
        try {
            const filters: ActiveFileFilters = { ...req.query }
            const result = await this.activeFileService.getArchivedFile(filters)
            res.status(200).json(result)
        }
        catch (error) {
            console.error(error);
        }
    }

    async updateStatus(req: Request, res: Response): Promise<void> {
        try {
            const body: UpdateStatusDto = req.body
            const id: number = parseInt(req.params.id)

            const result = await this.activeFileService.updateStatus(body, id)
            res.status(200).json(result)
        }
        catch (error) {
            console.error(error);
        }
    }

    async getRelationshipGraph(req: Request, res: Response): Promise<void> {
        try {
            const { filePath, inode, filePathExceptions, preset } = req.query

            const result = await this.activeFileService.relationGraph(
                filePath as string,
                inode ? parseInt(inode as string) : undefined,
                filePathExceptions as string,
                preset as string
            )
            res.status(200).json(result)
        }
        catch (error) {
            console.error(error);
        }
    }

    getRouter() {
        return this.router;
    }
}