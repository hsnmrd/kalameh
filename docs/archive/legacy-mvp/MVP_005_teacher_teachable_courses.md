# MVP-005 — مدل سطوح قابل تدریس استاد

**وضعیت:** نهایی برای MVP  
**دامنه:** قرارداد داده و رفتار ارتباط استاد با Courseهای قابل تدریس  
**وابسته به:** HC-006 و HC-007 در [MVP-001](./MVP_001_scheduling_hard_constraints.md)  
**مالک داده:** آموزشگاه / مدیر آموزشی

---

## ۱. هدف

این سند منبع معتبر صلاحیت تدریس استاد را تعریف می‌کند. موتور زمان‌بندی باید فقط استادانی را برای یک Course پیشنهاد کند که ارتباط ساخت‌یافته و صریح با آن Course دارند.

فیلد فعلی `TeacherProfile.specialties` متن آزاد است و برای تصمیم خودکار قابل اتکا نیست. این فیلد برای اطلاعات نمایشی مانند «IELTS» یا «مکالمه» حفظ می‌شود، اما مجوز تدریس Course ایجاد نمی‌کند.

---

## ۲. تصمیم مدل‌سازی

رابطه استاد و Course از نوع چندبه‌چند و با یک مدل صریح تعریف می‌شود:

```prisma
model TeacherCourseQualification {
  id               String @id @default(uuid())
  instituteId      String
  teacherProfileId String
  courseId         String

  institute      Institute      @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  teacherProfile TeacherProfile @relation(fields: [teacherProfileId], references: [id], onDelete: Cascade)
  course         Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([teacherProfileId, courseId])
  @@index([instituteId])
  @@index([courseId])
  @@index([teacherProfileId])
}
```

نام نهایی مدل برای پیاده‌سازی: `TeacherCourseQualification`.

روابط معکوس موردنیاز:

- `Institute.teacherCourseQualifications`
- `TeacherProfile.teachableCourses`
- `Course.qualifiedTeachers`

وجود رکورد به معنی «مجاز به تدریس» و نبود رکورد به معنی «غیرمجاز برای تخصیص خودکار» است. فیلد جداگانه `isActive` در MVP نیاز نیست.

---

## ۳. دلیل انتخاب مدل صریح

مدل صریح به‌جای relation ضمنی انتخاب می‌شود چون:

- `instituteId` را برای فیلتر سریع و جداسازی tenant نگه می‌دارد؛
- امکان Audit و توسعه آینده مانند تاریخ اعتبار را فراهم می‌کند؛
- یکتا بودن صلاحیت استاد برای هر Course را تضمین می‌کند؛
- حذف و جایگزینی گروهی صلاحیت‌ها را قابل کنترل می‌کند؛
- در خروجی API هویت مستقلی برای هر Qualification فراهم می‌کند.

---

## ۴. قواعد دامنه

### TQ-001 — هم‌مالک بودن استاد و Course

`TeacherProfile`، `Course` و رکورد Qualification باید متعلق به یک آموزشگاه باشند.

**کد خطا:** `CROSS_INSTITUTE_TEACHER_COURSE`

### TQ-002 — نقش صحیح کاربر

Qualification فقط برای User دارای نقش `TEACHER` قابل ایجاد است.

**کد خطا:** `USER_IS_NOT_TEACHER`

### TQ-003 — یکتایی ارتباط

یک استاد نمی‌تواند برای یک Course بیش از یک Qualification داشته باشد.

**کد خطا:** `TEACHER_COURSE_ALREADY_ASSIGNED`

### TQ-004 — عدم استنتاج از پیش‌نیاز Course

صلاحیت تدریس یک Course به Course قبلی یا بعدی زنجیره پیش‌نیاز منتقل نمی‌شود. هر سطح باید صریحاً انتخاب شود.

### TQ-005 — عدم استنتاج از Specialties

مقادیر `specialties` نباید خودکار به Course نگاشت شوند؛ حتی اگر عنوان یکسان یا مشابه داشته باشند.

### TQ-006 — استاد غیرفعال

غیرفعال شدن استاد Qualificationها را حذف نمی‌کند، اما استاد طبق HC-006 وارد زمان‌بندی خودکار نمی‌شود. فعال شدن مجدد او Qualificationهای قبلی را بازیابی می‌کند.

### TQ-007 — حذف استاد یا Course

- حذف TeacherProfile تمام Qualificationهای آن را با `Cascade` حذف می‌کند.
- حذف Course تمام Qualificationهای مربوط را با `Cascade` حذف می‌کند.
- غیرفعال‌سازی استاد حذف انجام نمی‌دهد.

### TQ-008 — فهرست خالی

استاد با فهرست خالی برای هیچ Course در زمان‌بندی خودکار واجد شرایط نیست. این وضعیت باید در preflight به‌صورت هشدار مسدودکننده برای Courseهای بدون استاد گزارش شود.

---

## ۵. رفتار تخصیص خودکار و دستی

### زمان‌بندی خودکار

- Qualification شرط قطعی است.
- موتور فقط با `teacherId` کار می‌کند و `teacherName` آزاد را قبول نمی‌کند.
- تغییر دستی استاد داخل Scheduling Draft نیز باید Qualification را رعایت کند.
- برنامه‌ای با استاد فاقد Qualification قابل انتشار نیست.

### ساخت دستی کلاس

برای حفظ فلو دستی موجود:

