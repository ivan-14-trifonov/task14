import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions, isAllowedEmail } from "@/lib/auth"
import { readData } from "@/lib/data/storage"

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email

  if (!email) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  if (!isAllowedEmail(email)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  try {
    const data = await readData()
    const body = JSON.stringify(data, null, 2)
    const stamp = new Date().toISOString().slice(0, 10)

    return new NextResponse(body, {
      headers: {
        "Content-Disposition": `attachment; filename="tasks-data-${stamp}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    })
  } catch {
    return new NextResponse("Не удалось подготовить файл данных.", { status: 500 })
  }
}
