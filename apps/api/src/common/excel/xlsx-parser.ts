import { BadRequestException } from '@nestjs/common';
import * as zlib from 'node:zlib';

export function parseXlsxBuffer(buffer: Buffer): Record<string, string>[] {
  try {
    const files = unzipBuffer(buffer);
    const sharedStringsXml = files['xl/sharedStrings.xml'] || '';
    const sheetXml =
      files['xl/worksheets/sheet1.xml'] ||
      files['xl/worksheets/sheet.xml'] ||
      '';

    if (!sheetXml) {
      throw new BadRequestException('Worksheet sheet1.xml not found in XLSX');
    }

    // Parse shared strings table
    const sharedStrings: string[] = [];
    const siMatches = sharedStringsXml.match(/<si>[\s\S]*?<\/si>/g) || [];
    for (const si of siMatches) {
      const textParts: string[] = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
      const text = textParts
        .map((t: string) => t.replace(/<[^>]+>/g, ''))
        .join('')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
      sharedStrings.push(text);
    }

    // Parse rows from sheetXml
    const rows: string[][] = [];
    const rowMatches = sheetXml.match(/<row[\s\S]*?<\/row>/g) || [];

    for (const rowXml of rowMatches) {
      const rowCells: string[] = [];
      const cellMatches = rowXml.match(/<c[\s\S]*?<\/c>|<c[^/]*\/>/g) || [];

      for (const cellXml of cellMatches) {
        const isSharedString = cellXml.includes('t="s"');
        const isInlineString = cellXml.includes('t="inlineStr"');
        const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
        const inlineMatch = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/);

        let cellValue = '';
        if (isInlineString && inlineMatch) {
          cellValue = inlineMatch[1];
        } else if (valueMatch) {
          const rawVal = valueMatch[1];
          if (isSharedString) {
            const idx = parseInt(rawVal, 10);
            cellValue = sharedStrings[idx] ?? '';
          } else {
            cellValue = rawVal;
          }
        }
        rowCells.push(cellValue.trim());
      }
      if (rowCells.some((c) => c !== '')) {
        rows.push(rowCells);
      }
    }

    if (rows.length === 0) return [];

    const headers = rows[0];
    const result: Record<string, string>[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) {
          record[h] = row[idx] ?? '';
        }
      });
      result.push(record);
    }

    return result;
  } catch {
    // Fallback if XLSX unpacking fails
    return [];
  }
}

/**
 * Minimal pure Node.js ZIP file reader.
 */
function unzipBuffer(buffer: Buffer): Record<string, string> {
  const files: Record<string, string> = {};
  let offset = 0;

  while (offset < buffer.length - 30) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break; // Local file header signature

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);

    const fileName = buffer.toString(
      'utf-8',
      offset + 30,
      offset + 30 + fileNameLength,
    );
    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
    const compressedData = buffer.subarray(
      dataOffset,
      dataOffset + compressedSize,
    );

    if (compressionMethod === 0) {
      // Uncompressed (stored)
      files[fileName] = compressedData.toString('utf-8');
    } else if (compressionMethod === 8) {
      // Deflated
      try {
        const uncompressed = zlib.inflateRawSync(compressedData);
        files[fileName] = uncompressed.toString('utf-8');
      } catch {
        // Ignore decompression failure for non-essential assets
      }
    }

    offset = dataOffset + compressedSize;
  }

  return files;
}

/**
 * Generate an official .xlsx binary template package for user import.
 */
