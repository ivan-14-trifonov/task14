import { del, get, list, put } from "@vercel/blob"
import { appDataSchema } from "@/lib/data/schema"
import type { AppData } from "@/types"

const DATA_KEY = "tasks-data.json"
const BACKUP_PREFIX = "backups/tasks-data-"
const MAX_BACKUPS = 20

export class DataValidationError extends Error {
  constructor(message = "Файл данных повреждён или не соответствует схеме. Автоматическая запись остановлена, чтобы не потерять данные.") {
    super(message)
    this.name = "DataValidationError"
  }
}

export class StorageError extends Error {
  constructor(message = "Не удалось загрузить данные задач. Попробуйте обновить страницу.") {
    super(message)
    this.name = "StorageError"
  }
}

function emptyData(now = new Date().toISOString()): AppData {
  return {
    version: 1,
    branches: {},
    tasks: {},
    meta: {
      createdAt: now,
      updatedAt: now,
    },
  }
}

async function readBlobText(pathname: string) {
  const blob = await get(pathname, { access: "private", useCache: false })
  if (!blob?.stream) return null
  return new Response(blob.stream).text()
}

export async function readData(): Promise<AppData> {
  try {
    const body = await readBlobText(DATA_KEY)
    if (!body) {
      const initial = emptyData()
      await writeRawData(initial, false)
      return initial
    }

    const json = JSON.parse(body)
    const parsed = appDataSchema.safeParse(json)
    if (!parsed.success) throw new DataValidationError()
    return parsed.data
  } catch (error) {
    if (error instanceof DataValidationError || error instanceof StorageError) throw error
    throw new StorageError()
  }
}

async function writeRawData(data: AppData, withBackup: boolean) {
  const parsed = appDataSchema.safeParse(data)
  if (!parsed.success) throw new DataValidationError()

  if (withBackup) {
    await backupCurrentData()
  }

  await put(DATA_KEY, JSON.stringify(parsed.data, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  })
}

async function backupCurrentData() {
  const body = await readBlobText(DATA_KEY)
  if (!body) return
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19)
  await put(`${BACKUP_PREFIX}${stamp}.json`, body, {
    access: "private",
    contentType: "application/json",
    allowOverwrite: false,
  })
  await pruneBackups()
}

async function pruneBackups() {
  const result = await list({ prefix: BACKUP_PREFIX, limit: 100 })
  const backups = result.blobs
    .filter((blob) => blob.pathname.startsWith(BACKUP_PREFIX))
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())

  await Promise.all(backups.slice(MAX_BACKUPS).map((blob) => del(blob.url)))
}

export async function writeData(data: AppData): Promise<AppData> {
  const nextData = {
    ...data,
    meta: {
      ...data.meta,
      updatedAt: new Date().toISOString(),
    },
  }
  await writeRawData(nextData, true)
  return nextData
}
