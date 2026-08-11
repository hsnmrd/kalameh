# جزییات محصول - بخش ۳: مدیریت زیرساخت، کاربران و تنظیمات
**نام فایل:** `03_Product_Details_Admin_and_Users.md`
**وضعیت:** نهایی (نسخه MVP)

---

## ۱. هدف این سند
این سند به تشریح زیرساخت‌های سیستمی شامل پنل ادمین کل (Super Admin) برای مدیریت SaaS، تنظیمات پایه آموزشگاه (به ویژه اطلاعات بانکی)، مدیریت کاربران بدون نیاز به پیامک، و داشبوردهای گزارش‌گیری می‌پردازد.

---

## ۲. پنل مدیریت کل (Super Admin / SaaS Manager)
این پنل صرفاً در اختیار شما (مالک نرم‌افزار) است و برای مدیریت مشتریان (آموزشگاه‌ها) استفاده می‌شود.
* **ایجاد آموزشگاه جدید (Onboarding):** دریافت نام آموزشگاه، تولید یک شناسه یکتا (`institute_id`)، و ساخت یک حساب کاربری «مدیر کل» (Institute Admin) برای آن آموزشگاه.
* **مدیریت لایسنس:** امکان تغییر وضعیت آموزشگاه به «فعال» یا «غیرفعال» (تعلیق). در صورت تعلیق، ورود تمام کاربرانِ آن آموزشگاه به سیستم مسدود می‌شود.
* **داشبورد سیستمی:** مشاهده تعداد کل آموزشگاه‌های فعال و مجموع کاربران ثبت‌شده در کل پلتفرم.
* **حریم خصوصی:** Super Admin نباید مستقیماً به اطلاعات مالی یا تحصیلیِ داخل یک آموزشگاه دسترسی عملیاتی داشته باشد (مگر از طریق دیتابیس برای پشتیبانی فنی).

---

## ۳. تنظیمات پایه آموزشگاه (Institute Settings)
مدیر آموزشگاه با ورود به پنل، باید بتواند اطلاعات زیر را تنظیم کند:
* **تنظیمات مالی (بسیار مهم):** ثبت «شماره کارت»، «شماره شبا» و «نام صاحب حساب». (این اطلاعات در PWA در زمان ثبت‌نام به زبان‌آموز نمایش داده می‌شود).
* **اطلاعات عمومی:** ثبت نام آموزشگاه، آپلود لوگو (برای نمایش در هدر PWA) و شماره تماس پشتیبانی آموزشگاه.

---

## ۴. مدیریت کاربران و ورود (بدون سیستم پیامک)
با توجه به عدم وجود سرویس پیامک (SMS OTP) در فاز اول، جریان کاربری به این شکل مدیریت می‌شود:

### الف) ایجاد کاربر (زبان‌آموز)
* **دستی توسط مدیر:** مدیر در پنل مشخصات زبان‌آموز (نام و موبایل) را وارد می‌کند. سیستم به صورت خودکار یک **رمز عبور پیش‌فرض** (مثلاً کدملی یا یک عدد ثابت مثل `123456`) برای او ست می‌کند. مدیر این رمز را شفاهاً یا روی یک برگه به زبان‌آموز می‌دهد.
* **تغییر رمز:** زبان‌آموز پس از اولین ورود موفق به PWA با رمز پیش‌فرض، می‌تواند (و بهتر است) از تنظیمات پروفایل، رمز خود را تغییر دهد.

### ب) فراموشی رمز عبور (Password Reset)
* اگر کاربری رمز خود را فراموش کند، دکمه‌ای به نام "فراموشی رمز" در اپلیکیشن می‌بیند که با کلیک روی آن پیام می‌دهد: *"لطفاً جهت بازنشانی رمز عبور، با پذیرش آموزشگاه تماس بگیرید."*
* مدیر در پنل خود کاربر را جستجو کرده، دکمه **«بازنشانی رمز»** را می‌زند. سیستم رمز کاربر را به همان رمز پیش‌فرض برمی‌گرداند.

### ج) مدیریت نقش‌ها (Roles)
* مدیر اصلی می‌تواند کاربران جدیدی با نقش «کارمند/منشی» ایجاد کند تا به پنل مدیریت دسترسی داشته باشند، اما این نقش به بخش «تنظیمات پایه آموزشگاه» دسترسی نخواهد داشت.

---

