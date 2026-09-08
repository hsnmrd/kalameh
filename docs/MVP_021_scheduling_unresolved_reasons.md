# MVP-021 — ثبت دلیل نیازهای حل‌نشده

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** تبدیل کمبود کلاس هر Requirement به Reason Code پایدار و قابل توضیح

## محاسبه کمبود

برای هر Requirement، Assignmentهای انتخاب‌شده با `assignmentKey` یکتا شمرده می‌شوند:

```text
missingClassCount = requiredClassCount - selectedClassCount
```

Requirement کامل‌شده وارد خروجی unresolved نمی‌شود. Assignment انتخاب‌شده باید در فهرست Feasible Assignmentهای عبورکرده از Hard Constraint وجود داشته باشد و تعداد انتخاب‌شده نمی‌تواند از نیاز بیشتر باشد.

## Reason Codeها

- `INVALID_REQUIREMENT`
- `NO_VALID_TEACHER`
- `NO_QUALIFIED_TEACHER`
- `NO_TEACHER_AVAILABILITY`
- `TEACHER_TIME_CONFLICT`
- `NO_COMPATIBLE_CLASSROOM`
- `INSUFFICIENT_CLASSROOM_CAPACITY`
- `CLASSROOM_TIME_CONFLICT`
- `NO_FEASIBLE_TIME_SLOT`
- `INSUFFICIENT_FEASIBLE_CANDIDATES`
- `PLAN_COMBINATION_CONFLICT`

کدهای Preflight و Hard Constraint به این قرارداد پایدار نگاشت می‌شوند. اگر چند علت وجود داشته باشد، علت ریشه‌ای با ترتیب قطعی انتخاب می‌شود؛ برای نمونه نبود Availability بر تداخل اتاق اولویت دارد.

اگر Candidate کافی برای Requirement وجود داشته باشد اما ترکیب نهایی نتواند همه را انتخاب کند، دلیل `PLAN_COMBINATION_CONFLICT` ثبت می‌شود. وجود تعدادی Candidate کمتر از نیاز، `INSUFFICIENT_FEASIBLE_CANDIDATES` است و نبود کامل شواهد به `NO_FEASIBLE_TIME_SLOT` منجر می‌شود.

## جزئیات ممیزی

هر مورد حل‌نشده علاوه بر Reason Code شامل موارد زیر است:

- تعداد درخواستی، انتخاب‌شده و مفقود؛
- تعداد Candidateهای یکتای قابل استفاده؛
- کدهای خام Preflight و Hard Constraint که تصمیم از آن‌ها استخراج شده است.

قرارداد Zod تضمین می‌کند مجموع `missingClassCount`ها با summary برابر باشد، هر Requirement فقط یک مورد unresolved داشته باشد و Reason Code خارج از فهرست پایدار پذیرفته نشود.

## مرز این مرحله

این سرویس خروجی آماده ذخیره در `SchedulingUnresolvedRequirement` تولید می‌کند. اتصال آن به transaction ذخیره Plan پس از تکمیل مرحله ترکیب و تولید برنامه انجام می‌شود؛ در MVP-021 کلاس ناقص، Proposal یا Class واقعی ساخته نمی‌شود.

## معیار پذیرش

- [x] کمبود هر Requirement دقیق محاسبه می‌شود.
- [x] Requirement تأمین‌شده در unresolved ظاهر نمی‌شود.
- [x] خطاهای Preflight و Hard Constraint به Reason Code پایدار نگاشت می‌شوند.
- [x] علت‌های چندگانه با اولویت قطعی حل می‌شوند.
- [x] کمبود Candidate از تعارض ترکیب Plan تفکیک می‌شود.
- [x] جزئیات تصمیم برای ممیزی حفظ می‌شوند.
- [x] خروجی با مدل `SchedulingUnresolvedRequirement` سازگار است.
