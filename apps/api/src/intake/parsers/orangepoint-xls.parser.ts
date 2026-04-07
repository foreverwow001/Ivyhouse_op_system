import { BadRequestException } from '@nestjs/common';

import { ConfidenceLevel, ParseKind } from '../types/intake.types';

const XLSX: typeof import('xlsx') = require('xlsx');

const SUPPORT_COLUMN_PATTERNS = [
  /^Total$/iu,
  /^袋$/u,
  /^件數$/u,
  /^贈送\(/u,
  /^業務贈送商品/u,
  /^補寄\(/u,
  /^備註/u,
  /^配送時段$/u,
  /^收貨人$/u,
  /^收貨人電話$/u,
  /^手機$/u,
  /^訂單金額$/u,
  /^代收款$/u,
  /^地址$/u,
];

export interface OrangePointParsedLineCandidate {
  sourceRowRef: string;
  rawProductText: string;
  rawSpecText?: string;
  rawQuantity: number;
  parseKind: ParseKind;
  parseConfidence: ConfidenceLevel;
  parserMeta: Record<string, unknown>;
}

export async function parseOrangePointXlsToParsedLines(params: {
  fileBuffer: Buffer;
  originalFileName: string;
}): Promise<OrangePointParsedLineCandidate[]> {
  const workbook = XLSX.read(params.fileBuffer, {
    type: 'buffer',
    raw: false,
    cellText: false,
  });

  if (!workbook.SheetNames.length) {
    throw new BadRequestException('橘點子 XLS 不包含任何工作表');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new BadRequestException('橘點子 XLS 工作表不存在');
  }

  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });
  const headerRowIndex = rows.findIndex((row) => normalizeCell(row[0]) === '序號');

  if (headerRowIndex < 0) {
    throw new BadRequestException('橘點子 XLS 未找到 header row');
  }

  const headerRow = rows[headerRowIndex] ?? [];
  const parsedLines: OrangePointParsedLineCandidate[] = [];

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const rowType = resolveRowType(row);

    if (rowType === 'empty') {
      continue;
    }

    const rowLabel = buildRowLabel(rowType, row);

    for (let columnIndex = 5; columnIndex < row.length; columnIndex += 1) {
      const headerText = normalizeCell(headerRow[columnIndex]);
      const cellText = normalizeCell(row[columnIndex]);

      if (cellText && /贈品:|試吃:/u.test(cellText)) {
        parsedLines.push(
          ...parseInlineSpecialCell({
            cellText,
            sourceRowRef: `${params.originalFileName}#${sheetName}!R${rowIndex + 1}C${columnIndex + 1}`,
            rowLabel,
          }),
        );
      }

      if (!headerText || SUPPORT_COLUMN_PATTERNS.some((pattern) => pattern.test(headerText))) {
        continue;
      }

      if (rowType === 'order') {
        const quantity = parseNumericQuantity(cellText);

        if (!quantity || quantity <= 0) {
          continue;
        }

        parsedLines.push(
          ...parseHeaderCell({
            headerText,
            quantity,
            sourceRowRef: `${params.originalFileName}#${sheetName}!R${rowIndex + 1}C${columnIndex + 1}`,
            rowLabel,
          }),
        );
        continue;
      }

      if (rowType === 'giftSummary' || rowType === 'reshipSummary') {
        if (!cellText || /^Total\s*0*$/iu.test(cellText)) {
          continue;
        }

        if (/試吃:|贈品:/u.test(cellText)) {
          parsedLines.push(
            ...parseInlineSpecialCell({
              cellText,
              sourceRowRef: `${params.originalFileName}#${sheetName}!R${rowIndex + 1}C${columnIndex + 1}`,
              rowLabel,
            }),
          );
        }
      }
    }
  }

  if (parsedLines.length === 0) {
    throw new BadRequestException('橘點子 XLS 未找到可解析內容');
  }

  return parsedLines;
}

function parseHeaderCell(params: {
  headerText: string;
  quantity: number;
  sourceRowRef: string;
  rowLabel: string;
}): OrangePointParsedLineCandidate[] {
  if (params.headerText.startsWith('試吃:')) {
    return expandTrialSnackHeader({
      expression: params.headerText,
      groupCount: params.quantity,
      sourceRowRef: params.sourceRowRef,
      rowLabel: params.rowLabel,
    });
  }

  if (params.headerText.startsWith('贈品:')) {
    const giftProductText = extractGiftProductText(params.headerText);

    return [
      {
        sourceRowRef: params.sourceRowRef,
        rawProductText: giftProductText,
        rawSpecText: params.headerText,
        rawQuantity: params.quantity,
        parseKind: ParseKind.GIFT,
        parseConfidence: ConfidenceLevel.HIGH,
        parserMeta: {
          parserProfile: 'orangepoint_xls_v1',
          rowLabel: params.rowLabel,
          originalHeader: params.headerText,
        },
      },
    ];
  }

  return [
    {
      sourceRowRef: params.sourceRowRef,
      rawProductText: params.headerText,
      rawSpecText: params.rowLabel,
      rawQuantity: params.quantity,
      parseKind: ParseKind.STANDARD,
      parseConfidence: ConfidenceLevel.HIGH,
      parserMeta: {
        parserProfile: 'orangepoint_xls_v1',
        rowLabel: params.rowLabel,
      },
    },
  ];
}

