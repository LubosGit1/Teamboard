import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ConflictError } from "@/lib/errors";
import { loginSchema, parseInput, registerSchema } from "@/lib/validation";

const publicUser = { id: users.id, name: users.name, email: users.email };

export async function createUser(input: unknown) {
  const data = parseInput(registerSchema, input);

  const existing = await db.query.users.findFirst({ where: eq(users.email, data.email) });
  if (existing) throw new ConflictError("An account with this email already exists.");

  const passwordHash = await hash(data.password, 10);
  const [user] = await db
    .insert(users)
    .values({ name: data.name, email: data.email, passwordHash })
    .returning(publicUser);
  return user;
}

/** Returns the user for valid credentials, otherwise null (never says which part was wrong). */
export async function verifyCredentials(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return null;

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!user) return null;

  const valid = await compare(parsed.data.password, user.passwordHash);
  return valid ? { id: user.id, name: user.name, email: user.email } : null;
}
