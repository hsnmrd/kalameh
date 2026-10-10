import { z } from 'zod';
import type { SupportedLocale } from '@workspace/types';
import { buildXlsxBuffer } from './xlsx-writer';

export const StudentImportRowSchema = z.object({
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
  currentAllowedCourseTitle: z.string().trim().optional(),
  fatherName: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  birthDate: z.string().trim().optional(),
  emergencyPhone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  schoolShift: z.string().trim().optional(),
  dayPreference: z.string().trim().optional(),
  branchName: z.string().trim().optional(),
  password: z.string().trim().optional(),
});

export type StudentTemplateRow = z.infer<typeof StudentImportRowSchema>;

export interface ValidStudentImportRow {
  instituteId: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalCode?: string;
  currentAllowedCourseId?: string;
  branchId?: string;
  fatherName?: string;
  gender?: string;
  birthDate?: Date;
  emergencyPhone?: string;
  address?: string;
  schoolShift: 'MORNING' | 'AFTERNOON' | 'FLEXIBLE';
  dayPreference: 'EVEN_DAYS' | 'ODD_DAYS' | 'ANY';
  password: string;
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
        'سطح / دوره مجاز',
        'نام پدر',
        'جنسیت',
        'تاریخ تولد',
        'شماره تماس اضطراری',
        'آدرس',
        'شیفت مدرسه',
        'ترجیح روز',
        'شعبه',
        'رمز عبور اولیه',
      ]
    : [
        'First Name',
        'Last Name',
        'Phone Number',
        'National Code',
        'Allowed Level / Course',
        'Father Name',
        'Gender',
        'Birth Date',
        'Emergency Phone',
        'Address',
        'School Shift',
        'Day Preference',
        'Branch',
        'Initial Password',
      ];

  const sampleRows = isFa
    ? [
        [
          'پارسا',
          'رستمی',
          '09121111111',
          '0012345678',
          'انگلیسی مقدماتی A1',
          'محمود',
          'پسر',
          '1388/04/15',
          '09123333333',
          'تهران، خیابان آزادی، کوچه مریم، پلاک ۱۰',
          'صبح',
          'روزهای فرد',
          'شعبه مرکزی',
          '123456',
        ],
        [
          'نگین',
          'صادقی',
          '09122222222',
          '0023456789',
          'IELTS Pre-Course',
          'رضا',
          'دختر',
          '1386/11/20',
          '09124444444',
          'تهران، میدان ونک، کوچه لادن، پلاک ۴',
          'عصر',
          'روزهای زوج',
          '',
          '',
        ],
      ]
    : [
        [
          'Parsa',
          'Rostami',
          '09121111111',
          '0012345678',
          'English A1',
          'Mahmoud',
          'Male',
          '2009-07-06',
          '09123333333',
          'Tehran, Azadi St, No 10',
          'Morning',
          'Odd Days',
          'Main Branch',
          '123456',
        ],
        [
          'Negin',
          'Sadeghi',
          '09122222222',
          '0023456789',
          'IELTS Pre-Course',
          'Reza',
          'Female',
          '2008-02-09',
          '09124444444',
          'Tehran, Vanak Sq, No 4',
          'Afternoon',
          'Even Days',
          '',
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
    gender?: string | null;
    birthDate?: Date | string | null;
    emergencyPhone?: string | null;
    address?: string | null;
    schoolShift?: string | null;
    dayPreference?: string | null;
    branchName?: string | null;
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
        'سطح / دوره مجاز',
        'نام پدر',
        'جنسیت',
        'تاریخ تولد',
        'شماره تماس اضطراری',
        'آدرس',
        'شیفت مدرسه',
        'ترجیح روز',
        'شعبه',
        'وضعیت برنامه هفتگی',
        'وضعیت',
        'تاریخ ثبت نام',
      ]
    : [
        'First Name',
        'Last Name',
        'Phone Number',
        'National Code',
        'Allowed Level / Course',
        'Father Name',
        'Gender',
        'Birth Date',
        'Emergency Phone',
        'Address',
        'School Shift',
        'Day Preference',
        'Branch',
        'Schedule Status',
        'Status',
        'Registration Date',
      ];

  const shiftLabels: Record<string, { fa: string; en: string }> = {
    MORNING: { fa: 'صبح', en: 'Morning' },
    AFTERNOON: { fa: 'عصر', en: 'Afternoon' },
    FLEXIBLE: { fa: 'شناور', en: 'Flexible' },
  };

  const dayPrefLabels: Record<string, { fa: string; en: string }> = {
    EVEN_DAYS: { fa: 'روزهای زوج', en: 'Even Days' },
    ODD_DAYS: { fa: 'روزهای فرد', en: 'Odd Days' },
    ANY: { fa: 'فرقی ندارد', en: 'Any' },
  };

  const rows = students.map((s) => {
    const statusLabel = isFa
      ? s.isActive
        ? 'فعال'
        : 'غیرفعال'
      : s.isActive
        ? 'Active'
        : 'Inactive';

    const scheduleStatusLabel = isFa
      ? s.scheduleStatus === 'COMPLETE'
        ? 'تکمیل شده'
        : 'ناقص'
      : s.scheduleStatus === 'COMPLETE'
        ? 'Complete'
        : 'Incomplete';

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

    let formattedBirthDate = '—';
    if (s.birthDate) {
      try {
        const bd = new Date(s.birthDate);
        formattedBirthDate = isFa
          ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(bd)
          : bd.toISOString().split('T')[0];
      } catch {
        formattedBirthDate = String(s.birthDate);
      }
    }

    const shiftText = s.schoolShift
      ? shiftLabels[s.schoolShift]?.[isFa ? 'fa' : 'en'] || s.schoolShift
      : '—';

    const dayPrefText = s.dayPreference
      ? dayPrefLabels[s.dayPreference]?.[isFa ? 'fa' : 'en'] || s.dayPreference
      : '—';

    return [
      s.firstName || '',
      s.lastName || '',
      s.phone || '',
      s.nationalCode || '—',
      s.currentAllowedCourseTitle || '—',
      s.fatherName || '—',
      s.gender || '—',
      formattedBirthDate,
      s.emergencyPhone || '—',
      s.address || '—',
      shiftText,
      dayPrefText,
      s.branchName || '—',
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
    const courseTitle = getField(
      record,
      'سطح',
      'دوره',
      'سطح / دوره مجاز',
      'سطح مجاز',
      'دوره مجاز',
      'سطح زبان',
      'level',
      'course',
      'Allowed Level / Course',
      'Course Title',
    );
    const fatherName = getField(
      record,
      'نام پدر',
      'پدر',
      'fatherName',
      'Father Name',
    );
    const gender = getField(record, 'جنسیت', 'gender', 'Gender');
    const birthDate = getField(
      record,
      'تاریخ تولد',
      'تولد',
      'birthDate',
      'Birth Date',
    );
    const rawEmergency = getField(
      record,
      'شماره تماس اضطراری',
      'شماره اضطراری',
      'تماس اضطراری',
      'تلفن اضطراری',
      'emergencyPhone',
      'Emergency Phone',
    );
    const address = getField(record, 'آدرس', 'نشانی', 'address', 'Address');
    const schoolShift = getField(
      record,
      'شیفت مدرسه',
      'شیفت',
      'schoolShift',
      'School Shift',
    );
    const dayPreference = getField(
      record,
      'ترجیح روز',
      'روزهای ترجیحی',
      'dayPreference',
      'Day Preference',
    );
    const branchName = getField(
      record,
      'شعبه',
      'نام شعبه',
      'branch',
      'Branch',
      'Branch Name',
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
      currentAllowedCourseTitle: courseTitle || undefined,
      fatherName: fatherName || undefined,
      gender: gender || undefined,
      birthDate: birthDate || undefined,
      emergencyPhone: normalizeDigits(rawEmergency) || undefined,
      address: address || undefined,
      schoolShift: schoolShift || undefined,
      dayPreference: dayPreference || undefined,
      branchName: branchName || undefined,
      password: password || undefined,
    };
  });
}

export function parseShift(val?: string): 'MORNING' | 'AFTERNOON' | 'FLEXIBLE' {
  if (!val) return 'FLEXIBLE';
  const norm = val.toLowerCase();
  if (norm.includes('صبح') || norm.includes('morning')) return 'MORNING';
  if (norm.includes('عصر') || norm.includes('afternoon')) return 'AFTERNOON';
  return 'FLEXIBLE';
}

export function parseDayPref(val?: string): 'EVEN_DAYS' | 'ODD_DAYS' | 'ANY' {
  if (!val) return 'ANY';
  const norm = val.toLowerCase();
  if (norm.includes('زوج') || norm.includes('even')) return 'EVEN_DAYS';
  if (norm.includes('فرد') || norm.includes('odd')) return 'ODD_DAYS';
  return 'ANY';
}
