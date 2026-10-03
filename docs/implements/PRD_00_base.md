# سند پیاده‌سازی و اجرای PRD_00_base: سیستم احراز هویت و زیرساخت چندمستاجری (Multi-Tenant Auth Base)

**مرجع نیازمندی‌ها:** [`docs/PRD_00_auth.md`](../PRD_00_auth.md) | [`docs/PRD_base.md`](../PRD_base.md) | [`docs/TECH_base.md`](../TECH_base.md)  
**مرجع دیزاین سیستم:** [`DESIGN.md`](../../DESIGN.md)  
**وضعیت:** تکمیل شده و تست شده (Implemented & Verified)

---

## ۱. نمای کلی و معماری پیاده‌سازی

این سند مراحل اجرایی پیاده‌سازی سیستم احراز هویت یکپارچه و تفکیک چندمستاجری در سطح پکیج‌ها و اپلیکیشن‌های مونوریپو را مشخص می‌کند:

1. **پکیج انواع اشتراکی (`packages/types`):**
   - اسکیماهای اعتبارسنجی Zod برای لاگین، کاربران، پیلود JWT و پاسخ‌های احراز هویت (Single Source of Truth).
2. **کتابخانه کامپوننت‌های اشتراکی (`packages/ui`):**
   - پیاده‌سازی دیزاین مینیمال احراز هویت بر اساس `DESIGN.md` (کنتراست مشکی/سفید، المان‌های لمسی با ارتفاع `h-14` / 56px، گوشه‌های گرد `rounded-2xl` / 16px، انیمیشن فیداین و کلیک `active:scale-[0.98]`، کنترل نمایش/عدم‌نمایش رمز عبور و پشتیبانی از استانداردهای دسترس‌پذیری Base UI / shadcn).
3. **بک‌اند (`apps/api` - NestJS):**
   - ماژول `AuthModule` شامل استراتژی JWT، گاردها (`JwtAuthGuard`, `RolesGuard`)، اکسترکتور مستاجر/آموزشگاه (Tenant Resolution)، هش پسورد با `bcrypt` و دکوراتورهای `@CurrentUser()` و `@Roles()`.
   - ماژول `UsersModule` برای مدیریت کاربران و پروفایل با فیلتر الزامی `where: { instituteId }`.
   - اعتبارسنجی کلیه DTOها با `nestjs-zod` و اسکیماهای Zod.
4. **پنل مدیریت (`apps/admin-panel` - Next.js App Router):**
   - صفحه ورود `(auth)/login` با طراحی Split 50/50 دسکتاپ (پنل تیره چپ با دیزاین Slate 800/900 + فرم ورود راست بر اساس `DESIGN.md`).
   - تنظیم کلاینت `micro-rq` و `createTokenProvider` برای مدیریت خودکار توکن‌ها.
   - گروه‌های روت محافظت شده نقش‌ها: `(super-admin)` و `(institute)`.
5. **نسخه زبان‌آموز (`apps/student-pwa` - Next.js PWA):**
   - صفحه ورود موبایل در چارچوب `max-w-[480px] mx-auto min-h-screen` با دکمه‌ها و فیلدهای `h-14` لمسی.
   - اتصال به کلاینت `micro-rq`.

---

## ۲. قوانین و الزامات کلیدی (Key Business & Technical Rules)

> [!IMPORTANT]
> **روش ورود در MVP:**
> بر اساس `docs/PRD_00_auth.md` و `docs/PRD_base.md`، در فاز MVP ورود تمامی کاربران صرفاً از طریق **شماره موبایل + رمز عبور** انجام می‌شود. ثبت‌نام خودکار عمومی (Self-Registration) و ورود با SMS OTP در این فاز خارج از محدوده است.

