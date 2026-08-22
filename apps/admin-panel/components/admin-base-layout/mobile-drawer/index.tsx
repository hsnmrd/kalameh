"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import type { Role } from "@workspace/types"
import { SidebarBrand } from "../sidebar-brand"
import { NavList, type NavItem } from "../nav-list"
import { SidebarFooter } from "../sidebar-footer"

export interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  isRtl: boolean
  role?: Role
  navItems: NavItem[]
  pathname: string
  onLogout: () => void
}

export function MobileDrawer({
  open,
  onClose,
  isRtl,
  role,
  navItems,
  pathname,
  onLogout,
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
          "fixed inset-y-0 z-50 flex w-72 flex-col justify-between bg-sidebar p-6 text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
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
        <div>
          <div className="flex items-center justify-between border-b border-sidebar-border/60 pb-4">
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
          <div className="mt-6">
            <NavList
              items={navItems}
              pathname={pathname}
              onItemClick={onClose}
            />
          </div>
        </div>
        <SidebarFooter onLogout={onLogout} />
      </aside>
    </>
  )
}
