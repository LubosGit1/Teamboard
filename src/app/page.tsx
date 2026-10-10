import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TaskCardView } from "@/components/board/TaskCardView";
import { buttonClass, Wordmark } from "@/components/ui";
import type { BoardColumn } from "@/lib/types";

const demo = (id: string, title: string, priority: "LOW" | "MEDIUM" | "HIGH", assignee?: string) => ({
  id,
  title,
  priority,
  createdById: "demo",
  assignee: assignee ? { id: assignee, name: assignee } : null,
});

const DEMO_COLUMNS: BoardColumn[] = [
  {
    id: "todo",
    name: "To do",
    tasks: [demo("1", "Write the launch email", "MEDIUM", "Mira Novak"), demo("2", "Book the venue", "LOW")],
  },
  { id: "doing", name: "In progress", tasks: [demo("3", "Fix checkout on Safari", "HIGH", "Peter Hruby")] },
  { id: "done", name: "Done", tasks: [demo("4", "Pick a domain name", "LOW", "Jana Kral")] },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/projects");

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <nav className="flex items-center justify-between py-5">
        <Wordmark />
        <Link href="/login" className={buttonClass("ghost")}>
          Sign in
        </Link>
      </nav>

      <section className="grid items-center gap-12 pt-8 lg:grid-cols-[1fr_1.15fr] lg:pt-16">
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold leading-[0.95] [font-stretch:75%] sm:text-7xl">
            Your team&apos;s week, on one board.
          </h1>
          <p className="max-w-[46ch] text-lg text-muted">
            Teamboard is a shared Kanban board. Add tasks, give them an owner and a priority, and drag
            them across as work moves. Everyone on the project sees the same board.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className={buttonClass("primary", "px-6 py-3 text-base")}>
              Create an account
            </Link>
            <Link href="/login" className={buttonClass("secondary", "px-6 py-3 text-base")}>
              Sign in
            </Link>
          </div>
        </div>

        {/* A static preview of the real board, built from the same card component. */}
        <div aria-hidden className="grid grid-cols-3 gap-3 rounded-3xl bg-surface p-3 sm:p-4 lg:rotate-[-2deg]">
          {DEMO_COLUMNS.map((column) => (
            <div key={column.id} className="space-y-2">
              <p className="px-1 font-display text-sm font-bold [font-stretch:90%] sm:text-base">{column.name}</p>
              {column.tasks.map((task) => (
                <TaskCardView key={task.id} task={task} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
        <div>
          <h2 className="text-lg font-bold">Invite by email</h2>
          <p className="mt-1 text-muted">Owners add teammates to a project. Members can add and move tasks.</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">Drag, or use the keyboard</h2>
          <p className="mt-1 text-muted">Pick up a card with Space, move it with the arrow keys, drop it with Space.</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">See who owns what</h2>
          <p className="mt-1 text-muted">Every card shows its priority and the person it&apos;s assigned to.</p>
        </div>
      </section>
    </main>
  );
}
