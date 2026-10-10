import { z } from 'zod';
import type { SupportedLocale } from '@workspace/types';
import { buildXlsxBuffer } from './xlsx-writer';

export const TeacherImportRowSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' }),
  lastName: z
    .string()
    .trim()
    .min(2, { message: 'نام خانوادگی باید حداقل ۲ کاراکتر باشد' }),
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, {
      message: 'شماره تماس باید ۱۱ رقم و با ۰۹ شروع شود',
    }),
  nationalCode: z.string().trim().optional(),
  degree: z.string().trim().optional(),
  teachableCourses: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  branchName: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  password: z.string().trim().optional(),
});

export type TeacherTemplateRow = z.infer<typeof TeacherImportRowSchema>;

export function generateTeacherTemplate(
  locale: SupportedLocale = 'fa',
): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? [
        'نام',
        'نام خانوادگی',
        'شماره موبایل',
        'کد ملی',
        'مدرک تحصیلی',
        'دوره‌های قابل تدریس',
        'تخصص‌ها',
        'شعبه',
        'بیوگرافی و سوابق',
        'رمز عبور اولیه',
      ]
    : [
        'First Name',
        'Last Name',
        'Phone Number',
        'National Code',
        'Degree',
        'Teachable Courses',
        'Specialties',
        'Branch',
        'Bio',
        'Initial Password',
      ];

  const sampleRows = isFa
    ? [
        [
          'علیرضا',
          'احمدی',
          '09121111111',
          '0012345678',
          'کارشناسی ارشد آموزش زبان انگلیسی',
          'انگلیسی بزرگسالان، IELTS',
          'مکالمه پیشرفته، گرامر',
          'شعبه مرکزی',
          '۱۰ سال سابقه تدریس دوره‌های تخصصی',
          '123456',
        ],
        [
          'مریم',
          'کاظمی',
          '09122222222',
          '0023456789',
          'دکترای زبان‌شناسی',
          'انگلیسی نوجوانان',
          'آموزش کودکان و نوجوانان',
          '',
          'مدرس دوره‌های مکالمه',
          '',
        ],
      ]
    : [
        [
          'Alireza',
          'Ahmadi',
          '09121111111',
          '0012345678',
          'MA in TEFL',
          'Adults English, IELTS',
          'Advanced Conversation, Grammar',
          'Main Branch',
          '10 years teaching experience',
          '123456',
        ],
        [
          'Maryam',
          'Kazemi',
          '09122222222',
          '0023456789',
          'PhD in Linguistics',
          'Teen English',
          'Kids Education',
          '',
          'Conversation Lecturer',
          '',
        ],
      ];

  return buildXlsxBuffer(
    headers,
    sampleRows,
    isFa,
    isFa ? 'اساتید' : 'Teachers',
  );
}

export function exportTeachers(
  teachers: Array<{
    firstName: string;
    lastName: string;
    phone: string;
    nationalCode?: string | null;
    isActive: boolean;
    createdAt: Date | string;
    classesCount?: number;
    degree?: string | null;
    teachableCourses?: string[];
    specialties?: string[];
    branchName?: string | null;
    bio?: string | null;
  }>,
  locale: SupportedLocale = 'fa',
): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? [
        'نام',
        'نام خانوادگی',
        'شماره موبایل',
        'کد ملی',
        'مدرک تحصیلی',
        'دوره‌های قابل تدریس',
        'تخصص‌ها',
        'شعبه',
        'بیوگرافی',
        'تعداد کلاس‌ها',
        'وضعیت',
        'تاریخ عضویت',
      ]
    : [
        'First Name',
        'Last Name',
        'Phone Number',
        'National Code',
        'Degree',
        'Teachable Courses',
        'Specialties',
        'Branch',
        'Bio',
        'Classes Count',
        'Status',
        'Registration Date',
      ];

  const rows = teachers.map((t) => {
    const statusLabel = isFa
      ? t.isActive
        ? 'فعال'
        : 'غیرفعال'
      : t.isActive
        ? 'Active'
        : 'Inactive';

    let formattedDate = '';
    try {
      const d = new Date(t.createdAt);
      formattedDate = isFa
        ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d)
        : d.toISOString().split('T')[0];
    } catch {
      formattedDate = String(t.createdAt);
    }

    return [
      t.firstName || '',
      t.lastName || '',
      t.phone || '',
      t.nationalCode || '—',
      t.degree || '—',
      t.teachableCourses?.length
        ? t.teachableCourses.join(isFa ? '، ' : ', ')
        : '—',
      t.specialties?.length ? t.specialties.join(isFa ? '، ' : ', ') : '—',
      t.branchName || '—',
      t.bio || '—',
      String(t.classesCount ?? 0),
      statusLabel,
      formattedDate,
    ];
  });

  return buildXlsxBuffer(
    headers,
    rows,
    isFa,
    isFa ? 'لیست اساتید' : 'Teachers List',
  );
}

export function parseTeacherRows(
  rawRecords: Record<string, string>[],
  normalizeDigits: (s: string) => string,
): TeacherTemplateRow[] {
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

  const splitList = (raw: string): string[] => {
    if (!raw) return [];
    return raw
      .split(/[,،;؛\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  return rawRecords.map((record) => {
    const firstName = getField(
      record,
      'نام',
      'firstName',
      'First Name',
      'Name',
    );
    const lastName = getField(
      record,
      'نام خانوادگی',
      'نام_خانوادگی',
      'lastName',
      'Last Name',
      'Family',
    );
    const rawPhone = getField(
      record,
      'شماره موبایل',
      'موبایل',
      'تلفن',
      'شماره تماس',
      'phone',
      'Phone Number',
      'Mobile',
    );
    const rawNationalCode = getField(
      record,
      'کد ملی',
      'کدملی',
      'nationalCode',
      'National Code',
    );
    const degree = getField(
      record,
      'مدرک',
      'مدرک تحصیلی',
      'degree',
      'Degree',
      'Education',
    );
    const rawTeachable = getField(
      record,
      'دوره‌های قابل تدریس',
      'دوره ها',
      'دوره‌ها',
      'دوره‌های تدریس',
      'سطوح تدریس',
      'teachableCourses',
      'Teachable Courses',
      'Courses',
    );
    const rawSpecialties = getField(
      record,
      'تخصص‌ها',
      'تخصص ها',
      'تخصص',
      'مهارت‌ها',
      'specialties',
      'Specialties',
    );
    const branchName = getField(
      record,
      'شعبه',
      'نام شعبه',
      'branch',
      'Branch',
      'Branch Name',
    );
    const bio = getField(
      record,
      'بیوگرافی',
      'بیوگرافی و سوابق',
      'سوابق',
      'bio',
      'Bio',
    );
    const password = getField(
      record,
      'رمز عبور',
      'رمز',
      'کلمه عبور',
      'رمز عبور اولیه',
      'password',
      'Initial Password',
    );

    return {
      firstName,
      lastName,
      phone: normalizeDigits(rawPhone),
      nationalCode: normalizeDigits(rawNationalCode) || undefined,
      degree: degree || undefined,
      teachableCourses: splitList(rawTeachable),
      specialties: splitList(rawSpecialties),
      branchName: branchName || undefined,
      bio: bio || undefined,
      password: password || undefined,
    };
  });
}
