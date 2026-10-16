---
name: kalameh-admin-page
description: Use this skill when building, modifying, or refactoring an admin entity list page, data table, filter bar, mobile list, sub-page breadcrumbs, or URL filter state synchronization in apps/admin-panel.
---

# Kalameh Admin Page Implementation Guide

## Overview

This skill provides the unified architectural pattern for all entity list and inner pages in `apps/admin-panel`. Every admin list page adheres to a two-tier view model:

1. **Desktop view (`lg:` / >= 1024px):** Uses `<AdminFilterBar actions={...}>` with an Add button and `<DataTable />`.
2. **Mobile view (< `lg` / < 1024px):** Uses `<FABSingle>` in `<AdminPageShell fab={...}>` and `<MobileList />`.

---

## 1. Unified List Page Architecture

```text
apps/admin-panel/src/app/[locale]/(institute)/courses/
├── page.tsx
├── components/
│   ├── course-filter/       # AdminFilterBar + SearchInput + Dropdown filters
│   │   └── index.tsx
│   ├── course-table/        # Desktop DataTable (hidden on < lg)
│   │   └── index.tsx
│   ├── course-list/         # Mobile MobileList (hidden on >= lg)
│   │   └── index.tsx
│   └── course-card/         # Card items (if applicable)
│       └── index.tsx
├── hooks/
│   └── use-course-filters.ts # Wraps useUrlFilters
└── modal/
    ├── add-course-modal/    # FormDialog / ResponsiveDialog
    │   └── index.tsx
    └── delete-course-modal/ # AlertDialog (confirmations only)
        └── index.tsx
```

---

## 2. Dynamic Title Routing (No In-Page Title)

- **NEVER** render an in-page `<h1>`, subtitle, or description inside list page containers.
- Register the route in `getPageTitle(pathname, t)` (`components/admin-base-layout/admin-header/index.tsx`) and define the title in `messages/[locale]/common.json` under `t("nav.<routeKey>")`.
- Titles render dynamically in the root `AdminHeader`.

---

## 3. URL Filter Synchronization (`useUrlFilters`)

Always synchronize filters, search keywords, and pagination with the URL:

```tsx
import { useUrlFilters } from "@/lib/hooks"

const { filters, setFilter, pageIndex, pageSize, setPageIndex, setPageSize } =
  useUrlFilters({
    defaultValues: {
      search: "",
      selectedStatus: "ALL",
      page: 1,
      pageSize: 10,
    },
    debounceKeys: ["search"], // 300ms debounce for text search
  })
```

### Core Rules:

1. **Search Input Debounce:** Local state updates instantly on typing; URL query updates with a 300ms debounce.
2. **Filter Change Resets Page to 1:** Updating discrete filters or search automatically resets `page` to `1`.
3. **Clean URLs:** Default values (`page=1`, empty search `""`, `"ALL"`) are omitted from the URL query string.
4. **Controlled Pagination:** Pass `pageIndex`, `pageSize`, `onPageIndexChange` to desktop `<DataTable />` and `onPageChange` to mobile `<MobileList />`.

---

## 4. Filter Bar & Desktop Add Button

```tsx
<AdminFilterBar
  search={
    <AdminSearchInput
      value={filters.search}
      onChange={(val) => setFilter("search", val)}
    />
  }
  filters={
    <ResponsiveCombobox
      drawerTitle={t("statusFilter")}
      value={filters.selectedStatus}
      onValueChange={(val) => setFilter("selectedStatus", val)}
      options={statusOptions}
    />
  }
  actions={
    <PermissionGuard mode="hide" permission={PERMISSIONS.COURSE_CREATE}>
      <Button
        type="button"
        onClick={handleOpenCreate}
        className="hidden lg:inline-flex" // STRICT: Hidden on mobile & tablet (< lg)
      >
        <Plus className="size-4" />
        <span>{t("create")}</span>
      </Button>
    </PermissionGuard>
  }
/>
```

---

## 5. Mobile Floating Action Button (FAB)

On screens < `lg` (mobile and tablet), primary creation is handled exclusively via the mobile FAB:

```tsx
<AdminPageShell
  breadcrumb={...}
  filters={<CourseFilter ... />}
  fab={
    isListEmpty ? null : ( // Hide FAB when empty state is displayed
      <PermissionGuard mode="hide" permission={PERMISSIONS.COURSE_CREATE}>
        <FABSingle
          onClick={handleOpenCreate}
          aria-label={t("create")}
        >
          <Plus className="size-6" />
        </FABSingle>
      </PermissionGuard>
    )
  }
>
  {/* Desktop Table & Mobile List */}
</AdminPageShell>
```

---

## 6. Empty Component Standard

When the collection has no data:

1. **Remove Create Button from Filter:** Pass `actions={isListEmpty ? undefined : <Button ... />}`.
2. **Place Create Button inside `<EmptyContent>`:**
   ```tsx
   <Empty>
     <EmptyHeader>
       <EmptyMedia>
         <Inbox className="size-10 text-muted-foreground" />
       </EmptyMedia>
       <EmptyTitle>{t("noCoursesFound")}</EmptyTitle>
       <EmptyDescription>{t("noCoursesDescription")}</EmptyDescription>
     </EmptyHeader>
     <EmptyContent>
       <PermissionGuard mode="hide" permission={PERMISSIONS.COURSE_CREATE}>
         <Button onClick={handleOpenCreate}>
           <Plus className="size-4" />
           <span>{t("createFirstCourse")}</span>
         </Button>
       </PermissionGuard>
     </EmptyContent>
   </Empty>
   ```
3. **No Card Wrapper:** Never wrap `<Empty />` inside `<Card>` or `bg-card`.
4. **Mobile Vertical Centering:** Containers (`<main>`, `<AdminPageShell>`, and list wrapper) must use `flex flex-1 flex-col` so `<Empty>` centers vertically.
5. **Hide Mobile FAB:** Ensure `fab={isListEmpty ? null : ...}`.

---

## 7. Admin Inner Page & Sub-Page Navigation

For sub-pages (e.g. `/calendar/custom`, `/classes/[id]/grades`):

- Pass `<AdminBreadcrumb />` to `AdminPageShell`'s `breadcrumb` prop:
  ```tsx
  <AdminPageShell
    breadcrumb={
      <AdminBreadcrumb
        backHref="/classes"
        backLabel={t("classes")}
        items={[
          { label: t("classes"), href: "/classes" },
          { label: t("classGrades") }
        ]}
      />
    }
  >
  ```
- Back navigation button appears next to the title in `AdminHeader` via `HeaderActionsContext`.
- Mobile bottom navigation automatically hides on sub-pages (2+ path segments).

---

## 8. FormDialog Scrollable Container Standard

Inside form dialogs and sheets (`<FormDialogContent>` or `<ResponsiveDialogContent>`):

```tsx
<form
  onSubmit={handleSubmit(onSubmit)}
  className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
>
  <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
    {/* Form inputs strictly h-14 / rounded-2xl */}
  </div>
  <FormDialogFooter>
    <Button type="button" variant="outline" onClick={onClose}>
      {t("cancel")}
    </Button>
    <Button type="submit">{t("save")}</Button>
  </FormDialogFooter>
</form>
```
