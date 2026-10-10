import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, toHttpError, ValidationError } from "@/lib/errors";
import { createTaskSchema, parseInput, projectSchema, registerSchema } from "@/lib/validation";

const uuid = "4b0d2c1e-8f5a-4a37-9d2e-6c1b7a9e0f11";

describe("registerSchema", () => {
  it("normalises the email", () => {
    const data = parseInput(registerSchema, { name: " Mira ", email: " Mira@Example.COM ", password: "12345678" });
    expect(data).toEqual({ name: "Mira", email: "mira@example.com", password: "12345678" });
  });

  it("explains a short password", () => {
    expect(() => parseInput(registerSchema, { name: "Mira", email: "m@e.com", password: "123" })).toThrow(
      "Password must be at least 8 characters.",
    );
  });
});

describe("createTaskSchema", () => {
  const base = { projectId: uuid, columnId: uuid, title: "Ship it" };

  it("defaults priority and assignee", () => {
    expect(createTaskSchema.parse(base)).toMatchObject({ priority: "MEDIUM", assigneeId: null });
  });

  it("rejects a blank title after trimming", () => {
    const result = createTaskSchema.safeParse({ ...base, title: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Write a title for the task.");
  });

  it("rejects ids that aren't UUIDs before they reach the database", () => {
    expect(createTaskSchema.safeParse({ ...base, columnId: "1; DROP TABLE tasks" }).success).toBe(false);
  });
});

it("projectSchema turns an empty description into null", () => {
  expect(projectSchema.parse({ name: "Launch", description: "  " })).toEqual({ name: "Launch", description: null });
});

it("parseInput throws a ValidationError", () => {
  expect(() => parseInput(projectSchema, { name: "" })).toThrow(ValidationError);
});

describe("toHttpError", () => {
  it("maps domain errors to their status", () => {
    expect(toHttpError(new NotFoundError("Project not found."))).toEqual({ status: 404, message: "Project not found." });
    expect(toHttpError(new ConflictError("Taken")).status).toBe(409);
  });

  it("hides details of unexpected errors", () => {
    const result = toHttpError(new Error("connection string with password"));
    expect(result.status).toBe(500);
    expect(result.message).not.toContain("password");
  });
});
