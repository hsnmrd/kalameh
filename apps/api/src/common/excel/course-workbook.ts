import { z } from 'zod';
import type { SupportedLocale } from '@workspace/types';
import { buildXlsxBuffer } from './xlsx-writer';

export const CourseImportRowSchema = z.object({
  title: z.string().trim().min(1, { message: 'عنوان دوره الزامی است' }),
  baseFee: z.coerce
    .number()
    .int()
    .nonnegative({ message: 'شهریه پایه باید یک عدد نامنفی باشد' }),
  prerequisiteTitle: z.string().trim().optional(),
});

export type CourseTemplateRow = z.infer<typeof CourseImportRowSchema>;

export function generateCourseTemplate(locale: SupportedLocale = 'fa'): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? ['عنوان دوره', 'شهریه پایه (تومان)', 'پیش‌نیاز']
    : ['Course Title', 'Base Fee', 'Prerequisite'];

  const sampleRows = isFa
    ? [
        ['انگلیسی مقدماتی A1', '1500000', ''],
        ['انگلیسی مقدماتی A2', '1650000', 'انگلیسی مقدماتی A1'],
        ['IELTS Preparation', '2800000', 'انگلیسی پیشرفته C1'],
      ]
    : [
        ['Elementary A1', '1500000', ''],
        ['Elementary A2', '1650000', 'Elementary A1'],
        ['IELTS Preparation', '2800000', 'Advanced C1'],
      ];

  return buildXlsxBuffer(
    headers,
    sampleRows,
    isFa,
    isFa ? 'دوره‌ها' : 'Courses',
  );
}

export function exportCourses(
  courses: Array<{
    title: string;
    baseFee: number;
    prerequisiteTitle?: string | null;
    classesCount?: number;
    qualifiedTeachersCount?: number;
    createdAt: Date | string;
  }>,
  locale: SupportedLocale = 'fa',
): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? [
        'عنوان دوره',
        'شهریه پایه (تومان)',
        'پیش‌نیاز',
        'تعداد کلاس‌ها',
        'اساتید واجد شرایط',
        'تاریخ ایجاد',
      ]
    : [
        'Course Title',
        'Base Fee',
        'Prerequisite',
        'Classes Count',
        'Qualified Teachers',
        'Creation Date',
      ];

  const rows = courses.map((c) => {
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
      c.title,
      c.baseFee.toLocaleString('en-US'),
      c.prerequisiteTitle || '—',
      String(c.classesCount ?? 0),
      String(c.qualifiedTeachersCount ?? 0),
      formattedDate,
    ];
  });

  return buildXlsxBuffer(
    headers,
    rows,
    isFa,
    isFa ? 'لیست دوره‌ها' : 'Courses List',
  );
}

export function parseCourseRows(
  rawRecords: Record<string, string>[],
  normalizeDigits: (s: string) => string,
): CourseTemplateRow[] {
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
    const title = getField(
      record,
      'عنوان دوره',
      'عنوان',
      'نام دوره',
      'دوره',
      'course',
      'title',
      'Course Title',
    );
    const rawBaseFee = getField(
      record,
      'شهریه پایه',
      'شهریه',
      'شهریه پایه (تومان)',
      'fee',
      'baseFee',
      'Base Fee',
    );
    const prerequisite = getField(
      record,
      'پیش‌نیاز',
      'پیشنیاز',
      'پیش نیاز',
      'prerequisite',
      'Prerequisite',
    );

    const cleanFee = normalizeDigits(rawBaseFee).replace(/,/g, '');
    const baseFee = Number(cleanFee) || 0;

    return {
      title,
      baseFee,
      prerequisiteTitle: prerequisite || undefined,
    };
  });
}
