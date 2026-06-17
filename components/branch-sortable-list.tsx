"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import React from "react"
import { GripVertical } from "lucide-react"
import { reorderBranchesAction } from "@/lib/data/actions"
import { cn } from "@/lib/utils"

function moveItem(items: string[], fromId: string, toId: string) {
  const fromIndex = items.indexOf(fromId)
  const toIndex = items.indexOf(toId)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export function BranchSortableList({
  ids,
  parentId,
  className,
  children,
}: {
  ids: string[]
  parentId: string | null
  className?: string
  children: React.ReactNode
}) {
  const childList = useMemo(() => React.Children.toArray(children), [children])
  const childById = useMemo(() => new Map(ids.map((id, index) => [id, childList[index]])), [childList, ids])
  const [order, setOrder] = useState(ids)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setOrder(ids)
  }, [ids])

  function save(nextOrder: string[]) {
    const formData = new FormData()
    formData.set("parentId", parentId ?? "")
    formData.set("orderedIds", JSON.stringify(nextOrder))
    startTransition(() => {
      void reorderBranchesAction(formData)
    })
  }

  return (
    <div className={cn(className, isPending && "opacity-70")}>
      {order.map((id) => {
        const child = childById.get(id)
        if (!child) return null

        return (
          <div
            key={id}
            className={cn("flex min-w-0 gap-2 rounded-lg", draggedId === id && "opacity-50")}
            onDragOver={(event) => {
              event.preventDefault()
              if (!draggedId) return
              setOrder((current) => moveItem(current, draggedId, id))
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDraggedId(null)
              save(order)
            }}
          >
            <button
              type="button"
              draggable
              title="Перетащить ветку"
              aria-label="Перетащить ветку"
              className="mt-3 flex h-8 w-6 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
              onDragStart={(event) => {
                setDraggedId(id)
                event.dataTransfer.effectAllowed = "move"
                event.dataTransfer.setData("text/plain", id)
              }}
              onDragEnd={() => {
                setDraggedId(null)
              }}
            >
              <GripVertical className="size-4" />
            </button>
            <div className="min-w-0 flex-1">{child}</div>
          </div>
        )
      })}
    </div>
  )
}
