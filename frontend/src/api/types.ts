/**
 * Response types for the ReStartHer FastAPI backend.
 * Derived from backend/services/serializers.py, backend/api/routes/* and recorded
 * responses from the running API. Keep in sync when the backend changes.
 */

export type AgentKey = "orchestrator" | "profile" | "skill_gap" | "learning" | "confidence" | "opportunity" | "application";
export type AiMode = "demo" | "llm";

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface Health {
  status: string;
  service: string;
  version: string;
  ai_mode: AiMode;
  ai_mode_description: string;
  database: string;
}

export interface User {
  id: number;
  name: string;
  is_demo: boolean;
  created_at: string;
  has_profile: boolean;
}

export interface EmploymentEntry {
  id: number;
  title: string;
  company: string | null;
  start: string | null;
  end: string | null;
  years: number | null;
  highlights: string[];
}

export interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  headline: string | null;
  previous_role: string | null;
  domain: string | null;
  education: string[];
  education_field: string | null;
  experience_years: number | null;
  career_break_years: number | null;
  career_break_reason: string | null;
  target_role: string | null;
  skills: string[];
  soft_skills: string[];
  transferable_skills: string[];
  certifications: string[];
  projects: string[];
  work_preferences: string[];
  employment_types: string[];
  location_preference: string | null;
  hours_per_day: number | null;
  plan_days: number | null;
  learning_preferences: string[];
  missing_info: string[];
  clarification_questions: string[];
  skill_evidence: Record<string, string>;
  source: string;
  extraction_mode: AiMode;
  updated_at: string;
  employment: EmploymentEntry[];
}

export type SkillStatus = "strong" | "outdated" | "needs_revision" | "developing" | "missing";

export interface PriorityGap {
  skill: string;
  status: SkillStatus;
  current_level: number;
  target_level: number;
  priority: string | null;
  measured: boolean;
  why: string;
}

export interface LearningTask {
  id: number;
  day: number;
  order: number;
  skill: string;
  kind: string;
  title: string;
  description: string;
  minutes: number;
  resource_title: string | null;
  resource_url: string | null;
  completed: boolean;
  completed_at: string | null;
  added_by_adaptation: boolean;
  adaptation_note: string | null;
}

export interface Progress {
  completed: number;
  total: number;
  percent: number;
}

/** One concrete edit the Learning Agent made (agents/learning_agent.py → adapt). */
export interface AdaptationChange {
  type: "added" | "upgraded";
  day: number;
  title: string;
  skill: string;
  kind: string;
  /** Present on "upgraded": the title of the task that was replaced by the challenge. */
  replaced?: string;
}

export interface RoadmapChange {
  version: number;
  at: string;
  trigger: string;
  reason: string;
  changes: AdaptationChange[];
}

export interface PlanOpportunity {
  id: number;
  title: string;
  employer_label: string;
  arrangement: string;
  employment_type: string;
  match_score: number;
  match_label: string;
  is_demo: boolean;
}

export interface Readiness {
  overall: number;
  components: { profile: number | null; skills: number | null; learning: number | null; interview: number | null };
  weights: { profile: number; skills: number; learning: number; interview: number };
  missing_profile_fields: string[];
  disclaimer: string;
}

export interface NextAction {
  title: string;
  description: string;
  agent: AgentKey;
  route: string;
}

export interface CareerSummary {
  name: string | null;
  previous_role: string | null;
  experience_years: number | null;
  career_break_years: number | null;
  target_role: string | null;
  skills: string[];
  transferable_skills: string[];
  work_preferences: string[];
  hours_per_day: number | null;
  location_preference: string | null;
}

export interface PlanRoadmap {
  roadmap_id: number;
  version: number;
  planned_days: number;
  total_days: number;
  hours_per_day: number;
  focus_skills: string[];
  progress: Progress;
  current_day: number | null;
  upcoming_tasks: LearningTask[];
  last_change: RoadmapChange | null;
}

