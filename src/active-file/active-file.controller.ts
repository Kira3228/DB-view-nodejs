import { Request, Response, Router } from "express";
import { ActiveFilesService } from "./active-file.service";
import { ActiveFileCongitDto, ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { validate } from "../middleware/validate";
import { graphQueryRules, listActiveFilesQueryRules, updateStatusRules } from "./active-file.validator";
import { asyncHandler } from "../shared/utils/async-handler";
import { log } from "console";

export class ActiveFileController {
    constructor() {
        this.router = Router()
        this.initializeRoutes()
        this.activeFileService = new ActiveFilesService()
    }
    router: Router
    activeFileService: ActiveFilesService

    initializeRoutes() {
        this.router.get('/active', validate(listActiveFilesQueryRules), asyncHandler(this.getActive.bind(this)));
        this.router.get('/archive', validate(listActiveFilesQueryRules), asyncHandler(this.getArchive.bind(this)));
        this.router.patch('/:id/status', validate(updateStatusRules), asyncHandler(this.updateStatus.bind(this)));
        this.router.get('/graph', validate(graphQueryRules), asyncHandler(this.graph.bind(this)));
        this.router.get('/headers', validate(listActiveFilesQueryRules), asyncHandler(this.getHeaders.bind(this)));
        this.router.get('/presets', validate(graphQueryRules), asyncHandler(this.getPresetNames.bind(this)));
        this.router.get(`/filters`, this.getFilters.bind(this))
    }

    async getFilters(req: Request, res: Response) {
        try {
            const presetName: string = req.query.presetName as string

            const filters = await this.activeFileService.getFilters(presetName)
            res.status(200).json(filters)
        }
        catch (err) {

        }
    }

    async getHeaders(req: Request, res: Response) {
        try {
            const presetName = req.query.presetName as string
            log(presetName)
            const headers = await this.activeFileService.getHeaders(presetName)
            res.status(200).json(headers)
        }
        catch (err) {

        }
    }

    async getPresetNames(req: Request, res: Response) {
        try {
            const names = await this.activeFileService.getPresetNames()
            res.status(200).json(names)
        }
        catch (err) {

        }
    }

    async getActive(req: Request, res: Response) {
        try {
            const filters: Partial<ActiveFileFilters> = { ...req.query }
            const result = await this.activeFileService.getActiveFiles(filters, filters.page, filters.limit)
            return res.status(200).json(result)
        }
        catch (err) {
            console.error(err);

        }

    }

    async getArchive(req: Request, res: Response) {
        const filters: Partial<ActiveFileFilters> = { ...req.query }
        const result = await this.activeFileService.getArchive(filters, filters.page, filters.limit)
        return res.status(200).json(result)
    }

    async updateStatus(req: Request, res: Response) {
        const body: UpdateStatusDto = req.body
        const id: number = Number(req.params.id)
        const result = await this.activeFileService.updateStatus(body, id)
        return res.status(200).json(result)
    }

    async graph(req: Request, res: Response) {
        const body = req.query
        const preset = body.preset
        const filePath = body.filePath
        const inode = body.inode
        const result = await this.activeFileService.relationGraph(filePath as string, Number(inode), body.filePathExceptions as string, preset as string);
        return res.status(200).json(result)
    }

    getRouter() {
        return this.router;
    }

}