import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { GoogleSignInButton } from "@/components/auth-buttons"
import { Card } from "@/components/ui"
import { authOptions, isAllowedEmail } from "@/lib/auth"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  const session = await getServerSession(authOptions)
  if (session?.user?.email && isAllowedEmail(session.user.email)) redirect("/")
  const denied = params.error === "AccessDenied" || (session?.user?.email && !isAllowedEmail(session.user.email))

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold">Дерево задач</h1>
        <p className="mt-2 text-sm text-muted-foreground">Вход доступен только разрешённым Google-аккаунтам.</p>
        {denied ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Доступ запрещён. Этот email не входит в список разрешённых администраторов.
          </div>
        ) : null}
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </Card>
    </main>
  )
}
