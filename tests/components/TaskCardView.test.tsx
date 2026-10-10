import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskCardView } from "@/components/board/TaskCardView";
import type { BoardTask } from "@/lib/types";

const task: BoardTask = {
  id: "t1",
  title: "Fix checkout on Safari",
  priority: "HIGH",
  createdById: "u1",
  assignee: { id: "u2", name: "Peter Hruby" },
};

describe("TaskCardView", () => {
  it("shows the title, priority and assignee", () => {
    render(<TaskCardView task={task} />);
    expect(screen.getByRole("heading", { name: "Fix checkout on Safari" })).toBeInTheDocument();
    expect(screen.getByText("High priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Assigned to Peter Hruby")).toHaveTextContent("PH");
  });

  it("says when nobody is assigned", () => {
    render(<TaskCardView task={{ ...task, assignee: null }} />);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("hides the delete button without permission", () => {
    render(<TaskCardView task={task} onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /delete task/i })).not.toBeInTheDocument();
  });

  it("calls onDelete with the task id", async () => {
    const onDelete = vi.fn();
    render(<TaskCardView task={task} canDelete onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete task: Fix checkout on Safari" }));
    expect(onDelete).toHaveBeenCalledWith("t1");
  });
});
