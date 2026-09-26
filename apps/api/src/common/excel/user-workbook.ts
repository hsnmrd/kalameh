import type { SupportedLocale, Role } from '@workspace/types';
import { buildXlsxBuffer } from './xlsx-writer';

export function generateUserTemplate(locale: SupportedLocale = 'fa'): Buffer {
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

  return buildXlsxBuffer(headers, sampleRows, isFa);
}

/**
 * Generate an official .xlsx binary export for existing users.
 */
export function exportUsers(
  users: Array<{
    firstName: string;
    lastName: string;
    phone: string;
    nationalCode?: string | null;
    role: Role;
    isActive: boolean;
    createdAt: Date | string;
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
        'نقش کاربری',
        'وضعیت حساب',
        'تاریخ عضویت',
      ]
    : [
        'First Name',
        'Last Name',
        'Phone Number',
        'National Code',
        'Role',
        'Status',
        'Registration Date',
      ];

  const rows = users.map((u) => {
    let roleLabel = String(u.role);
    if (isFa) {
      const reverseRoleMap: Record<Role, string> = {
        SUPER_ADMIN: 'ادمین کل',
        ADMIN: 'مدیر آموزشگاه',
        ASSISTANT: 'دستیار',
        SUPERVISOR: 'سوپروایزر',
        SUPER_CLERK: 'منشی ارشد',
        CLERK: 'منشی',
        TEACHER: 'مدرس',
        SUPER_STUDENT: 'زبان‌آموز ارشد',
        STUDENT: 'زبان‌آموز',
      };
      roleLabel = reverseRoleMap[u.role] || String(u.role);
    }

    const statusLabel = isFa
      ? u.isActive
        ? 'فعال'
        : 'غیرفعال'
      : u.isActive
        ? 'Active'
        : 'Inactive';

    let formattedDate = '';
    try {
      const d = new Date(u.createdAt);
      formattedDate = isFa
        ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d)
        : d.toISOString().split('T')[0];
    } catch {
      formattedDate = String(u.createdAt);
    }

    return [
      u.firstName || '',
      u.lastName || '',
      u.phone || '',
      u.nationalCode || '—',
      roleLabel,
      statusLabel,
      formattedDate,
    ];
  });

  return buildXlsxBuffer(
    headers,
    rows,
    isFa,
    isFa ? 'لیست کاربران' : 'Users List',
  );
}

/**
 * Build a standard valid .xlsx (ZIP package) from headers & rows.
 */
