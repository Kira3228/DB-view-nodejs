import { getRepository } from "typeorm";
import { SystemEvent } from "../entities/system_events.entity";

export class EventService {
  private eventRepo = getRepository(SystemEvent);

  public async getEvents(
    selectFields: string[],
    excludeFilePaths: string[] = [],
    excludeProcessPaths: string[] = [],
    startDate?: string,
    endDate?: string
  ) {
    try {
      let query = this.eventRepo
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.relatedFileId', 'file')
        .leftJoinAndSelect('event.relatedProcessId', 'process');

      if (excludeFilePaths && excludeFilePaths.length > 0) {
        const fileConds: string[] = [];
        const params: Record<string, any> = {};
        excludeFilePaths.forEach((path, idx) => {
          const param = `filePathExclude${idx}`;
          params[param] = path.endsWith('%') ? path : `${path}%`;
          fileConds.push(`file.filePath NOT LIKE :${param}`);
        });

        query = query.andWhere(
          `(file.filePath IS NULL OR (${fileConds.join(' AND ')}))`,
          params
        );
      }

      if (excludeProcessPaths && excludeProcessPaths.length > 0) {
        const procConds: string[] = [];
        const params: Record<string, any> = {};
        excludeProcessPaths.forEach((path, idx) => {
          const param = `processPathExclude${idx}`;
          params[param] = path.endsWith('%') ? path : `${path}%`;
          procConds.push(`process.executablePath NOT LIKE :${param}`);
        });

        query = query.andWhere(
          `(process.executablePath IS NULL OR (${procConds.join(' AND ')}))`,
          params
        );
      }

      if (startDate && endDate) {
        query = query.andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });
      }

      const events = await query.select(selectFields).getMany();
      return events;
    } catch (error) {
      console.error('Error in getEvents:', error);
      throw error;
    }
  }
}