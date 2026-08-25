import { Injectable, BadRequestException } from '@nestjs/common';
import * as zlib from 'node:zlib';
import { I18nService } from '../../i18n/i18n.service';
import type { SupportedLocale, Role } from '@workspace/types';

export interface UserTemplateRow {
  firstName: string;
  lastName: string;
  phone: string;
  nationalCode?: string;
  role: Role;
  branchName?: string;
  password?: string;
}

const ROLE_PERSIAN_MAP: Record<string, Role> = {
  مدیر: 'ADMIN',
  سرپرست: 'SUPERVISOR',
  دستیار: 'ASSISTANT',
  'منشی ارشد': 'SUPER_CLERK',
  منشی: 'CLERK',
  مدرس: 'TEACHER',
  استاد: 'TEACHER',
  معلم: 'TEACHER',
  دانش‌آموز: 'STUDENT',
  دانش_آموز: 'STUDENT',
  دانشاموز: 'STUDENT',
};

@Injectable()
export class ExcelService {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Normalize Persian & Arabic numerals to standard Latin digits.
   */
  normalizeDigits(str: string): string {
    if (!str) return '';
    return str
      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
      .trim();
  }

  /**
   * Map localized or English role names to standard Role enum key.
   */
  mapRole(rawRole: string | undefined): Role {
    if (!rawRole) return 'TEACHER';
    const trimmed = rawRole.trim();
    if (ROLE_PERSIAN_MAP[trimmed]) {
      return ROLE_PERSIAN_MAP[trimmed];
    }
    const upper = trimmed.toUpperCase();
    const validRoles: Role[] = [
      'ADMIN',
      'SUPERVISOR',
      'ASSISTANT',
      'SUPER_CLERK',
      'CLERK',
      'TEACHER',
      'STUDENT',
    ];
    if (validRoles.includes(upper as Role)) {
      return upper as Role;
    }
    return 'TEACHER';
  }

  /**
   * Parse CSV / TSV / plain spreadsheet text with quote and comma/tab support.
   */
  parseCsv(content: string): Record<string, string>[] {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');
    const lines = cleanContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    // Detect delimiter: comma, semicolon, or tab
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(';') && !firstLine.includes(',')) {
      delimiter = ';';
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.every((v) => v === '')) continue;

