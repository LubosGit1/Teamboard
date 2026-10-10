import type { Metadata } from "next";
import Link from "next/link";
import { Board } from "@/components/board/Board";
import { loadBoard } from "./data";

type Props = { params: Promise<{ projectId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const board = await loadBoard((await params).projectId);
  return { title: board.name };
}

export default async function BoardPage({ params }: Props) {
  const board = await loadBoard((await params).projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Link href="/projects" className="text-sm text-muted hover:text-ink">
            All projects
          </Link>
          <h1 className="text-4xl font-extrabold [font-stretch:80%]">{board.name}</h1>
          {board.description && <p className="mt-1 text-muted">{board.description}</p>}
        </div>
        <Link
          href={`/projects/${board.id}/members`}
          className="flex items-center gap-3 rounded-full border border-line bg-card py-1 pl-1 pr-4 text-sm font-bold hover:border-ink/40"
        >
          <span className="flex -space-x-2">
            {board.members.slice(0, 4).map((member) => (
              <span
                key={member.id}
                className="grid size-7 place-items-center rounded-full border-2 border-card bg-ink text-xs text-paper"
                aria-hidden
              >
                {member.name[0]?.toUpperCase()}
              </span>
            ))}
          </span>
          {board.members.length === 1 ? "Invite teammates" : `${board.members.length} people`}
        </Link>
      </div>

      <Board board={board} />
    </div>
  );
}
