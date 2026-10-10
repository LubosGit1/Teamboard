/** Domain errors carry an HTTP status so route handlers and server actions can map them uniformly. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export function toHttpError(error: unknown): { status: number; message: string } {
  if (error instanceof AppError) return { status: error.status, message: error.message };
  return { status: 500, message: "Something went wrong. Try again in a moment." };
}
