import { useId, useRef, useState, type DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { ApiError } from "@/api/client";
import { Button, cx } from "@/components/ui/primitives";
import { fileSize, validateResumeFile } from "@/lib/profile";

type Phase = "idle" | "uploading" | "processing";

/**
 * File picker with drag-and-drop, client-side validation (PDF/DOCX, ≤ 5 MB) and real upload progress.
 * `upload` performs the request; while bytes are sent it reports progress, after that the agents are working.
 */
export function ResumeUpload({
  upload,
  submitLabel = "Upload resume",
  disabled,
}: {
  upload: (file: File, onProgress: (f: number) => void) => Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const choose = (f: File | null | undefined) => {
    if (!f) return;
    const problem = validateResumeFile(f);
    setError(problem);
    setFile(problem ? null : f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    choose(e.dataTransfer.files?.[0]);
  };

  const submit = async () => {
    if (!file) return;
    setError(null);
    setProgress(0);
    setPhase("uploading");
    try {
      await upload(file, (f) => {
        setProgress(f);
        if (f >= 1) setPhase("processing");
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setPhase("idle");
    }
  };

  const busy = phase !== "idle";

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-5 py-7 text-center transition",
          dragging ? "border-plum-500 bg-lilac-50" : "border-line-strong bg-paper/60 hover:border-plum-500",
          (busy || disabled) && "pointer-events-none opacity-60",
        )}
      >
        <UploadCloud className="h-6 w-6 text-plum-600" aria-hidden />
        <span className="text-sm font-semibold text-ink">Drop your resume here, or choose a file</span>
        <span className="text-xs text-ink-faint">PDF or DOCX, up to 5 MB. Scanned images can't be read.</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
          disabled={busy || disabled}
        />
      </label>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-plum-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-ink-faint">{fileSize(file.size)}</p>
          </div>
          {!busy && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-full p-1 text-ink-faint hover:bg-paper-deep"
              aria-label="Remove selected file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {busy && (
        <div className="mt-3" aria-live="polite">
          <div className="mb-1.5 flex justify-between text-xs text-ink-soft">
            <span>{phase === "uploading" ? "Uploading…" : "Profile Intelligence Agent is reading your resume, then the orchestrator runs the plan…"}</span>
            {phase === "uploading" && <span className="num">{Math.round(progress * 100)}%</span>}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className={cx("h-full rounded-full bg-plum-700 transition-[width]", phase === "processing" && "animate-pulse")} style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-rosewood-600" role="alert">
          {error}
        </p>
      )}

      <Button type="button" onClick={submit} disabled={!file || busy || disabled} className="mt-4">
        {busy ? "Working…" : submitLabel}
      </Button>
    </div>
  );
}
