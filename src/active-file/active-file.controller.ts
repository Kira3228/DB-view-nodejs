import { Request, Response, Router } from "express";
import { ActiveFilesService } from "./active-file.service";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { validate } from "../middleware/validate";
import { listActiveFilesQueryRules, updateStatusRules } from "./active-file.validator";
import { asyncHandler } from "../shared/utils/async-handler";
import { BaseController } from "../shared/controllers/base.controller";
import { ActiveFileDtoFilter } from "./dto/acrive-file.dto";
import { ChainsDto } from "./dto/chains.dto";

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
        this.router.patch('/:id/status', validate(updateStatusRules), asyncHandler(this.updateStatus.bind(this)));
        this.router.get('/headers', asyncHandler(this.getHeaders.bind(this)));
        this.router.get('/presets', asyncHandler(this.getPresetNames.bind(this)));
        this.router.get('/filters', asyncHandler(this.getFilters.bind(this)));
        this.router.get('/exceptions', asyncHandler(this.getExceptions.bind(this)));
        this.router.get('/details', this.getTreeNode.bind(this));
        this.router.get('/chain', this.getFileChains.bind(this));
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

    async getActive(req: Request<any, any, any, ActiveFileDtoFilter>, res: Response): Promise<void> {
        const result = await this.activeFileService.getActiveFile(req.query)
        res.status(200).json(result);
    }

    async updateStatus(req: Request<{ id: number }, any, UpdateStatusDto>, res: Response): Promise<void> {
        const result = await this.activeFileService.updateStatus(req.body, Number(req.params.id));
        res.status(200).json(result);
    }

    async getTreeNode(req: Request<any, any, any, ChainsDto>, res: Response) {
        const allChains = await this.activeFileService.getTreeNode(req.query)
        res.status(200).json(allChains);
    }

    async getFileChains(req: Request, res: Response) {
        const allChains = await this.activeFileService.getFileChains()
        res.status(200).json(allChains);
    }

    getRouter(): Router {
        return this.router;
    }
}
