import type { SupportedLocale } from '@workspace/types';
import { buildXlsxBuffer } from './xlsx-writer';

export interface TeacherTemplateRow {
  firstName: string;
  lastName: string;
  phone: string;
  nationalCode?: string;
  degree?: string;
  bio?: string;
  password?: string;
}

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
        'بیوگرافی و سوابق',
        'رمز عبور اولیه',
      ]
    : [
        'First Name',
        'Last Name',
        'Phone Number',
        'National Code',
        'Degree',
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
          '۱۰ سال سابقه تدریس دوره‌های IELTS',
          '123456',
        ],
        [
          'مریم',
          'کاظمی',
          '09122222222',
          '0023456789',
          'دکترای زبان‌شناسی',
          'مدرس دوره‌های پیشرفته مکالمه',
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
          '10 years experience teaching IELTS',
          '123456',
        ],
        [
          'Maryam',
          'Kazemi',
          '09122222222',
          '0023456789',
          'PhD in Linguistics',
          'Advanced Conversation Instructor',
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
    );

    return {
      firstName,
      lastName,
      phone: normalizeDigits(rawPhone),
      nationalCode: normalizeDigits(rawNationalCode) || undefined,
      degree: degree || undefined,
      bio: bio || undefined,
      password: password || undefined,
    };
  });
}
