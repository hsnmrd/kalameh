# MVP-011 — قراردادهای مشترک زمان‌بندی

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** Zod Schemaها و Typeهای مشترک میان API و رابط‌های کاربری  
**محل پیاده‌سازی:** `@workspace/types/scheduling`

---

## قراردادهای اضافه‌شده

- `ClassRequirementInputSchema` و `ClassRequirementSchema` برای نیاز کلاس ترم؛
- `GenerateSchedulingPlanSchema` برای درخواست تولید یا بازتولید برنامه؛
- `SchedulingRunSchema` و `SchedulingPlanSchema` برای چرخه اجرا و برنامه؛
- `SchedulingProposalSchema` و `SchedulingProposalSessionSchema` برای خروجی هر کلاس و جلسات آن؛
- `SchedulingUnresolvedRequirementSchema` برای نیازهای حل‌نشده؛
- `SchedulingScoreCriterionSchema` و `SchedulingScoreBreakdownSchema` برای امتیازدهی؛
- `SchedulingWarningSchema` برای هشدارهای قابل ترجمه؛
- `SchedulingSelectionReasonSchema` برای دلیل ساخت‌یافته انتخاب پیشنهاد؛
- constantها و Typeهای وضعیت Run/Plan، شیوه برگزاری و گروه زمانی.

Schemaهای `StudentTimeConstraintSchema`، `ReplaceStudentTimeProfileSchema` و `TeacherCourseQualificationSchema` از MVPهای قبلی موجود بودند و به‌عنوان منبع واحد حفظ شدند.

## تصمیم‌های اعتبارسنجی

- Requirement باید دقیقاً یکی از `sessionsPerWeek` یا `totalSessions` را داشته باشد.
- درخواست تولید حداقل یک Requirement و حداکثر سه Plan جایگزین می‌پذیرد.
- شناسه‌های تکراری Requirement و Proposal قفل‌شده حذف می‌شوند.
- امتیازها و درصدها در بازه صفر تا صد و امتیاز نرمال‌شده در بازه صفر تا یک‌اند.
- معیار `NOT_APPLICABLE` مقدار عددی ساختگی دریافت نمی‌کند.
- کد هشدار با severity، scope و context ساخت‌یافته منتقل می‌شود و متن ترجمه‌شده داخل قرارداد ذخیره نمی‌شود.
- زمان‌ها قالب `HH:mm` دارند و زمان پایان باید بعد از زمان شروع باشد.
- پیشنهاد آنلاین نمی‌تواند اتاق فیزیکی داشته باشد.
- هشدار `null` دیتابیس در خروجی به آرایه خالی تبدیل می‌شود.
- خروجی‌ها تاریخ را هم به شکل `Date` و هم رشته می‌پذیرند تا قرارداد API و کلاینت مشترک بماند.

## معیار پذیرش MVP-011

- [x] محدودیت زمانی دانش‌آموز Schema و Type مشترک دارد.
- [x] صلاحیت Course استاد Schema و Type مشترک دارد.
- [x] نیاز کلاس ترم ورودی و خروجی معتبر دارد.
- [x] درخواست تولید برنامه قرارداد مستقل دارد.
- [x] Run، Plan، Proposal و Session قرارداد خروجی دارند.
- [x] هشدار، دلیل انتخاب و breakdown امتیاز ساخت‌یافته‌اند.
- [x] تمام قراردادها از barrel اصلی `@workspace/types` صادر می‌شوند.
- [x] تست‌های اعتبارسنجی cadence، درخواست تولید، امتیاز و Proposal اضافه شده‌اند.
