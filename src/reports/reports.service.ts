import { getRepository } from "typeorm/globals.js";
import { SystemEvent } from "../entities/system_events.entity";
import { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";
import * as path from 'path'
import PdfPrinter from "pdfmake";
import { log } from "console";
import { Between } from "typeorm";
import { field, Flatten, ReportFieldConfig, SystemEventFlags, testFields } from "./report-config";

export class ReportService {
    private reportRepo = getRepository(SystemEvent)
    private readonly robotoFontPath = path.resolve(__dirname, '../assets/Roboto.ttf')
    async getEvents() {
        try {
            const { selectFields } = this.buildEventSelect(field)
            //log(this.buildEventSelect(field))
            const events = await this.reportRepo
                .createQueryBuilder(`event`)
                .leftJoinAndSelect(`event.relatedFileId`, `file`)
                .leftJoinAndSelect(`event.relatedProcessId`, `process`)
                .select(selectFields).getMany()
             this.generatePdfReport(events)
            // log(events)

            // log(this.toFlatObject(events))
            return this.generatePdfReport(this.toFlatObject(events))
            // return qwe
        }
        catch (error) {
            console.error('Error in getEvents:', error);
            throw error;
        }

    }
    private toFlatObject(data: SystemEvent[]): any[] {
        return data.map(event => {
            const flatObj = { ...event };
            const flatObj2: Flatten = {  }
            if (event.relatedProcessId) {

                for (const [key, value] of Object.entries(event.relatedProcessId)) {
                    flatObj2[`${key}`] = value;
                }
                delete flatObj.relatedProcessId
                flatObj.relatedFileId = undefined;

            }

            if (event.relatedFileId) {
                for (const [key, value] of Object.entries(event.relatedFileId)) {
                    flatObj2[`${key}`] = value;
                }
                flatObj.relatedProcessId = undefined
                delete flatObj.relatedFileId;
            }
            log(flatObj2)
            return flatObj2;
        });
    }

    private buildEventSelect(field: SystemEventFlags<SystemEvent>) {
        const selectFields: string[] = [];
        const fieldNames: { text: string; style: string }[] = [];

        // Основные поля события
        if (field.id) {
            selectFields.push('event.id');
            fieldNames.push({ text: 'ID события', style: 'tableHeader' });
        }
        if (field.eventType) {
            selectFields.push('event.eventType');
            fieldNames.push({ text: 'Тип события', style: 'tableHeader' });
        }
        if (field.eventData) {
            selectFields.push('event.eventData');
            fieldNames.push({ text: 'Данные события', style: 'tableHeader' });
        }
        if (field.severity) {
            selectFields.push('event.severity');
            fieldNames.push({ text: 'Важность', style: 'tableHeader' });
        }
        if (field.source) {
            selectFields.push('event.source');
            fieldNames.push({ text: 'Источник', style: 'tableHeader' });
        }
        if (field.timestamp) {
            selectFields.push('event.timestamp');
            fieldNames.push({ text: 'Время события', style: 'tableHeader' });
        }

        // Поля связанного процесса
        if (field.relatedProcessId) {
            if (field.relatedProcessId.id) {
                selectFields.push('process.id');
                fieldNames.push({ text: 'ID процесса', style: 'tableHeader' });
            }
            if (field.relatedProcessId.pid) {
                selectFields.push('process.pid');
                fieldNames.push({ text: 'PID процесса', style: 'tableHeader' });
            }
            if (field.relatedProcessId.executablePath) {
                selectFields.push('process.executablePath');
                fieldNames.push({ text: 'Путь к исполняемому файлу', style: 'tableHeader' });
            }
            if (field.relatedProcessId.commandLine) {
                selectFields.push('process.commandLine');
                fieldNames.push({ text: 'Командная строка', style: 'tableHeader' });
            }
            if (field.relatedProcessId.parentPid) {
                selectFields.push('process.parentPid');
                fieldNames.push({ text: 'Родительский PID', style: 'tableHeader' });
            }
            if (field.relatedProcessId.groupId) {
                selectFields.push('process.groupId');
                fieldNames.push({ text: 'ID группы', style: 'tableHeader' });
            }
            if (field.relatedProcessId.createdAt) {
                selectFields.push('process.createdAt');
                fieldNames.push({ text: 'Дата создания', style: 'tableHeader' });
            }
            if (field.relatedProcessId.processStartTime) {
                selectFields.push('process.processStartTime');
                fieldNames.push({ text: 'Время запуска', style: 'tableHeader' });
            }
        }
        if (field.relatedFileId) {
            if (field.relatedFileId.id) {
                selectFields.push('file.id');
                fieldNames.push({ text: 'ID файла', style: 'tableHeader' });
            }
            if (field.relatedFileId.fileSystemId) {
                selectFields.push('file.fileSystemId');
                fieldNames.push({ text: 'ID файловой системы', style: 'tableHeader' });
            }
            if (field.relatedFileId.inode) {
                selectFields.push('file.inode');
                fieldNames.push({ text: 'Inode', style: 'tableHeader' });
            }
            if (field.relatedFileId.filePath) {
                selectFields.push('file.filePath');
                fieldNames.push({ text: 'Путь к файлу', style: 'tableHeader' });
            }
            if (field.relatedFileId.fileName) {
                selectFields.push('file.fileName');
                fieldNames.push({ text: 'Имя файла', style: 'tableHeader' });
            }
            if (field.relatedFileId.fileSize) {
                selectFields.push('file.fileSize');
                fieldNames.push({ text: 'Размер файла', style: 'tableHeader' });
            }
            if (field.relatedFileId.createdAt) {
                selectFields.push('file.createdAt');
                fieldNames.push({ text: 'Дата создания', style: 'tableHeader' });
            }
            if (field.relatedFileId.modifiedAt) {
                selectFields.push('file.modifiedAt');
                fieldNames.push({ text: 'Дата изменения', style: 'tableHeader' });
            }
            if (field.relatedFileId.isOriginalMarked) {
                selectFields.push('file.isOriginalMarked');
                fieldNames.push({ text: 'Родоначальник', style: 'tableHeader' });
            }
            if (field.relatedFileId.maxChainDepth) {
                selectFields.push('file.maxChainDepth');
                fieldNames.push({ text: 'Макс. глубина цепочки', style: 'tableHeader' });
            }
            if (field.relatedFileId.minChainDepth) {
                selectFields.push('file.minChainDepth');
                fieldNames.push({ text: 'Мин. глубина цепочки', style: 'tableHeader' });
            }
            if (field.relatedFileId.status) {
                selectFields.push('file.status');
                fieldNames.push({ text: 'Статус файла', style: 'tableHeader' });
            }
            if (field.relatedFileId.extendedAttributes) {
                selectFields.push('file.extendedAttributes');
                fieldNames.push({ text: 'Дополнительные атрибуты', style: 'tableHeader' });
            }
        }

        return { selectFields, fieldNames };
    }

    private generatePdfReport(data: SystemEvent[]): PDFKit.PDFDocument {
        const fonts: TFontDictionary = {
            Roboto: {
                normal: this.robotoFontPath,
            }
        };

        const { fieldNames } = this.buildEventSelect(field);
        const printer = new PdfPrinter(fonts);

        // Подготовка данных для таблицы
        const tableBody = [
            fieldNames,
            [14, 13, 14] // Заголовки столбцов
        ];

        // Автоматический расчет ширины столбцов
        const columnCount = fieldNames.length;
        const widths = new Array(columnCount).fill('*'); // Равномерное распределение

        const docDefinition: TDocumentDefinitions = {
            content: [
                { text: 'Отчёт по событиям системы', style: 'header' },
                { text: `Сгенерировано: ${new Date().toLocaleString()}`, style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: widths,
                        dontBreakRows: true,
                        body: tableBody
                    }
                },
            ],
            styles: {
                header: {
                    fontSize: 18,
                    margin: [0, 0, 0, 10],
                    alignment: 'center'
                },
                subheader: {
                    fontSize: 10,
                    margin: [0, 0, 0, 10],
                    alignment: 'center'
                },
                tableHeader: {
                    fontSize: 10,
                    color: 'black',

                }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 10
            },
            pageSize: "A4",
            // pageMargins: [40, 60, 40, 60]
        };

        return printer.createPdfKitDocument(docDefinition);
    }


}