"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@workspace/ui/components/field"
import { ROLES } from "@workspace/types"
import { authResource } from "@/lib/api"
import { useRouter, usePathname, useIsRtl } from "@/i18n/routing"
import { useLoginSchema, type LoginInput } from "./hooks/use-auth-schemas"
import {
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  Languages,
} from "lucide-react"

export default function AdminLoginPage() {
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const isRtl = useIsRtl()
  const loginSchema = useLoginSchema()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
      subdomain: "",
    },
  })

  const logoutMutation = useMutation(authResource.logout.toMutation())

  const loginMutation = useMutation({
    ...authResource.login.toMutation(),
    onSuccess: (data) => {
      // Reject student logins from accessing admin panel
      if (data.user.role === ROLES.STUDENT) {
        logoutMutation.mutate()
        queryClient.clear()
        toast.error(t("studentNotAllowed"))
        return
      }
      router.push("/")
    },
  })

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data)
  }

  const handleSwitchLanguage = () => {
    const nextLocale = locale === "en" ? "fa" : "en"
    router.replace(pathname, { locale: nextLocale })
  }

  const SubmitArrow = isRtl ? ArrowLeft : ArrowRight

  return (
    <main className="grid min-h-screen w-full grid-cols-1 bg-white font-sans text-slate-900 antialiased lg:grid-cols-2">
      {/* Branding Panel (Desktop Only) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex xl:p-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-md">
              <GraduationCap className="size-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              {tCommon("appName")}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSwitchLanguage}
            className="h-8 cursor-pointer gap-1.5 border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-95"
          >
            <Languages className="size-3.5" />
            <span>{locale === "en" ? "فارسی" : "English"}</span>
          </Button>
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="text-3xl leading-tight font-semibold xl:text-4xl">
            {t("brandingTitle")}
          </h1>
          <p className="text-base leading-relaxed text-slate-400">
            {t("brandingDesc")}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-800 pt-6 text-sm text-slate-400">
          <ShieldCheck className="size-5 text-emerald-400" />
          <span>{t("securityNotice")}</span>
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
            <span className="text-lg font-semibold">{tCommon("appName")}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSwitchLanguage}
            className="h-8 cursor-pointer gap-1 border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95"
          >
            <Languages className="size-3.5" />
            <span>{locale === "en" ? "FA" : "EN"}</span>
          </Button>
        </header>

        {/* Form Container */}
        <div className="mx-auto my-auto w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {t("loginTitle")}
            </h2>
            <p className="text-[15px] text-slate-500">{t("loginDesc")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel htmlFor="phone">{t("phoneLabel")}</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  variant="auth"
                  placeholder={t("phonePlaceholder")}
                  autoComplete="username"
                  {...register("phone")}
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
                <PasswordInput
                  id="password"
                  dir="ltr"
                  variant="auth"
                  autoComplete="current-password"
                  placeholder={t("passwordPlaceholder")}
                  {...register("password")}
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.subdomain)}>
                <FieldLabel htmlFor="subdomain">
                  {t("subdomainLabel")}
                </FieldLabel>
                <Input
                  id="subdomain"
                  type="text"
                  dir="ltr"
                  variant="auth"
                  placeholder={t("subdomainPlaceholder")}
                  {...register("subdomain")}
                />
                <FieldError>{errors.subdomain?.message}</FieldError>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              size="auth"
              disabled={loginMutation.isPending}
              className="w-full cursor-pointer bg-black text-white transition-all hover:bg-slate-800"
            >
              {loginMutation.isPending ? (
                <Spinner className="size-5" />
              ) : (
                <>
                  <span>{t("signInButton")}</span>
                  <SubmitArrow className="size-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-[13px] text-slate-400">
          {tCommon("footer")}
        </footer>
      </section>
    </main>
  )
}
