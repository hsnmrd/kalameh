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
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

export default function LoginPage() {
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

      if (response.user.role === "SUPER_ADMIN") {
        router.push("/institutes")
      } else {
        router.push("/classes")
      }
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
    <main className="grid min-h-screen w-full grid-cols-1 bg-white font-sans text-slate-900 antialiased lg:grid-cols-2">
      {/* Left Branding Panel (Desktop Only per DESIGN.md) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-md">
            <GraduationCap className="size-6" />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            کلمه | Kalameh
          </span>
        </div>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-emerald-400">
            <Sparkles className="size-3.5" />
            <span>پلتفرم یکپارچه مدیریت آموزشگاه زبان</span>
          </div>
          <h1 className="text-3xl leading-tight font-semibold xl:text-4xl">
            مدیریت هوشمند دوره‌ها، امور مالی و زبان‌آموزان
          </h1>
          <p className="text-base leading-relaxed text-slate-400">
            سامانه جامع SaaS با قابلیت تفکیک چندمستاجری، بررسی فیش‌های شهریه و
            دستیار گیمیفیکیشن مرور لغات برای پیشرفت مستمر.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-800 pt-6 text-sm text-slate-400">
          <ShieldCheck className="size-5 text-emerald-400" />
          <span>امنیت داده‌ها و احراز هویت چندسطحی استاندارد</span>
        </div>
      </aside>

      {/* Right Form Panel */}
      <section className="flex min-h-screen flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-24">
        {/* Mobile Header */}
        <header className="flex items-center justify-between pt-4 pb-8 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-black text-white">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-lg font-semibold">کلمه</span>
          </div>
        </header>

        {/* Form Container */}
        <div className="mx-auto my-auto w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              ورود به پنل مدیریت
            </h2>
            <p className="text-[15px] text-slate-500">
              برای دسترسی به اطلاعات آموزشگاه، شماره موبایل و رمز عبور خود را
              وارد کنید.
            </p>
          </div>

          {serverError && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel htmlFor="phone">شماره موبایل</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  variant="auth"
                  placeholder="09123456789"
                  {...register("phone")}
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.password)}>
                <div className="ml-0.5 flex items-center justify-between">
                  <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                </div>
                <PasswordInput
                  id="password"
                  dir="ltr"
                  variant="auth"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.subdomain)}>
                <FieldLabel htmlFor="subdomain">
                  شناسه آموزشگاه / زیردامنه (اختیاری)
                </FieldLabel>
                <Input
                  id="subdomain"
                  type="text"
                  dir="ltr"
                  variant="auth"
                  placeholder="tehran (یا شناسه اختصاصی)"
                  {...register("subdomain")}
                />
                <FieldError>{errors.subdomain?.message}</FieldError>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              size="auth"
              disabled={isLoading}
              className="w-full cursor-pointer bg-black text-white transition-all hover:bg-slate-800"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <span>ورود به حساب</span>
                  <ArrowRight className="size-5 rotate-180" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-[13px] text-slate-400">
          سامانه مدیریت آموزشگاه کلمه &bull; نگارش ۱.۰
        </footer>
      </section>
    </main>
  )
}
