import settings from "./../configs/settings.config.json"
import { injectable, InjectionToken } from "tsyringe"
import fs from "fs"
import path from "path"
import { log } from "console"

export interface ISettingsRepository {
  getAll(): ISettingsJson
  updateSettings(data: Partial<ISettingsJson>): ISettingsJson
}

export interface ISettingsJson {
  monitoringPaths: string[],
  exceptions: string[],
  dataBase: { path: string },
  interaface: { rowsQuantity: number, virtualScrolling: boolean }
}

export const JsonSettingsRepositoryToken: InjectionToken<JsonSettingsRepository> = "JsonSettingsRepositoryToken"

@injectable()
export class JsonSettingsRepository implements ISettingsRepository {
  private data: ISettingsJson = settings
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(__dirname, "../configs/settings.config.json");

    if (fs.existsSync(this.filePath)) {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      this.data = JSON.parse(raw);
    } else {
      this.data = settings;
    }
  }
  getAll(): ISettingsJson {
    return this.data
  }

  updateSettings(data: Partial<ISettingsJson>): ISettingsJson {
    this.data = { ...this.data, ...data }
    log(data)
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8")
    }
    catch (err) {
      console.error("Ошибка при сохранении настроек:", err)

    }

    return this.data

  }
} 