      const record: Record<string, string> = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] ?? '';
      });
      records.push(record);
    }

    return records;
  }

  /**
   * Parse an uploaded binary buffer (XLSX or CSV).
   */
  parseUserRows(
    fileBuffer: Buffer,
    _locale: SupportedLocale = 'fa',
  ): UserTemplateRow[] {
    const isZip =
      fileBuffer.length > 4 &&
      fileBuffer[0] === 0x50 &&
      fileBuffer[1] === 0x4b &&
      fileBuffer[2] === 0x03 &&
      fileBuffer[3] === 0x04;

    let rawRecords: Record<string, string>[] = [];

    if (isZip) {
      // XLSX file - extract worksheet and sharedStrings
      rawRecords = this.parseXlsxBuffer(fileBuffer);
    } else {
      // CSV or plain text format
      const text = fileBuffer.toString('utf-8');
      rawRecords = this.parseCsv(text);
    }

    return rawRecords.map((record) => {
      // Intelligently map headers regardless of case or Persian/English labels
      const getField = (...keys: string[]): string => {
        for (const key of keys) {
          for (const [rKey, rVal] of Object.entries(record)) {
            if (
              rKey.trim().toLowerCase() === key.toLowerCase() ||
              rKey.trim() === key
            ) {
              return rVal?.trim() || '';
            }
          }
        }
        return '';
      };

      const firstName = getField('نام', 'firstName', 'First Name', 'Name');
      const lastName = getField(
        'نام خانوادگی',
        'نام_خانوادگی',
        'lastName',
        'Last Name',
        'Family',
      );
      const rawPhone = getField(
        'شماره موبایل',
        'موبایل',
        'تلفن',
        'phone',
        'Phone Number',
        'Mobile',
      );
      const rawNationalCode = getField(
        'کد ملی',
        'کدملی',
        'nationalCode',
        'National Code',
      );
      const rawRole = getField('نقش', 'نقش کاربری', 'role', 'Role');
      const branchName = getField('شعبه', 'نام شعبه', 'branch', 'branchName');
      const password = getField(
        'رمز عبور',
        'رمز',
        'کلمه عبور',
        'رمز عبور اولیه',
        'password',
      );

      const phone = this.normalizeDigits(rawPhone);
      const nationalCode = this.normalizeDigits(rawNationalCode);
      const role = this.mapRole(rawRole);

      return {
        firstName,
        lastName,
        phone,
        nationalCode: nationalCode || undefined,
        role,
        branchName: branchName || undefined,
        password: password || undefined,
      };
    });
  }

  /**
   * Parse XLSX buffer by extracting sharedStrings and sheet1 XML from ZIP.
   */
  private parseXlsxBuffer(buffer: Buffer): Record<string, string>[] {
    try {
      const files = this.unzipBuffer(buffer);
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
        const textParts = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
        const text = textParts
          .map((t) => t.replace(/<[^>]+>/g, ''))
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
        const cellMatches = rowXml.match(/<c[\s\S]*?<\/c>|<c[^\/]*\/>/g) || [];

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
  private unzipBuffer(buffer: Buffer): Record<string, string> {
    const files: Record<string, string> = {};
    let offset = 0;

    while (offset < buffer.length - 30) {
      const signature = buffer.readUInt32LE(offset);
      if (signature !== 0x04034b50) break; // Local file header signature

      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const uncompressedSize = buffer.readUInt32LE(offset + 22);
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
  generateUserTemplate(locale: SupportedLocale = 'fa'): Buffer {
    const isFa = locale === 'fa';

    const headers = isFa
      ? [
          'نام',
          'نام خانوادگی',
          'شماره موبایل',
          'کد ملی',
          'نقش کاربری',
          'شعبه',
          'رمز عبور اولیه',
        ]
      : [
          'First Name',
          'Last Name',
          'Phone Number',
          'National Code',
          'Role',
          'Branch',
          'Initial Password',
        ];

    const sampleRows = isFa
      ? [
          [
            'علی',
            'محمدی',
            '09121111111',
            '0012345678',
            'مدرس',
            'شعبه مرکزی',
            '123456',
          ],
          [
            'سارا',
            'احمدی',
            '09122222222',
            '0023456789',
            'منشی',
            'شعبه مرکزی',
            '',
          ],
          ['رضا', 'حسینی', '09123333333', '', 'سرپرست', '', ''],
        ]
      : [
          [
            'Ali',
            'Mohammadi',
            '09121111111',
            '0012345678',
            'TEACHER',
            'Central Branch',
            '123456',
          ],
          [
            'Sara',
            'Ahmadi',
            '09122222222',
            '0023456789',
            'CLERK',
            'Central Branch',
            '',
          ],
        ];

    return this.buildXlsxBuffer(headers, sampleRows, isFa);
  }

  /**
   * Build a standard valid .xlsx (ZIP package) from headers & rows.
   */
  private buildXlsxBuffer(
    headers: string[],
    rows: string[][],
    isRtl = true,
  ): Buffer {
    const sharedStrings: string[] = [];
    const getSharedStringIndex = (text: string): number => {
      let idx = sharedStrings.indexOf(text);
      if (idx === -1) {
        sharedStrings.push(text);
        idx = sharedStrings.length - 1;
      }
      return idx;
    };

    // Header cell XML
    let sheetDataXml = '<row r="1" ht="28" customHeight="1">';
    headers.forEach((h, colIdx) => {
      const colLetter = String.fromCharCode(65 + colIdx);
      const strIdx = getSharedStringIndex(h);
      sheetDataXml += `<c r="${colLetter}1" t="s" s="1"><v>${strIdx}</v></c>`;
    });
    sheetDataXml += '</row>';

    // Data cell XML
    rows.forEach((row, rowIdx) => {
      const rNum = rowIdx + 2;
      sheetDataXml += `<row r="${rNum}">`;
      row.forEach((cellVal, colIdx) => {
        const colLetter = String.fromCharCode(65 + colIdx);
        if (cellVal !== undefined && cellVal !== '') {
          const strIdx = getSharedStringIndex(cellVal);
          sheetDataXml += `<c r="${colLetter}${rNum}" t="s"><v>${strIdx}</v></c>`;
        }
      });
      sheetDataXml += '</row>';
    });

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0" rightToLeft="${isRtl ? '1' : '0'}"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols>
    ${headers
      .map(
        (_, idx) =>
          `<col min="${idx + 1}" max="${idx + 1}" width="22" customWidth="1"/>`,
      )
      .join('\n    ')}
  </cols>
  <sheetData>
    ${sheetDataXml}
  </sheetData>
</worksheet>`;

    let sstXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">`;
    sharedStrings.forEach((str) => {
      const escaped = str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      sstXml += `<si><t>${escaped}</t></si>`;
    });
    sstXml += '</sst>';

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${isRtl ? 'کاربران' : 'Users'}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

    const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Vazirmatn"/><sz val="11"/></font>
    <font><b/><name val="Vazirmatn"/><sz val="11"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF3B82F6"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

    return this.createZipPackage({
      '[Content_Types].xml': contentTypesXml,
      '_rels/.rels': rootRelsXml,
      'xl/workbook.xml': workbookXml,
      'xl/_rels/workbook.xml.rels': workbookRelsXml,
      'xl/worksheets/sheet1.xml': sheetXml,
      'xl/sharedStrings.xml': sstXml,
      'xl/styles.xml': stylesXml,
    });
  }

  /**
   * Minimal ZIP archive creator for OpenXML spreadsheet packages using standard zlib.
   */
  private createZipPackage(files: Record<string, string>): Buffer {
    const entries: {
      name: string;
      compressedData: Buffer;
      crc: number;
      uncompressedSize: number;
      offset: number;
    }[] = [];

    const localHeaders: Buffer[] = [];
    let currentOffset = 0;

    for (const [name, content] of Object.entries(files)) {
      const data = Buffer.from(content, 'utf-8');
      const crc = this.computeCrc32(data);
      const compressedData = zlib.deflateRawSync(data);

      const nameBuffer = Buffer.from(name, 'utf-8');
      const localHeader = Buffer.alloc(30 + nameBuffer.length);

      localHeader.writeUInt32LE(0x04034b50, 0); // Signature
      localHeader.writeUInt16LE(20, 4); // Version needed (2.0)
      localHeader.writeUInt16LE(0, 6); // General purpose bit flag
      localHeader.writeUInt16LE(8, 8); // Compression method (deflate)
      localHeader.writeUInt16LE(0, 10); // Last mod time
      localHeader.writeUInt16LE(0, 12); // Last mod date
      localHeader.writeUInt32LE(crc, 14); // CRC32
      localHeader.writeUInt32LE(compressedData.length, 18); // Compressed size
      localHeader.writeUInt32LE(data.length, 22); // Uncompressed size
      localHeader.writeUInt16LE(nameBuffer.length, 26); // File name length
      localHeader.writeUInt16LE(0, 28); // Extra field length
      nameBuffer.copy(localHeader, 30);

      entries.push({
        name,
        compressedData,
        crc,
        uncompressedSize: data.length,
        offset: currentOffset,
      });

      localHeaders.push(localHeader, compressedData);
      currentOffset += localHeader.length + compressedData.length;
    }

    // Central Directory
    const centralDirectoryStart = currentOffset;
    const centralHeaders: Buffer[] = [];

    for (const entry of entries) {
      const nameBuffer = Buffer.from(entry.name, 'utf-8');
      const cdHeader = Buffer.alloc(46 + nameBuffer.length);

      cdHeader.writeUInt32LE(0x02014b50, 0); // Signature
      cdHeader.writeUInt16LE(20, 4); // Version made by
      cdHeader.writeUInt16LE(20, 6); // Version needed
      cdHeader.writeUInt16LE(0, 8); // General purpose bit flag
      cdHeader.writeUInt16LE(8, 10); // Compression method
      cdHeader.writeUInt16LE(0, 12); // Last mod time
      cdHeader.writeUInt16LE(0, 14); // Last mod date
      cdHeader.writeUInt32LE(entry.crc, 16); // CRC-32
      cdHeader.writeUInt32LE(entry.compressedData.length, 20); // Compressed size
      cdHeader.writeUInt32LE(entry.uncompressedSize, 24); // Uncompressed size
      cdHeader.writeUInt16LE(nameBuffer.length, 28); // File name length
      cdHeader.writeUInt16LE(0, 30); // Extra field length
      cdHeader.writeUInt16LE(0, 32); // File comment length
      cdHeader.writeUInt16LE(0, 34); // Disk number start
      cdHeader.writeUInt16LE(0, 36); // Internal file attributes
      cdHeader.writeUInt32LE(0, 38); // External file attributes
      cdHeader.writeUInt32LE(entry.offset, 42); // Relative offset of local header
      nameBuffer.copy(cdHeader, 46);

      centralHeaders.push(cdHeader);
      currentOffset += cdHeader.length;
    }

    const centralDirectorySize = currentOffset - centralDirectoryStart;

    // End of Central Directory Record
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
    eocd.writeUInt16LE(0, 4); // Number of this disk
    eocd.writeUInt16LE(0, 6); // Disk with start of CD
    eocd.writeUInt16LE(entries.length, 8); // Total entries on this disk
    eocd.writeUInt16LE(entries.length, 10); // Total entries
    eocd.writeUInt32LE(centralDirectorySize, 12); // Size of CD
    eocd.writeUInt32LE(centralDirectoryStart, 16); // Offset of start of CD
    eocd.writeUInt16LE(0, 20); // Comment length

    return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
  }

  /**
   * Fast CRC32 calculation.
   */
  private computeCrc32(buf: Buffer): number {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ this.crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  private crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();
}
