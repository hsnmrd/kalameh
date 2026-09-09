# MVP-026 — Orchestrator موتور تولید برنامه

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** اجرای end-to-end مراحل موتور برای یک `SchedulingRun` صف‌شده

## هدف

سرویس `SchedulingGenerationEngineService` اجزای مستقل MVP-016 تا MVP-025 را به یک pipeline اجرایی متصل می‌کند. ورودی اجرای موتور فقط Snapshot ذخیره‌شده Run است؛ بنابراین تغییر داده‌های زنده وسط اجرا، محاسبات همان Run را تغییر نمی‌دهد.

## Claim اتمیک

Run ابتدا با شرط‌های زیر claim می‌شود:

```text
id = runId
instituteId = requested institute
status = QUEUED
```

فقط اگر دقیقاً یک رکورد update شود، وضعیت به `GENERATING` می‌رود. در نتیجه دو worker نمی‌توانند یک Run را هم‌زمان اجرا کنند.

## Pipeline

پس از اعتبارسنجی Snapshotهای ورودی، تنظیمات و preflight، مراحل زیر اجرا می‌شوند:

1. تولید Slotهای ممکن؛
2. حذف گزینه‌های ناقض Hard Constraint؛
3. محاسبه پوشش زبان‌آموزان؛
4. ساخت و رتبه‌بندی Planهای جایگزین؛
5. محاسبه علت نیازهای حل‌نشده برای هر Plan؛
6. persistence اتمیک خروجی و تکمیل Run.

تعداد گزینه‌ها، گام زمانی، وزن پوشش و وزن تنوع فقط از Snapshot همان Run خوانده می‌شوند.

## قرارداد Snapshot

دو Schema مشترک برای داده engine اضافه شده‌اند:

- `SchedulingEngineInputSnapshotSchema`؛
- `SchedulingEngineSettingsSnapshotSchema`.

Schema ورودی تمام داده‌های لازم Requirement، Qualification و Availability استاد، وضعیت زمانی زبان‌آموز، کلاس‌های موجود و اتاق‌ها را پیش از شروع محاسبه کنترل می‌کند. `isActive` اتاق نیز از این نسخه به Snapshot درخواست تولید اضافه شده است.

## مدیریت شکست

اگر هر مرحله پس از claim خطا بدهد:

- Run با guard وضعیت `GENERATING` به `FAILED` می‌رود؛
- `failureCode = GENERATION_ENGINE_FAILED` ثبت می‌شود؛
- پیام خطا حداکثر تا ۵۰۰ کاراکتر ذخیره می‌شود؛
- رویداد `GENERATION_FAILED` در Audit Log ثبت می‌شود؛
- خطای اصلی برای worker دوباره پرتاب می‌شود.

## مرز مرحله

این سرویس entrypoint داخلی موتور است. اتصال آن به worker یا queue runner در مرحله جدا انجام می‌شود. ایجاد `Class` همچنان فقط در فلو انتشار مجاز خواهد بود.

## معیار پذیرش

- [x] یک Run فقط یک‌بار و tenant-scoped claim می‌شود.
- [x] تمام مراحل موتور به ترتیب صحیح اجرا می‌شوند.
- [x] موتور فقط از Snapshot و تنظیمات همان Run استفاده می‌کند.
- [x] علت‌های حل‌نشده برای تک‌تک گزینه‌ها محاسبه می‌شوند.
- [x] خروجی از مسیر persistence اتمیک MVP-025 ذخیره می‌شود.
- [x] شکست هر مرحله Run را به `FAILED` منتقل می‌کند.
- [x] موفقیت و شکست قابل ممیزی هستند.
- [x] worker و انتشار Class خارج از این تسک باقی می‌مانند.
