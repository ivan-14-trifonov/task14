import { z } from "zod"

export const branchStatusSchema = z.union([z.literal("in_progress"), z.literal("timing"), z.null()])
export const taskStatusSchema = z.enum(["in_progress", "planned", "done"])
export const taskDailyStatusSchema = z.enum(["worked", "closed"])
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const branchSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  tag: z.string().max(24).optional().default(""),
  parentId: z.string().min(1).nullable(),
  status: branchStatusSchema,
  timing: z
    .object({
      startDate: dateKeySchema,
      dailyMinutes: z.number().int().positive(),
      entries: z.record(z.number().min(0)).default({}),
    })
    .nullable()
    .optional()
    .default(null),
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
  dailyStatus: z
    .object({
      date: dateKeySchema,
      status: taskDailyStatusSchema,
    })
    .nullable()
    .optional()
    .default(null),
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
  tag: z.string().trim().max(24, "Тег должен быть короче 24 символов").default(""),
  parentId: z.string().nullable(),
  status: branchStatusSchema,
  timingStartDate: z.string().trim().default(""),
  timingDailyMinutes: z.coerce.number().int().min(0).default(0),
}).superRefine((value, ctx) => {
  if (value.status !== "timing") return
  if (!dateKeySchema.safeParse(value.timingStartDate).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["timingStartDate"],
      message: "Укажите дату старта тайминга",
    })
  }
  if (value.timingDailyMinutes <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["timingDailyMinutes"],
      message: "Укажите норму минут в день",
    })
  }
}).transform((value) => ({
  title: value.title,
  tag: value.tag,
  parentId: value.parentId,
  status: value.status,
  timing:
    value.status === "timing"
      ? {
          startDate: value.timingStartDate,
          dailyMinutes: value.timingDailyMinutes,
        }
      : null,
}))
