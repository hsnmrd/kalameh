"use client"

import * as React from "react"
import {
  BookOpen,
  Layers,
  Award,
  Sparkles,
  LogOut,
  ArrowLeft,
} from "lucide-react"

export default function StudentDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <main className="mx-auto max-w-[480px] space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
              ز
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                علی رضایی
              </h1>
              <span className="text-xs text-slate-400">
                سطح مجاز فعلی: Top Notch 1
              </span>
            </div>
          </div>
          <a
            href="/login"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:text-black"
          >
            <LogOut className="size-5" />
          </a>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Layers className="size-4" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              کلاس‌های مجاز
            </h2>
            <p className="text-xs text-slate-500">انتخاب کلاس و ثبت فیش</p>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="size-4" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              جعبه لایتنر
            </h2>
            <p className="text-xs text-slate-500">مرور کلمات روزانه</p>
          </div>
        </div>

        {/* Active Enrollment Status Card */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              در انتظار تایید فیش
            </span>
            <span className="text-xs text-slate-400">ترم پاییز ۱۴۰۵</span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Top Notch 1A
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              فیش شهریه شما ارسال شده و در صف بررسی مدیر آموزشگاه است.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
