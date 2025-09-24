import { TableHeader } from "../../report.types"
import XLSX from 'xlsx'

export const generateXlsx = async (flattenData: string[][], fieldNames: TableHeader[],) => {
  const arrayOfHeaders: string[] = fieldNames.map(field => field.text)

  const data: string[][] = [arrayOfHeaders, ...flattenData]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  XLSX.utils.book_append_sheet(workbook, worksheet, `Sheet1`)

  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Buffer;

  return buffer
}