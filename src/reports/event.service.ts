import { getRepository } from "typeorm";
import { SystemEvent } from "../entities/system_events.entity";
import { log } from "console";

export class EventService {
  private eventRepo = getRepository(SystemEvent);

  async getEvents(settings: {
    selectFields: string[],
    excludeFilePaths?: string[],
    excludeProcessPaths?: string[],
    startDate?: string,
    endDate?: string
  }
  ) {
    try {
      const dbFields = [...settings.selectFields]

      if (!dbFields.includes(`event.id`)) {
        dbFields.push(`event.id`)
      }


      log(`В ивент сервисе`, settings.selectFields)
      let query = this.eventRepo
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.relatedFileId', 'file')
        .leftJoinAndSelect('event.relatedProcessId', 'process');

      if (settings.excludeFilePaths && settings.excludeFilePaths.length > 0) {
        const fileConds: string[] = [];
        const params: Record<string, any> = {};
        params.excludeFilePaths.forEach((path, idx) => {
          const param = `filePathExclude${idx}`;
          params[param] = path.endsWith('%') ? path : `${path}%`;
          fileConds.push(`file.filePath NOT LIKE :${param}`);
        });

        query = query.andWhere(
          `(file.filePath IS NULL OR (${fileConds.join(' AND ')}))`,
          params
        );
      }

      if (settings.excludeProcessPaths && settings.excludeProcessPaths.length > 0) {
        const procConds: string[] = [];
        const params: Record<string, any> = {};
        params.excludeProcessPaths.forEach((path, idx) => {
          const param = `processPathExclude${idx}`;
          params[param] = path.endsWith('%') ? path : `${path}%`;
          procConds.push(`process.executablePath NOT LIKE :${param}`);
        });

        query = query.andWhere(
          `(process.executablePath IS NULL OR (${procConds.join(' AND ')}))`,
          params
        );
      }

      if (settings.startDate && settings.endDate) {
        query = query.andWhere('event.timestamp BETWEEN :startDate AND :endDate', {
          startDate: settings.startDate,
          endDate: settings.endDate
        });
      }

      const events = await query.select(dbFields).getMany();
      return events;
    } catch (error) {
      console.error('Error in getEvents:', error);
      throw error;
    }
  }
}