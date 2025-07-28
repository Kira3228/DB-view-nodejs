import { getRepository, In, SelectQueryBuilder } from "typeorm";
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

    async getFilteredSystemEvents(
        filters: FiltersDto,
        page: number = 1,
        limit: number = 30
    ) {
        let queryBuilder = this.systemLogRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.relatedFileId', 'file')
            .leftJoinAndSelect('event.relatedProcessId', 'process')

        const excludeFilePaths = this.toArray(filters.filePathException)
        const excludeProcessPaths = this.toArray(filters.processPathException)

        if (excludeFilePaths && excludeFilePaths.length > 0) {
            const fileConds: string[] = []
            const params: Record<string, any> = {};

            excludeFilePaths.forEach((path, idx) => {
                const param = `filePathExclude${idx}`;
                params[param] = path.endsWith(`%`) ? path : `%${path}%`;
                fileConds.push(`file.filePath NOT LIKE :${param}`)

            })

            queryBuilder = queryBuilder.andWhere(
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

            queryBuilder = queryBuilder.andWhere(
                `(process.executablePath IS NULL OR (${procConds.join(' AND ')}))`,
                params
            );
        }

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

        const [events, totalCount] = await queryBuilder.select([
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
        ]).getManyAndCount();

        this.toArray(filters.filePathException)

        return {
            events,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            limit,
        };
    }

    private applyDateFilters(
        queryBuilder: SelectQueryBuilder<SystemEvent>,
        filters: FiltersDto
    ) {
        if (filters.startDate && filters.endDate) {
            const startDate = new Date(filters.startDate).toISOString().replace('T', ' ').slice(0, 19);
            const endDate = new Date(filters.endDate).toISOString().replace('T', ' ').slice(0, 19);


            queryBuilder.andWhere(
                'event.timestamp BETWEEN :startDate AND :endDate',
                {
                    startDate: `${startDate}`,
                    endDate: `${endDate}`
                }
            );

        } else {
            if (filters.startDate) {
                const startDate = new Date(filters.startDate).toISOString().replace('T', ' ').slice(0, 19);
                queryBuilder.andWhere('event.timestamp >= :startDate', {
                    startDate: `'${startDate}'`
                });
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate).toISOString().replace('T', ' ').slice(0, 19);
                queryBuilder.andWhere('event.timestamp <= :endDate', {
                    endDate: `'${endDate}'`
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
        const where: any = {}

        if (ids && ids.length) {
            where.id = In(ids)
        }

        const data = await this.systemLogRepo.find({
            where
        })

        return this.exportCSV(data)
    }

    async getAllEventTypeOption() {
        const options = this.systemLogRepo.find({
            select: ["eventType"]
        })

        return options
    }

    async getAllCSV() {
        const data = await this.systemLogRepo.find()
        return this.exportCSV(data)
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

    private toArray(exception: string): string[] {
        if (!exception || exception.trim() === '') {
            return [];
        }

        const normalizedPath = exception
            .split('/')
            .map(part => part.trim())
            .filter(part => part.length > 0)
            .join('/')

        const result = normalizedPath
            .trimEnd()
            .split(";")
            .map(path => path.trim())
            .filter(path => path !== '');

        return result
    }






}