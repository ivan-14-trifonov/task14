import { z } from "zod"

export const branchStatusSchema = z.union([z.literal("in_progress"), z.null()])
export const taskStatusSchema = z.enum(["in_progress", "planned", "done"])

export const branchSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  status: branchStatusSchema,
  sort: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  branchId: z.string().min(1),
  status: taskStatusSchema,
  sort: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
})

export const appDataSchema = z.object({
  version: z.literal(1),
  branches: z.record(branchSchema),
  tasks: z.record(taskSchema),
  meta: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
})

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Укажите название"),
  description: z.string().trim().default(""),
  branchId: z.string().min(1, "Выберите ветку"),
  status: taskStatusSchema,
})

export const branchInputSchema = z.object({
  title: z.string().trim().min(1, "Укажите название"),
  parentId: z.string().nullable(),
  status: branchStatusSchema,
})
