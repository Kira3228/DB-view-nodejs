import { Request, Response, Router } from "express";
import { ActiveFilesService } from "./active-file.service";
import { ActiveFileFilters } from "./dto/acrive-file.dto";
import { UpdateStatusDto } from "./dto/updateStatus.dto";

export class ActiveFileController {
    constructor() {
        this.router = Router()
        this.initializeRoutes()
        this.activeFileService = new ActiveFilesService()
    }
    router: Router
    activeFileService: ActiveFilesService

    initializeRoutes() {
        this.router.get('/get', this.get.bind(this));
        this.router.get('/get/archive', this.getArchive.bind(this));
        this.router.patch('/get/active/update/:id', this.updateStatus.bind(this));
    }

    async get(req: Request, res: Response) {
        const filters: ActiveFileFilters = { ...req.query }
        const result = await this.activeFileService.getActiveFiles(filters, filters.page, filters.limit)
        return res.status(200).json(result)
    }

    async getArchive(req: Request, res: Response) {
        const filters: ActiveFileFilters = { ...req.query }
        const result = this.activeFileService.getArchive(filters, filters.page, filters.limit)
        return res.status(200).json(result)
    }
    async updateStatus(req: Request, res: Response) {
        const body: UpdateStatusDto = req.body
        const id: number = Number(req.params)
        const result = this.activeFileService.updateStatus(body, id)
        return res.status(200).json(result)
    }
    getRouter() {
        return this.router;
    }

}