- انتخاب استاد فاقد Qualification مجاز است، اما باید به‌عنوان override صریح انجام شود.
- UI باید هشدار دهد که استاد برای این سطح ثبت نشده است.
- تأیید override باید با AlertDialog انجام شود.
- کاربر باید مجوز `classes:manage` داشته باشد.
- عملیات باید با `courseId`، `teacherId` و کاربر تأییدکننده در Audit Log ثبت شود.
- override دستی Qualification دائمی برای استاد ایجاد نمی‌کند.

کلاس‌های دستی موجود که استادشان Qualification ندارد معتبر باقی می‌مانند و migration نباید آن‌ها را تغییر دهد.

---

## ۶. قرارداد خواندن و نوشتن داده

### نمایش استاد

خروجی پروفایل و فهرست استاد باید شامل Courseهای قابل تدریس باشد:

```ts
type TeacherCourseQualificationDto = {
  id: string
  teacherProfileId: string
  courseId: string
  course: {
    id: string
    title: string
  }
  createdAt: string | Date
  updatedAt: string | Date
}
```

### نوشتن فهرست

عملیات مدیریت Qualification به شکل «جایگزینی کامل فهرست» انجام می‌شود:

```ts
type ReplaceTeacherCoursesInput = {
  courseIds: string[]
}
```

قواعد:

- `courseIds` پیش از ذخیره یکتا می‌شوند.
- تمام Courseها باید در همان آموزشگاه وجود داشته باشند.
- عملیات در transaction انجام می‌شود.
- رکوردهای حذف‌شده پاک و رکوردهای جدید ایجاد می‌شوند.
- ارسال آرایه خالی، تمام Qualificationهای استاد را حذف می‌کند.
- پاسخ، فهرست نهایی مرتب‌شده براساس عنوان Course است.

Schema و API نهایی در MVP-011 و MVP-013 پیاده‌سازی می‌شوند.

---

## ۷. انتقال داده‌های موجود

هیچ Qualification نباید از داده‌های فعلی حدس زده شود.

- `specialties` بدون تغییر حفظ می‌شود.
- کلاس‌های قبلی منبع ساخت خودکار Qualification نیستند.
- تمام استادان موجود پس از migration فهرست Qualification خالی خواهند داشت.
- مدیر آموزشی باید سطح‌های هر استاد را صریحاً تکمیل کند.
- preflight زمان‌بندی باید تعداد استادان بدون سطح و Courseهای بدون استاد واجد شرایط را نمایش دهد.

این سیاست از تخصیص اشتباه ناشی از نام‌های آزاد یا سابقه استثنایی تدریس جلوگیری می‌کند.

---

## ۸. جداسازی tenant و امنیت

- تمام queryها باید `instituteId` داشته باشند.
- `courseId` صرفاً به دلیل UUID معتبر قابل پذیرش نیست و مالکیت آن باید بررسی شود.
- مسیر دسترسی به TeacherProfile باید از User همان آموزشگاه عبور کند.
- `SUPER_ADMIN` باید آموزشگاه هدف را صریح مشخص کند.
- مشاهده Qualification نیازمند `teachers:view` است.
- تغییر Qualification نیازمند `teachers:manage` یا مجوز اختصاصی آینده `scheduling:settings` است.

---

## ۹. Snapshot در برنامه زمان‌بندی

هر پیشنهاد باید این اطلاعات را برای ممیزی نگه دارد:

- `teacherId`؛
- `courseId`؛
- شناسه Qualification استفاده‌شده؛
- زمان بررسی صلاحیت.

پیش از انتشار، Qualification باید دوباره از داده زنده بررسی شود. حذف Qualification بعد از تولید Draft، انتشار را با `TEACHER_NOT_QUALIFIED` مسدود می‌کند.

---

## ۱۰. موارد خارج از محدوده این تسک

- تاریخ شروع و پایان اعتبار Qualification؛
- سطح مهارت استاد برای یک Course؛
- اولویت یا علاقه استاد به یک Course؛
- پیشنهاد Course براساس متن `specialties`؛
- تأیید چندمرحله‌ای صلاحیت استاد؛
- محدودیت Qualification به شعبه خاص.

این موارد در صورت نیاز می‌توانند بدون جایگزینی مدل صریح به آن افزوده شوند.

---

## ۱۱. الزامات تست هنگام پیاده‌سازی

- جلوگیری از Qualification بین دو آموزشگاه؛
- جلوگیری از رکورد تکراری؛
- پذیرش چند Course برای یک استاد و چند استاد برای یک Course؛
- حذف Cascade با حذف TeacherProfile یا Course؛
- باقی ماندن Qualificationها هنگام غیرفعال شدن استاد؛
- رد استاد فاقد Qualification در زمان‌بندی خودکار؛
- حفظ کلاس‌های دستی و قدیمی؛
- جایگزینی اتمیک فهرست Courseها؛
- کنترل مجوز مشاهده و تغییر.

---

## ۱۲. معیار پذیرش MVP-005

- [x] مدل صریح چندبه‌چند و نام آن مشخص شده است.
- [x] فیلدها، indexها، unique constraint و رفتار حذف مشخص شده‌اند.
- [x] منبع معتبر صلاحیت از `specialties` جدا شده است.
- [x] رفتار فهرست خالی و استاد غیرفعال مشخص شده است.
- [x] تفاوت تخصیص خودکار و override دستی مشخص شده است.
- [x] قرارداد خواندن و جایگزینی فهرست Courseها تعریف شده است.
- [x] سیاست انتقال داده‌های موجود بدون حدس‌زدن مشخص شده است.
- [x] قواعد tenant isolation، مجوز و Snapshot تعریف شده‌اند.
