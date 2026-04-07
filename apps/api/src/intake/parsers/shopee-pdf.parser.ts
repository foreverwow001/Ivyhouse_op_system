import { BadRequestException } from '@nestjs/common';

import { ConfidenceLevel, ParseKind } from '../types/intake.types';

const pdfParse: (dataBuffer: Buffer) => Promise<{ text: string }> = require('pdf-parse');

const SHOPEE_STORE_PREFIX_PATTERN = /^艾薇手工坊\s*/u;
const PAGE_HEADER_PATTERNS = [
  /^儲位$/u,
  /^艾薇手工坊$/u,
  /^揀貨單/u,
  /^列印時間：/u,
  /^出貨數量商店/u,
  /^\(公司倉\)/u,
];
const MERGED_SPEC_MARKERS = ['150g', '135g', '120g', '90g', '60g', '45g', '36入', '30入', '22入', '15入', '10入', '5包'];

export interface ShopeeParsedLineCandidate {
  sourceRowRef: string;
  rawProductText: string;
  rawSpecText?: string;
  rawQuantity: number;
  parseKind: ParseKind;
  parseConfidence: ConfidenceLevel;
  parserWarningCode?: string;
  parserMeta: Record<string, unknown>;
}

interface QuantityParseResult {
  serialNumber: string;
  rawQuantity: number;
  tailText?: string;
  usedMergedSpecHeuristic: boolean;
}

export async function parseShopeePdfToParsedLines(params: {
  fileBuffer: Buffer;
  originalFileName: string;
}): Promise<ShopeeParsedLineCandidate[]> {
  const pdfResult = await pdfParse(params.fileBuffer);
  const text = pdfResult.text?.trim();

  if (!text) {
    throw new BadRequestException('蝦皮 PDF 無法抽出文字內容');
  }

  const blocks = extractShopeeBlocks(text);

  if (blocks.length === 0) {
    throw new BadRequestException('蝦皮 PDF 未辨識到任何可解析商品區塊');
  }

  return blocks.map((block, index) => buildParsedLineCandidate(block, params.originalFileName, index + 1));
}

function extractShopeeBlocks(text: string): string[][] {
  const lines = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    if (isShopeeBlockStart(line)) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
      }

      currentBlock = [line];
      continue;
    }

    if (currentBlock.length === 0) {
      continue;
    }

    if (line.startsWith('合計')) {
      blocks.push(currentBlock);
      currentBlock = [];
      continue;
    }

    if (PAGE_HEADER_PATTERNS.some((pattern) => pattern.test(line))) {
      continue;
    }

    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

function isShopeeBlockStart(line: string): boolean {
  return line.startsWith('艾薇手工坊【艾薇手工坊】');
}

function buildParsedLineCandidate(
  blockLines: string[],
  originalFileName: string,
  blockSequence: number,
): ShopeeParsedLineCandidate {
  let quantityLineIndex = -1;

  for (let index = blockLines.length - 1; index >= 0; index -= 1) {
    if (maybeParseQuantityLine(blockLines[index], blockSequence) !== null) {
      quantityLineIndex = index;
      break;
    }
  }

  if (quantityLineIndex < 0) {
    const collapsedLineCandidate = maybeParseCollapsedSingleLineBlock(
      blockLines,
      originalFileName,
      blockSequence,
    );

    if (collapsedLineCandidate) {
      return collapsedLineCandidate;
    }

    throw new BadRequestException(`蝦皮區塊缺少序號/數量行: ${blockLines.join(' | ')}`);
  }

  const quantityInfo = maybeParseQuantityLine(blockLines[quantityLineIndex], blockSequence);

  if (!quantityInfo) {
    throw new BadRequestException(`蝦皮數量行格式不正確: ${blockLines[quantityLineIndex]}`);
  }

  const descriptionLines = blockLines.slice(0, quantityLineIndex);
  const trailingSpecLines = blockLines.slice(quantityLineIndex + 1);
  const rawProductText = normalizeJoinedText(descriptionLines.map(stripStorePrefix));
  const rawSpecText = normalizeJoinedText(
    [quantityInfo.tailText, ...trailingSpecLines].filter((item): item is string => Boolean(item)),
  );

  if (!rawProductText) {
    throw new BadRequestException(`蝦皮區塊缺少商品名稱: ${blockLines.join(' | ')}`);
  }

  return {
    sourceRowRef: `${originalFileName}#item-${quantityInfo.serialNumber}`,
    rawProductText,
    rawSpecText: rawSpecText || undefined,
    rawQuantity: quantityInfo.rawQuantity,
    parseKind: ParseKind.STANDARD,
    parseConfidence: quantityInfo.usedMergedSpecHeuristic
      ? ConfidenceLevel.MEDIUM
      : ConfidenceLevel.HIGH,
    parserWarningCode: quantityInfo.usedMergedSpecHeuristic
      ? 'SHOPEE_MERGED_QUANTITY_SPEC'
      : undefined,
    parserMeta: {
      serialNumber: quantityInfo.serialNumber,
      rawBlockLines: blockLines,
      parserProfile: 'shopee_pdf_v1',
    },
  };
}

