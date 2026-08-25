"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import type { Role } from "@workspace/types"
import { SidebarBrand } from "../sidebar-brand"
import { NavList, type NavItem, type NavSection } from "../nav-list"
import { SidebarFooter } from "../sidebar-footer"

export interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  isRtl: boolean
  role?: Role
  sections?: NavSection[]
  navItems?: NavItem[]
  pathname: string
  onLogout: () => void
  onSwitchLanguage?: () => void
  locale?: string
}

export function MobileDrawer({
  open,
  onClose,
  isRtl,
  role,
  sections,
  navItems,
  pathname,
  onLogout,
  onSwitchLanguage,
  locale,
}: MobileDrawerProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex h-[100dvh] max-h-[100dvh] w-72 flex-col justify-between bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isRtl
            ? cn(
                "right-0 border-l border-sidebar-border",
                open ? "translate-x-0" : "translate-x-full"
              )
            : cn(
                "left-0 border-r border-sidebar-border",
                open ? "translate-x-0" : "-translate-x-full"
              )
        )}
      >
        {/* Drawer Header (Fixed) */}
        <div className="flex shrink-0 items-center justify-between border-b border-sidebar-border/60 px-6 pt-6 pb-4">
          <SidebarBrand role={role} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <NavList
            sections={sections}
            items={navItems}
            pathname={pathname}
            onItemClick={onClose}
          />
        </div>

        {/* Drawer Footer (Fixed) */}
        <div className="shrink-0 px-6 pt-2 pb-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
          <SidebarFooter
            onLogout={onLogout}
            onSwitchLanguage={onSwitchLanguage}
            locale={locale}
          />
        </div>
      </aside>
    </>
  )
}
