import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUserId } from "@/auth";
import { NotFoundError } from "@/lib/errors";
import { getBoard } from "@/server/services/projects";

/** Loads the board once per request (shared by page + metadata) and maps domain errors to Next.js responses. */
export const loadBoard = cache(async (projectId: string) => {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  try {
    return await getBoard(userId, projectId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
});
