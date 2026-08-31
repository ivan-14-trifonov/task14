"use client"

import { createContext, useContext, useState } from "react"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui"

const BranchSortModeContext = createContext<{
  enabled: boolean
  toggle: () => void
}>({
  enabled: false,
  toggle: () => undefined,
})

export function BranchSortModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  return (
    <BranchSortModeContext.Provider value={{ enabled, toggle: () => setEnabled((value) => !value) }}>
      {children}
    </BranchSortModeContext.Provider>
  )
}

export function BranchSortModeButton() {
  const { enabled, toggle } = useBranchSortModeContext()

  return (
    <Button type="button" variant={enabled ? "primary" : "secondary"} onClick={toggle}>
      <GripVertical className="size-4" />
      {enabled ? "Выключить перетаскивание" : "Включить перетаскивание"}
    </Button>
  )
}

export function useBranchSortMode() {
  return useContext(BranchSortModeContext).enabled
}

function useBranchSortModeContext() {
  return useContext(BranchSortModeContext)
}
