import { Request, Response } from "express";
import { SystemLogService } from "../../system-log/system-log.service";
import { ActiveFilesService } from "../../active-file/active-file.service";

type CommonService = SystemLogService | ActiveFilesService


export abstract class BaseController {
  protected async handleGetHeaders(req: Request, res: Response, service: CommonService): Promise<void> {
    try {
      const presetName = req.query.presetName as string
      const headers = await service.getHeaders(presetName)
      res.status(200).json(headers)
    }
    catch (errors) {
      console.error(errors);
    }
  }

  protected async handleGetFilters(req: Request, res: Response, service: CommonService): Promise<void> {
    try {
      const presetName = req.query.presetName as string
      const filters = await service.getFilters(presetName)
      res.status(200).json(filters)
    }
    catch (error) {
      console.error(error);
    }
  }

  protected async handleGetPresetNames(req: Request, res: Response, service: CommonService): Promise<void> {
    try {
      const names = await service.getPresetNames()
      res.status(200).json(names)
    }
    catch (error) {
      console.error(error);
    }
  }

  protected async handleGetExceptions(req: Request, res: Response, service: CommonService): Promise<void> {
    try {
      const presetName = req.query.presetName as string
      const exceptions = await service.getExceptions(presetName)
      res.status(200).json(exceptions)
    }
    catch (error) {
      console.error(error);
    }
  }  
}