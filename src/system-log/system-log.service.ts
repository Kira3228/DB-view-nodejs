import { getRepository, In, Repository, SelectQueryBuilder } from "typeorm";
import { SystemEvent } from "../entities/system_events.entity";
import { NotFoundError } from "../errors/http-errors";
import { SystemLogConfigService } from "./system-log-config.service";
import { CSVExport, SystemLogFilters } from "./interfaces/system-log.interface";
import { applyNotLikeList } from "../shared/utils/query-utils";
import { PaginatedResult } from "../shared/interfaces/common.interface";
import { paginate } from "../shared/utils/pagination";


export class SystemLogService {
    private readonly systemLogRepo: Repository<SystemEvent>
    private readonly configService: SystemLogConfigService

    constructor() {
        this.systemLogRepo = getRepository(SystemEvent)
        this.configService = new SystemLogConfigService()
    }


    async getHeaders(presetName?: string): Promise<any> {
        return this.configService.getHeaders(presetName)
    }

    async getPresetNames(): Promise<string[]> {
        return this.configService.getPresetNames()
    }

    async getFilters(presetName: string): Promise<Record<string, any>> {
        return this.configService.getFilters(presetName)
    }

    async getExceptions(presetName: string): Promise<Record<string, string[]>> {
        try {
            const preset = this.configService.getPreset(presetName)
            return preset?.exceptions || {}
        }
        catch (errors) {
            console.error(errors);
        }
    }

    async getSystemEvents(): Promise<SystemEvent[]> {
        try {
            const qb = this.createBaseQuery()
                .leftJoinAndSelect("event.relatedProcessId.user", "user")
                .addSelect(["user.id", "user.userName"]);

            const events = await qb.getMany();

            if (!events || events.length === 0) {
                throw new NotFoundError('События не найдены');
            }
            return events;
        }
        catch { }
    }
    async getFilteredSystemEvents(filters: SystemLogFilters): Promise<PaginatedResult<SystemEvent>> {
        try {
            const qb = this.createBaseQuery();
            this.applyAllFilters(qb, filters);

            return await this.paginateQuery(qb, filters);
        } catch (error) {
            console.error('Ошибка получения отфильтрованных событий:', error);
            throw new Error('Не удалось получить отфильтрованные события');
        }
    }

    async getSelectedEvents(ids: number[]): Promise<CSVExport> {
        try {
            if (!ids || ids.length === 0) {
                return { data: [], headers: '', rows: '' };
            }

            const events = await this.systemLogRepo.find({
                where: { id: In(ids) }
            });

            if (!events || events.length === 0) {
                throw new NotFoundError('События не найдены');
            }

            return this.exportToCSV(events);
        } catch (error) {
            console.error('Ошибка получения выбранных событий:', error);
            throw error;
        }
    }

    async getAllEventTypeOption(): Promise<string[]> {
        try {
            const result = await this.systemLogRepo
                .createQueryBuilder('event')
                .select('DISTINCT event.eventType', 'eventType')
                .getRawMany();

            return result.map(item => item.eventType).filter(Boolean);
        } catch (error) {
            console.error('Ошибка получения типов событий:', error);
            return [];
        }
    }

    async getAllCSV(): Promise<CSVExport> {
        try {
            const events = await this.systemLogRepo.find();

            if (!events || events.length === 0) {
                throw new NotFoundError('События для экспорта не найдены');
            }

            return this.exportToCSV(events);
        } catch (error) {
            console.error('Ошибка экспорта всех событий:', error);
            throw error;
        }
    }


