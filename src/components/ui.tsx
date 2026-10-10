import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-110",
  secondary: "border border-line bg-card text-ink hover:border-ink/40",
  ghost: "text-ink hover:bg-ink/5",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-ink placeholder:text-muted/80 focus:border-accent focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent/30";

export function Field({
  label,
  hint,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  const hintId = hint ? `${props.name}-hint` : undefined;
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold">{label}</span>
      <input className={inputClass} aria-describedby={hintId} {...props} />
      {hint && (
        <span id={hintId} className="block text-sm text-muted">
          {hint}
        </span>
      )}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

export function Wordmark() {
  return (
    <span className="font-display text-xl font-extrabold tracking-tight [font-stretch:85%]">
      teamboard
    </span>
  );
}
