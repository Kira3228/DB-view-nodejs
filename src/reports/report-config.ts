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

