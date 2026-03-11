import { Request, Response, Router } from "express";
import { ActiveFilesService } from "./active-file.service";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { BaseController } from "../shared/controllers/base.controller";
import { ActiveFileDtoFilter } from "./dto/acrive-file.dto";
import { ChainsDto } from "./dto/chains.dto";
import { Controller } from "../shared/utils/routing";
import { inject, injectable, InjectionToken } from "tsyringe";

export const ActiveFilesServiceToken: InjectionToken<ActiveFilesService> = `ActiveFilesServiceToken`

@Controller(`/files`)
@injectable()
export class ActiveFileController extends BaseController {
    private readonly router: Router;

    constructor(@inject(ActiveFilesServiceToken) private readonly activeFileService: ActiveFilesService) {
        super();
        this.router = Router();
        this.activeFileService = new ActiveFilesService();
    }

    // async getHeaders(req: Request, res: Response): Promise<void> {
    //     await this.handleGetHeaders(req, res, this.activeFileService);
    // }

    // async getFilters(req: Request, res: Response): Promise<void> {
    //     await this.handleGetFilters(req, res, this.activeFileService);
    // }

    // async getPresetNames(req: Request, res: Response): Promise<void> {
    //     await this.handleGetPresetNames(req, res, this.activeFileService);
    // }

    // async getExceptions(req: Request, res: Response): Promise<void> {
    //     await this.handleGetExceptions(req, res, this.activeFileService);
    // }

    // async getActive(req: Request<any, any, any, ActiveFileDtoFilter>, res: Response): Promise<void> {
    //     const result = await this.activeFileService.getActiveFile(req.query)
    //     res.status(200).json(result);
    // }

    // async updateStatus(req: Request<{ id: number }, any, UpdateStatusDto>, res: Response): Promise<void> {
    //     const result = await this.activeFileService.updateStatus(req.body, Number(req.params.id));
    //     res.status(200).json(result);
    // }

    // async getTreeNode(req: Request<any, any, any, ChainsDto>, res: Response) {
    //     const allChains = await this.activeFileService.getTreeNode(req.query)
    //     res.status(200).json(allChains);
    // }

    // async getFileChains(req: Request, res: Response) {
    //     const allChains = await this.activeFileService.getFileChains()
    //     res.status(200).json(allChains);
    // }
}