function parseInlineSpecialCell(params: {
  cellText: string;
  sourceRowRef: string;
  rowLabel: string;
}): OrangePointParsedLineCandidate[] {
  if (params.cellText.startsWith('試吃:')) {
    const parsedTrial = parseTrialSnackExpression(params.cellText);

    if (!parsedTrial || parsedTrial.groupCount <= 0) {
      return [];
    }

    return parsedTrial.components.map((component, index) => ({
      sourceRowRef: `${params.sourceRowRef}#trial-${index + 1}`,
      rawProductText: component.productText,
      rawSpecText: parsedTrial.originalExpression,
      rawQuantity: parsedTrial.groupCount * component.multiplier,
      parseKind: ParseKind.TRIAL_SNACK,
      parseConfidence: ConfidenceLevel.HIGH,
      parserMeta: {
        parserProfile: 'orangepoint_xls_v1',
        rowLabel: params.rowLabel,
        groupCount: parsedTrial.groupCount,
        componentMultiplier: component.multiplier,
        originalExpression: parsedTrial.originalExpression,
      },
    }));
  }

  if (params.cellText.startsWith('贈品:')) {
    const quantity = extractTrailingQuantity(params.cellText);

    if (!quantity || quantity <= 0) {
      return [];
    }

    return [
      {
        sourceRowRef: params.sourceRowRef,
        rawProductText: extractGiftProductText(params.cellText),
        rawSpecText: params.cellText,
        rawQuantity: quantity,
        parseKind: ParseKind.GIFT,
        parseConfidence: ConfidenceLevel.HIGH,
        parserMeta: {
          parserProfile: 'orangepoint_xls_v1',
          rowLabel: params.rowLabel,
          originalExpression: params.cellText,
        },
      },
    ];
  }

  return [];
}

function expandTrialSnackHeader(params: {
  expression: string;
  groupCount: number;
  sourceRowRef: string;
  rowLabel: string;
}): OrangePointParsedLineCandidate[] {
  const parsedTrial = parseTrialSnackExpression(params.expression, params.groupCount);

  if (!parsedTrial || parsedTrial.groupCount <= 0) {
    return [];
  }

  return parsedTrial.components.map((component, index) => ({
    sourceRowRef: `${params.sourceRowRef}#trial-${index + 1}`,
    rawProductText: component.productText,
    rawSpecText: parsedTrial.originalExpression,
    rawQuantity: parsedTrial.groupCount * component.multiplier,
    parseKind: ParseKind.TRIAL_SNACK,
    parseConfidence: ConfidenceLevel.HIGH,
    parserMeta: {
      parserProfile: 'orangepoint_xls_v1',
      rowLabel: params.rowLabel,
      groupCount: parsedTrial.groupCount,
      componentMultiplier: component.multiplier,
      originalExpression: parsedTrial.originalExpression,
    },
  }));
}

function parseTrialSnackExpression(expression: string, fallbackGroupCount?: number) {
  const normalizedExpression = normalizeCell(expression);
  const withoutPrefix = normalizedExpression.replace(/^試吃:\s*/u, '');
  const tailMatch = withoutPrefix.match(/^(.*?)(?:\s+(\d+))?$/u);

  if (!tailMatch) {
    return null;
  }

  const content = normalizeCell(tailMatch[1]);
  const trailingGroupCount = tailMatch[2] ? Number(tailMatch[2]) : undefined;
  const groupCount = trailingGroupCount ?? fallbackGroupCount ?? 0;

  if (!content || groupCount <= 0) {
    return null;
  }

  const components = content.split('+').map((item) => normalizeCell(item)).filter(Boolean).map((item) => {
    const match = item.match(/^(.*)\*(\d+)$/u);

    if (!match) {
      throw new BadRequestException(`試吃 grammar 不合法: ${expression}`);
    }

    return {
      productText: normalizeCell(match[1]),
      multiplier: Number(match[2]),
    };
  });

  return {
    originalExpression: normalizedExpression,
    groupCount,
    components,
  };
}

function extractGiftProductText(text: string): string {
  const normalized = normalizeCell(text).replace(/^贈品:/u, '');
  const hashIndex = normalized.indexOf('#');
  const productSection = hashIndex >= 0 ? normalized.slice(hashIndex + 1) : normalized;

  return productSection.replace(/(?:x\s*\d+|\s+\d+)$/iu, '').trim();
}

function extractTrailingQuantity(text: string): number | null {
  const normalized = normalizeCell(text);
  const xMatch = normalized.match(/x\s*(\d+)$/iu);

  if (xMatch) {
    return Number(xMatch[1]);
  }

  const tailMatch = normalized.match(/\s(\d+)$/u);

  if (tailMatch) {
    return Number(tailMatch[1]);
  }

  return null;
}

function resolveRowType(row: (string | number)[]): 'order' | 'giftSummary' | 'reshipSummary' | 'empty' | 'other' {
  const sequence = normalizeCell(row[0]);
  const summaryLabel = normalizeCell(row[2]);

  if (/^\d+$/u.test(sequence)) {
    return 'order';
  }

  if (summaryLabel === '贈送量') {
    return 'giftSummary';
  }

  if (summaryLabel === '補寄量') {
    return 'reshipSummary';
  }

  if (row.every((cell) => !normalizeCell(cell))) {
    return 'empty';
  }

  return 'other';
}

function buildRowLabel(rowType: 'order' | 'giftSummary' | 'reshipSummary' | 'empty' | 'other', row: (string | number)[]): string {
  if (rowType === 'order') {
    return `訂單列:${normalizeCell(row[3]) || normalizeCell(row[0])}`;
  }

  if (rowType === 'giftSummary') {
    return '贈送量';
  }

  if (rowType === 'reshipSummary') {
    return '補寄量';
  }

  return '矩陣列';
}

function parseNumericQuantity(text: string): number | null {
  const normalized = normalizeCell(text).replace(/,/gu, '');

  if (!/^\d+$/u.test(normalized)) {
    return null;
  }

  const quantity = Number(normalized);

  return quantity > 0 ? quantity : null;
}

function normalizeCell(value: string | number | undefined): string {
  return String(value ?? '').replace(/\s+/gu, ' ').trim();
}