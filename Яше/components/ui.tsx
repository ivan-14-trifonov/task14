import Link from "next/link"
import { cn } from "@/lib/utils"

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-blue-700",
        variant === "secondary" && "border bg-white text-foreground hover:bg-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:bg-red-700",
        className,
      )}
      {...props}
    />
  )
}

export function LinkButton({
  className,
  variant = "secondary",
  ...props
}: React.ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <Link
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-blue-700",
        variant === "secondary" && "border bg-white text-foreground hover:bg-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} />
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("grid gap-1.5 text-sm font-medium", className)} {...props} />
}
