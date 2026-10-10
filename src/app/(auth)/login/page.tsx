import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-extrabold [font-stretch:85%]">Sign in</h1>
      <LoginForm />
    </>
  );
}
