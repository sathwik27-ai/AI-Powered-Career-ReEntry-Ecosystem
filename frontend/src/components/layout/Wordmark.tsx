import { Link } from "react-router-dom";

/** Product logo: a small monogram tile plus the name, set in the UI typeface. */
export function Wordmark({ to = "/", inverted = false }: { to?: string; inverted?: boolean }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-2" aria-label="ReStartHer home">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill={inverted ? "#FFFFFF" : "#294D42"} />
        <path
          d="M10 22V10h6.2a4 4 0 0 1 .9 7.9L21 22"
          fill="none"
          stroke={inverted ? "#294D42" : "#EAF2EE"}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`text-[1.0625rem] font-semibold tracking-tight ${inverted ? "text-white" : "text-ink"}`}>
        ReStart<span className={inverted ? "text-plum-200" : "text-plum-700"}>Her</span>
      </span>
    </Link>
  );
}