    private createBaseQuery(): SelectQueryBuilder<SystemEvent> {
        return this.systemLogRepo
            .createQueryBuilder(`event`)
            .leftJoinAndSelect(`event.relatedFileId`, `file`)
            .leftJoinAndSelect(`event.relatedProcessId`, `process`)
            .select([
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
    }

    private applyAllFilters(qb: SelectQueryBuilder<SystemEvent>, filters: SystemLogFilters): void {
        this.applyPresetExceptions(qb, filters.presetName);
        this.applyEventTypeFilter(qb, filters);
        this.applyDateFilters(qb, filters);
        this.applyFileFilters(qb, filters);
        this.applyRelatedFileFilters(qb, filters);
    }

    private applyPresetExceptions(qb: SelectQueryBuilder<SystemEvent>, presetName?: string): void {
        if (!presetName) return

        try {
            const filePathExceptions = this.configService.getFieldExceptions(presetName, `filePath`)
            if (filePathExceptions.length > 0) {
                applyNotLikeList(qb, 'file', 'filePath', filePathExceptions, 'both', true);
            }

            const processPathExceptions = this.configService
                .getFieldExceptions(presetName, `relatedProcessId`)
            if (processPathExceptions.length > 0) {
                applyNotLikeList(qb, `process`, `executablePath`, processPathExceptions, "both", true)
            }
        }
        catch (error) {
            console.error(error);
        }
    }

    private applyEventTypeFilter(qb: SelectQueryBuilder<SystemEvent>, filters: SystemLogFilters): void {
        if (filters.eventType?.trim()) {
            qb.andWhere(`event.eventType = :eventType`, { eventType: filters.eventType.trim() })
        }
    }

    private applyDateFilters(qb: SelectQueryBuilder<SystemEvent>, filters: SystemLogFilters): void {
        const normalizedDate = (dateStr?: string): string | undefined => {
            if (!dateStr) return undefined

            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return undefined

            return d.toISOString().replace(`T`, ` `).slice(0, 19)
        }

        const startDate = normalizedDate(filters.startDate)
        const endDate = normalizedDate(filters.endDate)

        if (startDate && endDate) {
            qb.andWhere(`event.timestamp BETWEEN :startDate AND :endDate`, { startDate, endDate })
        }
        else {
            if (startDate) {
                qb.andWhere(`event.timestamp >= :startDate`, { startDate })
            }
            if (endDate) {
                qb.andWhere(`event.timestamp <= :endDate`, { endDate })
            }
        }

    }

    private applyFileFilters(qb: SelectQueryBuilder<SystemEvent>, filters: SystemLogFilters): void {
        if (filters.status?.trim()) {
            qb.andWhere(`file.status = :status`, { status: filters.status?.trim() })
        }

        if (filters.filePath?.trim()) {
            qb.andWhere('file.filePath LIKE :filePath', { filePath: `%${filters.filePath.trim()}%` });
        }
        if (filters.fileSystemId?.trim()) {
            qb.andWhere('file.fileSystemId = :fileSystemId',
                { fileSystemId: filters.fileSystemId.trim() });
        }
    }

    private applyRelatedFileFilters(qb: SelectQueryBuilder<SystemEvent>, filters: SystemLogFilters): void {
        const relatedFile = filters.relatedFileId
        if (!relatedFile) return

        if (relatedFile.status?.trim()) {
            qb.andWhere(`file.status = :fileStatus`, { fileStatus: relatedFile.status.trim() })
        }
        if (relatedFile.filePath?.trim()) {
            qb.andWhere('file.filePath LIKE :relatedFilePath', { relatedFilePath: `%${relatedFile.filePath.trim()}%` });
        }

        if (relatedFile.fileSystemId?.trim()) {
            qb.andWhere('file.fileSystemId = :relatedFileSystemId', { relatedFileSystemId: relatedFile.fileSystemId.trim() });
        }
    }

    private async paginateQuery(qb: SelectQueryBuilder<SystemEvent>,
        filters: SystemLogFilters
    ): Promise<PaginatedResult<SystemEvent>> {
        const page = Math.max(1, filters.page || 1)
        const limit = Math.min(100, Math.max(1, filters.limit || 30))

        return await paginate(qb, page, limit, `events`)
    }

    private exportToCSV(data: SystemEvent[]): CSVExport {
        if (!data || data.length === 0) {
            return { data: [], headers: ``, rows: '' }
        }

        const headers = Object.keys(data[0]).join(`,`)

        const rows = data
            .map(row => {
                Object.values(row)
                    .map(val => {
                        const stringVal = typeof val === `object` ? JSON.stringify(val) : String(val)
                        return `"${stringVal.replace(/"/g, '""')}"`;
                    })
                    .join(',')
            })
            .join('\n')
        return { data, headers, rows };
    }
}