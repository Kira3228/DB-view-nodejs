import { BaseConfigService } from "../shared/services/base-config.service";
import tableConfig from './config.json'


export class ActiveFileConfigService extends BaseConfigService {
  constructor() {
    super(tableConfig)
  }
}