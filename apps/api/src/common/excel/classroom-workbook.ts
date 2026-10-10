import { z } from 'zod';
import type { SupportedLocale } from '@workspace/types';
import { buildXlsxBuffer } from './xlsx-writer';

export const ClassroomImportRowSchema = z.object({
  name: z.string().trim().min(1, { message: 'نام کلاس الزامی است' }),
  capacity: z.coerce
    .number()
    .int()
    .positive({ message: 'ظرفیت کلاس باید یک عدد مثبت باشد' }),
  branchName: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export type ClassroomTemplateRow = z.infer<typeof ClassroomImportRowSchema>;

export function generateClassroomTemplate(
  locale: SupportedLocale = 'fa',
): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? ['نام کلاس', 'ظرفیت', 'شعبه', 'توضیحات']
    : ['Classroom Name', 'Capacity', 'Branch', 'Description'];

  const sampleRows = isFa
    ? [
        ['کلاس ۱۰۱', '۱۵', 'شعبه مرکزی', 'مجهز به ویدیو پروژکتور و وایت‌برد'],
        ['کلاس ۱۰۲', '۱۲', '', 'کلاس گفتگوی آزاد'],
      ]
    : [
        [
          'Room 101',
          '15',
          'Main Branch',
          'Equipped with projector & whiteboard',
        ],
        ['Room 102', '12', '', 'Discussion room'],
      ];

  return buildXlsxBuffer(
    headers,
    sampleRows,
    isFa,
    isFa ? 'کلاس‌های درس' : 'Classrooms',
  );
}

export function exportClassrooms(
  classrooms: Array<{
    name: string;
    capacity: number;
    branchName?: string | null;
    description?: string | null;
    classesCount?: number;
    isActive: boolean;
    createdAt: Date | string;
  }>,
  locale: SupportedLocale = 'fa',
): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? [
        'نام کلاس',
        'ظرفیت',
        'شعبه',
        'توضیحات',
        'تعداد کلاس‌ها',
        'وضعیت',
        'تاریخ ایجاد',
      ]
    : [
        'Classroom Name',
        'Capacity',
        'Branch',
        'Description',
        'Classes Count',
        'Status',
        'Creation Date',
      ];

  const rows = classrooms.map((c) => {
    const statusLabel = isFa
      ? c.isActive
        ? 'فعال'
        : 'غیرفعال'
      : c.isActive
        ? 'Active'
        : 'Inactive';

    let formattedDate = '';
    try {
      const d = new Date(c.createdAt);
      formattedDate = isFa
        ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d)
        : d.toISOString().split('T')[0];
    } catch {
      formattedDate = String(c.createdAt);
    }

    return [
      c.name,
      String(c.capacity),
      c.branchName || '—',
      c.description || '—',
      String(c.classesCount ?? 0),
      statusLabel,
      formattedDate,
    ];
  });

  return buildXlsxBuffer(
    headers,
    rows,
    isFa,
    isFa ? 'لیست کلاس‌های درس' : 'Classrooms List',
  );
}

export function parseClassroomRows(
  rawRecords: Record<string, string>[],
  normalizeDigits: (s: string) => string,
): ClassroomTemplateRow[] {
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
      'نام کلاس',
      'نام',
      'class',
      'name',
      'Classroom Name',
      'Room',
    );
    const rawCapacity = getField(
      record,
      'ظرفیت',
      'ظرفیت کلاس',
      'capacity',
      'Capacity',
    );
    const branchName = getField(
      record,
      'شعبه',
      'نام شعبه',
      'branch',
      'Branch',
      'Branch Name',
    );
    const description = getField(
      record,
      'توضیحات',
      'شرح',
      'description',
      'Description',
    );

    const normCap = normalizeDigits(rawCapacity);
    const parsedCapacity = Number(normCap) || 0;

    return {
      name,
      capacity: parsedCapacity,
      branchName: branchName || undefined,
      description: description || undefined,
    };
  });
}