> [!NOTE]
> **جداسازی مستاجر (Tenant Isolation):**
> شناسه `instituteId` از طریق هدر `x-tenant-id`، ساب‌دامین یا مد تک‌مستاجری استخراج شده و در توکن JWT قرار می‌گیرد. تمام کوئری‌های دیتابیس باید به صورت اجباری با `where: { instituteId }` فیلتر شوند.

---

## ۳. جزییات تغییرات و فایل‌ها (Proposed Changes)

### الف) پکیج انواع اشتراکی (`packages/types`)

#### [MODIFY] [`packages/types/src/index.ts`](file:///D:/projects/kalameh/packages/types/src/index.ts)

- اضافه کردن اسکیماهای Zod و خروجی تایپ‌های TypeScript:
  - `RoleEnum`: `'SUPER_ADMIN' | 'INSTITUTE_ADMIN' | 'CLERK' | 'STUDENT'`
  - `LoginInputSchema` / `LoginDto`: اعتبارسنجی شماره موبایل (۱۱ رقم با فرمت `09xxxxxxxxx`)، رمز عبور (حداقل ۶ کاراکتر)، ساب‌دامین یا شناسه آموزشگاه.
  - `JwtPayloadSchema`: شامل فیلدهای `sub`, `instituteId`, `role`, `phone`.
  - `AuthResponseSchema`: شامل `accessToken`, `user` (`id`, `firstName`, `lastName`, `phone`, `role`, `instituteId`, `isActive`).
  - `CreateUserSchema`, `UpdateUserSchema`, `ChangePasswordSchema`.

---

### ب) کتابخانه UI اشتراکی (`packages/ui`)

#### [MODIFY] [`packages/ui/src/styles/globals.css`](file:///D:/projects/kalameh/packages/ui/src/styles/globals.css)

- تعریف توکن‌ها و متغیرهای رنگی منطبق با `DESIGN.md` (مشکی `#000000`، سفید `#ffffff`، اسلیت‌های 900/500/400/200/50 و اکسنت زمردی `#4ade80`).

#### [NEW] [`packages/ui/src/components/input.tsx`](file:///D:/projects/kalameh/packages/ui/src/components/input.tsx)

- کامپوننت ورودی با ارتفاع `h-14` (56px)، انحنای `rounded-2xl` (16px)، بوردر `border-slate-200` و فوکوس `border-black` بر اساس `DESIGN.md`.

#### [NEW] [`packages/ui/src/components/password-input.tsx`](file:///D:/projects/kalameh/packages/ui/src/components/password-input.tsx)

- کامپوننت فیلد پسورد با دکمه تغییر وضعیت نمایش/مخفی‌سازی رمز و آیکون‌های Lucide.

#### [NEW] [`packages/ui/src/components/field.tsx`](file:///D:/projects/kalameh/packages/ui/src/components/field.tsx)

- کامپوننت‌های ساختاری فرم (`Field`, `FieldLabel`, `FieldError`, `FieldDescription`) با پشتیبانی از دسترس‌پذیری.

#### [NEW] [`packages/ui/src/components/badge.tsx`](file:///D:/projects/kalameh/packages/ui/src/components/badge.tsx)

- کامپوننت نشان وضعیت و نقش با واریانت‌های `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`.

#### [NEW] [`packages/ui/src/components/dialog.tsx`](file:///D:/projects/kalameh/packages/ui/src/components/dialog.tsx)

- کامپوننت دیالوگ/مدال در دسترس با انیمیشن‌های نرم، پس‌زمینه مات و فوکوس استاندارد بر پایه `@base-ui/react/dialog`.

#### [NEW] [`packages/ui/src/components/select.tsx`](file:///D:/projects/kalameh/packages/ui/src/components/select.tsx)

- کامپوننت انتخابگر منو و آیتم‌ها بر پایه `@base-ui/react/select`.

#### [MODIFY] [`packages/ui/src/components/button.tsx`](file:///D:/projects/kalameh/packages/ui/src/components/button.tsx)

