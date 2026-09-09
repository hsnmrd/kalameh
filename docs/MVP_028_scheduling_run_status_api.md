# MVP-028 — API وضعیت اجرای زمان‌بندی

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** polling وضعیت Run و اعلام آماده‌شدن نتیجه

## Endpoint

```http
GET /scheduling/runs/:runId
```

مجوز لازم `VIEW_CLASSES` و ماژول لازم `CLASSES_COURSES` است. `SUPER_ADMIN` باید `instituteId` را در query مشخص کند؛ برای سایر نقش‌ها آموزشگاه فقط از JWT گرفته می‌شود و مقدار query نمی‌تواند tenant را تغییر دهد.

## پاسخ

`SchedulingRunStatusSchema` اطلاعات زیر را برمی‌گرداند:

- شناسه و وضعیت Run؛
- `isTerminal` برای توقف امن polling؛
- زمان ایجاد، شروع، تکمیل و آخرین تغییر؛
- گزارش ساختاریافته preflight؛
- کد و پیام شکست؛
- بعد از `COMPLETED`، شناسه Planهای تولیدشده و Plan پیشنهادی.

Plan موقت `PENDING_ENGINE` که هنگام ساخت Run ایجاد می‌شود تا پیش از تکمیل موتور به‌عنوان نتیجه نمایش داده نمی‌شود. جزئیات کامل Plan و Proposalها در MVP-029 ارائه خواهد شد.

## وضعیت‌های نهایی

```text
PREFLIGHT_FAILED
COMPLETED
FAILED
CANCELLED
```

در `QUEUED` و `GENERATING` مقدار `isTerminal` برابر false است و کلاینت می‌تواند polling را ادامه دهد. فقط Run با وضعیت `COMPLETED` دارای `result` است.

## امنیت tenant

خواندن Run با ترکیب زیر انجام می‌شود:

```text
id = runId
instituteId = resolved institute
```

بنابراین Run ناموجود و Run متعلق به آموزشگاه دیگر از دید API تفاوتی ندارند.

## معیار پذیرش

- [x] وضعیت Run با endpoint محافظت‌شده قابل polling است.
- [x] وضعیت‌های نهایی به‌صورت صریح مشخص می‌شوند.
- [x] Plan موقت به‌عنوان خروجی موتور افشا نمی‌شود.
- [x] شناسه گزینه‌ها فقط پس از تکمیل Run ارائه می‌شود.
- [x] خطاهای engine و preflight قابل نمایش‌اند.
- [x] lookup برای تمام نقش‌ها tenant-safe است.
- [x] قرارداد query و response در `@workspace/types` تعریف شده است.
- [x] جزئیات Plan و عملیات انتشار خارج از این مرحله باقی می‌مانند.
