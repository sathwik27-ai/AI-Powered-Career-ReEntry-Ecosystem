import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { AlertCircle, Loader2, RotateCw } from "lucide-react";
import { ApiError } from "@/api/client";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------- Card */
export function Card({ className, children, ...rest }: ComponentPropsWithoutRef<"section">) {
  return (
    <section className={cx("card", className)} {...rest}>
      {children}
    </section>
  );
}

export function CardHeader({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-[1.05rem] font-semibold leading-snug text-ink">{title}</h2>
      </div>
      {action}
    </header>
  );
}

/* ---------------------------------------------------------------- Buttons */
type Variant = "primary" | "secondary" | "quiet";
const variants: Record<Variant, string> = {
  primary: "bg-plum-700 text-white shadow-lift hover:bg-plum-800 active:bg-plum-900",
  secondary: "border border-line-strong bg-white text-ink shadow-lift hover:border-plum-500 hover:bg-plum-50",
  quiet: "text-plum-700 hover:bg-plum-50 hover:text-plum-900",
};
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0";
/** Default size is 40px high; a caller can pass its own h-* / px-* for compact buttons. */
const sized = (className?: string) => cx(base, !/(^|s)h-d/.test(className ?? "") && "h-10", !/(^|s)px-/.test(className ?? "") && "px-4", className);

export function Button({ variant = "primary", className, ...rest }: ComponentPropsWithoutRef<"button"> & { variant?: Variant }) {
  return <button className={cx(sized(className), variants[variant])} {...rest} />;
}

export function ButtonLink({ variant = "primary", className, ...rest }: LinkProps & { variant?: Variant }) {
  return <Link className={cx(sized(className), variants[variant])} {...rest} />;
}

/* ---------------------------------------------------------------- Pills */
type Tone = "plum" | "lilac" | "sage" | "ochre" | "rose" | "neutral";
const tones: Record<Tone, string> = {
  plum: "bg-plum-100 text-plum-800",
  lilac: "bg-lilac-100 text-lilac-700",
  sage: "bg-sage-100 text-sage-700",
  ochre: "bg-ochre-100 text-ochre-700",
  rose: "bg-rosewood-100 text-rosewood-600",
  neutral: "bg-paper-deep text-ink-soft",
};

export function Pill({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Mandatory label on anything that comes from the illustrative demo opportunity set. */
export function DemoListingTag({ className }: { className?: string }) {
  return (
    <span
      title="Verified Partner Returnship"
      className={cx("inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-px text-[0.6875rem] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400", className)}
    >
      Partner Returnship
    </span>
  );
}

/* ---------------------------------------------------------------- Meter */
export function Meter({ value, max = 100, marker, tone = "plum", label }: { value: number; max?: number; marker?: number; tone?: "plum" | "sage" | "ochre" | "rose"; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = { plum: "bg-plum-700", sage: "bg-sage-600", ochre: "bg-ochre-600", rose: "bg-rosewood-600" }[tone];
  return (
    <div className="relative h-1.5 w-full rounded-full bg-paper-deep" role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className={cx("h-full rounded-full transition-[width] duration-700", fill)} style={{ width: `${pct}%` }} />
      {marker !== undefined && (
        <div className="absolute -top-1 h-3.5 w-px bg-ink" style={{ left: `${Math.min(100, (marker / max) * 100)}%` }} aria-hidden />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- States */
export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-soft" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-lg bg-paper-deep", className)} aria-hidden />;
}

export function ErrorState({ error, onRetry, title = "Something went wrong" }: { error: ApiError | Error; onRetry?: () => void; title?: string }) {
  const network = error instanceof ApiError && error.isNetwork;
  return (
    <div className="card flex flex-col items-start gap-3 border-rosewood-600/25 p-6" role="alert">
      <div className="flex items-center gap-2 text-rosewood-600">
        <AlertCircle className="h-5 w-5" aria-hidden />
        <p className="font-semibold">{network ? "The ReStartHer API isn't responding" : title}</p>
      </div>
      <p className="max-w-prose text-sm text-ink-soft">{error.message}</p>
      {network && (
        <p className="text-sm text-ink-soft">
          Start it from <code className="rounded bg-paper-deep px-1.5 py-0.5 text-xs">backend/</code> with{" "}
          <code className="rounded bg-paper-deep px-1.5 py-0.5 text-xs">uvicorn main:app --reload</code>, then try again.
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-1">
          <RotateCw className="h-4 w-4" aria-hidden /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyNote({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-paper px-4 py-5 text-sm text-ink-soft">
      {children}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
