import { Between, getRepository } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { FileRelationship } from "../entities/file_relationships.entity";
import { TChains } from "./report.types";

export class ChainsService {
  private filesRepo = getRepository(MonitoredFile)
  private relationRepo = getRepository(FileRelationship)

  public async getChains(startDate: string, endDate: string, minDepth: number, maxDepth: number) {
    const files = await this.filesRepo.find({
      where: {
        createdAt: Between(startDate, endDate)
      }
    })
    const rels = await this.relationRepo.find()
    const fileMap = new Map<number, MonitoredFile>();
    const childrenMap = new Map<number, number[]>()
    const chains: TChains[] = []
    const visitedGlobal = new Set<number>();

    files.map((file) => { fileMap.set(file.id, file) })

    rels.forEach(rel => {
      const parent = rel.parentFileId
      const child = rel.childFileId
      if (!childrenMap.has(parent)) {
        childrenMap.set(parent, []);
      }
      childrenMap.get(parent)?.push(child)
    });

    const originalFiles = await this.filesRepo.find({
      where: { isOriginalMarked: true }
    })

    for (const origin of originalFiles) {
      const originalId = origin.id

      const dfs = (currentId: number, path: number[], depth: number) => {
        if (visitedGlobal.has(currentId)) {
          return
        }
        visitedGlobal.add(currentId)

        const currentFile = fileMap.get(currentId)

        if (!currentFile) {
          return
        }
        const chainPath = path.map(id => fileMap.get(id)?.filePath || `unknown`);
        if (depth >= minDepth && depth <= maxDepth) {
          chains.push({
            ancestorId: origin.id,
            ancestorPath: origin.filePath,
            pathChain: [...chainPath],
            chainDepth: depth,
            createdAt: currentFile.createdAt.toISOString().replace('.000Z', '').replace(`T`, ' '),
          });
        }
        const children = childrenMap.get(currentId) || [];
        for (const childId of children) {
          dfs(childId, [...path, childId], depth + 1);
        }
      };

      dfs(originalId, [originalId], 0);
    }
    return chains
  }
}