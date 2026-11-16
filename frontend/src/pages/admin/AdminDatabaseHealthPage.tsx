import { useEffect, useState } from "react";
import {
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { api } from "../../api/client";

export function AdminDatabaseHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminHealth();
      setHealth(res);
    } catch (err: any) {
      setError(err?.message || "Failed to reach database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const isConnected = health?.database?.status === "connected";
  const isPostgres = health?.database?.is_postgres;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-jelly-blueberry/10 px-3 py-1 text-xs font-bold text-jelly-blueberry mb-1">
            <Database className="h-3.5 w-3.5" /> Infrastructure Health
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Database &amp; Engine Telemetry</h1>
          <p className="text-xs text-ink-muted">
            Live connectivity diagnosis, SQL dialect detection (Neon Postgres / SQLite), and storage telemetry.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="inline-flex items-center gap-2 rounded-2xl bg-paper-deep hover:bg-paper-subtle px-4 py-2.5 text-xs font-bold text-ink transition-all self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Ping Database
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="jelly-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-faint uppercase tracking-wider">Database Status</span>
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${
                  isConnected
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                {isConnected ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
            </div>
            <p className="text-2xl font-black text-ink capitalize">{health?.database?.status ?? "Checking..."}</p>
            <p className="text-xs text-ink-muted mt-1 font-medium">
              Active SQL connection verified via <code className="text-jelly-purple font-mono">SELECT 1</code>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line text-xs font-semibold text-ink-soft">
            Dialect: <span className="font-mono text-ink font-bold">{health?.database?.dialect ?? "—"}</span>
          </div>
        </div>

        <div className="jelly-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-faint uppercase tracking-wider">Storage Engine</span>
              <div className="h-9 w-9 rounded-xl bg-jelly-purple/10 text-jelly-purple flex items-center justify-center font-bold">
                <Server className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-ink">{isPostgres ? "Neon PostgreSQL" : "Local SQLite"}</p>
            <p className="text-xs text-ink-muted mt-1 font-medium">
              {isPostgres
                ? "Serverless cloud PostgreSQL with auto-scaling & pooling"
                : "Zero-config persistent embedded file storage"}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line text-xs font-semibold text-ink-soft truncate">
            Path: <span className="font-mono text-ink text-[11px]">{health?.database?.storage_dir ?? "In-cloud"}</span>
          </div>
        </div>

        <div className="jelly-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-faint uppercase tracking-wider">AI Agents Registry</span>
              <div className="h-9 w-9 rounded-xl bg-jelly-aqua/10 text-jelly-aqua flex items-center justify-center font-bold">
                <Cpu className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-ink">
              {health?.agents?.registered_count ?? 0} / 6 Verified
            </p>
            <p className="text-xs text-ink-muted mt-1 font-medium">
              Jotform AI CDN agents mapped and operational
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line text-xs font-semibold text-ink-soft">
            Status: <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{health?.agents?.status ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* Dual Database Architecture Card */}
      <div className="jelly-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="h-5 w-5 text-jelly-purple" />
          <h2 className="text-base font-bold text-ink">Dual-Engine Persistence Architecture</h2>
        </div>
        <p className="text-xs text-ink-soft leading-relaxed mb-4">
          ReStartHer is architected for zero-configuration local evaluation as well as cloud-native hackathon deployment:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl bg-paper-deep p-4 border border-line">
            <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-jelly-blueberry" />
              Neon PostgreSQL Mode
            </h3>
            <p className="text-ink-muted leading-relaxed">
              When <code className="font-mono text-jelly-purple">DATABASE_URL</code> is provided (e.g. from Neon), the backend automatically adjusts URL protocols (<code className="font-mono">postgres://</code> to <code className="font-mono">postgresql://</code>) and activates production connection pooling (<code className="font-mono">pool_pre_ping=True</code>).
            </p>
          </div>

          <div className="rounded-2xl bg-paper-deep p-4 border border-line">
            <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-jelly-aqua" />
              SQLite Development Mode
            </h3>
            <p className="text-ink-muted leading-relaxed">
              When no external connection string is specified, the application defaults to an isolated SQLite file located at <code className="font-mono text-jelly-aqua">backend/storage/restarther.db</code>, requiring zero external server dependencies to run.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