export interface PlanData {
  career_summary: CareerSummary | null;
  priority_gaps: PriorityGap[];
  learning_roadmap: PlanRoadmap | null;
  interview_preparation: string[];
  suitable_opportunities: PlanOpportunity[];
  readiness: Readiness;
  next_action: NextAction;
  ai_mode: AiMode;
}

export interface PlanChange {
  version: number;
  at: string;
  trigger: string;
  reason: string;
}

export interface Plan {
  version: number;
  goal: string;
  data: PlanData;
  change_log: PlanChange[];
  updated_at: string | null;
}

export interface AssessmentItem {
  skill: string;
  tier: string;
  target_level: number;
  current_level: number;
  gap: number;
  status: SkillStatus;
  measured: boolean;
  basis: string;
  why: string;
  in_profile: boolean;
  volatility: string;
  priority: string | null;
  priority_rank: number | null;
}

export interface Assessment {
  id: number;
  version: number;
  target_role: string;
  readiness: number;
  items: AssessmentItem[];
  summary: {
    priorities: string[];
    counts: Record<SkillStatus, number>;
    additional_strengths: string[];
    recommendations: string[];
    method: string;
  };
  trigger: string;
  created_at: string;
}

export interface Roadmap {
  id: number;
  version: number;
  planned_days: number;
  total_days: number;
  hours_per_day: number;
  focus_skills: string[];
  difficulty: Record<string, string>;
  changes: RoadmapChange[];
  mini_project: { title: string; description: string } | null;
  created_at: string;
  updated_at: string;
  tasks: LearningTask[];
  progress: Progress;
  current_day: number | null;
}

export interface ActivityLog {
  id: number;
  run_id: string;
  workflow: string;
  step: number;
  agent: AgentKey;
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  decision: string | null;
  next_agent: AgentKey | null;
  roadmap_changed: boolean;
  status: string;
  mode: AiMode;
  duration_ms: number;
  created_at: string;
}

export interface Dashboard {
  user: User;
  profile: Profile | null;
  plan: Plan;
  assessment: Assessment | null;
  roadmap: Roadmap | null;
  interviews: { completed: number; latest_score: number | null };
  applications: { counts: Record<string, number>; items: unknown[] };
  recent_activity: ActivityLog[];
}

export interface AgentStatus {
  key: AgentKey;
  name: string;
  description: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  status: "idle" | "completed" | "error";
  executions: number;
  last_action: string | null;
  last_summary: string | null;
  last_run_at: string | null;
  last_mode: AiMode | null;
}

export interface WorkflowDefinition {
  name: string;
  entry: string;
  nodes: string[];
  edges: { from: string; to: string }[];
  conditional_edges: { from: string; routes: Record<string, string> }[];
}

export interface UserAgents {
  agents: AgentStatus[];
  workflows: WorkflowDefinition[];
}

export interface WorkflowResult {
  run_id: string;
  trace: string[];
  needs_clarification: boolean;
  clarification_questions: string[];
  suggested_roles: string[];
  roadmap_kept: boolean;
}

export interface DemoPriyaResponse {
  user: User;
  resume: { id: number; filename: string; type: string; size_bytes: number; text_chars: number; uploaded_at: string };
  workflow: WorkflowResult;
  profile: Profile;
  note: string;
}

/* ------------------------------------------------------------------ learning & quizzes */

export interface RoadmapResponse {
  roadmap: Roadmap | null;
}

export interface SkillsResponse {
  assessment: Assessment | null;
  measured_evidence: Record<string, { score: number; source: "quiz" | "interview" | string }>;
}

