export class ActiveFileFilters {
    inode?: number;
    filePath?: string;
    page?: number;
    limit?: number;
    presetName?: string

    filePathException: string
    processPathException: string
}

export class ActiveFileCongitDto {
    presetName: string
}