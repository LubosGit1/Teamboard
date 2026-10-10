import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/auth";
import { NewProjectForm } from "@/components/forms/ProjectForms";
import { listProjects } from "@/server/services/projects";

export const metadata: Metadata = { title: "Your projects" };

const tasksLabel = (n: number) => (n === 1 ? "1 task" : `${n} tasks`);
const peopleLabel = (n: number) => (n === 1 ? "1 person" : `${n} people`);

export default async function ProjectsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const projects = await listProjects(userId);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-extrabold [font-stretch:80%]">Your projects</h1>
        <div className="rounded-2xl border border-line bg-card p-5">
          <NewProjectForm />
        </div>
      </section>

      {projects.length === 0 ? (
        <p className="max-w-prose text-muted">
          No projects yet. Name your first one above and you&apos;ll land on its board.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block h-full rounded-xl border border-line bg-surface p-5 hover:border-accent"
              >
                <h2 className="text-xl font-bold">{project.name}</h2>
                {project.description && <p className="mt-1 line-clamp-2 text-muted">{project.description}</p>}
                <p className="mt-4 text-sm text-muted">
                  {tasksLabel(project.taskCount)}, {peopleLabel(project.memberCount)}
                  {project.role === "OWNER" && <span className="ml-2 font-bold text-ink">You own this</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
