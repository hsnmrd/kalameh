"use client"

import * as React from "react"

export interface HeaderActionsContextValue {
  headerActions: React.ReactNode
  setHeaderActions: (actions: React.ReactNode) => void
}

const HeaderActionsContext = React.createContext<HeaderActionsContextValue>({
  headerActions: null,
  setHeaderActions: () => {},
})

export function HeaderActionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [headerActions, setHeaderActions] =
    React.useState<React.ReactNode>(null)

  return (
    <HeaderActionsContext.Provider value={{ headerActions, setHeaderActions }}>
      {children}
    </HeaderActionsContext.Provider>
  )
}

export function useHeaderActions(): HeaderActionsContextValue {
  return React.useContext(HeaderActionsContext)
}
