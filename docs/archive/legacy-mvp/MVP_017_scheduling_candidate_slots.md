# MVP-017 — تولید Slotهای کاندید زمان‌بندی

**وضعیت:** پیاده‌سازی‌شده  
**دامنه:** تولید بازه‌های زمانی اولیه از Requirement و Availability استاد

## رفتار تولید

برای هر Requirement، فقط Qualificationهای همان Course بررسی می‌شوند. داخل هر Availability استاد، بازه‌هایی با طول `sessionDurationMinutes` و گام پیش‌فرض ۳۰ دقیقه تولید می‌شوند.

```text
candidateStart = availabilityStart + n × stepMinutes
candidateEnd   = candidateStart + sessionDurationMinutes
candidateEnd  <= availabilityEnd
```

در نتیجه هیچ کاندیدی حتی به‌اندازه یک دقیقه از Availability استاد خارج نمی‌شود. Availability نامعتبر یا کوتاه‌تر از مدت جلسه به‌صورت fail-closed نادیده گرفته می‌شود.

## گروه زمانی

هر Slot براساس تنظیمات مؤثر آموزشگاه در یکی از گروه‌های `ODD_MORNING`، `ODD_EVENING`، `EVEN_MORNING`، `EVEN_EVENING`، `NEUTRAL_MORNING` یا `NEUTRAL_EVENING` قرار می‌گیرد. شروع دقیقاً در `eveningStartsAt` در گروه عصر است.

قرارداد تنظیمات تضمین می‌کند هر هفت روز دقیقاً در یکی از گروه‌های فرد، زوج یا خنثی قرار داشته باشند و مرز عصر در بازه مجاز باشد.

## خروجی و تکرارپذیری

هر Candidate شامل Requirement، Course، شعبه، استاد، Qualification، Availability، روز، ساعت، مدت و گروه زمانی است. کلید Candidate از داده‌های دامنه ساخته می‌شود. ورودی‌ها مرتب و Slotهای حاصل از Availabilityهای هم‌پوشان deduplicate می‌شوند؛ بنابراین ورودی یکسان همیشه ترتیب خروجی یکسانی دارد.

این مرحله Candidateها را در دیتابیس ذخیره و Proposal تولید نمی‌کند. خروجی سرویس در MVP-018 وارد فیلتر Hard Constraint خواهد شد.

## معیار پذیرش

- [x] Slotها فقط برای Qualification متناظر با Course تولید می‌شوند.
- [x] هیچ Slot خارج از Availability استاد تولید نمی‌شود.
- [x] طول Slot دقیقاً با مدت جلسه Requirement برابر است.
- [x] گام تولید قابل تنظیم و پیش‌فرض آن ۳۰ دقیقه است.
- [x] گروه فرد/زوج، خنثی و صبح/عصر از تنظیمات مؤثر استخراج می‌شود.
- [x] Availabilityهای هم‌پوشان خروجی تکراری تولید نمی‌کنند.
- [x] خروجی دارای قرارداد Zod مشترک و ترتیب قطعی است.
- [x] در این مرحله هیچ Plan، Proposal یا Class جدیدی ساخته نمی‌شود.
