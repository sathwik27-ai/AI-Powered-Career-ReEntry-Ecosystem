import type {
  ActivityResponse,
  AdminDashboardKpis,
  AgentMeta,
  Application,
  ApplicationStatus,
  ApplicationWorkflowResponse,
  ApproveResponse,
  AuthResponse,
  JotformAgentInfo,
  NotificationItem,
  OpportunitiesResponse,
  OpportunityFilters,
  OpportunityMatch,
  Profile,
  ProfileInput,
  ProfileWorkflowResponse,
  ResumeUploadResponse,
  AnswerFeedback,
  ApiErrorBody,
  InterviewCompleteResponse,
  InterviewSession,
  InterviewType,
  Dashboard,
  DemoPriyaResponse,
  Health,
  Quiz,
  QuizResult,
  QuizSubmissionResponse,
  QuizSummary,
  RoadmapResponse,
  SkillsResponse,
  TaskUpdateResponse,
  TrainerListenerItem,
  User,
  UserAgents,
} from "./types";

/** Backend origin, e.g. https://restarther-api.onrender.com. Set VITE_API_BASE_URL in Vercel or frontend/.env. */
let rawApiUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
if (rawApiUrl.endsWith("/api")) {
  rawApiUrl = rawApiUrl.slice(0, -4);
}
export const API_BASE_URL = rawApiUrl;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetwork() {
    return this.status === 0;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;
interface RequestOptions {
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}/api${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const isForm = opts.body instanceof FormData;
  const token = localStorage.getItem("restarther_token");
  const headers: Record<string, string> = {};
  if (opts.body !== undefined && !isForm) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      signal: opts.signal,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(`Can't reach the ReStartHer API at ${API_BASE_URL}. Is the backend running?`, 0, "network_error");
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const e = (data as ApiErrorBody | null)?.error;
    throw new ApiError(e?.message ?? `Request failed (${res.status})`, res.status, e?.code ?? "http_error", e?.details);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>("GET", "/health", { signal }),
  getUser: (userId: number, signal?: AbortSignal) => request<User>("GET", `/users/${userId}`, { signal }),
  dashboard: (userId: number, signal?: AbortSignal) => request<Dashboard>("GET", `/users/${userId}/dashboard`, { signal }),
  userAgents: (userId: number, signal?: AbortSignal) => request<UserAgents>("GET", `/users/${userId}/agents`, { signal }),
  loadPriyaDemo: () => request<DemoPriyaResponse>("POST", "/demo/priya"),

  // learning roadmap & quizzes (backend/api/routes/learning.py)
  roadmap: (userId: number, signal?: AbortSignal) => request<RoadmapResponse>("GET", `/users/${userId}/roadmap`, { signal }),
  skills: (userId: number, signal?: AbortSignal) => request<SkillsResponse>("GET", `/users/${userId}/skills`, { signal }),
  updateTask: (userId: number, taskId: number, completed: boolean) =>
    request<TaskUpdateResponse>("PATCH", `/users/${userId}/tasks/${taskId}`, { body: { completed } }),
  quizzes: (signal?: AbortSignal) => request<{ skills: QuizSummary[] }>("GET", "/quizzes", { signal }),
  quiz: (skill: string, signal?: AbortSignal) => request<Quiz>("GET", `/quizzes/${encodeURIComponent(skill)}`, { signal }),
  submitQuiz: (userId: number, skill: string, answers: Record<string, number>) =>
    request<QuizSubmissionResponse>("POST", `/users/${userId}/quizzes/${encodeURIComponent(skill)}`, { body: { answers } }),
  quizResults: (userId: number, signal?: AbortSignal) => request<{ results: QuizResult[] }>("GET", `/users/${userId}/quiz-results`, { signal }),

  // mock interviews (backend/api/routes/interviews.py)
  interviews: (userId: number, signal?: AbortSignal) => request<{ sessions: InterviewSession[] }>("GET", `/users/${userId}/interviews`, { signal }),
  interview: (userId: number, sessionId: number, signal?: AbortSignal) =>
    request<{ session: InterviewSession }>("GET", `/users/${userId}/interviews/${sessionId}`, { signal }),
  startInterview: (userId: number, interviewType: InterviewType) =>
    request<{ session: InterviewSession }>("POST", `/users/${userId}/interviews`, { body: { interview_type: interviewType } }),
  answerInterview: (userId: number, sessionId: number, questionId: string, answer: string) =>
    request<{ feedback: AnswerFeedback }>("POST", `/users/${userId}/interviews/${sessionId}/answers`, { body: { question_id: questionId, answer } }),
  completeInterview: (userId: number, sessionId: number) =>
    request<InterviewCompleteResponse>("POST", `/users/${userId}/interviews/${sessionId}/complete`),

  // profile, onboarding & resume
  createUser: (name: string) => request<User>("POST", "/users", { body: { name } }),
  profile: (userId: number, signal?: AbortSignal) => request<{ profile: Profile | null }>("GET", `/users/${userId}/profile`, { signal }),
  onboarding: (userId: number, body: ProfileInput) => request<ProfileWorkflowResponse>("POST", `/users/${userId}/onboarding`, { body }),
  updateProfile: (userId: number, body: ProfileInput) => request<ProfileWorkflowResponse>("PUT", `/users/${userId}/profile`, { body }),
  uploadResume: (userId: number, file: File, onboarding?: ProfileInput, onProgress?: (fraction: number) => void) =>
    uploadWithProgress<ResumeUploadResponse>(`/users/${userId}/resume`, file, onboarding, onProgress),

  // opportunities (backend/api/routes/opportunities.py)
  opportunities: (userId: number, filters: OpportunityFilters, signal?: AbortSignal) =>
    request<OpportunitiesResponse>("GET", `/users/${userId}/opportunities`, { query: { ...filters, returnship_only: filters.returnship_only || undefined }, signal }),
  savedOpportunities: (userId: number, signal?: AbortSignal) =>
    request<{ disclaimer: string; results: OpportunityMatch[] }>("GET", `/users/${userId}/opportunities/saved`, { signal }),
  saveOpportunity: (userId: number, oid: number) => request<{ saved: true; opportunity_id: number }>("POST", `/users/${userId}/opportunities/${oid}/save`),
  unsaveOpportunity: (userId: number, oid: number) => request<{ saved: false }>("DELETE", `/users/${userId}/opportunities/${oid}/save`),

  // applications – ReStartHer never submits anything itself
  applications: (userId: number, signal?: AbortSignal) => request<{ applications: Application[]; note: string }>("GET", `/users/${userId}/applications`, { signal }),
  createApplication: (userId: number, opportunityId: number) =>
    request<ApplicationWorkflowResponse>("POST", `/users/${userId}/applications`, { body: { opportunity_id: opportunityId } }),
  regenerateApplication: (userId: number, aid: number) => request<ApplicationWorkflowResponse>("POST", `/users/${userId}/applications/${aid}/regenerate`),
  saveDrafts: (userId: number, aid: number, body: { resume?: string; cover_letter?: string }) =>
    request<{ application: Application }>("PUT", `/users/${userId}/applications/${aid}/drafts`, { body }),
  approveApplication: (userId: number, aid: number) => request<ApproveResponse>("POST", `/users/${userId}/applications/${aid}/approve`),
  updateApplicationStatus: (userId: number, aid: number, status: ApplicationStatus, note: string) =>
    request<{ application: Application }>("PATCH", `/users/${userId}/applications/${aid}/status`, { body: { status, note } }),

  // agents & activity log
  agentCatalog: (signal?: AbortSignal) => request<{ agents: AgentMeta[]; jotform_agents?: JotformAgentInfo[] }>("GET", "/agents", { signal }),
  jotformAgents: (signal?: AbortSignal) => request<JotformAgentInfo[]>("GET", "/agents/jotform", { signal }),
  agentHealth: (key: string, signal?: AbortSignal) => request<any>("GET", `/agents/${key}/health`, { signal }),
  logAgentActivity: (body: { agent_key: string; action: string; input_text?: string; output_text?: string }) =>
    request<{ status: string; message: string }>("POST", "/agents/activity", { body }),
  activity: (userId: number, q: { run_id?: string; workflow?: string; agent?: string; limit?: number }, signal?: AbortSignal) =>
    request<ActivityResponse>("GET", `/users/${userId}/activity`, { query: q, signal }),

  // auth endpoints
  login: (body: { email: string; password: string }) => request<AuthResponse>("POST", "/auth/login", { body }),
  register: (body: { name: string; email: string; password: string; confirm_password?: string; terms_accepted?: boolean; is_woman_confirm?: boolean }) =>
    request<AuthResponse>("POST", "/auth/register", { body }),
  me: (signal?: AbortSignal) => request<any>("GET", "/auth/me", { signal }),
  logout: () => request<{ status: string; message: string }>("POST", "/auth/logout"),
  forgotPassword: (email: string) => request<{ status: string; message: string; reset_token?: string }>("POST", "/auth/forgot-password", { body: { email } }),
  resetPassword: (body: { token: string; new_password: string }) =>
    request<{ status: string; message: string }>("POST", "/auth/reset-password", { body }),

  // listener workspace
  listenerProfile: (signal?: AbortSignal) => request<any>("GET", "/listeners/me", { signal }),
  updateListenerProfile: (body: any) => request<any>("PUT", "/listeners/me", { body }),
  listenerProgress: (signal?: AbortSignal) => request<any>("GET", "/listeners/progress", { signal }),
  listenerTasks: (signal?: AbortSignal) => request<any>("GET", "/listeners/tasks", { signal }),
  toggleAssignedTask: (id: number) => request<any>("PUT", `/listeners/tasks/${id}/toggle`),
  completeAssignedTask: (id: number, body: { proof_notes: string; proof_url?: string }) =>
    request<any>("POST", `/listeners/tasks/${id}/complete`, { body }),

  // trainer workspace
  trainerListeners: (signal?: AbortSignal) => request<{ listeners: TrainerListenerItem[]; count: number }>("GET", "/trainers/me/listeners", { signal }),
  trainerListenerDetail: (id: number, signal?: AbortSignal) => request<any>("GET", `/trainers/listeners/${id}`, { signal }),
  assignTask: (id: number, body: { title: string; description: string; skill: string; due_date?: string }) =>
    request<any>("POST", `/trainers/listeners/${id}/assign-task`, { body }),
  addTrainerNote: (id: number, body: { content: string; category?: string }) =>
    request<any>("POST", `/trainers/listeners/${id}/notes`, { body }),
  trainerStats: (signal?: AbortSignal) => request<any>("GET", "/trainers/stats", { signal }),
  createTrainerColleague: (body: { name: string; email: string; password: string; specialization?: string; bio?: string }) =>
    request<any>("POST", "/trainers/colleagues", { body }),

  // admin workspace
  adminDashboard: (signal?: AbortSignal) => request<{ kpis: AdminDashboardKpis; recent_activity: any[] }>("GET", "/admin/dashboard", { signal }),
  adminUsers: (q?: { role?: string; search?: string }, signal?: AbortSignal) => request<{ users: any[]; count: number }>("GET", "/admin/users", { query: q, signal }),
  createTrainer: (body: any) => request<any>("POST", "/admin/trainers", { body }),
  createAdmin: (body: { name: string; email: string; password: string }) => request<any>("POST", "/admin/admins", { body }),
  updateUserRole: (id: number, body: { role?: string; is_active?: boolean }) => request<any>("PUT", `/admin/users/${id}/role`, { body }),
  assignTrainer: (body: { trainer_id: number; listener_id: number; notes?: string }) => request<any>("POST", "/admin/assign", { body }),
  adminAnalytics: (signal?: AbortSignal) => request<any>("GET", "/admin/analytics", { signal }),
  adminHealth: (signal?: AbortSignal) => request<any>("GET", "/admin/health", { signal }),

  // notifications & settings
  notifications: (signal?: AbortSignal) => request<NotificationItem[]>("GET", "/notifications", { signal }),
  markNotificationRead: (id: number) => request<any>("PUT", `/notifications/${id}/read`),
  markAllNotificationsRead: () => request<any>("POST", "/notifications/mark-all-read"),
  settings: (signal?: AbortSignal) => request<any>("GET", "/settings", { signal }),
  updateSettings: (body: { theme?: string; email_notifications?: boolean; job_alerts?: boolean }) =>
    request<any>("PUT", "/settings", { body }),
  deleteAccount: () => request<{ status: string; message: string }>("DELETE", "/users/me"),
};

/** Multipart upload via XHR so the UI can show real upload progress (fetch exposes no upload progress events). */
function uploadWithProgress<T>(path: string, file: File, onboarding?: ProfileInput, onProgress?: (fraction: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (onboarding && Object.keys(onboarding).length) form.append("onboarding", JSON.stringify(onboarding));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api${path}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new ApiError(`Can't reach the ReStartHer API at ${API_BASE_URL}. Is the backend running?`, 0, "network_error"));
    xhr.onload = () => {
      const data = xhr.responseText ? safeJson(xhr.responseText) : null;
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data as T);
      const e = (data as ApiErrorBody | null)?.error;
      reject(new ApiError(e?.message ?? `Upload failed (${xhr.status})`, xhr.status, e?.code ?? "http_error", e?.details));
    };
    xhr.send(form);
  });
}
