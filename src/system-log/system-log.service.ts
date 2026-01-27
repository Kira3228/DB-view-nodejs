import { getRepository, In, Repository, SelectQueryBuilder } from "typeorm";
import { SystemEvent } from "../entities/system_events.entity";
import { NotFoundError } from "../errors/http-errors";
import { SystemLogConfigService } from "./system-log-config.service";
import { CSVExport } from "./interfaces/system-log.interface";
import { } from "../shared/utils/query-utils";
import { IException, IHeader, } from "../shared/interfaces/common.interface";
import { log } from "console";
import { SystemEventDto } from "./dto/system-event.dto";

export class SystemLogService {
    private readonly systemLogRepo: Repository<SystemEvent>
    private readonly configService: SystemLogConfigService

    constructor() {
        this.systemLogRepo = getRepository(SystemEvent)
        this.configService = new SystemLogConfigService()
    }


    async getHeaders(presetName?: string): Promise<IHeader[]> {
        return this.configService.getHeaders(presetName)
    }

    async getPresetNames(): Promise<string[]> {
        return this.configService.getPresetNames()
    }

    async getFilters(presetName: string): Promise<Record<string, any>> {
        return this.configService.getFilters(presetName)
    }

    async getExceptions(presetName: string): Promise<IException[]> {
        try {
            const preset = this.configService.getPreset(presetName)
            return preset?.exceptions || []
        }
        catch (errors) {
            console.error(errors);
        }
    }

    async getSystemEventsTypes() {
        try {
            const result = await this.systemLogRepo
                .createQueryBuilder(`log`)
                .select("DISTINCT log.eventType", `eventType`)
                .getRawMany()

            return result.map(item => item.eventType).filter(Boolean);
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }

    async getSystemEvents(dto: SystemEventDto) {
        try {
            const headers = await this.getHeaders(dto.presetName)
            if (!headers || headers.length === 0) {
                throw new NotFoundError('Заголовки не найдены');
            }

            const qb = await this.createBaseQuery()
            const skip = (Number(dto.page) - 1) * dto.limit

            if (dto.fileSystemId?.trim()) {
                qb.andWhere(
                    'file.fileSystemId LIKE :relatedFileSystemId',
                    { relatedFileSystemId: `%${dto.fileSystemId.trim()}%` }
                );
            }

            if (dto.eventType) {
                qb.andWhere(`event.eventType = :eventType`, { eventType: dto.eventType.trim() })
            }

            if (dto.status?.trim()) {
                qb.andWhere(`file.status = :status`, { status: dto.status })
            }

            if (dto.filePath?.trim()) {
                qb.andWhere('file.filePath LIKE :relatedFilePath', { relatedFilePath: `%${dto.filePath.trim()}%` });
            }

            if (dto.startDate && !dto.endDate) {
                qb.andWhere(`event.timestamp >= :start`, {
                    start: dto.startDate,
                })
            }

            if (!dto.startDate && dto.endDate) {
                qb.andWhere(`event.timestamp <= :end`, {
                    end: dto.endDate,
                })
            }
            if (dto.startDate && dto.endDate) {
                qb.andWhere(`event.timestamp BETWEEN :start AND :end`, {
                    start: dto.startDate,
                    end: dto.endDate,
                })
            }

            const [events, totalCount] = await qb
                .skip(skip)
                .take(dto.limit)
                .getManyAndCount()

            return {
                headers,
                events: events,
                totalCount,
                totalPage: dto.limit > 0 ? Math.ceil(totalCount / dto.limit) : 0,
            };
        }
        catch (error) {
            log(error)
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

            return this.csvGenerator(events);
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

            return this.csvGenerator(events);
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

    private csvGenerator(data: SystemEvent[]): CSVExport {
        if (!data || data.length === 0) {
            return { data: [], headers: ``, rows: '' }
        }
        const headers = Object.keys(data[0]).join(`,`)
        const rows = data
            .map(row => {
                return Object.values(row)
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