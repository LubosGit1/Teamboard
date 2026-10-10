import { getCurrentUserId } from "@/auth";
import { AppError } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

/** Shared wrapper for server actions: auth check + predictable error shape for the UI. */
export async function runAction<T>(fn: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Your session expired. Sign in again." };
  try {
    return { ok: true, data: await fn(userId) };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Something went wrong. Try again in a moment." };
  }
}
