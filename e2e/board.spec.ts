import { expect, test, type Locator, type Page } from "@playwright/test";

const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

const column = (page: Page, name: string) =>
  page.locator(`[data-testid="column"][data-column-name="${name}"]`);

async function register(page: Page) {
  await page.goto("/register");
  await page.getByLabel("Your name").fill("E2E Tester");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("e2e-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/projects$/);
}

/** dnd-kit listens to pointer events, so move the mouse in steps instead of using dragTo(). */
async function drag(page: Page, source: Locator, target: Locator) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Drag source or target is not visible");

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();
}

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("wrong password shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("That email and password don't match.");
});

test("create a project, add a task and drag it to Done", async ({ page }) => {
  await register(page);

  await page.getByLabel("Project name").fill("E2E launch");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "E2E launch" })).toBeVisible();

  const todo = column(page, "To do");
  await todo.getByRole("button", { name: "Add task to To do" }).click();
  await todo.getByLabel("Task title").fill("Write release notes");
  await todo.getByLabel("Priority").selectOption("HIGH");
  await todo.getByRole("button", { name: "Add task" }).click();

  const card = todo.getByTestId("task-card").filter({ hasText: "Write release notes" });
  await expect(card).toBeVisible();

  const done = column(page, "Done");
  await drag(page, card, done);
  await expect(done.getByText("Write release notes")).toBeVisible();

  // The move must be persisted, not just optimistic.
  await page.reload();
  await expect(column(page, "Done").getByText("Write release notes")).toBeVisible();
  await expect(column(page, "To do").getByText("Write release notes")).toHaveCount(0);
});