function maybeParseCollapsedSingleLineBlock(
  blockLines: string[],
  originalFileName: string,
  blockSequence: number,
): ShopeeParsedLineCandidate | null {
  if (blockLines.length !== 1) {
    return null;
  }

  const serialNumber = String(blockSequence);
  const normalizedLine = stripStorePrefix(blockLines[0]);
  const match = normalizedLine.match(new RegExp(`^(.*)${serialNumber}(\\d+)$`, 'u'));

  if (!match) {
    return null;
  }

  const rawProductText = normalizeJoinedText([match[1]]);
  const rawQuantity = Number(match[2]);

  if (!rawProductText || !Number.isFinite(rawQuantity) || rawQuantity <= 0) {
    return null;
  }

  return {
    sourceRowRef: `${originalFileName}#item-${serialNumber}`,
    rawProductText,
    rawQuantity,
    parseKind: ParseKind.STANDARD,
    parseConfidence: ConfidenceLevel.MEDIUM,
    parserWarningCode: 'SHOPEE_INLINE_QUANTITY_COLLAPSED',
    parserMeta: {
      serialNumber,
      rawBlockLines: blockLines,
      parserProfile: 'shopee_pdf_v1',
    },
  };
}

function maybeParseQuantityLine(line: string, blockSequence: number): QuantityParseResult | null {
  const serialNumber = String(blockSequence);
  let remainder = '';

  if (isQuantityLineForBlock(line, blockSequence)) {
    remainder = line.slice(serialNumber.length).trim();
  } else {
    const match = line.match(/^(\d+)\s+(.+)$/u);

    if (!match) {
      return null;
    }

    remainder = match[2];
  }

  const directMatch = remainder.match(/^(\d+)(.*)$/u);

  if (!directMatch) {
    return null;
  }

  const [, directQuantityText, directTailText] = directMatch;
  const directQuantity = Number(directQuantityText);

  if (!Number.isFinite(directQuantity) || directQuantity <= 0) {
    return null;
  }

  const directTail = directTailText.trim();
  const mergedMarkerIndex = findMergedSpecMarkerIndex(remainder);

  if (mergedMarkerIndex > 0) {
    const quantityText = remainder.slice(0, mergedMarkerIndex);
    const mergedTailText = remainder.slice(mergedMarkerIndex).trim();

    if (/^\d+$/u.test(quantityText)) {
      return {
        serialNumber,
        rawQuantity: Number(quantityText),
        tailText: mergedTailText || undefined,
        usedMergedSpecHeuristic: true,
      };
    }
  }

  return {
    serialNumber,
    rawQuantity: directQuantity,
    tailText: directTail || undefined,
    usedMergedSpecHeuristic: false,
  };
}

function isQuantityLineForBlock(line: string, blockSequence: number): boolean {
  const serialNumber = String(blockSequence);

  if (!line.startsWith(serialNumber)) {
    return false;
  }

  const suffix = line.slice(serialNumber.length);

  return /^\s*\d/u.test(suffix);
}

function findMergedSpecMarkerIndex(text: string): number {
  for (const marker of MERGED_SPEC_MARKERS) {
    const index = text.indexOf(marker);

    if (index > 0) {
      return index;
    }
  }

  return -1;
}

function stripStorePrefix(line: string): string {
  return line.replace(SHOPEE_STORE_PREFIX_PATTERN, '');
}

function normalizeJoinedText(lines: string[]): string {
  return lines.join('').replace(/\s+/gu, ' ').trim();
}