import { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";
import { TChains } from "../../report.types";
import PdfPrinter from "pdfmake";
import { toArray } from "../../utils/to-array";

export const genearteChainsPdf = async (body: TChains[], fontPath: string, headers: string[]) => {
  const fonts: TFontDictionary = {
    Roboto: {
      normal: fontPath,
      bold: fontPath,
      italics: fontPath,
      bolditalics: fontPath,
    }
  };

  const printer = new PdfPrinter(fonts);
  const fieldNames = headers
  const data = toArray(body)
  const betterData = [...data]

  const tableBody = [
    fieldNames,
    ...betterData,
  ];

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Отчёт по событиям системы', style: 'header' },
      { text: `Сгенерировано: ${new Date().toLocaleString()}`, style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: [`auto`, `auto`, `auto`],
          dontBreakRows: true,
          body: tableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            return rowIndex === 0 ? '#CCCCCC' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
          }
        }
      }
    ],
  }
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', (err: Error) => reject(err));
    pdfDoc.end();
  });
}