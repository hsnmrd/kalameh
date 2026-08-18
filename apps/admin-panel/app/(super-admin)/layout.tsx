import * as React from "react"
import { ShieldAlert, LogOut } from "lucide-react"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-black text-white">
            <ShieldAlert className="size-4" />
          </div>
          <span className="text-base font-semibold">
            پنل ادمین کل پلتفرم (Super Admin)
          </span>
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
