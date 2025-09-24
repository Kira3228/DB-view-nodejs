import XLSX from 'xlsx'
import { toArray } from '../../utils/to-array'
import { TChains } from '../../report.types'

export const genearteChainsXlsx = async (body: TChains[], headers: string[]) => {
  const arrayOfHeaders: string[] = headers
  const flattenData = toArray(body)
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