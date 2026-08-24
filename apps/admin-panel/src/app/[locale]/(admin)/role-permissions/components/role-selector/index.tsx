"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Headphones,
  Shield,
  User,
  UserCog,
} from "lucide-react"
import {
  CONFIGURABLE_ROLES,
  ROLES,
  type Role,
  type RolePermissionResponse,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { cn } from "@workspace/ui/lib/utils"

export interface RoleSelectorProps {
  selectedRole: Role
  onSelectRole: (role: Role) => void
  rolePermissionsList?: RolePermissionResponse[]
}

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  [ROLES.SUPER_ADMIN]: Shield,
  [ROLES.ADMIN]: Shield,
  [ROLES.ASSISTANT]: UserCog,
  [ROLES.SUPERVISOR]: BookOpen,
  [ROLES.SUPER_CLERK]: Briefcase,
  [ROLES.CLERK]: Headphones,
  [ROLES.TEACHER]: GraduationCap,
  [ROLES.SUPER_STUDENT]: Award,
  [ROLES.STUDENT]: User,
}

export function RoleSelector({
  selectedRole,
  onSelectRole,
  rolePermissionsList = [],
}: RoleSelectorProps) {
  const t = useTranslations("rolePermissions")

  const overriddenMap = React.useMemo(() => {
    const map = new Map<string, boolean>()
    for (const item of rolePermissionsList) {
      map.set(item.role, item.isOverridden)
    }
    return map
  }, [rolePermissionsList])

  return (
    <div className="relative w-full">
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ms-2.5">
          {CONFIGURABLE_ROLES.map((role) => {
            const isSelected = selectedRole === role
            const isOverridden = overriddenMap.get(role) ?? false
            const Icon = ROLE_ICONS[role] || User

            return (
              <CarouselItem
                key={role}
                className="basis-1/2 ps-2.5 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 xl:basis-[12.5%]"
              >
                <Button
                  variant="outline"
                  onClick={() => onSelectRole(role)}
                  className={cn(
                    "group relative flex h-auto w-full cursor-pointer flex-col items-start gap-2.5 rounded-2xl border p-3 text-start transition-all select-none",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary hover:bg-primary/10"
                      : "border-border/70 bg-card hover:border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    {isOverridden ? (
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          isSelected
                            ? "bg-primary/20 font-semibold text-primary"
                            : "bg-amber-500/15 text-amber-600"
                        )}
                        title={t("isCustomized")}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            isSelected ? "bg-primary" : "bg-amber-500"
                          )}
                        />
                        <span>{t("customizedBadge")}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60">
                        {t("defaultBadge")}
                      </span>
                    )}
                  </div>

                  <div className="w-full">
                    <div
                      className={cn(
                        "truncate text-xs font-semibold",
                        isSelected
                          ? "font-bold text-foreground"
                          : "text-foreground/80"
                      )}
                    >
                      {t(`roles.${role}` as any)}
                    </div>
                  </div>
                </Button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}
