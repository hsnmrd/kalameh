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
  common: {
    internalServerError: 'خطای داخلی سرور رخ داده است',
    unauthorized: 'عدم دسترسی، لطفاً مجدداً وارد شوید',
    forbidden: 'شما دسترسی لازم برای انجام این عملیات را ندارید',
    badRequest: 'درخواست نامعتبر است',
    notFound: 'موردی یافت نشد',
  },
};
