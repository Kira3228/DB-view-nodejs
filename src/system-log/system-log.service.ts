import { getRepository, In } from "typeorm";
import { SystemEvent } from "../entities/system_events.entity";
import { FiltersDto } from "./dto/filters.dto";

export class SystemLogService {
    private systemLogRepo = getRepository(SystemEvent);

    async getSystemEvents() {
        try {
            return await this.systemLogRepo
                .createQueryBuilder("event")
                .leftJoinAndSelect("event.relatedFileId", "file")
                .leftJoinAndSelect("event.relatedProcessId", "process")
                .leftJoinAndSelect("process.user", "user")
                .select([
                    "event.id",
                    "event.eventData",
                    "event.timestamp",
                    "event.eventType",
                    "event.source",
                    "file.id", "file.filePath", "file.fileName",
                    "file.status", "file.fileSystemId",
                    "process.id", "process.pid",
                    "user.id", "user.userName"
                ])
                .getMany();
        } catch (error) {
            throw error;
        }
    }

    async getFilteredSystemEvents(filters: FiltersDto) {
        const { page, limit } = filters
        console.log(page, limit)
        const queryBuilder = this.systemLogRepo.createQueryBuilder("event")
            .leftJoinAndSelect("event.relatedFileId", "file")
            .leftJoinAndSelect("event.relatedProcessId", "process")
            .select([
                "event.id",
                "event.eventData",
                "event.timestamp",
                "event.eventType",
                "event.source",
                "file.id",
                "file.filePath",
                "file.fileName",
                "file.status",
                "file.fileSystemId",
                "process.id",
                "process.pid"
            ])
        if (filters.eventType) {
            queryBuilder.andWhere("event.eventType = :eventType", { eventType: filters.eventType });
        }

        if (filters.startDate && filters.endDate) {
            queryBuilder.andWhere("event.timestamp BETWEEN :startDate AND :endDate", {
                startDate: new Date(Number(filters.startDate)),
                endDate: new Date(Number(filters.endDate))
            });
        } else {
            if (filters.startDate) {
                queryBuilder.andWhere("event.timestamp >= :startDate", {
                    startDate: new Date(Number(filters.startDate))
                });
            }
            if (filters.endDate) {
                queryBuilder.andWhere("event.timestamp <= :endDate", {
                    endDate: new Date(Number(filters.endDate))
                });
            }
        }

        if (filters.status || filters.filePath || filters.fileSystemId) {
            if (filters.status) {
                queryBuilder.andWhere("file.status = :status", { status: filters.status });
            }
            if (filters.filePath) {
                queryBuilder.andWhere("file.filePath = :filePath", { filePath: filters.filePath });
            }
            if (filters.fileSystemId) {
                queryBuilder.andWhere("file.fileSystemId = :fileSystemId", {
                    fileSystemId: filters.fileSystemId
                });
            }
        }

        if (filters.relatedFileId) {
            if (filters.relatedFileId.status) {
                queryBuilder.andWhere("file.status = :fileStatus", {
                    fileStatus: filters.relatedFileId.status
                });
            }
            if (filters.relatedFileId.filePath) {
                queryBuilder.andWhere("file.filePath = :filePath", {
                    filePath: filters.relatedFileId.filePath
                });
            }
            if (filters.relatedFileId.fileSystemId) {
                queryBuilder.andWhere("file.fileSystemId = :fileSystemId", {
                    fileSystemId: filters.relatedFileId.fileSystemId
                });
            }
        }
        console.log((page - 1) * limit)
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [events, totalCount] = await queryBuilder.getManyAndCount();

        return {
            events,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            limit
        };


    }

    async getSelectedEvents(ids: number[]) {
        const where: any = {}
        if (ids && ids.length) {
            where.id = In(ids)
        }
        const data = await this.systemLogRepo.find({
            where
        })
        return this.exportCSV(data)
    }

    async getAllCSV() {
        const data = await this.systemLogRepo.find()
        return this.exportCSV(data)
    }

    private async exportCSV(data: any) {
        if (!data || data.length === 0) {
            return { data: [], headers: '', rows: '' }
        }
        console.log(`до хедера`);
        console.log(`data[0]`, data[0]);

        const headers = Object.keys(data[0]).join(',')

        console.log(`ПОСЛЕ  хедера`);
        const rows = data
            .map((row) =>
                Object.values(row)
                    .map((val) => {
                        const stringVal =
                            typeof val === 'object' ? JSON.stringify(val) : String(val);
                        return `"${stringVal.replace(/"/g, '""')}"`;
                    })
                    .join(',')).join('\n');
        return {
            data,
            headers,
            rows
        }
    }

}