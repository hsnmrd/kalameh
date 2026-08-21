"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@workspace/ui/components/field"
import { authResource } from "@/lib/api"
import { useRouter, usePathname, Link, useIsRtl } from "@/i18n/routing"
import { useLoginSchema, type LoginInput } from "./hooks/use-auth-schemas"
import { ArrowRight, ArrowLeft, BookOpen, Languages } from "lucide-react"

export default function StudentLoginPage() {
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const isRtl = useIsRtl()
  const loginSchema = useLoginSchema()

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

  const loginMutation = useMutation({
    ...authResource.login.toMutation(),
    onSuccess: () => {
      router.push("/dashboard")
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Centered Mobile Container */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-slate-50 shadow-xs">
        {/* Top Toolbar */}
        <header className="relative sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
          {/* Left Action (Language Switcher) */}
          <div className="z-10 flex min-w-9 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchLanguage}
              className="h-8 cursor-pointer gap-1 border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95"
              title={tCommon("language")}
              aria-label={tCommon("language")}
            >
              <Languages className="size-3.5" />
              <span>{locale === "en" ? "FA" : "EN"}</span>
            </Button>
          </div>

          {/* Centered Logo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Link
              href="/login"
              className="pointer-events-auto flex items-center gap-2 transition-opacity hover:opacity-80 active:scale-95"
              aria-label={tCommon("appName")}
            >
              <div className="flex size-8 items-center justify-center rounded-xl bg-black text-white shadow-xs">
                <BookOpen className="size-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                {tCommon("appName")}
              </span>
            </Link>
          </div>

          {/* Right Action Spacer */}
          <div className="z-10 flex min-w-9 items-center justify-end" />
        </header>

        {/* Main Area */}
        <main className="flex-1 space-y-6 px-4 py-6">
          {/* Login Form Card */}
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {t("title")}
              </h1>
              <p className="text-[15px] text-slate-500">{t("description")}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FieldGroup>
                <Field data-invalid={Boolean(errors.phone)}>
                  <FieldLabel htmlFor="student-phone">
                    {t("phoneLabel")}
                  </FieldLabel>
                  <Input
                    id="student-phone"
                    type="tel"
                    dir="ltr"
                    variant="auth"
                    placeholder={t("phonePlaceholder")}
                    autoComplete="username"
                    {...register("phone")}
                  />
                  <FieldError>{errors.phone?.message}</FieldError>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field data-invalid={Boolean(errors.password)}>
                  <FieldLabel htmlFor="student-password">
                    {t("passwordLabel")}
                  </FieldLabel>
                  <PasswordInput
                    id="student-password"
                    dir="ltr"
                    variant="auth"
                    placeholder={t("passwordPlaceholder")}
                    autoComplete="current-password"
                    {...register("password")}
                  />
                  <FieldError>{errors.password?.message}</FieldError>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field data-invalid={Boolean(errors.subdomain)}>
                  <FieldLabel htmlFor="student-subdomain">
                    {t("subdomainLabel")}
                  </FieldLabel>
                  <Input
                    id="student-subdomain"
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
                className="mt-2 w-full cursor-pointer bg-black text-white transition-all hover:bg-slate-800"
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
          <footer className="pt-2 text-center text-xs text-slate-400">
            {tCommon("footer")}
          </footer>
        </main>
      </div>
    </div>
  )
}
