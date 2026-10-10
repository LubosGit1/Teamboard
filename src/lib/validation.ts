import { z } from "zod";
import { ValidationError } from "./errors";

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITIES)[number];

const id = z.uuid("Invalid id.");
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(50, "Name is too long."),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Give the project a name.").max(60, "Name is too long."),
  description: z
    .string()
    .trim()
    .max(280, "Description is too long.")
    .optional()
    .transform((value) => value || null),
});

export const createTaskSchema = z.object({
  projectId: id,
  columnId: id,
  title: z.string().trim().min(1, "Write a title for the task.").max(120, "Title is too long."),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  assigneeId: id.nullish().transform((value) => value ?? null),
});

export const moveTaskSchema = z.object({
  taskId: id,
  columnId: id,
  index: z.number().int().min(0),
});

export const addMemberSchema = z.object({
  projectId: id,
  email: emailSchema,
});

export type RegisterInput = z.input<typeof registerSchema>;
export type ProjectInput = z.input<typeof projectSchema>;
export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type MoveTaskInput = z.input<typeof moveTaskSchema>;

/** Parse untrusted input or throw a ValidationError with the first readable message. */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? "Invalid input.");
  }
  return result.data;
}

export function isUuid(value: string): boolean {
  return id.safeParse(value).success;
}
