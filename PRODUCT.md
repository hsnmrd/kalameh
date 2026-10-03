# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Kalameh serves language-institute operators, staff, teachers, and students. The
admin dashboard is used by platform administrators and institute staff to run
day-to-day education and finance workflows. The student PWA supports learners'
self-service activities.

## Product Purpose

Kalameh centralizes institute administration across tenants. Success means each
institute can safely manage its own users, courses, classes, grades, and payment
records while platform administrators retain controlled cross-institute access.

## Operating Context

The product is a Persian- and English-language SaaS application. Staff primarily
operate a responsive web dashboard; students use a mobile-oriented PWA. Financial
staff review uploaded payment receipts and record an approval decision against
each transaction.

## Capabilities and Constraints

- All tenant-owned data is isolated by institute.
- Access is controlled by shared roles, granular permissions, and enabled modules.
- Authentication uses JWTs transported through HttpOnly cookies or bearer tokens.
- Transaction records contain a student, amount in toman, tracking code, receipt
  image, payment date, and pending, approved, or rejected status.
- User-facing copy supports Persian and English and must remain fully localized.

## Evidence on Hand

The repository contains the production application structure, shared schemas,
Prisma data model, role and permission definitions, navigation, locale messages,
and automated tests. No external marketing claims or customer evidence were
provided and future work must not fabricate them.

## Product Principles

- Protect tenant data at every query boundary.
- Make operational status and the next permitted action immediately clear.
- Keep workflows consistent across desktop and mobile layouts.
- Treat localization, permissions, and accessibility as functional requirements.
