# MVP-025 — ذخیره اتمیک خروجی موتور زمان‌بندی

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** تبدیل خروجی درون‌حافظه‌ای MVP-024 به Plan، Proposal و Unresolved Requirement پایدار

## هدف

پس از پایان تولید گزینه‌ها، Plan موقت `GENERATION_PENDING` با خروجی واقعی موتور جایگزین می‌شود. تمام جایگزینی در یک transaction انجام می‌شود و Run فقط بعد از ذخیره موفق همه گزینه‌ها به `COMPLETED` می‌رود.

## کنترل‌های قبل از جایگزینی

- Run با `runId` و `instituteId` به‌صورت tenant-scoped خوانده می‌شود.
- فقط Run دارای وضعیت `QUEUED` یا `GENERATING` پذیرفته می‌شود.
- تمام Planهای فعلی باید `DRAFT` و بدون ویرایش دستی باشند.
- وجود Proposal قفل‌شده، ویرایش‌شده یا منتشرشده جایگزینی را متوقف می‌کند.
- تمام Requirementها، Qualificationهای استاد و Classroomهای خروجی دوباره با `instituteId` واکشی و ارتباطشان با Proposal کنترل می‌شود.
- همه گزینه‌ها باید scope یکسان و غیرخالی از Requirementها داشته باشند.
- برای هر Plan باید دقیقاً یک ارزیابی unresolved با totals منطبق وجود داشته باشد.

## عملیات transaction

1. حذف Planهای placeholder دست‌نخورده همان Run؛
2. ساخت Planهای رتبه‌بندی‌شده همراه Snapshot امتیاز و metric؛
3. ساخت Proposalهای مربوط به assignmentهای انتخاب‌شده؛
4. ساخت موارد `SchedulingUnresolvedRequirement`؛
5. تغییر Run به `COMPLETED` با optimistic status guard.

اگر وضعیت Run بین خواندن و پایان transaction تغییر کند، کل transaction rollback می‌شود.

## داده Proposal

Proposal شامل Requirement، Course، شعبه، استاد، Qualification، اتاق، ظرفیت، شیوه برگزاری، روز و ساعت، گروه زمانی، Score Breakdown و Selection Reason است. زمان بررسی Qualification و امتیازدهی از `completedAt` واحد همان اجرا گرفته می‌شود.

در این مرحله هر assignment یک روز هفتگی را ذخیره می‌کند. تولید تاریخ‌های واقعی جلسات ترم در مرحله مستقل انجام می‌شود.

## Snapshot و ممیزی

- وزن‌ها، گروه‌های زمانی، کامل‌بودن داده و نسخه فرمول از Plan placeholder گرفته می‌شوند؛
- summary و exclusionهای هر گزینه داخل `metricsSnapshot` ذخیره می‌شوند؛
- پس از موفقیت، Audit Log با کد `GENERATION_COMPLETED` ثبت می‌شود.

## مرز ایمنی

- این سرویس هیچ `Class` واقعی ایجاد نمی‌کند.
- Plan بررسی‌شده یا قفل‌شده هرگز overwrite نمی‌شود.
- خطای هر Plan باعث rollback کل خروجی Run می‌شود.

## معیار پذیرش

- [x] جایگزینی placeholder و ذخیره همه گزینه‌ها اتمیک است.
- [x] تمام queryهای Run و Requirement tenant-scoped هستند.
- [x] Planهای بررسی‌شده یا قفل‌شده محافظت می‌شوند.
- [x] Proposalها دارای score، reason و snapshot لازم هستند.
- [x] نیازهای حل‌نشده همراه Reason Code ذخیره می‌شوند.
- [x] Run فقط پس از ذخیره کامل به `COMPLETED` می‌رود.
- [x] رویداد موفقیت در Audit Log ثبت می‌شود.
- [x] هیچ Class واقعی ساخته نمی‌شود.
