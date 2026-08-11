# سند معماری فنی و زیرساخت پروژه (Master Tech Architecture)

**نام پروژه:** سیستم یکپارچه مدیریت آموزشگاه زبان (SaaS)
**متدولوژی توسعه:** AI-Driven Development (طراحی شده به عنوان Context برای ابزارهای هوش مصنوعی)

---

## ۱. پشته فناوری (Tech Stack)

- **معماری مخزن:** Turborepo (Monorepo)
- **بک‌اند:** NestJS (Node.js)
- **فرانت‌اند (ادمین و PWA):** React / Next.js
- **سیستم دیزاین و استایل:** Tailwind CSS + shadcn/ui
- **مدیریت وضعیت و درخواست‌ها:** React Query (از طریق پکیج `micro-rq`)
- **اعتبارسنجی و Type Safety سراسری:** Zod (Single Source of Truth)
- **دیتابیس:** PostgreSQL
- **رابط دیتابیس (ORM):** Prisma
- **مدیریت کش و قفل‌ها:** Redis
- **زیرساخت اجرا:** Docker & Docker Compose

---

## ۲. ساختار پوشه‌ها (Turborepo Structure)

پروژه بر اساس ساختار استاندارد Turborepo به دو بخش `apps` و `packages` تقسیم می‌شود:

````text
/
├── apps/
│   ├── api/                # NestJS Backend (RESTful APIs)
│   ├── admin-panel/        # Next.js App (Desktop Dashboard for Institute Admins)
│   └── student-pwa/        # Next.js App (Mobile-first PWA for Students)
│
├── packages/
│   ├── database/           # Prisma schema, migrations, and generated PrismaClient
│   ├── types/              # Zod schemas & TypeScript inferred types (Shared E2E)
│   ├── ui/                 # Shared UI components (shadcn/ui + Tailwind)
│   └── config/             # Shared ESLint, Prettier, and tsconfig.json
│
├── docker-compose.yml      # Services: PostgreSQL, Redis
└── package.json            # Root workspace config (pnpm/yarn)
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
````