- بهینه‌سازی دکمه برای فرم ورود با سایز `h-14 rounded-2xl`، انیمیشن کلیک `active:scale-[0.98]` و حالت لودینگ اسپینر.

#### [MODIFY] [`packages/ui/package.json`](file:///D:/projects/kalameh/packages/ui/package.json)

- ثبت کامپوننت‌های جدید در `exports`.

---

### ج) بک‌اند (`apps/api`)

#### [MODIFY] [`apps/api/package.json`](file:///D:/projects/kalameh/apps/api/package.json)

- نصب وابستگی‌های احراز هویت: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `@types/bcrypt`, `@types/passport-jwt`.

#### [NEW] [`apps/api/src/auth/`](file:///D:/projects/kalameh/apps/api/src/auth/)

- `auth.module.ts`: پیکربندی `JwtModule`, `PassportModule`.
- `auth.service.ts`: بررسی اطلاعات کاربر، صحت رمز عبور با `bcrypt` و صدور JWT بر اساس `instituteId` و `role`.
- `auth.controller.ts`: مسیرهای `POST /auth/login`، `GET /auth/me` و `POST /auth/change-password`.
- `jwt.strategy.ts`: استخراج و اعتبارسنجی Bearer Token.
- `jwt-auth.guard.ts`: گارد سراسری محافظت از مسیرها با پشتیبانی از دکوراتور `@Public()`.
- `roles.guard.ts` و دکوراتور `@Roles()`: اعمال ماتریس دسترسی RBAC.
- `current-user.decorator.ts`: دکوراتور دسترسی به آبجکت کاربر لاگین کرده در کنترلرها.

#### [NEW] [`apps/api/src/users/`](file:///D:/projects/kalameh/apps/api/src/users/)

- `users.module.ts`, `users.service.ts`, `users.controller.ts`: سرویس و کنترلر کاربران آموزشگاه با اعمال اجباری `where: { instituteId }`.
- متدهای CRUD: ایجاد کاربر جدید، لیست کاربران با فیلتر نقش و سرچ، ویرایش مشخصات و وضعیت، بازنشانی رمز عبور.

#### [MODIFY] [`apps/api/src/app.module.ts`](file:///D:/projects/kalameh/apps/api/src/app.module.ts)

- اضافه کردن `AuthModule` و `UsersModule`.

---

### د) پنل مدیریت (`apps/admin-panel`)

#### [MODIFY] [`apps/admin-panel/package.json`](file:///D:/projects/kalameh/apps/admin-panel/package.json)

- افزودن `@hookform/resolvers` و `react-hook-form` و `@workspace/types`.

#### [NEW] [`apps/admin-panel/lib/api/`](file:///D:/projects/kalameh/apps/admin-panel/lib/api/)

- پیکربندی کلاینت `micro-rq` همراه با `client.ts` و ریسورس‌های `auth.resource.ts` و `users.resource.ts`.

#### [NEW] [`apps/admin-panel/app/(auth)/login/page.tsx`](<file:///D:/projects/kalameh/apps/admin-panel/app/(auth)/login/page.tsx>)

- پیاده‌سازی صفحه لاگین با دیزاین Split 50/50 دسکتاپ بر اساس `DESIGN.md`، اعتبارسنجی فرم با Zod و هدایت بر اساس نقش.

#### [NEW] [`apps/admin-panel/app/[locale]/(admin)/users/`](<file:///D:/projects/kalameh/apps/admin-panel/app/[locale]/(admin)/users/>)

- **صفحه مدیریت کاربران (`page.tsx`):**
  - مدیریت کامل کاربران آموزشگاه (فراگیران، منشی‌ها و مدیران) با TanStack React Query.
  - فیلتر آنی بر اساس نقش‌ها (زبان‌آموز، منشی، مدیر آموزشگاه).
  - سرچ زنده بر اساس نام، نام خانوادگی یا شماره تماس.
