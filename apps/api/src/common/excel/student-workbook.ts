import type { SupportedLocale } from '@workspace/types';
import { buildXlsxBuffer } from './xlsx-writer';

export interface StudentTemplateRow {
  firstName: string;
  lastName: string;
  phone: string;
  nationalCode?: string;
  fatherName?: string;
  emergencyPhone?: string;
  password?: string;
}

export function generateStudentTemplate(
  locale: SupportedLocale = 'fa',
): Buffer {
  const isFa = locale === 'fa';

  const headers = isFa
    ? [
        'نام',
        'نام خانوادگی',
        'شماره موبایل',
        'کد ملی',
        'نام پدر',
        'شماره تماس اضطراری',
        'رمز عبور اولیه',
      ]
    : [
        'First Name',
        'Last Name',
        'Phone Number',
        'National Code',
        'Father Name',
        'Emergency Phone',
        'Initial Password',
      ];

  const sampleRows = isFa
    ? [
        [
          'پارسا',
          'رستمی',
          '09121111111',
          '0012345678',
          'محمود',
          '09123333333',
          '123456',
        ],
        [
          'نگین',
          'صادقی',
          '09122222222',
          '0023456789',
          'رضا',
          '09124444444',
          '',
        ],
      ]
    : [
        [
          'Parsa',
          'Rostami',
          '09121111111',
          '0012345678',
          'Mahmoud',
          '09123333333',
          '123456',
        ],
        [
          'Negin',
          'Sadeghi',
          '09122222222',
          '0023456789',
          'Reza',
          '09124444444',
          '',
        ],
      ];

  return buildXlsxBuffer(
    headers,
    sampleRows,
    isFa,
    isFa ? 'فراگیران' : 'Students',
  );
}

export function exportStudents(
  students: Array<{
    firstName: string;
    lastName: string;
    phone: string;
    nationalCode?: string | null;
    isActive: boolean;
    createdAt: Date | string;
    fatherName?: string | null;
    emergencyPhone?: string | null;
    currentAllowedCourseTitle?: string | null;
    scheduleStatus?: string | null;
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
        'نام پدر',
        'شماره تماس اضطراری',
        'سطح مجاز فعلی',
        'برنامه حضور',
        'وضعیت',
        'تاریخ ثبت‌نام',
      ]
    : [
        'First Name',
        'Last Name',
        'Phone Number',
        'National Code',
        'Father Name',
        'Emergency Phone',
        'Current Level',
        'Schedule Status',
        'Status',
        'Registration Date',
      ];

  const rows = students.map((s) => {
    const statusLabel = isFa
      ? s.isActive
        ? 'فعال'
        : 'غیرفعال'
      : s.isActive
        ? 'Active'
        : 'Inactive';

    let scheduleStatusLabel = isFa ? 'نیاز به تماس' : 'Incomplete';
    if (s.scheduleStatus === 'COMPLETE') {
      scheduleStatusLabel = isFa ? 'برنامه مشخص شده' : 'Complete';
    }

    let formattedDate = '';
    try {
      const d = new Date(s.createdAt);
      formattedDate = isFa
        ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d)
        : d.toISOString().split('T')[0];
    } catch {
      formattedDate = String(s.createdAt);
    }

    return [
      s.firstName || '',
      s.lastName || '',
      s.phone || '',
      s.nationalCode || '—',
      s.fatherName || '—',
      s.emergencyPhone || '—',
      s.currentAllowedCourseTitle || (isFa ? 'تعیین سطح نشده' : 'No Level'),
      scheduleStatusLabel,
      statusLabel,
      formattedDate,
    ];
  });

  return buildXlsxBuffer(
    headers,
    rows,
    isFa,
    isFa ? 'لیست فراگیران' : 'Students List',
  );
}

export function parseStudentRows(
  rawRecords: Record<string, string>[],
  normalizeDigits: (s: string) => string,
): StudentTemplateRow[] {
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
    const fatherName = getField(
      record,
      'نام پدر',
      'پدر',
      'fatherName',
      'Father Name',
      'Father',
    );
    const rawEmergencyPhone = getField(
      record,
      'شماره تماس اضطراری',
      'تلفن اضطراری',
      'شماره ولی',
      'تلفن ولی',
      'شماره اضطراری',
      'emergencyPhone',
      'Emergency Phone',
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
      fatherName: fatherName || undefined,
      emergencyPhone: normalizeDigits(rawEmergencyPhone) || undefined,
      password: password || undefined,
    };
  });
}
