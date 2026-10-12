# PRD 02: Finance & Enrollment Implementation Questions & Decisions

This document outlines architectural choices made during the implementation of `PRD_02_finance.md` for `student-pwa`, `admin-panel`, and `api`, along with key questions and recommendations for your review.

---

## 1. Waitlist Promotion Automation

- **Current Implementation:**
  - When a class is full, students can join the waitlist for free (`status: WAITLISTED`).
  - An admin can promote waitlisted students via `POST /enrollments/:id/promote-waitlist`.
- **Question for Review:**
  - When an admin rejects a receipt or a reservation expires and frees up a seat, should the system **automatically** promote the first waitlisted student (giving them a 30-minute payment lock and sending an SMS/push notification), or should waitlist promotion remain **manual** via the admin dashboard?

---

## 2. Duplicate Tracking Code Detection Scope

- **Current Implementation:**
  - The API flags transactions with duplicate tracking codes within the same institute (`isDuplicateTrackingCode: true`, `duplicateCount: N`), and the Admin Panel highlights them with a non-blocking ⚠️ warning badge in both the transactions table and the review dialog.
- **Question for Review:**
  - Is per-institute duplicate detection sufficient, or should duplicate tracking codes be checked across **all institutes** in the system (e.g., in multi-branch setups or to catch reused receipt codes across institutes)?

---

## 3. Receipt Image Storage Strategy

- **Current Implementation:**
  - Receipt images are handled via the existing file upload infrastructure (`Multer` into the local uploads directory and served via static endpoint).
- **Question for Review:**
  - For production deployments, will S3-compatible cloud storage (e.g. ArvanCloud Object Storage, AWS S3, or MinIO) be configured for receipt files, or should local disk persistence continue to be used?

---

## 4. Discounts and Voucher Waivers

- **Current Implementation:**
  - Strictly enforces the PRD rule: **"One Lump-Sum Payment Rule: Tuition must be paid in full (no partial/installment payments)."**
  - The backend validates that `transaction.amount === class.fee`.
- **Question for Review:**
  - Are discount codes, sibling discounts, or scholarship vouchers planned for future phases that will alter the expected transaction amount prior to receipt upload?

---

## 5. Redis TTL & Memory Cache Fallback

- **Current Implementation:**
  - Capacity reservations use Redis locks (`kalameh:lock:class:{classId}:{studentId}`) with a 30-minute TTL (1800s).
  - In local environments without Redis, a robust in-memory store fallback ensures zero crashes and full test compatibility.
- **Status:** Fully functioning. Please ensure production environment has `REDIS_HOST` / `REDIS_PORT` configured in root `.env`.
