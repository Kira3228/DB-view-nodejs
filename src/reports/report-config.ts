import { MonitoredFile } from "../entities/monitored_file.entity";
import { Process } from "../entities/process.entity";
import { SystemEvent } from "../entities/system_events.entity";

export interface ReportFieldConfig {
    key: keyof SystemEvent
    title: string
    format?: (value: any) => string;
    nestedProcessProp?: {
        key: keyof Process
        title: string
        format?: (value: any) => string;
    }
    nestedFileProp?: {
        key: keyof MonitoredFile
        title: string
        format?: (value: any) => string;
    }
}


export const testFields: ReportFieldConfig[] = [
    { key: `id`, title: `id` },
    { key: `eventData`, title: `id` },
    { key: `eventType`, title: `id` },
    { key: `relatedFileId`, title: `id`, nestedFileProp: { key: "fileName", title: `Имя файла` } },
    { key: `relatedProcessId`, title: `id`, nestedProcessProp: { key: "groupId", title: `Id Группы` } },
    { key: `severity`, title: `id` },
    { key: `source`, title: `id` },
    { key: `timestamp`, title: `id` },
]

export type SystemEventFlags<T> = {
    [K in keyof T]?:
    T[K] extends object
    ? SystemEventFlags<T[K]> // Рекурсия для вложенных объектов
    : boolean | string;
};


export const field: SystemEventFlags<SystemEvent> = {
    timestamp: true,
    id: true,
    eventType: true,
    relatedProcessId: {
        pid: true,
        id: true,
        createdAt: true
    },
    relatedFileId: {
        id: true,
        createdAt: true,
        fileName: true,
        filePath: true
    }
}
export type Flatten = Record<keyof SystemEvent | keyof MonitoredFile | keyof Process, string | undefined | null>;



export type FlattenedSystemEventFlags<T> = {
    [K in keyof T as T[K] extends object ? keyof T[K] : K]:
    T[K] extends object ? (FlattenedSystemEventFlags<T[K]> | null | undefined) : T[K]
};

