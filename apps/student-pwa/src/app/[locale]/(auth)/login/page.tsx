"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import { Spinner } from "@workspace/ui/components/spinner"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@workspace/ui/components/field"
import { authResource } from "@/lib/api"
import { useRouter, usePathname, Link, useIsRtl } from "@/i18n/routing"
import {
  useLoginSchema,
  type LoginInput as LoginSchemaInput,
} from "./hooks/use-auth-schemas"
import { ArrowRight, ArrowLeft, BookOpen, Languages } from "lucide-react"

export default function StudentLoginPage() {
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const isRtl = useIsRtl()
  const queryClient = useQueryClient()
  const loginSchema = useLoginSchema()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaInput>({
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
      toast.success(t("loginSuccess"))
      router.push("/dashboard")
    },
  })

  const onSubmit = (formData: LoginSchemaInput) => {
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
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Centered Mobile Container */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background shadow-xs">
        {/* Top Toolbar */}
        <header className="relative sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/80 bg-card/95 px-4 backdrop-blur-md">
          {/* Left Action (Language Switcher) */}
          <div className="z-10 flex min-w-9 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchLanguage}
              className="h-8 cursor-pointer gap-1 border-border bg-background px-2 text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
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
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <BookOpen className="size-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                {tCommon("appName")}
              </span>
            </Link>
          </div>

          {/* Right Action (Theme Toggle) */}
          <div className="z-10 flex min-w-9 items-center justify-end">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 space-y-6 px-4 py-6">
          {/* Login Form Card */}
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="text-[15px] text-muted-foreground">
                {t("description")}
              </p>
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
                className="mt-2 w-full cursor-pointer bg-primary text-primary-foreground transition-all hover:bg-primary/90"
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
          <footer className="pt-2 text-center text-xs text-muted-foreground">
            {tCommon("footer")}
          </footer>
        </main>
      </div>
    </div>
  )
}
