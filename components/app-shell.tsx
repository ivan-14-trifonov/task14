import { Download, FolderTree, ListTodo, Network } from "lucide-react"
import { SignOutButton } from "@/components/auth-buttons"
import { LinkButton } from "@/components/ui"
import type { Session } from "next-auth"

export function AppShell({ children, session }: { children: React.ReactNode; session: Session }) {
  return (
    <main className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-lg font-semibold">Дерево задач</p>
            <p className="text-sm text-muted-foreground">{session.user?.email}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <LinkButton href="/" variant="ghost">
              <FolderTree className="size-4" />
              Дерево
            </LinkButton>
            <LinkButton href="/?view=mind-map" variant="ghost">
              <Network className="size-4" />
              Ментальная карта
            </LinkButton>
            <LinkButton href="/tasks" variant="ghost">
              <ListTodo className="size-4" />
              Все задачи
            </LinkButton>
            <LinkButton href="/api/data/download" variant="ghost">
              <Download className="size-4" />
              Скачать данные
            </LinkButton>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </main>
  )
}
