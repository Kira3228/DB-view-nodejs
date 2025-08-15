import { getRepository, In, SelectQueryBuilder } from "typeorm";
import { SystemEvent } from "../entities/system_events.entity";
import { FiltersDto } from "./dto/filters.dto";
import { applyNotLikeList, parsePathExceptions } from "../utils/query-utils";
import { paginate } from "../utils/pagination";
import { NotFoundError } from "../errors/http-errors";

export class SystemLogService {
    private systemLogRepo = getRepository(SystemEvent);

    async getSystemEvents() {
        try {
            const events = await this.systemLogRepo
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

            if (!events) {
                throw new NotFoundError()
            }
            return events
        }
        catch (err) {
            console.log(err);
        }

    }

    async getFilteredSystemEvents(
        filters: FiltersDto,
        page: number = 1,
        limit: number = 30
    ) {

        let queryBuilder = this.systemLogRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.relatedFileId', 'file')
            .leftJoinAndSelect('event.relatedProcessId', 'process')

        const excludeFilePaths = parsePathExceptions(filters.filePathException)
        applyNotLikeList(queryBuilder, `file`, `filePath`, excludeFilePaths, 'both', true)

        const excludeProcessPaths = parsePathExceptions(filters.processPathException)
        applyNotLikeList(queryBuilder, `process`, `executablePath`, excludeProcessPaths, 'both', true)

        if (filters.eventType) {
            queryBuilder.andWhere('event.eventType = :eventType', {
                eventType: filters.eventType,
            });
        }

        this.applyDateFilters(queryBuilder, filters);
        this.applyFileFilters(queryBuilder, filters);

        if (filters.relatedFileId) {
            this.applyRelatedFileFilters(queryBuilder, filters.relatedFileId);
        }

        const skipAmount = (page - 1) * limit;
        queryBuilder.skip(skipAmount).take(limit);

        queryBuilder.select([
            'event.id',
            'event.eventData',
            'event.timestamp',
            'event.eventType',
            'event.source',
            'file.id',
            'file.filePath',
            'file.fileName',
            'file.status',
            'file.fileSystemId',
            'process.id',
            'process.pid',
            'process.executablePath'
        ])

        return paginate(queryBuilder, page, limit, `events`)
    }

    private applyDateFilters(
        queryBuilder: SelectQueryBuilder<SystemEvent>,
        filters: FiltersDto
    ) {
        const startDate = new Date(filters.startDate).toISOString().replace('T', ' ').slice(0, 19);
        const endDate = new Date(filters.endDate).toISOString().replace('T', ' ').slice(0, 19);
        if (filters.startDate && filters.endDate) {
            queryBuilder.andWhere(
                'event.timestamp BETWEEN :startDate AND :endDate',
                {
                    startDate: startDate,
                    endDate: endDate
                }
            );
        } else {
            if (filters.startDate) {
                queryBuilder.andWhere('event.timestamp >= :startDate', {
                    startDate: startDate
                });
            }
            if (filters.endDate) {
                queryBuilder.andWhere('event.timestamp <= :endDate', {
                    endDate: endDate
                });
            }
        }
    }

    private applyFileFilters(
        queryBuilder: SelectQueryBuilder<SystemEvent>,
        filters: FiltersDto
    ) {
        if (filters.status || filters.filePath || filters.fileSystemId) {
            if (filters.status) {
                queryBuilder.andWhere('file.status = :status', {
                    status: filters.status,
                });
            }

            if (filters.filePath) {
                queryBuilder.andWhere('file.filePath LIKE :filePath', {
                    filePath: `%${filters.filePath}%`,
                });
            }

            if (filters.fileSystemId) {
                queryBuilder.andWhere('file.fileSystemId = :fileSystemId', {
                    fileSystemId: filters.fileSystemId,
                });
            }
        }
    }

    private applyRelatedFileFilters(
        queryBuilder: SelectQueryBuilder<SystemEvent>,
        relatedFile: { status?: string; filePath?: string; fileSystemId?: string }
    ) {
        if (relatedFile.status) {
            queryBuilder.andWhere('file.status = :fileStatus', {
                fileStatus: relatedFile.status,
            });
        }

        if (relatedFile.filePath) {
            queryBuilder.andWhere('file.filePath LIKE :filePath', {
                filePath: `%${relatedFile.filePath}%`,
            });
        }

        if (relatedFile.fileSystemId) {
            queryBuilder.andWhere('file.fileSystemId = :fileSystemId', {
                fileSystemId: relatedFile.fileSystemId,
            });
        }
    }

    async getSelectedEvents(ids: number[]) {
        try {
            const where: any = {}

            if (ids && ids.length) {
                where.id = In(ids)
            }

            const data = await this.systemLogRepo.find({
                where
            })

            if (!data) {
                throw new NotFoundError()
            }

            return this.exportCSV(data)
        }
        catch (err) {
            console.log(err);

        }

    }

    async getAllEventTypeOption() {
        const options = this.systemLogRepo.find({
            select: ["eventType"]
        })

        return options
    }

    async getAllCSV() {
        try {
            const data = await this.systemLogRepo.find()
            if (!data) {
                throw new NotFoundError()
            }
            return this.exportCSV(data)

        }
        catch (err) {
            console.log(err);
        }
    }

    private async exportCSV(data: any) {
        if (!data || data.length === 0) {
            return { data: [], headers: '', rows: '' }
        }

        const headers = Object.keys(data[0]).join(',')

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