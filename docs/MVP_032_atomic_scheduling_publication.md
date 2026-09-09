# MVP-032 — انتشار اتمیک Plan زمان‌بندی

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** تبدیل Plan انتخاب‌شده و معتبر به Classهای عملیاتی

## Endpoint

```http
POST /scheduling/plans/:planId/publish
```

مجوز لازم `MANAGE_CLASSES` است. فقط Plan با وضعیت `SELECTED` از Run تکمیل‌شده قابل انتشار است و `SUPER_ADMIN` باید آموزشگاه هدف را مشخص کند.

## transaction انتشار

تمام عملیات با isolation سطح `Serializable` در یک transaction انجام می‌شوند:

1. اجرای دوباره validator زنده MVP-031 داخل همان transaction؛
2. claim کردن Plan از `SELECTED` به `PUBLISHED`؛
3. ساخت یک `Class` برای هر Proposal؛
4. اتصال `publishedClassId` هر Proposal به Class ساخته‌شده؛
5. تغییر سایر گزینه‌های همان Run به `REJECTED`؛
6. ثبت زمان انتشار Plan.

اگر اعتبارسنجی، ساخت Class یا اتصال حتی یک Proposal شکست بخورد، transaction کامل rollback می‌شود.

## تبدیل Proposal به Class

- آموزشگاه و ترم از Run معتبر گرفته می‌شوند؛
- سطح، شعبه، اتاق، استاد، ظرفیت و زمان از Proposal؛
- شهریه از `Course.baseFee` زنده؛
- نام نمایشی استاد از رکورد User؛
- تاریخ Sessionها با قالب `YYYY-MM-DD` در `sessionDates`؛
- شناسه اصلی استاد همچنان `teacherId` است.

## جلوگیری از race

نتیجه endpoint جداگانه validate مجوز دائمی انتشار نیست. validator داخل transaction تکرار می‌شود و isolation سطح Serializable از انتشار هم‌زمان بر پایه داده‌ای که بین بررسی و insert تغییر کرده جلوگیری می‌کند. guard وضعیت Plan و `publishedClassId` نیز انتشار تکراری را متوقف می‌کند.

## خطا و ممیزی

تخلف قطعی پاسخ `409` با کد `HARD_CONSTRAINT_PUBLISH_BLOCKED` و گزارش validation می‌دهد. انتشار موفق با `PLAN_PUBLISHED` و انتشار مسدودشده با `PLAN_PUBLICATION_BLOCKED` ثبت می‌شود.

## معیار پذیرش

- [x] فقط Plan انتخاب‌شده و معتبر قابل انتشار است.
- [x] اعتبارسنجی با داده زنده داخل transaction تکرار می‌شود.
- [x] برای هر Proposal دقیقاً یک Class ساخته و متصل می‌شود.
- [x] انتشار ناقص در صورت شکست ممکن نیست.
- [x] انتشار تکراری با guard وضعیت متوقف می‌شود.
- [x] Planهای جایگزین پس از انتشار رد می‌شوند.
- [x] عملیات tenant-safe و قابل ممیزی است.
- [x] نتیجه شامل شناسه تمام Classهای ساخته‌شده است.
