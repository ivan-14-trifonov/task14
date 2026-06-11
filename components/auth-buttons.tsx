"use client"

import { signIn, signOut } from "next-auth/react"
import { LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui"

export function GoogleSignInButton() {
  return (
    <Button type="button" onClick={() => signIn("google", { callbackUrl: "/" })}>
      <LogIn className="size-4" />
      Войти через Google
    </Button>
  )
}

export function SignOutButton() {
  return (
    <Button type="button" variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
      <LogOut className="size-4" />
      Выйти
    </Button>
  )
}
