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
  students: {
    studentAlreadyExists:
      'فراگیری با این شماره تماس در این آموزشگاه قبلاً ثبت شده است',
    studentNotFound: 'فراگیر مورد نظر یافت نشد',
    unauthorizedStudentCreation: 'شما مجوز ثبت فراگیر جدید را ندارید',
    phoneAlreadyInUse:
      'این شماره تماس به کاربر دیگری در این آموزشگاه اختصاص یافته است',
    passwordResetSuccess: 'رمز عبور فراگیر با موفقیت بازنشانی شد',
  },
  institutes: {
    instituteNotFound: 'آموزشگاه مورد نظر یافت نشد',
    subdomainAlreadyExists: 'آموزشگاهی با این زیردامنه قبلاً ثبت شده است',
    cannotDeleteWithDependencies:
      'امکان حذف آموزشگاه دارای اطلاعات وابسته وجود ندارد',
    cannotDeleteSystemInstitute: 'امکان حذف آموزشگاه اصلی سامانه وجود ندارد',
    instituteDeletedSuccess: 'آموزشگاه با موفقیت حذف گردید',
  },
  branches: {
    branchNotFound: 'شعبه مورد نظر یافت نشد',
    branchAlreadyExists: 'شعبه‌ای با این نام قبلاً در آموزشگاه ثبت شده است',
  },
  terms: {
    termNotFound: 'ترم تحصیلی مورد نظر یافت نشد',
    termAlreadyExists: 'ترمی با این عنوان قبلاً در آموزشگاه ثبت شده است',
    invalidDateRange: 'تاریخ پایان ترم باید پس از تاریخ شروع باشد',
  },
  courses: {
    courseNotFound: 'سطح/دوره آموزشی مورد نظر یافت نشد',
    courseAlreadyExists: 'سطحی با این عنوان قبلاً در آموزشگاه ثبت شده است',
    prerequisiteNotFound: 'سطح پیش‌نیاز انتخابی یافت نشد',
    prerequisiteCycleDetected:
      'امکان ایجاد حلقه بازگشتی در زنجیره پیش‌نیازها وجود ندارد',
  },
  classes: {
    classNotFound: 'کلاس مورد نظر یافت نشد',
    classAlreadyExists: 'کلاسی با این مشخصات قبلاً در این ترم ثبت شده است',
    classFull: 'ظرفیت این کلاس تکمیل شده است',
    invalidTermOrCourse: 'ترم یا سطح آموزشی انتخابی نامعتبر است',
  },
  grades: {
    gradesSubmittedSuccess:
      'نمرات کلاس با موفقیت ثبت و وضعیت قبولی زبان‌آموزان اعمال شد',
    studentNotEnrolled: 'زبان‌آموز در این کلاس ثبت‌نام نکرده است',
    invalidScoreRange: 'نمره باید عددی بین ۰ تا ۱۰۰ باشد',
    studentLevelUpdatedSuccess: 'سطح مجاز زبان‌آموز با موفقیت تغییر یافت',
  },
  common: {
    internalServerError: 'خطای داخلی سرور رخ داده است',
    unauthorized: 'عدم دسترسی، لطفاً مجدداً وارد شوید',
    forbidden: 'شما دسترسی لازم برای انجام این عملیات را ندارید',
    badRequest: 'درخواست نامعتبر است',
    notFound: 'موردی یافت نشد',
  },
};
