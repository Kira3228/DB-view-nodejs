import { getRepository } from "typeorm";
import { FileChainsView } from "../entities/FileChainsView";

export class FileChainsService {
  private fileChainRepository = getRepository(FileChainsView);

  async getAllFileChains() {
    return await this.fileChainRepository.find()
  }
}