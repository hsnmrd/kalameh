# سند پیاده‌سازی و معماری جامع: PRD_00_base_complete

## تفکیک هویت فراگیران از پرسنل و زیرساخت احراز هویت چندمستاجری (Complete Base Domain & Student/Staff Separation)

**مرجع نیازمندی‌ها:** [`docs/PRD_00_auth.md`](../PRD_00_auth.md) | [`docs/PRD_base.md`](../PRD_base.md) | [`docs/TECH_base.md`](../TECH_base.md)  
**مرجع دیزاین سیستم:** [`DESIGN.md`](../../DESIGN.md)  
**وضعیت:** آماده اجرا و پیاده‌سازی (Ready for Implementation)

---

## ۱. نمای کلی و اهداف بازآرایی معماری (Architecture Overview)

در ساختار اولیه سامانه، تمامی هویت‌ها در یک موجودیت یکپارچه به نام `User` با نقش‌های مختلف ذخیره می‌شدند. برای پاسخگویی به نیازهای سامانه‌های مدیریت آموزشی و حفظ تمیزی دامنه (Domain-Driven Design)، در این سند معماری کامل **تفکیک فراگیران (Students) از پرسنل آموزشگاه (Staff / Users)** به همراه ساختار احراز هویت چندمستاجری تدوین شده است:

```mermaid
erDiagram
    Institute ||--o{ User : "has"
    User ||--o| StudentProfile : "has (1-to-1 if role=STUDENT)"
    User ||--o{ Transaction : "pays (student)"
    User ||--o{ Enrollment : "enrolls in"
    User }o--o| Course : "currentAllowedCourse"
    Class ||--o{ Enrollment : "contains"
```

### اصول کلیدی تفکیک:

1. **هویت پایه مشترک (`User`):** نگهداری اطلاعات ورود، امنیت، سشن و هویت حداقلی (`id`, `instituteId`, `phone`, `password`, `firstName`, `lastName`, `nationalCode`, `avatarUrl`, `role`, `isActive`).
2. **پروفایل اختصاصی فراگیر (`StudentProfile`):** نگهداری اطلاعات تحصیلی، خانوادگی و فردی ویژه زبان‌آموزان (`fatherName`, `birthDate`, `gender`, `emergencyPhone`, `address`, `notes`).
3. **تفکیک در لایه فرانت‌اند (Admin Panel):**
   - بخش **فراگیران و زبان‌آموزان (`/students`)**: جستجو، فیلتر سطح، ثبت‌نام، کارت پروفایل، سوابق تحصیلی و اطلاعات والدین.
   - بخش **پرسنل و کاربران سیستم (`/users`)**: مدیریت ادمین‌ها، منشی‌ها و مدرسین، تخصیص دسترسی‌ها و ریست پسورد پرسنل.

---

## ۲. ماتریس فیلدها و موجودیت‌ها (Data Matrix)

| فیلد اطلاعاتی                                        | هویت پایه (`User`) | فراگیر (`StudentProfile`)  |        پرسنل / کاربر پنل (`Staff`)        |
| :--------------------------------------------------- | :----------------: | :------------------------: | :---------------------------------------: |
| **شناسه یکتا (`id`, `uuid`)**                        |         ✅         |       ✅ (`userId`)        |             ❌ وابسته به User             |
| **شناسه آموزشگاه (`instituteId`)**                   |         ✅         |      ✅ از طریق User       |              ✅ از طریق User              |
| **نام و نام خانوادگی**                               |         ✅         |          ✅ مشترک          |                 ✅ مشترک                  |
| **شماره موبایل (نام کاربری ورود)**                   |         ✅         |          ✅ مشترک          |                 ✅ مشترک                  |
| **کد ملی (`nationalCode`)**                          |         ✅         |          ✅ مشترک          |                 ✅ مشترک                  |
| **تصویر پروفایل / عکس پرسنلی (`avatarUrl`)**         |         ✅         |          ✅ مشترک          |                 ✅ مشترک                  |
| **نام پدر (`fatherName`)**                           |         ❌         | ✅ ضروری برای سوابق آموزشی |                ❌ غیرضروری                |
| **تاریخ تولد (`birthDate`)**                         |         ❌         | ✅ رده سنی و پرونده تحصیلی |                ❌ غیرضروری                |
| **جنسیت (`gender`)**                                 |         ❌         |  ✅ تفکیک کلاس‌ها/گزارشات  |                ❌ غیرضروری                |
| **شماره تماس اضطراری / ولی (`emergencyPhone`)**      |         ❌         | ✅ تماس با والدین و پیامک  |                ❌ غیرضروری                |
| **آدرس سکونت و یادداشت تحصیلی (`address`, `notes`)** |         ❌         |    ✅ پرونده دانش‌آموز     |                ❌ غیرضروری                |
| **دوره / سطح مجاز فعلی (`currentAllowedCourseId`)**  |         ❌         |  ✅ تعیین سطح و پیش‌نیاز   |                ❌ غیرضروری                |
| **نقش کاربری (`Role`)**                              |         ✅         |         `STUDENT`          | `CLERK`, `INSTITUTE_ADMIN`, `SUPER_ADMIN` |

