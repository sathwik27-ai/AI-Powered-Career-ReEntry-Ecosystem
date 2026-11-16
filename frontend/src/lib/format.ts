/** The backend sends naive UTC timestamps ("2026-11-15T05:28:19") and some with an offset. */
export function parseTime(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  const d = new Date(hasZone ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function timeAgo(iso: string | null | undefined): string {
  const d = parseTime(iso);
  if (!d) return "";
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function round(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  return n.toFixed(digits).replace(/\.0+$/, "");
}

export function years(n: number | null | undefined): string {
  if (n === null || n === undefined) return "–";
  const v = Math.round(n * 10) / 10;
  return `${round(v, 1)} ${v === 1 ? "year" : "years"}`;
}

export function firstName(name: string | null | undefined): string {
  if (!name) return "there";
  return name.replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || "there";
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function humanize(s: string): string {
  return s.replace(/_/g, " ");
}
