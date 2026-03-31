import { inject, injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { FileManagementServiceToken } from "../constants/tokens";
import { FileManagementService } from "./file-management.service";
import { Request, Response } from "express";
import { log } from "console";
import { FileManagementDto } from "./dto/file-management.dto";

@Controller(`/file`)
@injectable()
export class FileMamagementContoller {
  constructor(
    @inject(FileManagementServiceToken) private readonly fileManagementService: FileManagementService
  ) { }


  @Get(`/get/all`)
  async getFiles(req: Request<any, any, any, FileManagementDto>, res: Response) {
    const result = await this.fileManagementService.getFiles(req.query)
    res.status(200).json(result)
  }
}