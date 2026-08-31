import { LinkButton } from "@/components/ui"

export default function BranchNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Ветка не найдена</h1>
        <p className="mt-2 text-sm text-muted-foreground">Возможно, она была удалена или ссылка устарела.</p>
        <LinkButton href="/" className="mt-5">
          Вернуться к дереву
        </LinkButton>
      </div>
    </main>
  )
}
