"use client"

import * as React from "react"

export interface BackNavigationConfig {
  backHref: string
  backLabel?: string
}

export interface HeaderActionsContextValue {
  headerActions: React.ReactNode
  setHeaderActions: (actions: React.ReactNode) => void
  backNavigation: BackNavigationConfig | null
  setBackNavigation: (nav: BackNavigationConfig | null) => void
}

const HeaderActionsContext = React.createContext<HeaderActionsContextValue>({
  headerActions: null,
  setHeaderActions: () => {},
  backNavigation: null,
  setBackNavigation: () => {},
})

export function HeaderActionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [headerActions, setHeaderActions] =
    React.useState<React.ReactNode>(null)
  const [backNavigation, setBackNavigation] =
    React.useState<BackNavigationConfig | null>(null)

  return (
    <HeaderActionsContext.Provider
      value={{
        headerActions,
        setHeaderActions,
        backNavigation,
        setBackNavigation,
      }}
    >
      {children}
    </HeaderActionsContext.Provider>
  )
}

export function useHeaderActions(): HeaderActionsContextValue {
  return React.useContext(HeaderActionsContext)
}
