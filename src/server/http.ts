import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/auth";
import { toHttpError, UnauthorizedError } from "@/lib/errors";

/** Wraps a route handler: resolves the signed-in user and maps domain errors to JSON responses. */
export async function withUser<T>(handler: (userId: string) => Promise<T>, status = 200) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new UnauthorizedError();
    return NextResponse.json(await handler(userId), { status });
  } catch (error) {
    const { status: errorStatus, message } = toHttpError(error);
    if (errorStatus === 500) console.error(error);
    return NextResponse.json({ error: message }, { status: errorStatus });
  }
}
