"use client"

import { useRef } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui"

export function DialogButton({
  label,
  title,
  children,
  variant = "secondary",
}: {
  label: React.ReactNode
  title: string
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
}) {
  const ref = useRef<HTMLDialogElement>(null)

  return (
    <>
      <Button type="button" variant={variant} onClick={() => ref.current?.showModal()}>
        {label}
      </Button>
      <dialog ref={ref} className="w-[min(92vw,560px)] rounded-lg border bg-white p-0 shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button type="button" variant="ghost" className="size-8 p-0" onClick={() => ref.current?.close()} title="Закрыть">
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </dialog>
    </>
  )
}
