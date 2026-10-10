import Link from "next/link";
import { auth } from "@/auth";
import { Button, Wordmark } from "@/components/ui";
import { signOutAction } from "@/server/actions/auth";

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/projects">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{session?.user?.name}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
