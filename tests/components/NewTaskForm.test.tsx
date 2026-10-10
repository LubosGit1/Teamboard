import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewTaskForm } from "@/components/board/NewTaskForm";
import { createTaskAction } from "@/server/actions/tasks";

// The server action is replaced so the component can be tested in isolation.
vi.mock("@/server/actions/tasks", () => ({ createTaskAction: vi.fn() }));
const createTask = vi.mocked(createTaskAction);

const props = {
  projectId: "4b0d2c1e-8f5a-4a37-9d2e-6c1b7a9e0f11",
  columnId: "9f1c7a2b-3d4e-4f56-8a9b-0c1d2e3f4a5b",
  columnName: "To do",
  members: [{ id: "7e6d5c4b-3a29-4180-9f7e-6d5c4b3a2918", name: "Mira Novak", email: "mira@example.com", role: "OWNER" as const }],
};

async function openForm() {
  const user = userEvent.setup();
  render(<NewTaskForm {...props} />);
  await user.click(screen.getByRole("button", { name: "Add task to To do" }));
  return user;
}

describe("NewTaskForm", () => {
  beforeEach(() => createTask.mockReset());

  it("validates on the client before calling the server", async () => {
    const user = await openForm();
    await user.click(screen.getByRole("button", { name: "Add task" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Write a title for the task.");
    expect(createTask).not.toHaveBeenCalled();
  });

  it("sends the parsed task and clears the form", async () => {
    createTask.mockResolvedValue({ ok: true, data: undefined });
    const user = await openForm();

    await user.type(screen.getByLabelText("Task title"), "  Write release notes  ");
    await user.selectOptions(screen.getByLabelText("Priority"), "HIGH");
    await user.selectOptions(screen.getByLabelText("Assignee"), "Mira Novak");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(createTask).toHaveBeenCalledWith({
      projectId: props.projectId,
      columnId: props.columnId,
      title: "Write release notes",
      priority: "HIGH",
      assigneeId: props.members[0].id,
    });
    expect(await screen.findByLabelText("Task title")).toHaveValue("");
  });

  it("shows the server's error and keeps the input", async () => {
    createTask.mockResolvedValue({ ok: false, error: "Assign the task to someone on this project." });
    const user = await openForm();

    await user.type(screen.getByLabelText("Task title"), "Book venue");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Assign the task to someone on this project.");
    expect(screen.getByLabelText("Task title")).toHaveValue("Book venue");
  });
});
