import { DateRange, FilterBase } from "../shared/interfaces/common.interface";

export interface SystemLogFilters extends FilterBase, DateRange {
  eventType?: string
  status?: string
  filePath?: string
  fileSystemId?: string
  relatedFileId: {
    status?: string
    filePath?: string
    fileSystemId?: string;
  }
}