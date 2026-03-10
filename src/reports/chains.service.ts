import { getRepository } from "typeorm";
import { MonitoredFile } from "../entities/monitored_file.entity";
import { FileRelationship } from "../entities/file_relationships.entity";
import { TChains } from "./report.types";

export class ChainsService {
  private filesRepo = getRepository(MonitoredFile)
  private relationRepo = getRepository(FileRelationship)

  async getChains(startDate?: string, endDate?: string) {
    const query = this
      .filesRepo
      .createQueryBuilder(`files`)

    if (startDate && endDate) {
      query.andWhere(`files.createdAt BETWEEN :startDate AND :endDate`, {
        startDate: startDate,
        endDate: endDate
      })
    }
    const files = await query.getMany()

    const fileMap = new Map<number, MonitoredFile>();

    files.forEach((file) => fileMap.set(file.id, file))

    const rels = await this.relationRepo.find()

    const childrenMap = new Map<number, number[]>()

    rels.forEach(rel => {
      const parent = rel.parentFileId
      const child = rel.childFileId
      if (fileMap.has(child)) {
        if (!childrenMap.has(parent)) {
          childrenMap.set(parent, [])
        }
        childrenMap.get(parent)?.push(child);

      }
    });

    const originalFiles = files.filter(f => f.isOriginalMarked)
    const chains: TChains[] = []

    const dfs = (currentId: number, currentPathIds: number[]) => {
      const currentFile = fileMap.get(currentId)
      if (!currentFile) return

      const children = childrenMap.get(currentId) || []

      if (children.length === 0) {
        const pathChainStrings = currentPathIds
          .map(id => fileMap.get(id)?.filePath)
          .filter((path): path is string => !!path)

        const ancestorId = currentPathIds[0];
        const ancestor = fileMap.get(ancestorId);
        if (ancestor) {
          chains.push({
            ancestorId: ancestor.id,
            ancestorPath: ancestor.filePath,
            pathChain: pathChainStrings,
            chainDepth: currentPathIds.length - 1,
            createdAt: currentFile.createdAt.toISOString().replace('.000Z', '').replace('T', ' '),
          });
        }
        return;

      }
      for (const childId of children) {
        if (!currentPathIds.includes(childId)) {
          dfs(childId, [...currentPathIds, childId]);
        }
      }
    }

    for (const origin of originalFiles) {
      dfs(origin.id, [origin.id]);
    }
    return chains;
  }
}