"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { AppError } from "@/lib/errors";
import { createUser } from "@/server/services/users";

export type AuthFormState = { error?: string };

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: field(formData, "email"),
      password: field(formData, "password"),
      redirectTo: "/projects",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "That email and password don't match." };
    throw error; // the redirect is thrown as an error and must propagate
  }
}

export async function registerAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const credentials = { email: field(formData, "email"), password: field(formData, "password") };
  try {
    await createUser({ ...credentials, name: field(formData, "name") });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  await signIn("credentials", { ...credentials, redirectTo: "/projects" });
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
