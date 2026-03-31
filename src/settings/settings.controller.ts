import { Controller, Get, Patch } from "../shared/utils/routing";
import { inject, injectable } from "tsyringe";
import { SettngsService, SettngsServiceToken } from "./settings.service";
import { Request, Response } from "express";
import { ISettingsJson } from "./JsonSettingsRepository";
import { log } from "console";

@Controller(`/settings`)
@injectable()
export class SettingsController {
  constructor(
    @inject(SettngsServiceToken) private readonly settingsService: SettngsService
  ) { }

  @Get(`/all`)
  async getAll(req: Request, res: Response) {
    const settings = await this.settingsService.getAll()
    res.status(200).send(settings)
  }

  @Patch(`/update`)
  async updateSettings(req: Request<any, any, Partial<ISettingsJson>, any>, res: Response) {
    log(req.body)
    const settings = await this.settingsService.updateSettings(req.body)
    res.status(200).send(settings)

  }
}