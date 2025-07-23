
export class ReportDto {
    id: boolean;
    eventType: boolean;
    eventData: boolean;
    severity: boolean
    source: boolean;
    timestamp: boolean;
    relatedFileId: MonitoredFile;
    relatedProcessId: Process;
}

class Process {
    id: boolean;
    pid: boolean;
    executablePath: boolean;
    commandLine: boolean;
    parentPid: boolean
    groupId: boolean;
    createdAt: boolean;
    processStartTime: boolean;
}
class MonitoredFile {
    id: boolean;
    fileSystemId: boolean;
    inode: boolean;
    filePath: boolean;
    fileName: boolean;
    fileSize: boolean;
    createdAt: boolean;
    modifiedAt: boolean;
    isOriginalMarked: boolean;
    maxChainDepth: boolean;
    minChainDepth: boolean;
    status: boolean
    extendedAttributes: boolean;
}


export class ReportFilters {
    startDate: string
    endDate: string
}