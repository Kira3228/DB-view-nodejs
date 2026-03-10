export class ExceptionsDto {
    startDate?: string
    endDate?: string
    depth: number
    minDepth: number
    maxDepth: number
}

export interface ReportData {
    headers: ReportHeader[]
    format: `pdf` | 'docx' | 'xlsx'
    startDate: string
    endDate: string
}
export interface ReportHeader {
    text: string
    value: string
} 