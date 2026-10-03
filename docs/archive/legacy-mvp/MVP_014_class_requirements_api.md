# MVP-014 — API مدیریت نیاز کلاس‌های ترم

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** ایجاد، مشاهده، فیلتر، ویرایش و غیرفعال‌سازی `ClassRequirement`  
**پیش‌نیازها:** [MVP-008](./MVP_008_class_requirements.md) و [MVP-011](./MVP_011_shared_scheduling_schemas.md)

---

## Endpointها

```http
GET    /class-requirements
GET    /class-requirements/:id
POST   /class-requirements
PATCH  /class-requirements/:id
DELETE /class-requirements/:id
```

مشاهده به `classes:view` و تغییر به `classes:manage` نیاز دارد. ماژول `CLASSES_COURSES` نیز باید برای آموزشگاه فعال باشد.

## فیلترها

فهرست با موارد زیر فیلتر می‌شود:

- `instituteId` برای انتخاب آموزشگاه توسط `SUPER_ADMIN`؛
- `termId`؛
- `courseId`؛
- `branchId` یا مقدار `NONE` برای نیازهای بدون شعبه؛
- `deliveryMode`؛
- `isActive` با مقادیر boolean یا `ACTIVE`، `INACTIVE` و `ALL`.

پاسخ شامل مرجع خلاصه Term، Course و Branch است و براساس ترم، عنوان Course و زمان ایجاد مرتب می‌شود.

## قواعد نوشتن

- Term، Course و Branch باید با queryهای دارای `instituteId` به همان آموزشگاه تعلق داشته باشند.
- دقیقاً یکی از `sessionsPerWeek` یا `totalSessions` باید مقدار مثبت داشته باشد.
- هنگام تغییر نوع cadence، مقدار قبلی باید صریحاً `null` شود.
- مقادیر تعداد کلاس، ظرفیت و مدت جلسه اعداد صحیح مثبت‌اند.
- آموزشگاه کاربر عادی از توکن گرفته می‌شود و ورودی نمی‌تواند آن را override کند.
- `SUPER_ADMIN` باید آموزشگاه هدف را صریح انتخاب کند.

## حذف و تاریخچه

`DELETE` حذف فیزیکی انجام نمی‌دهد و فقط `isActive=false` ذخیره می‌کند. این تصمیم Snapshotها و ارتباط تاریخی برنامه‌های پیشنهادی را حفظ می‌کند. فعال‌سازی مجدد با `PATCH` و `{ isActive: true }` انجام می‌شود.

عملیات ایجاد، ویرایش و غیرفعال‌سازی در Audit Log ثبت می‌شوند. فلو دستی ساخت Class به این API وابسته نیست و بدون تغییر باقی می‌ماند.

## معیار پذیرش MVP-014

- [x] ایجاد و مشاهده نیازهای کلاس پشتیبانی می‌شود.
- [x] فهرست tenant-safe و قابل فیلتر است.
- [x] ویرایش تمام مشخصات و تغییر cadence پشتیبانی می‌شود.
- [x] حذف به‌صورت غیرفعال‌سازی قابل بازیابی انجام می‌شود.
- [x] مالکیت Term، Course و Branch بررسی می‌شود.
- [x] ورودی و خروجی از Schemaهای مشترک استفاده می‌کنند.
- [x] مجوز و فعال بودن ماژول کنترل می‌شود.
- [x] تغییرات Audit می‌شوند.
- [x] تست‌های filter، tenant، reference، cadence و deactivate اضافه شده‌اند.
