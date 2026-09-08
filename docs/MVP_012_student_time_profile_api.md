# MVP-012 — API مدیریت پروفایل زمانی فراگیر

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** خواندن و جایگزینی اتمیک محدودیت‌های زمانی هر فراگیر  
**پیش‌نیازها:** [MVP-006](./MVP_006_student_time_profile.md)، [MVP-007](./MVP_007_student_time_profile_schemas.md) و [MVP-011](./MVP_011_shared_scheduling_schemas.md)

---

## Endpointها

### دریافت پروفایل زمانی

```http
GET /students/:id/time-profile
```

- نیازمند `students:view` است.
- فقط فراگیر همان آموزشگاه قابل بازیابی است؛ `SUPER_ADMIN` از قاعده دسترسی سراسری موجود استفاده می‌کند.
- فراگیر قدیمیِ بدون `StudentProfile` با وضعیت `INCOMPLETE` و فهرست خالی برگردانده می‌شود و خواندن باعث ایجاد داده نمی‌شود.

### جایگزینی پروفایل زمانی

```http
PUT /students/:id/time-profile
```

- نیازمند `students:manage` است.
- بدنه با `ReplaceStudentTimeProfileSchema` مشترک اعتبارسنجی می‌شود.
- `scheduleStatus` و تمام Constraintها در یک transaction جایگزین می‌شوند.
- آرایه خالی، تمام محدودیت‌های قبلی را صریحاً پاک می‌کند.
- شناسه اختیاری Constraint ورودی برای جلوگیری از اعتماد به شناسه متعلق به tenant دیگر مصرف نمی‌شود و رکوردهای جایگزین شناسه جدید می‌گیرند.
- تاریخ‌های اعتبار پیش از ذخیره به `Date` تبدیل می‌شوند.

## مالکیت و امنیت

- جستجوی فراگیر برای کاربران عادی با `instituteId` توکن محدود می‌شود.
- حذف Constraintها هم‌زمان با `studentProfileId` و `instituteId` محدود می‌شود.
- خواندن نتیجه transaction فقط از پروفایل و Constraintهای همان آموزشگاه انجام می‌شود.
- اطلاعات خام ساعات در Audit Log تکرار نمی‌شوند؛ فقط وضعیت قبلی/جدید و تعداد بازه‌ها ثبت می‌شود.
- خطای دانش‌آموز ناموجود یا متعلق به آموزشگاه دیگر به‌صورت not-found مدیریت می‌شود و وجود داده tenant دیگر را افشا نمی‌کند.

## شکل پاسخ

پاسخ هر دو endpoint از `StudentTimeProfileSchema` عبور می‌کند:

```ts
type StudentTimeProfileDto = {
  studentId: string
  studentProfileId: string | null
  scheduleStatus: "INCOMPLETE" | "COMPLETE"
  constraints: StudentTimeConstraintDto[]
}
```

## معیار پذیرش MVP-012

- [x] پروفایل زمانی فراگیر قابل خواندن است.
- [x] وضعیت تکمیل و تمام بازه‌ها اتمیک جایگزین می‌شوند.
- [x] پاک‌کردن کامل محدودیت‌ها پشتیبانی می‌شود.
- [x] ورودی و خروجی از Schemaهای مشترک استفاده می‌کنند.
- [x] دسترسی مشاهده و مدیریت مستقل اعمال می‌شود.
- [x] جداسازی tenant در جستجو، حذف و بازیابی نتیجه رعایت می‌شود.
- [x] تغییر در Audit Log ثبت می‌شود.
- [x] تست‌های سرویس مسیرهای legacy، tenant، replace و clear را پوشش می‌دهند.
