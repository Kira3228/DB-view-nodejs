
export class FiltersDto {
    eventType?: string;
    timestamp?: Date;
    status?: string;
    filePath?: string;
    fileSystemId?: string;
    relatedFileId?: {
        filePath?: string;
        status?: string;
        fileSystemId?: string;
    };
    page?: number = 4;
    limit?: number = 30;
    startDate?: string;
    endDate?: string;

    filePathException?: string
    processPathException?: string
}
