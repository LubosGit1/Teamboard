import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ConflictError } from "@/lib/errors";
import { createUser, verifyCredentials } from "@/server/services/users";

const input = { name: "Mira Novak", email: "mira@example.com", password: "correct horse battery" };

describe("users service", () => {
  it("stores a bcrypt hash, never the password", async () => {
    const user = await createUser(input);
    const row = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    expect(row?.passwordHash).not.toBe(input.password);
    expect(row?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("treats emails case-insensitively when checking for duplicates", async () => {
    await createUser(input);
    await expect(createUser({ ...input, email: "MIRA@example.com" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("verifies credentials", async () => {
    await createUser(input);
    await expect(verifyCredentials({ email: "Mira@Example.com", password: input.password })).resolves.toMatchObject({
      email: "mira@example.com",
    });
    await expect(verifyCredentials({ email: input.email, password: "wrong password" })).resolves.toBeNull();
    await expect(verifyCredentials({ email: "nobody@example.com", password: "whatever1" })).resolves.toBeNull();
  });
});
