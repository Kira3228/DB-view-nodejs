import { getRepository, In, SelectQueryBuilder } from "typeorm";
import { SystemEvent } from "../entities/system_events.entity";
import { FiltersDto } from "./dto/filters.dto";
import { log } from "console";
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import * as fs from 'fs';
import { TDocumentDefinitions } from "pdfmake/interfaces";



export class SystemLogService {
    private systemLogRepo = getRepository(SystemEvent);
    private readonly russianFontPath = path.resolve(__dirname, '../../assets/timesnewromanpsmt.ttf');
    private readonly robotoFontPath = path.resolve(__dirname, '../../assets/Roboto.ttf')
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
        const queryBuilder = this.systemLogRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.relatedFileId', 'file')
            .leftJoinAndSelect('event.relatedProcessId', 'process')
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
            ]);

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
        const [events, totalCount] = await queryBuilder.getManyAndCount();

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

            log(startDate.toString(), endDate)
            queryBuilder.andWhere(
                'event.timestamp BETWEEN :startDate AND :endDate',
                {
                    startDate: `${startDate}`,
                    endDate: `${endDate}`

                }
            );
            log(queryBuilder.getSql())
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
                log(queryBuilder.getSql())
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
            log(queryBuilder.getSql())
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

    async generatePdfReport() {
        const fonts = {
            Roboto: {
                normal: this.robotoFontPath,

            }
        };

        const printer = new PdfPrinter({
            Roboto: {
                normal: this.robotoFontPath
            }
        });

        const docDefinition: TDocumentDefinitions = {
            content: [
                { text: 'Отчёт по событиям', style: 'header' },
                {
                    table: {
                        headerRows: 2,
                        widths: ['auto', 'auto', `auto`],
                        body: [
                            ['Дата', 'Тип', 'Статус'],
                            ['2023-01-01', 'Ошибка', 'Критично'],
                            ['2023-01-02', 'Предупреждение', 'Нормально']
                        ]
                    }
                }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    margin: [0, 0, 0, 0],
                }
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition)
        return pdfDoc
    }

    



}