---

## ۳. جزییات لایه‌ها و تغییرات فنی (Detailed Technical Breakdown)

### ۳.۱. لایه پایگاه داده (`packages/database`)

#### ۱. به‌روزرسانی مدل‌ها در `schema.prisma`:

```prisma
model User {
  id          String   @id @default(uuid())
  instituteId String
  role        Role     @default(STUDENT)

  firstName    String
  lastName     String
  phone        String
  password     String   // Hashed via bcrypt
  nationalCode String?
  avatarUrl    String?
  isActive     Boolean  @default(true)

  currentAllowedCourseId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  institute            Institute       @relation(fields: [instituteId], references: [id])
  currentAllowedCourse Course?         @relation("UserAllowedCourse", fields: [currentAllowedCourseId], references: [id])
  studentProfile       StudentProfile?
  enrollments          Enrollment[]
  transactions         Transaction[]

  @@unique([phone, instituteId])
  @@index([instituteId])
}

model StudentProfile {
  id             String    @id @default(uuid())
  userId         String    @unique
  fatherName     String?
  birthDate      DateTime?
  gender         String?   // "MALE" | "FEMALE" | "OTHER"
  emergencyPhone String?
  address        String?
  notes          String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### ۲. مایگریشن و سید دیتا:

- اجرای خودکار مایگریشن توسعه:
  ```bash
  pnpm run db:migrate:dev --name add_student_profile_and_avatar
  pnpm run db:generate
  ```
- به‌روزرسانی `src/seed.ts` جهت ایجاد رکورد `StudentProfile` برای زبان‌آموز تستی (`09120000004`).

---

### ۳.۲. لایه انواع و اسکیماهای Zod (`packages/types`)

#### اسکیماهای جدید در مسیر `packages/types/src/student/`:

1. **`student-profile.schema.ts`:**

   ```typescript
   export const StudentProfileSchema = z.object({
     id: z.string().uuid().optional(),
     userId: z.string().uuid().optional(),
     fatherName: z.string().nullable().optional(),
     birthDate: z.date().or(z.string()).nullable().optional(),
     gender: z.string().nullable().optional(),
     emergencyPhone: z.string().nullable().optional(),
     address: z.string().nullable().optional(),
     notes: z.string().nullable().optional(),
   })
   export type StudentProfileDto = z.infer<typeof StudentProfileSchema>
   ```

2. **`student.schema.ts`:**

   ```typescript
   export const StudentDtoSchema = z.object({
     id: z.string().uuid(),
     instituteId: z.string().uuid(),
     role: z.literal("STUDENT"),
     firstName: z.string(),
     lastName: z.string(),
     phone: z.string(),
     nationalCode: z.string().nullable().optional(),
     avatarUrl: z.string().nullable().optional(),
     isActive: z.boolean(),
     currentAllowedCourseId: z.string().nullable().optional(),
     currentAllowedCourse: z
       .object({
         id: z.string().uuid(),
         title: z.string(),
         baseFee: z.number().optional(),
       })
       .nullable()
       .optional(),
     studentProfile: StudentProfileSchema.nullable().optional(),
     enrollmentsCount: z.number().optional(),
     createdAt: z.date().or(z.string()),
     updatedAt: z.date().or(z.string()),
   })
   export type StudentDto = z.infer<typeof StudentDtoSchema>
   ```

3. **`create-student.schema.ts` و `update-student.schema.ts`:**
   - اعتبارسنجی نام، نام خانوادگی، شماره تماس (Regex شماره ایران)، کد ملی، نام پدر، تلفن ولی، تاریخ تولد، دوره مجاز اولیه و تصویر.

4. **خروجی مشترک در `packages/types/src/index.ts`:**
   - اکسپورت ماژول `export * from "./student/index.js"`.

---

### ۳.۳. لایه بک‌اند (`apps/api` - NestJS)

#### ماژول اختصاصی `StudentsModule` (`src/students/`):

1. **`StudentsController` (`/students`):**
   - `POST /students`: ثبت فراگیر جدید (ایجاد رکورد `User` با نقش `STUDENT` و ایجاد همزمان `StudentProfile` در یک تراکنش دیتابیس).
   - `GET /students`: لیست فراگیران با پشتیبانی از فیلترهای جستجو (`search` بر روی نام، شماره تماس، کد ملی و نام پدر)، سطح مجاز (`courseId`)، وضعیت حساب (`isActive`) و مستاجر فعال.
   - `GET /students/:id`: دریافت جزئیات کامل پرونده فراگیر، سوابق و وضعیت مالی.
   - `PATCH /students/:id`: ویرایش اطلاعات فردی و فیلدهای پروفایل فراگیر.
   - `POST /students/:id/reset-password`: بازنشانی رمز عبور فراگیر.

2. **کنترل دسترسی (RBAC):**
   - دسترسی کامل برای `SUPER_ADMIN` و `INSTITUTE_ADMIN`.
   - دسترسی ثبت و مشاهده برای `CLERK`.
   - مسدودسازی دسترسی برای نقش `STUDENT` روی این اندپوینت‌ها.

3. **ماژول `UsersModule` (`src/users/`):**
   - تمرکز اختصاصی بر روی مدیریت کاربران کادر آموزشی و اداری (`SUPER_ADMIN`, `INSTITUTE_ADMIN`, `CLERK`).
   - فیلتر پیش‌فرض نقش‌ها برای جلوگیری از تداخل با فراگیران.

---

### ۳.۴. لایه پنل مدیریت (`apps/admin-panel`)

#### ۱. منوی سایدبار (`components/admin-base-layout/index.tsx`):

- تفکیک آیتم‌های ناوبری:
  - **فراگیران و زبان‌آموزان (`/students`)**: آیکون `GraduationCap`
  - **پرسنل و دسترسی‌ها (`/users`)**: آیکون `ShieldCheck`

#### ۲. صفحه اختصاصی فراگیران (`app/[locale]/(admin)/students`):

- **`StudentsHeader`:** عنوان، توضیحات، بج تعداد کل فراگیران و دکمه «افزودن فراگیر جدید».
- **`StudentsFilter`:** جستجوی پیشرفته متنی و فیلتر سطوح آموزشی.
- **`StudentsTable`:** جدول واکنش‌گرا با استفاده از `DataTable` اشتراکی و ستون‌های:
  - آواتار، نام و نام خانوادگی
  - شماره تماس
  - نام پدر
  - کد ملی
  - سطح مجاز فعلی (Badge)
  - وضعیت حساب (فعال / مسدود)
  - منوی عملیات (مشاهده پرونده، ویرایش، بازنشانی رمز)
- **`CreateStudentModal`:** فرم چندبخشی شامل اطلاعات هویتی، اطلاعات تحصیلی و نام پدر/تلفن اضطراری.
- **`EditStudentModal`:** ویرایش کامل اطلاعات و تغییر سطح.
- **`StudentProfileModal`:** نمایش کارت کامل پرونده زبان‌آموز.

#### ۳. صفحه پرسنل و کاربران (`app/[locale]/(admin)/users`):

- بازآرایی برای نمایش منشی‌ها، مدیران و کاربران ستادی با فیلتر نقش‌ها و مدیریت سطوح دسترسی.

#### ۴. فایل‌های چندزبانه (`next-intl`):

- ایجاد `messages/fa/students.json` و `messages/en/students.json`.
- اصلاح `messages/fa/users.json` و `messages/en/users.json`.
- به‌روزرسانی عنوان‌های ناوبری در `messages/fa/common.json` و `messages/en/common.json`.

---

## ۴. برنامه آزمون و راستی‌آزمایی (Verification & Testing Plan)

### ۴.۱. تست‌های خودکار (Automated Tests)

1. **تست‌های واحد بک‌اند (`apps/api`):**
   ```bash
   pnpm --filter @workspace/api test
   ```
   - تست اعتبارسنجی سرویس `StudentsService` (ایجاد همزمان User و StudentProfile).
   - تست اعتبارسنجی تکراری نبودن شماره تماس در سطح هر آموزشگاه (`phone_instituteId`).
   - تست گاردها و دسترسی‌های RBAC.
2. **تست‌های کامپوننت و جداول پنل مدیریت (`apps/admin-panel`):**
   ```bash
   pnpm --filter admin-panel test
   ```
   - رندر جدول فراگیران، باز شدن مودال‌ها و اعتبارسنجی فیلدهای فارسی/انگلیسی.

### ۴.۲. راستی‌آزمایی دستی (Manual Verification)

1. ورود با کاربر `INSTITUTE_ADMIN` (تلفن: `09120000002`).
2. ورود به مسیر `/students` و ثبت فراگیر جدید با نام پدر، کد ملی و تلفن اضطراری.
3. بررسی نمایش صحیح اطلاعات در جدول و مشاهده کارت پروفایل زبان‌آموز.
4. ورود به مسیر `/users` و اطمینان از عدم نمایش زبان‌آموزان و نمایش انحصاری پرسنل آموزشگاه.
5. جابجایی زبان به انگلیسی (`/en/students`) و اطمینان از صحت جهت‌گیری (LTR) و متون ترجمه.