## ۵. داشبورد و گزارش‌ها (MVP Dashboard)
برای اینکه نرم‌افزار برای مدیر آموزشگاه کاربردی و جذاب باشد، صفحه اول پنل (Dashboard) باید در یک نگاه وضعیت کسب‌وکار را نشان دهد:
1. **ویجت اعلان‌ها:** تعداد فیش‌های بانکی در انتظار بررسی (با قابلیت کلیک برای هدایت به لیست).
2. **ویجت مالی:** مجموع درآمد تایید شده (تراکنش‌های موفق) در ماه جاری.
3. **ویجت آموزشی:** تعداد کل زبان‌آموزان فعال (دارای کلاس) در ترم جاری.
4. **خروجی اکسل:** مدیر باید بتواند از لیست زبان‌آموزان (کل آموزشگاه یا یک کلاس خاص) خروجی اکسل (Export) بگیرد.

---

## ۶. قوانین تجاری و اعتبارسنجی‌ها (Business Rules)
* **یکتایی حساب کاربری:** ترکیب فیلد `phone_number` (شماره موبایل) و `institute_id` باید یکتا (Unique) باشد. یعنی یک شماره موبایل می‌تواند در سیستم وجود داشته باشد به شرطی که متعلق به دو آموزشگاهِ متفاوت باشد.
* **حذف فیزیکی ممنوع (Soft Delete):** مدیر نمی‌تواند یک زبان‌آموز یا فیش مالی را کاملاً از دیتابیس پاک کند (به دلیل حفظ یکپارچگی سوابق مالی). سیستم فقط آن‌ها را غیرفعال (Deactivate/Archived) می‌کند.

۳. قوانین توسعه و کدنویسی (AI Development Guidelines)
هوش مصنوعی در زمان تولید کد برای این پروژه باید قوانین زیر را رعایت کند:

الف) اعتبارسنجی (Validation & Types)
از class-validator در NestJS استفاده نشود.

تمام اسکیماهای اعتبارسنجی باید با Zod در packages/types نوشته شوند.

بک‌اند (NestJS) باید از nestjs-zod یا Zod Pipes برای اعتبارسنجی ورودی‌ها استفاده کند.

فرانت‌اند باید از react-hook-form همراه با @hookform/resolvers/zod و همان اسکیمای Zod اشتراکی استفاده کند.

ب) فرانت‌اند (Frontend - React/Next.js)
کامپوننت‌های پایه (Buttons, Inputs, Modals) فقط و فقط باید در packages/ui ساخته شوند (بر پایه shadcn/ui).

برای ارتباط با API همیشه از micro-rq (بسته‌بندی کننده React Query) استفاده شود.

در student-pwa، عرض صفحه در دسکتاپ باید روی موبایل (max-width: 480px) محدود و وسط‌چین شود.

ج) بک‌اند و دیتابیس (Backend & DB)
معماری SaaS: فیلد instituteId باید در تمام کوئری‌های مربوط به آموزشگاه‌ها به عنوان فیلتر (WHERE clause) اعمال شود تا از نشت اطلاعات (Data Leakage) جلوگیری گردد.

قفل ظرفیت کلاس: رزرو موقت ۳۰ دقیقه‌ای ظرفیت کلاس، باید با استفاده از کلیدهای TTL دار در Redis پیاده‌سازی شود، نه در دیتابیس اصلی.

آپلود فایل‌ها (مثل عکس فیش بانکی) نباید روی دیسک لوکال ذخیره شود. فقط URL آن‌ها در دیتابیس ذخیره می‌گردد.

۴. طرح‌واره پایگاه داده (Prisma Schema - MVP)
این اسکیما مبنای تولید کلاینت دیتابیس است و باید در مسیر packages/database/schema.prisma قرار گیرد:

Code snippet
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Institute {
  id              String   @id @default(uuid())
  name            String
  subdomain       String   @unique
  isActive        Boolean  @default(true)
  
  bankCardNumber  String?
  bankAccountName String?
  bankShaba       String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  users         User[]
  courses       Course[]
  terms         Term[]
  classes       Class[]
  transactions  Transaction[]
}

enum Role {
  SUPER_ADMIN
  INSTITUTE_ADMIN
  CLERK
  STUDENT
}

model User {
  id           String    @id @default(uuid())
  instituteId  String
  role         Role      @default(STUDENT)
  
  firstName    String
  lastName     String
  phone        String
  password     String    // Hashed
  nationalCode String?
  isActive     Boolean   @default(true)

  currentAllowedCourseId String? 

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  institute          Institute     @relation(fields: [instituteId], references: [id])
  currentAllowedCourse Course?     @relation("UserAllowedCourse", fields: [currentAllowedCourseId], references: [id])
  enrollments        Enrollment[]
  transactions       Transaction[]

  @@unique([phone, instituteId])
  @@index([instituteId])
}

