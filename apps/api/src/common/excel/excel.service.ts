import { Injectable } from '@nestjs/common';
import { I18nService } from '../../i18n/i18n.service';
import type { SupportedLocale, Role } from '@workspace/types';
import { parseXlsxBuffer } from './xlsx-parser';
import { buildXlsxBuffer } from './xlsx-writer';
import { exportUsers, generateUserTemplate } from './user-workbook';

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
    locale: SupportedLocale = 'fa',
  ): UserTemplateRow[] {
    void locale;
    const isZip =
      fileBuffer.length > 4 &&
      fileBuffer[0] === 0x50 &&
      fileBuffer[1] === 0x4b &&
      fileBuffer[2] === 0x03 &&
      fileBuffer[3] === 0x04;

    let rawRecords: Record<string, string>[] = [];

    if (isZip) {
      // XLSX file - extract worksheet and sharedStrings
      rawRecords = parseXlsxBuffer(fileBuffer);
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

  generateUserTemplate(locale: SupportedLocale = 'fa'): Buffer {
    return generateUserTemplate(locale);
  }

  exportUsers(
    users: Parameters<typeof exportUsers>[0],
    locale: SupportedLocale = 'fa',
  ): Buffer {
    return exportUsers(users, locale);
  }

  buildXlsxBuffer(
    headers: string[],
    rows: string[][],
    isRtl = true,
    sheetTitle?: string,
  ): Buffer {
    return buildXlsxBuffer(headers, rows, isRtl, sheetTitle);
  }
}
