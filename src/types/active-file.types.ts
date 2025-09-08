import { FilterBase } from "../shared/interfaces/common.types"

export interface ActiveFileFilters extends FilterBase {
  filePath?: string
  inode?: number
  filePathExceptions: string[]
  processPathExceptions: string[]
}