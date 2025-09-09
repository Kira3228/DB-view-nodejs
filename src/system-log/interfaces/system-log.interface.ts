import { GraphEdge } from "../../active-file/interfaces/active-file.interface";
import { BaseFilters, PaginationParams } from "../../shared/interfaces/common.interface";

export interface SystemLogFilters extends BaseFilters, PaginationParams {
  eventType?: string
  status?: string
  filePath?: string
  fileSystemId?: string
  startDate?: string
  endDate?: string
  relatedFileId?: {
    status?: string
    filePath?: string
    fileSystemId?: string
  }
}

export interface CSVExport {
  data: any[]
  headers: string
  rows: string
}
