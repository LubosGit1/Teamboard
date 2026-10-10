import Link from "next/link";
import { Wordmark } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-8 self-start">
        <Wordmark />
      </Link>
      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">{children}</div>
    </main>
  );
}
