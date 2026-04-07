import { BadRequestException } from '@nestjs/common';

import { ConfidenceLevel, ParseKind } from '../types/intake.types';

const XLSX: typeof import('xlsx') = require('xlsx');

const OFFICIAL_HEADER = ['No.', '商品名稱', '規格', '倉位編號', '貨號', '數量'];

export interface OfficialParsedLineCandidate {
  sourceRowRef: string;
  rawProductText: string;
  rawSpecText?: string;
  rawQuantity: number;
  parseKind: ParseKind;
  parseConfidence: ConfidenceLevel;
  parserMeta: Record<string, unknown>;
}

export async function parseOfficialXlsxToParsedLines(params: {
  fileBuffer: Buffer;
  originalFileName: string;
}): Promise<OfficialParsedLineCandidate[]> {
  const workbook = XLSX.read(params.fileBuffer, {
    type: 'buffer',
    raw: false,
    cellText: false,
  });

  if (!workbook.SheetNames.length) {
    throw new BadRequestException('官網 XLSX 不包含任何工作表');
  }

  const parsedLines: OfficialParsedLineCandidate[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    });
    const headerRowIndex = rows.findIndex((row) => hasOfficialHeader(row));

    if (headerRowIndex < 0) {
      continue;
    }

    for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] ?? [];
      const no = normalizeCell(row[0]);
      const rawProductText = normalizeCell(row[1]);
      const rawSpecText = normalizeCell(row[2]);
      const quantityText = normalizeCell(row[5]).replace(/,/gu, '');

      if (!/^\d+$/u.test(no) || !rawProductText || !/^\d+$/u.test(quantityText)) {
        continue;
      }

      parsedLines.push({
        sourceRowRef: `${params.originalFileName}#${sheetName}!row-${rowIndex + 1}`,
        rawProductText,
        rawSpecText: rawSpecText || undefined,
        rawQuantity: Number(quantityText),
        parseKind: ParseKind.STANDARD,
        parseConfidence: ConfidenceLevel.HIGH,
        parserMeta: {
          parserProfile: 'official_xlsx_v1',
          sheetName,
          headerRow: headerRowIndex + 1,
          sourceNo: no,
        },
      });
    }
  }

  if (parsedLines.length === 0) {
    throw new BadRequestException('官網 XLSX 未找到可解析明細列');
  }

  return parsedLines;
}

function hasOfficialHeader(row: (string | number)[]): boolean {
  return OFFICIAL_HEADER.every((header, index) => normalizeCell(row[index]) === header);
}

function normalizeCell(value: string | number | undefined): string {
  return String(value ?? '').replace(/\s+/gu, ' ').trim();
}