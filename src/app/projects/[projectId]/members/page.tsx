import type { Metadata } from "next";
import Link from "next/link";
import { AddMemberForm, DeleteProjectButton, RemoveMemberButton } from "@/components/forms/ProjectForms";
import { can } from "@/lib/permissions";
import { loadBoard } from "../data";

type Props = { params: Promise<{ projectId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const board = await loadBoard((await params).projectId);
  return { title: `People on ${board.name}` };
}

export default async function MembersPage({ params }: Props) {
  const board = await loadBoard((await params).projectId);
  const canManage = can(board.role, "member:manage");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href={`/projects/${board.id}`} className="text-sm text-muted hover:text-ink">
          Back to the board
        </Link>
        <h1 className="text-4xl font-extrabold [font-stretch:80%]">People on {board.name}</h1>
      </div>

      <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
        {board.members.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div>
              <p className="font-bold">
                {member.name}
                {member.id === board.currentUserId && <span className="font-normal text-muted"> (you)</span>}
              </p>
              <p className="text-sm text-muted">
                {member.email}, {member.role === "OWNER" ? "owner" : "member"}
              </p>
            </div>
            {canManage && member.role !== "OWNER" && (
              <RemoveMemberButton projectId={board.id} memberId={member.id} name={member.name} />
            )}
          </li>
        ))}
      </ul>

      {canManage ? (
        <>
          <section className="space-y-3">
            <h2 className="text-xl font-bold">Add a teammate</h2>
            <AddMemberForm projectId={board.id} />
          </section>
          <section className="space-y-3 rounded-2xl border border-danger/30 p-5">
            <h2 className="text-xl font-bold">Delete this project</h2>
            <p className="text-muted">Removes the board and every task on it for all members.</p>
            <DeleteProjectButton projectId={board.id} />
          </section>
        </>
      ) : (
        <p className="text-muted">Only the project owner can add or remove people.</p>
      )}
    </div>
  );
}
