"use client"

import * as React from "react"
import { Layers, Plus, Calendar, Users, GraduationCap } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            مدیریت کلاس‌ها
          </h1>
          <p className="text-sm text-slate-500">
            مشاهده، تعریف و مدیریت کلاس‌های فعال ترم جاری آموزشگاه
          </p>
        </div>
        <Button size="auth" className="h-11 gap-2 rounded-xl px-5">
          <Plus className="size-4" />
          <span>افزودن کلاس جدید</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              در حال ثبت‌نام
            </span>
            <span className="text-xs text-slate-400">ترم پاییز ۱۴۰۵</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Top Notch 1A
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <GraduationCap className="size-4" />
              <span>استاد محمدی</span>
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              <span>زوج ۱۷:۰۰ الی ۱۸:۳۰</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="size-3.5" />
              <span>۱۲ / ۱۵ نفر</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
