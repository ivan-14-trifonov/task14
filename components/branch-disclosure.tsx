"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function BranchDisclosure({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={className}>
      <button
        type="button"
        title={open ? "Свернуть подветки" : "Развернуть подветки"}
        aria-label={open ? "Свернуть подветки" : "Развернуть подветки"}
        aria-expanded={open}
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} />
      </button>
      {open ? children : null}
    </div>
  )
}