export interface QuizSummary {
  skill: string;
  questions: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

/** GET /quizzes/{skill} – questions without the answer key. */
export interface Quiz {
  skill: string;
  questions: QuizQuestion[];
  note: string;
}

export interface QuizAnswerReview {
  id: string;
  question: string;
  selected: number | null;
  correct_index: number;
  is_correct: boolean;
  explanation: string;
}

export interface QuizResult {
  id: number;
  skill: string;
  correct: number;
  total: number;
  percent: number;
  answers: QuizAnswerReview[];
  created_at: string;
}

export interface AdaptiveOrchestration {
  run_id: string;
  trace: string[];
  signals: { skill: string; score: number; source: string; missing_points?: string[] }[];
  roadmap_changed: boolean;
  /** null when the Learning Agent decided no change was needed. */
  adaptation: { reason: string; changes: AdaptationChange[]; roadmap_version: number } | null;
  /** Present when the workflow was triggered by completing an interview; null for quizzes. */
  interview_summary: InterviewSummary | null;
  plan: Plan;
}

/** POST /users/{id}/quizzes/{skill} */
export interface QuizSubmissionResponse {
  result: QuizResult;
  orchestration: AdaptiveOrchestration;
}

/** PATCH /users/{id}/tasks/{task_id} */
export interface TaskUpdateResponse {
  task: LearningTask;
  progress: Progress;
  current_day: number | null;
  readiness: Readiness;
}

/* ------------------------------------------------------------------ mock interviews */

export type InterviewType = "technical" | "hr" | "mixed";

export interface InterviewQuestion {
  id: string;
  question: string;
  type: "technical" | "hr";
  skill: string | null;
  answered: boolean;
}

/** services/serializers.py → feedback_dict */
export interface InterviewFeedback {
  id: number;
  question_id: string;
  question: string;
  question_type: "technical" | "hr";
  skill: string | null;
  answer: string;
  /** Criterion → 0–100. HR answers have no technical_accuracy. */
  scores: Record<string, number>;
  overall: number;
  strengths: string[];
  improvements: string[];
  missing_points: string[];
  improved_answer: string;
  mode: AiMode;
  created_at: string;
}

/** POST /answers adds these two fields; stored feedback (session.feedback) does not have them. */
export interface AnswerFeedback extends InterviewFeedback {
  weak: boolean;
  criteria_weights: Record<string, number>;
}

export interface WeakTopic {
  skill: string;
  score: number;
  missing_points: string[];
}

export interface InterviewSession {
  id: number;
  interview_type: InterviewType;
  status: "in_progress" | "completed";
  questions: InterviewQuestion[];
  overall_score: number | null;
  weak_topics: WeakTopic[];
  created_at: string;
  completed_at: string | null;
  feedback: InterviewFeedback[];
}

export interface InterviewSummary {
  overall: number;
  hr_score: number | null;
  skill_scores: Record<string, number>;
  weak_topics: WeakTopic[];
  signals: { skill: string; score: number; source: string; missing_points?: string[] }[];
  recommendations: string[];
}

/** POST /interviews/{sid}/complete */
export interface InterviewCompleteResponse {
  session: InterviewSession;
  orchestration: AdaptiveOrchestration;
}

/* ------------------------------------------------------------------ profile, onboarding & resume */

export type WorkArrangement = "Remote" | "Hybrid" | "On-site" | "Part-time" | "Flexible hours";
export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Freelance" | "Returnship";
export const WORK_ARRANGEMENTS: WorkArrangement[] = ["Remote", "Hybrid", "On-site", "Part-time", "Flexible hours"];
export const EMPLOYMENT_TYPES: EmploymentType[] = ["Full-time", "Part-time", "Contract", "Freelance", "Returnship"];

/** schemas.ProfileInput – every field optional; supplied values override parsed resume values. */
export interface ProfileInput {
  full_name?: string;
  previous_role?: string;
  experience_years?: number;
  career_break_years?: number;
  career_break_reason?: string;
  target_role?: string;
  skills?: string[];
  education?: string[];
  work_preferences?: WorkArrangement[];
  employment_types?: EmploymentType[];
  location_preference?: string;
  hours_per_day?: number;
  plan_days?: 15 | 30;
  learning_preferences?: string[];
}

export interface ComebackWorkflowResult extends WorkflowResult {
  plan: Plan;
}

export interface ProfileWorkflowResponse {
  workflow: ComebackWorkflowResult;
  profile: Profile | null;
}

export interface ResumeMeta {
  id: number;
  filename: string;
  type: string;
  size_bytes: number;
  text_chars: number;
  uploaded_at: string;
}

export interface ResumeUploadResponse extends ProfileWorkflowResponse {
  resume: ResumeMeta;
}

/* ------------------------------------------------------------------ opportunities */

export interface Opportunity {
  id: number;
  slug: string;
  title: string;
  employer_label: string;
  location: string;
  arrangement: string;
  employment_type: string;
  flexible_hours: boolean;
  returnship_friendly: boolean;
  role_family: string;
  required_skills: string[];
  nice_to_have: string[];
  min_experience: number;
  description: string;
  source: string;
  source_url: string | null;
  is_demo: boolean;
}

export interface OpportunityMatch extends Opportunity {
  match_score: number;
  match_label: string;
  components: { skills: number; experience: number; flexibility: number; location: number; returnship: number };
  matched_skills: string[];
  in_progress_skills: string[];
  missing_skills: string[];
  reasons: string[];
  gaps: string[];
  role_fit: boolean;
  saved: boolean;
  listing_label: string;
  saved_at?: string;
}

export interface OpportunityFilters {
  arrangement?: WorkArrangement;
  employment_type?: EmploymentType;
  location?: string;
  role?: string;
  returnship_only?: boolean;
}

export interface OpportunitiesResponse {
  disclaimer: string;
  count: number;
  filters: Partial<OpportunityFilters>;
  results: OpportunityMatch[];
}

/* ------------------------------------------------------------------ applications */

export type ApplicationStatus = "saved" | "drafted" | "ready_for_review" | "applied" | "interview" | "rejected" | "offer";

export interface ApplicationHistoryEntry {
  status: ApplicationStatus;
  at: string;
  note: string;
}

export interface Application {
  id: number;
  status: ApplicationStatus;
  notes: string;
  approved: boolean;
  approved_at: string | null;
  history: ApplicationHistoryEntry[];
  created_at: string;
  updated_at: string;
  opportunity: Opportunity;
  resume: { id: number; content: string; tailoring_notes: string[]; edited_by_user: boolean; mode: AiMode; updated_at: string } | null;
  cover_letter: { id: number; content: string; edited_by_user: boolean; mode: AiMode; updated_at: string } | null;
}

export interface ApplicationWorkflowResponse {
  run_id: string;
  trace: string[];
  application: Application;
  plan: Plan;
  note: string;
}

export interface ApproveResponse {
  application: Application;
  submitted_by_restarther: false;
  note: string;
}

/* ------------------------------------------------------------------ agents & activity */

export interface AgentMeta {
  key: AgentKey;
  name: string;
  description: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
}

export interface ActivityRun {
  run_id: string;
  workflow: string;
  started_at: string;
  steps: number;
  agents: AgentKey[];
  roadmap_changed: boolean;
  errors: number;
}

export interface ActivityResponse {
  runs: ActivityRun[];
  logs: ActivityLog[];
}

/* ------------------------------------------------------------------ auth & roles */

export type UserRole = "listener" | "trainer" | "admin";

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  role: UserRole;
  is_demo: boolean;
  has_profile: boolean;
  is_woman_verified?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
  redirect: string;
}

export interface JotformAgentInfo {
  key: string;
  name: string;
  description: string;
  role_summary: string;
  jotform_id: string;
  accent_color: string;
  icon: string;
  category: string;
  status: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string | null;
}

export interface TrainerListenerItem {
  id: number;
  name: string;
  email: string;
  target_role: string;
  career_break_years: number | null;
  readiness_score: number;
  tasks_completed: number;
  tasks_total: number;
  progress_percent: number;
  assigned_tasks_total?: number;
  assigned_tasks_completed?: number;
  flags: string[];
  created_at: string;
}

export interface AdminDashboardKpis {
  total_users: number;
  listeners: number;
  trainers: number;
  active_users: number;
  tasks_completed: number;
  applications_drafted: number;
  applications_approved: number;
  average_readiness: number;
}

