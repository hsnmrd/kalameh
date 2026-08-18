"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoginInputSchema, type LoginInput } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@workspace/ui/components/field"
import { authResource } from "@/lib/api-client"
import { ArrowRight, BookOpen, Loader2, Sparkles } from "lucide-react"

export default function StudentLoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: {
      phone: "",
      password: "",
      subdomain: "",
    },
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true)
      setServerError(null)
      const response = await authResource.login.fn(data)

      localStorage.setItem("accessToken", response.accessToken)
      localStorage.setItem("user", JSON.stringify(response.user))

      router.push("/dashboard")
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "ورود ناموفق بود. لطفاً شماره موبایل و رمز عبور را بررسی کنید."
      setServerError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-6 sm:px-6">
      {/* Mobile-first viewport locked to max-w-[480px] */}
      <main className="mx-auto flex min-h-[90vh] w-full max-w-[480px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:min-h-[640px] sm:p-8">
        {/* Top Header */}
        <div>
          <header className="flex items-center justify-between pb-8">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-black text-white shadow-xs">
                <BookOpen className="size-5" />
              </div>
              <span className="text-lg font-semibold text-slate-900">کلمه</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Sparkles className="size-3 text-emerald-500" />
              <span>پنل زبان‌آموز</span>
            </div>
          </header>

          {/* Form Header */}
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              ورود زبان‌آموز
            </h1>
            <p className="text-[15px] text-slate-500">
              جهت مشاهده کلاس‌ها، ثبت‌نام و مرور لغات وارد شوید.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {serverError}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel htmlFor="student-phone">شماره موبایل</FieldLabel>
                <Input
                  id="student-phone"
                  type="tel"
                  dir="ltr"
                  variant="auth"
                  placeholder="09123456789"
                  {...register("phone")}
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor="student-password">رمز عبور</FieldLabel>
                <PasswordInput
                  id="student-password"
                  dir="ltr"
                  variant="auth"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.subdomain)}>
                <FieldLabel htmlFor="student-subdomain">
                  شناسه آموزشگاه (اختیاری)
                </FieldLabel>
                <Input
                  id="student-subdomain"
                  type="text"
                  dir="ltr"
                  variant="auth"
                  placeholder="tehran (یا خالی بگذارید)"
                  {...register("subdomain")}
                />
                <FieldError>{errors.subdomain?.message}</FieldError>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              size="auth"
              disabled={isLoading}
              className="mt-2 w-full cursor-pointer bg-black text-white transition-all hover:bg-slate-800"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <span>ورود به سامانه</span>
                  <ArrowRight className="size-5 rotate-180" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-xs text-slate-400">
          سامانه آموزشگاه کلمه &bull; نگارش PWA ۱.۰
        </footer>
      </main>
    </div>
  )
}
