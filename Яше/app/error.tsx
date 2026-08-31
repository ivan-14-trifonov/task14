"use client"

import { Button } from "@/components/ui"

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const isValidation = error.name === "DataValidationError"

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{isValidation ? "Файл данных повреждён" : "Ошибка"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {isValidation
            ? "Файл данных повреждён или не соответствует схеме. Автоматическая запись остановлена, чтобы не потерять данные."
            : "Не удалось загрузить данные задач. Попробуйте обновить страницу."}
        </p>
        <Button className="mt-5" onClick={() => reset()}>
          Повторить
        </Button>
      </div>
    </main>
  )
}
