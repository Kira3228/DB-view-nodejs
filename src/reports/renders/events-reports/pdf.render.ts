import PdfPrinter from "pdfmake";
import { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";
import { TableData, TableHeader } from "../../report.types";

type RenderOptions = {
  title: string
  generatedAt: string
}

export const generatePdf = (flattenData: string[][], fieldNames: TableHeader[], fontPath: string): Promise<Buffer> => {
  const fonts: TFontDictionary = {
    Roboto: {
      normal: fontPath,
      bold: fontPath,
      italics: fontPath,
      bolditalics: fontPath,
    },
  };

  const printer = new PdfPrinter(fonts);
  const headers = fieldNames.map(f => f.text);
  const tableBody = [headers, ...flattenData];

  const widths = new Array(fieldNames.length).fill('auto');

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Отчёт по событиям системы', style: 'header' },
      { text: `Сгенерировано: ${new Date().toLocaleString()}`, style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths,
          dontBreakRows: true,
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#CCCCCC' : rowIndex % 2 === 0 ? '#F5F5F5' : null),
        },
      },
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10], alignment: 'center' },
      subheader: { fontSize: 10, margin: [0, 0, 0, 10], alignment: 'center' },
      tableHeader: { bold: true, fontSize: 8, color: 'black' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 5 },
    pageSize: 'A4',
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', (err: Error) => reject(err));
    pdfDoc.end();
  });
}