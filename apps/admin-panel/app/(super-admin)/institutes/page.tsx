"use client"

import * as React from "react"
import { Building2, Plus, CheckCircle2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export default function InstitutesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            مدیریت آموزشگاه‌ها
          </h1>
          <p className="text-sm text-slate-500">
            فهرست آموزشگاه‌های فعال روی سامانه ابری کلمه و وضعیت لایسنس‌ها
          </p>
        </div>
        <Button size="auth" className="h-11 gap-2 rounded-xl px-5">
          <Plus className="size-4" />
          <span>ثبت آموزشگاه جدید</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Building2 className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  آموزشگاه مرکزی تهران
                </h2>
                <span className="font-mono text-xs text-slate-400">
                  tehran.kalameh.ir
                </span>
              </div>
            </div>
            <CheckCircle2 className="size-5 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>وضعیت: فعال</span>
            <span>۲۴ کلاس جاری</span>
          </div>
        </div>
      </div>
    </div>
  )
}
