import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx"
import { TableHeader } from "../../report.types"

export const generateDocx = async (flattenData: string[][], fieldNames: TableHeader[]) => {
  const doc = new Document()
  const header = new Paragraph({
    children: [
      new TextRun({
        bold: true,
        size: 48,
        text: `Отчёт по событиям системы`,
      })
    ],
    alignment: AlignmentType.CENTER
  })
  const subHeader = new Paragraph({
    children: [
      new TextRun({
        size: 28,
        text: `Сгенерировано: ${new Date().toLocaleString()}`,
      })
    ],
    alignment: AlignmentType.CENTER
  })

  const tableHeaders = fieldNames.map((field) => {
    return new TableCell({
      width: {
        size: 5000,
        type: WidthType.DXA
      },
      children: [
        new Paragraph(field.text)
      ]
    })
  })

  const headerRow = new TableRow({
    children: tableHeaders
  })

  const tableBody = flattenData.map((row) => {
    const cells = row.map(cell => {
      return new TableCell({
        width: {
          size: 5000,
          type: WidthType.DXA
        },
        children: [
          new Paragraph(String(cell))
        ]
      })
    })

    return new TableRow({ children: cells })
  })

  const table = new Table({
    rows: [headerRow, ...tableBody]
  })

  doc.addSection({
    children: [header, subHeader, table]
  })

  try {
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  } catch (error) {
    console.error('DOCX generation error:', error);
    throw new Error('Failed to generate DOCX file');
  }
}