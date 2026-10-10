import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["OWNER", "MEMBER"]);
export const priorityEnum = pgEnum("priority", ["LOW", "MEDIUM", "HIGH"]);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: roleEnum("role").default("MEMBER").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("memberships_user_project_idx").on(t.userId, t.projectId),
    index("memberships_project_idx").on(t.projectId),
  ],
);

export const boardColumns = pgTable(
  "board_columns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    position: doublePrecision("position").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (t) => [index("board_columns_project_position_idx").on(t.projectId, t.position)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    priority: priorityEnum("priority").default("MEDIUM").notNull(),
    // Fractional position inside a column – moving a task is a single UPDATE.
    position: doublePrecision("position").notNull(),
    columnId: uuid("column_id")
      .notNull()
      .references(() => boardColumns.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("tasks_column_position_idx").on(t.columnId, t.position),
    index("tasks_project_idx").on(t.projectId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  memberships: many(memberships),
  columns: many(boardColumns),
  tasks: many(tasks),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  project: one(projects, { fields: [memberships.projectId], references: [projects.id] }),
}));

export const boardColumnsRelations = relations(boardColumns, ({ one, many }) => ({
  project: one(projects, { fields: [boardColumns.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  column: one(boardColumns, { fields: [tasks.columnId], references: [boardColumns.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
}));
