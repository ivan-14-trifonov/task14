"use client"

import { useActionState, useEffect, useRef } from "react"

type ActionState = {
  savedAt: number
} | null

export function AutoCloseForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<void>
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState<ActionState, FormData>(async (_previousState, formData) => {
    await action(formData)
    return { savedAt: Date.now() }
  }, null)

  useEffect(() => {
    if (!state) return
    ref.current?.closest("dialog")?.close()
  }, [state])

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
    </form>
  )
}
