# MVP-013 — API مدیریت سطوح قابل تدریس استاد

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** خواندن و جایگزینی مستقل Courseهای قابل تدریس استاد  
**پیش‌نیازها:** [MVP-005](./MVP_005_teacher_teachable_courses.md) و [MVP-011](./MVP_011_shared_scheduling_schemas.md)

---

## Endpointها

### دریافت صلاحیت‌های استاد

```http
GET /teachers/:id/course-qualifications
```

- نیازمند `teachers:view` است.
- فهرست Qualificationها همراه `id` و `title` مربوط به Course بازگردانده می‌شود.
- ترتیب پاسخ براساس عنوان Course صعودی است.
- استاد بدون TeacherProfile یا Qualification فهرست خالی دارد.

### جایگزینی صلاحیت‌های استاد

```http
PUT /teachers/:id/course-qualifications
```

- نیازمند `teachers:manage` است.
- بدنه با `ReplaceTeacherCoursesSchema` و شکل `{ courseIds: string[] }` اعتبارسنجی می‌شود.
- شناسه‌های تکراری پیش از سرویس حذف می‌شوند.
- ارسال آرایه خالی تمام Qualificationها را حذف می‌کند.
- حذف، ایجاد و خواندن نتیجه در یک transaction انجام می‌شوند.

## جداسازی آموزشگاه

- کاربر عادی فقط استاد و Courseهای `instituteId` توکن خود را مدیریت می‌کند.
- `SUPER_ADMIN` باید `instituteId` هدف را صریحاً در query ارسال کند.
- استاد با `id` معتبر ولی متعلق به آموزشگاه دیگر به دلیل query ترکیبی پیدا نمی‌شود.
- تمام Courseهای ورودی پیش از transaction با آموزشگاه استاد تطبیق داده می‌شوند.
- حذف و خواندن Qualification نیز هم‌زمان با `teacherProfileId` و `instituteId` محدود می‌شوند.

## سازگاری با MVP-005

امکان ارسال `courseIds` داخل ایجاد یا ویرایش کلی استاد حفظ شده است. endpoint مستقل برای مصرف صفحه تنظیم صلاحیت، preflight و ابزارهای زمان‌بندی اضافه شده و منبع داده هر دو مسیر همان `TeacherCourseQualification` است.

تغییر فهرست در Audit Log با Courseهای قبلی و جدید ثبت می‌شود. این عملیات روی `specialties` یا کلاس‌های دستی موجود اثری ندارد.

## معیار پذیرش MVP-013

- [x] فهرست صلاحیت استاد از endpoint مستقل قابل دریافت است.
- [x] جایگزینی کامل و پاک‌کردن فهرست پشتیبانی می‌شود.
- [x] Course متعلق به آموزشگاه دیگر رد می‌شود.
- [x] استاد و Qualificationها با tenant فیلتر می‌شوند.
- [x] `SUPER_ADMIN` آموزشگاه هدف را صریح انتخاب می‌کند.
- [x] پاسخ نهایی براساس عنوان Course مرتب است.
- [x] تغییرات اتمیک و قابل ممیزی‌اند.
- [x] Schemaهای ورودی، query و خروجی از `@workspace/types` صادر می‌شوند.
- [x] تست‌های Schema، tenant، cross-tenant، replace و clear اضافه شده‌اند.
