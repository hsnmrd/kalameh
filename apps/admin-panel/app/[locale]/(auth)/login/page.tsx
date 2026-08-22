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
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"

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

  const loginMutation = useMutation({
    ...authResource.login.toMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(authResource.me.toQuery().queryKey, data.user)
      toast.success(tCommon("success"))
      router.push("/")
    },
  })

  const onSubmit = (formData: LoginInput) => {
    loginMutation.mutate({
      phone: formData.phone,
      password: formData.password,
      subdomain: formData.subdomain || undefined,
    })
  }

  const handleSwitchLanguage = () => {
    const nextLocale = locale === "en" ? "fa" : "en"
    router.replace(pathname, { locale: nextLocale })
  }

  const SubmitArrow = isRtl ? ArrowLeft : ArrowRight

  return (
    <main className="grid min-h-screen w-full grid-cols-1 bg-background font-sans text-foreground antialiased lg:grid-cols-2">
      {/* Branding Panel (Desktop Only) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-e border-sidebar-border bg-sidebar p-12 text-sidebar-foreground lg:flex xl:p-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <GraduationCap className="size-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {tCommon("appName")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchLanguage}
              className="h-8 cursor-pointer gap-1.5 border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
            >
              <Languages className="size-3.5" />
              <span>{locale === "en" ? "فارسی" : "English"}</span>
            </Button>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="text-3xl leading-tight font-semibold text-foreground xl:text-4xl">
            {t("brandingTitle")}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("brandingDesc")}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-sidebar-border/60 pt-6 text-sm text-muted-foreground">
          <ShieldCheck className="size-5 text-emerald-500" />
          <span>{t("securityNotice")}</span>
        </div>
      </aside>

      {/* Right Form Panel */}
      <section className="flex min-h-screen flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-24">
        {/* Mobile Header */}
        <header className="flex items-center justify-between pt-4 pb-8 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              {tCommon("appName")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchLanguage}
              className="h-8 cursor-pointer gap-1 border-border bg-background px-2.5 text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
            >
              <Languages className="size-3.5" />
              <span>{locale === "en" ? "FA" : "EN"}</span>
            </Button>
          </div>
        </header>

        {/* Form Container */}
        <div className="mx-auto my-auto w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {t("loginTitle")}
            </h2>
            <p className="text-[15px] text-muted-foreground">
              {t("loginDesc")}
            </p>
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
              className="w-full cursor-pointer bg-primary text-primary-foreground transition-all hover:bg-primary/90"
            >
              {loginMutation.isPending ? (
                <Spinner className="size-5 text-primary-foreground" />
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
        <footer className="pt-8 text-center text-[13px] text-muted-foreground">
          {tCommon("footer")}
        </footer>
      </section>
    </main>
  )
}
