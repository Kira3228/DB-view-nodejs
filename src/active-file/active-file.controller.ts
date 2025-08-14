import { Request, Response, Router } from "express";
import { ActiveFilesService } from "./active-file.service";
import { ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";
import { validate } from "../middleware/validate";
import { graphQueryRules, listActiveFilesQueryRules, updateStatusRules } from "./active-file.validator";

export class ActiveFileController {
    constructor() {
        this.router = Router()
        this.initializeRoutes()
        this.activeFileService = new ActiveFilesService()
    }
    router: Router
    activeFileService: ActiveFilesService

    initializeRoutes() {
        this.router.get('/get/active', validate(listActiveFilesQueryRules), this.getActive.bind(this));
        this.router.get('/get/archive', validate(listActiveFilesQueryRules), this.getArchive.bind(this));
        this.router.patch('/get/active/update/:id', validate(updateStatusRules), this.updateStatus.bind(this));
        this.router.get('/get/graph', validate(graphQueryRules), this.graph.bind(this));
    }

    async getActive(req: Request, res: Response) {
        const filters: Partial<ActiveFileFilters> = { ...req.query }
        const result = await this.activeFileService.getActiveFiles(filters, filters.page, filters.limit)
        return res.status(200).json(result)
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
        const filePath = body.filePath
        const inode = body.inode
        const result = await this.activeFileService.graph(filePath as string, Number(inode), body.filePathExceptions as string);
        return res.status(200).json(result)
    }

    getRouter() {
        return this.router;
    }

}