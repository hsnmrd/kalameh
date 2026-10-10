import { z } from 'zod';
import type { SupportedLocale } from '@workspace/types';
import { buildXlsxBuffer } from './xlsx-writer';

export const BranchImportRowSchema = z.object({
  name: z.string().trim().min(1, { message: 'نام شعبه الزامی است' }),
  address: z.string().trim().optional(),
  phones: z.array(z.string()).optional(),
});

export type BranchTemplateRow = z.infer<typeof BranchImportRowSchema>;

export function generateBranchTemplate(locale: SupportedLocale = 'fa'): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? ['نام شعبه', 'آدرس', 'شماره‌های تماس']
    : ['Branch Name', 'Address', 'Phone Numbers'];

  const sampleRows = isFa
    ? [
        [
          'شعبه مرکزی',
          'تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲',
          '02188888888, 02188888889',
        ],
        ['شعبه غرب', 'تهران، صادقیه، فلکه دوم، مجتمع طلا', '02144444444'],
      ]
    : [
        [
          'Main Branch',
          'Tehran, Valiasr St, No 12',
          '02188888888, 02188888889',
        ],
        ['West Branch', 'Tehran, Sadeghiyeh, 2nd Sq', '02144444444'],
      ];

  return buildXlsxBuffer(headers, sampleRows, isFa, isFa ? 'شعب' : 'Branches');
}

export function exportBranches(
  branches: Array<{
    name: string;
    address?: string | null;
    phones: string[];
    classroomsCount?: number;
    classesCount?: number;
    isActive: boolean;
    createdAt: Date | string;
  }>,
  locale: SupportedLocale = 'fa',
): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? [
        'نام شعبه',
        'آدرس',
        'شماره‌های تماس',
        'تعداد کلاس‌های درس',
        'تعداد کلاس‌ها',
        'وضعیت',
        'تاریخ ایجاد',
      ]
    : [
        'Branch Name',
        'Address',
        'Phone Numbers',
        'Classrooms Count',
        'Classes Count',
        'Status',
        'Creation Date',
      ];

  const rows = branches.map((b) => {
    const statusLabel = isFa
      ? b.isActive
        ? 'فعال'
        : 'غیرفعال'
      : b.isActive
        ? 'Active'
        : 'Inactive';

    let formattedDate = '';
    try {
      const d = new Date(b.createdAt);
      formattedDate = isFa
        ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d)
        : d.toISOString().split('T')[0];
    } catch {
      formattedDate = String(b.createdAt);
    }

    return [
      b.name,
      b.address || '—',
      b.phones?.length ? b.phones.join(isFa ? '، ' : ', ') : '—',
      String(b.classroomsCount ?? 0),
      String(b.classesCount ?? 0),
      statusLabel,
      formattedDate,
    ];
  });

  return buildXlsxBuffer(
    headers,
    rows,
    isFa,
    isFa ? 'لیست شعب' : 'Branches List',
  );
}

export function parseBranchRows(
  rawRecords: Record<string, string>[],
  normalizeDigits: (s: string) => string,
): BranchTemplateRow[] {
  const getField = (
    record: Record<string, string>,
    ...keys: string[]
  ): string => {
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

  return rawRecords.map((record) => {
    const name = getField(
      record,
      'نام شعبه',
      'نام',
      'branch',
      'name',
      'Branch Name',
    );
    const address = getField(record, 'آدرس', 'نشانی', 'address', 'Address');
    const rawPhones = getField(
      record,
      'شماره‌های تماس',
      'شماره تماس',
      'تلفن',
      'تلفن‌ها',
      'phones',
      'Phone Numbers',
    );

    const phones = rawPhones
      ? rawPhones
          .split(/[,،;؛\n]/)
          .map((p) => normalizeDigits(p.trim()))
          .filter(Boolean)
      : [];

    return {
      name,
      address: address || undefined,
      phones,
    };
  });
}