model Term {
  id          String   @id @default(uuid())
  instituteId String
  title       String
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  @default(true)

  institute   Institute @relation(fields: [instituteId], references: [id])
  classes     Class[]

  @@index([instituteId])
}

model Course {
  id           String   @id @default(uuid())
  instituteId  String
  title        String
  baseFee      Int

  prerequisiteId String?
  prerequisite   Course?  @relation("Prerequisite", fields: [prerequisiteId], references: [id])
  nextCourses    Course[] @relation("Prerequisite")

  institute      Institute @relation(fields: [instituteId], references: [id])
  classes        Class[]
  allowedUsers   User[]    @relation("UserAllowedCourse")

  @@index([instituteId])
}

model Class {
  id          String   @id @default(uuid())
  instituteId String
  termId      String
  courseId    String
  
  title       String
  capacity    Int
  fee         Int
  teacherName String?
  schedule    String?

  institute   Institute @relation(fields: [instituteId], references: [id])
  term        Term      @relation(fields: [termId], references: [id])
  course      Course    @relation(fields: [courseId], references: [id])
  enrollments Enrollment[]

  @@index([instituteId])
}

enum EnrollmentStatus {
  PENDING_PAYMENT
  PENDING_APPROVAL
  ENROLLED
  REJECTED
  WAITLISTED
}

model Enrollment {
  id          String           @id @default(uuid())
  studentId   String
  classId     String
  status      EnrollmentStatus @default(PENDING_PAYMENT)
  
  finalScore  Int?
  isPassed    Boolean?

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  student     User  @relation(fields: [studentId], references: [id])
  class       Class @relation(fields: [classId], references: [id])

  @@unique([studentId, classId])
  @@index([classId])
}

enum TransactionStatus {
  PENDING
  APPROVED
  REJECTED
}

model Transaction {
  id              String            @id @default(uuid())
  instituteId     String
  studentId       String
  
  amount          Int
  trackingCode    String
  receiptImageUrl String
  
  status          TransactionStatus @default(PENDING)
  paymentDate     DateTime          @default(now())

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  institute Institute @relation(fields: [instituteId], references: [id])
  student   User      @relation(fields: [studentId], references: [id])

  @@index([instituteId])
}

## ۵. کیفیت کد و تجربه توسعه‌دهنده (Code Quality & DX)
برای حفظ یکپارچگی کدها و جلوگیری از ورود کدهای مخرب یا فرمت‌نشده به ریپازیتوری، ابزارهای کیفیت کد در سطح Root پروژه (Monorepo) پیکربندی می‌شوند. هوش مصنوعی باید این زیرساخت را در زمان Setup پروژه ایجاد کند:

### الف) Prettier و Format on Save
* تنظیمات Prettier به صورت متمرکز در `packages/config` تعریف می‌شود و تمام اپلیکیشن‌ها از آن ارث‌بری می‌کنند.
* برای اعمال خودکار فرمت در زمان ذخیره (Save)، پوشه `.vscode` در Root پروژه ایجاد شده و فایل `settings.json` با پیکربندی زیر الزامی است:
  ```json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    },
    "[prisma]": {
      "editor.defaultFormatter": "Prisma.prisma"
    }
  }
ب) Husky و lint-staged (جلوگیری از کامیت کدهای کثیف)
ابزار Husky برای مدیریت Git Hooks در روت پروژه نصب می‌شود.

هوک pre-commit فعال شده و موظف است دستور npx lint-staged را اجرا کند.

برای جلوگیری از کند شدن فرآیند کامیت، از lint-staged استفاده می‌شود تا فرمت و لینت فقط روی فایل‌های تغییر یافته (Staged) اعمال شود.

پیکربندی lint-staged در فایل package.json (سطح روت) باید به شکل زیر پیاده‌سازی شود:

JSON
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml,css,scss}": [
    "prettier --write"
  ],
  "*.prisma": [
    "prisma format"
  ]
}
قانون سخت‌گیرانه: اگر ESLint اروری بدهد که با --fix به صورت خودکار قابل حل نباشد، هوک Husky باید فرآیند کامیت را مسدود (Abort) کند و لاگ ارور را به توسعه‌دهنده نمایش دهد.