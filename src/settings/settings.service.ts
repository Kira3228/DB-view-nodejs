import { inject, injectable, InjectionToken } from "tsyringe";
import { ISettingsJson, ISettingsRepository, JsonSettingsRepositoryToken } from "./JsonSettingsRepository";
import { log } from "console";

export const SettngsServiceToken: InjectionToken<SettngsService> = 'SettngsServiceToken'

@injectable()
export class SettngsService {
  constructor(@inject(JsonSettingsRepositoryToken) private readonly settingsRepo: ISettingsRepository
  ) { }

  async getAll(): Promise<ISettingsJson> {
    const result = this.settingsRepo.getAll()
    log(result)
    return result
  }

  async updateSettings(data: any): Promise<ISettingsJson> {
    log(data)
    const result = this.settingsRepo.updateSettings(data)
    return result
  }

}