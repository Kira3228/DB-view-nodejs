import { DateRange, FilterBase } from "../shared/interfaces/common.types";

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