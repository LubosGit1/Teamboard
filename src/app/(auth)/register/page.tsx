import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-extrabold [font-stretch:85%]">Create an account</h1>
      <RegisterForm />
    </>
  );
}
