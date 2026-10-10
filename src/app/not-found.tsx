import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5">
      <h1 className="text-4xl font-extrabold [font-stretch:80%]">This page isn&apos;t here</h1>
      <p className="text-muted">
        The project may have been deleted, or you aren&apos;t a member of it. Ask the owner to add you.
      </p>
      <Link href="/projects" className={buttonClass("primary", "self-start")}>
        Go to your projects
      </Link>
    </main>
  );
}
