export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  [key: string]: T[] | number;
  page: number
  totalPages: number;
  totalCount: number;
  limit: number
}

export interface PresetConfig {
  presetName: string
  headers: string[]
  default_filters: Record<string, any>
  exceptions: Record<string, string[]>
}

export interface BaseFilters {
  presetName?: string
}

export interface DateRange {
  startDate?: string
  endDate?: string
}