- **کامپوننت‌های اختصاصی بر اساس معماری دایرکتوری‌محور:**
  - `users-header/index.tsx`: سرتیتر، شمارنده کل، و دکمه افزودن کاربر.
  - `users-filter/index.tsx`: اینپوت جستجو و تب‌های انتخاب نقش.
  - `users-table/index.tsx`: جدول واکنش‌گرا با حالت خالی و لودینگ اسپینر.
  - `user-row/index.tsx`: سطر جدول همراه با دکمه‌های عملیاتی (ویرایش، ریست پسورد).
  - `user-card/index.tsx`: کارت اختصاصی نمایش کاربر در نمایشگرهای موبایل.
  - `user-role-badge/index.tsx`: برچسب رنگی نقش کاربر.
  - `user-status-badge/index.tsx`: برچسب وضعیت فعال/غیرفعال.
  - `create-user-modal/index.tsx`: دیالوگ ایجاد کاربر جدید با `react-hook-form` و اسکیماهای Zod.
  - `edit-user-modal/index.tsx`: دیالوگ ویرایش مشخصات کاربر و تغییر وضعیت حساب.
  - `reset-password-modal/index.tsx`: دیالوگ بازنشانی سریع رمز عبور.
  - `hooks/use-user-schemas/index.ts`: هوک محلی‌سازی خطاهای اعتبارسنجی فرم.
- **پیام‌های محلی‌سازی (`messages/{fa,en}/users.json`):**
  - ترجمه کامل عناوین، فیلدها و خطاهای اعتبارسنجی به زبان‌های فارسی و انگلیسی.

#### [NEW] [`apps/admin-panel/app/(institute)/layout.tsx`](<file:///D:/projects/kalameh/apps/admin-panel/app/(institute)/layout.tsx>)

- لایه و ساختار روت اختصاصی مدیران و کارمندان آموزشگاه.

#### [NEW] [`apps/admin-panel/app/(super-admin)/layout.tsx`](<file:///D:/projects/kalameh/apps/admin-panel/app/(super-admin)/layout.tsx>)

- لایه و ساختار روت اختصاصی ادمین کل.

---

### ه) نسخه زبان‌آموز (`apps/student-pwa`)

#### [MODIFY] [`apps/student-pwa/package.json`](file:///D:/projects/kalameh/apps/student-pwa/package.json)

- افزودن `@hookform/resolvers` و `react-hook-form` و `@workspace/types`.

#### [NEW] [`apps/student-pwa/lib/api-client.ts`](file:///D:/projects/kalameh/apps/student-pwa/lib/api-client.ts)

- پیکربندی کلاینت PWA با `micro-rq`.

#### [NEW] [`apps/student-pwa/app/(auth)/login/page.tsx`](<file:///D:/projects/kalameh/apps/student-pwa/app/(auth)/login/page.tsx>)

- پیاده‌سازی فرم ورود PWA در اندازه حداکثر ۴۸۰ پیکسل و تعاملات لمسی مناسب موبایل.

---

## ۴. برنامه اعتبارسنجی و تست‌ها (Verification Plan)

### تست‌های خودکار:

1. اجرای Typecheck در تمام پکیج‌ها: `pnpm typecheck`
2. اجرای Lint: `pnpm lint`
3. تست‌های واحد بک‌اند: `pnpm --filter api test`

### تست‌های دستی و عملکردی:

1. تست صحت ظاهری و واکنش‌گرایی صفحه لاگین دسکتاپ در `admin-panel` و مقایسه با `DESIGN.md`.
2. تست رابط کاربری موبایل در `student-pwa` در ابعاد ۳۹۰ الی ۴۸۰ پیکسل.
3. بررسی اعتبارسنجی Zod (شماره موبایل نامعتبر یا پسورد کوتاه) و نمایش پیام‌های خطا.
4. تست لاگین موفق با ایجاد توکن JWT و بررسی جداسازی داده‌های مستاجر.
