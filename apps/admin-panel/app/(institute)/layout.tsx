import * as React from "react"
import {
  Building2,
  LogOut,
  BookOpen,
  Layers,
  Users,
  CreditCard,
} from "lucide-react"

export default function InstituteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-black text-white">
              <Building2 className="size-4" />
            </div>
            <span className="text-base font-semibold">پنل آموزشگاه</span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="/classes"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Layers className="size-4" />
              <span>کلاس‌ها</span>
            </a>
            <a
              href="/courses"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <BookOpen className="size-4" />
              <span>دوره‌ها</span>
            </a>
            <a
              href="/users"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Users className="size-4" />
              <span>کاربران</span>
            </a>
            <a
              href="/transactions"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <CreditCard className="size-4" />
              <span>امور مالی</span>
            </a>
          </nav>
        </div>

        <a
          href="/login"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-black"
        >
          <LogOut className="size-4" />
          <span>خروج</span>
        </a>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-6">{children}</main>
    </div>
  )
}
