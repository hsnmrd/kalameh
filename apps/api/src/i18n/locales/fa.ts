import type { TranslationDictionary } from '../i18n.types';

export const fa: TranslationDictionary = {
  auth: {
    instituteNotFound: 'آموزشگاه مورد نظر یافت نشد',
    instituteBlocked: 'دسترسی این آموزشگاه مسدود شده است',
    instituteDeactivated: 'آموزشگاه شما غیرفعال شده است',
    invalidCredentials: 'شماره موبایل یا رمز عبور اشتباه است',
    multipleInstitutesFound:
      'این شماره در چند آموزشگاه ثبت شده است. لطفاً شناسه یا زیردامنه آموزشگاه را وارد کنید',
    userDeactivated: 'حساب کاربری شما غیرفعال شده است',
    userNotFound: 'کاربر یافت نشد',
    invalidCurrentPassword: 'رمز عبور فعلی نادرست است',
    passwordChangedSuccess: 'رمز عبور با موفقیت به‌روزرسانی شد',
    logoutSuccess: 'با موفقیت خارج شدید',
  },
  users: {
    userAlreadyExists:
      'کاربری با این شماره تماس در این آموزشگاه قبلاً ثبت شده است',
    instituteAdminAllowedRolesOnly:
      'مدیر آموزشگاه تنها مجاز به ایجاد کاربران با نقش منشی یا زبان‌آموز است',
    clerkAllowedRolesOnly: 'منشی آموزشگاه تنها مجاز به ثبت زبان‌آموز جدید است',
    unauthorizedUserCreation: 'شما مجوز ایجاد کاربر را ندارید',
    userNotFound: 'کاربر مورد نظر یافت نشد',
    cannotAccessSuperAdmin: 'دسترسی به اطلاعات این کاربر مجاز نمی‌باشد',
    clerkAccessStudentOnly: 'منشی تنها به اطلاعات زبان‌آموزان دسترسی دارد',
    cannotEditSuperAdmin: 'شما اجازه ویرایش اطلاعات ادمین کل را ندارید',
    clerkEditStudentOnly: 'منشی تنها اجازه ویرایش اطلاعات زبان‌آموزان را دارد',
    phoneAlreadyInUse:
      'این شماره تماس به کاربر دیگری در این آموزشگاه اختصاص یافته است',
    cannotResetSuperAdminPassword:
      'شما اجازه بازنشانی رمز عبور ادمین کل را ندارید',
    clerkResetStudentPasswordOnly:
      'منشی تنها اجازه بازنشانی رمز عبور زبان‌آموزان را دارد',
    passwordResetSuccess: 'رمز عبور با موفقیت بازنشانی شد',
  },
  institutes: {
    instituteNotFound: 'آموزشگاه مورد نظر یافت نشد',
    subdomainAlreadyExists: 'آموزشگاهی با این زیردامنه قبلاً ثبت شده است',
    cannotDeleteWithDependencies:
      'امکان حذف آموزشگاه دارای اطلاعات وابسته وجود ندارد',
  },
  common: {
    internalServerError: 'خطای داخلی سرور رخ داده است',
    unauthorized: 'عدم دسترسی، لطفاً مجدداً وارد شوید',
    forbidden: 'شما دسترسی لازم برای انجام این عملیات را ندارید',
    badRequest: 'درخواست نامعتبر است',
    notFound: 'موردی یافت نشد',
  },
};
