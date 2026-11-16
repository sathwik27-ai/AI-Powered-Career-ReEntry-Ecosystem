import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import type { Dashboard, UserAgents } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { firstName, greeting, timeAgo } from "@/lib/format";
import { Button, ButtonLink, ErrorState, Pill, Skeleton } from "@/components/ui/primitives";
import { NextStep } from "@/components/dashboard/NextStep";
import { ReadinessPanel } from "@/components/dashboard/ReadinessPanel";
import { CareerSummaryCard } from "@/components/dashboard/CareerSummaryCard";
import { SkillGapsCard } from "@/components/dashboard/SkillGapsCard";
import { LearningProgressCard } from "@/components/dashboard/LearningProgressCard";
import { OpportunitiesCard } from "@/components/dashboard/OpportunitiesCard";
import { ActivityFeed, AgentRoster } from "@/components/dashboard/AgentActivity";
import { PlanHistory } from "@/components/dashboard/PlanHistory";
import { InterviewPrepCard } from "@/components/dashboard/InterviewPrepCard";

interface DashboardBundle {
  dashboard: Dashboard;
  agents: UserAgents;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { userId, setUserId } = useSession();
  const uid = user?.id || userId || 1;
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi<DashboardBundle>(
    uid === null
      ? null
      : async (signal) => {
          const [dashboard, agents] = await Promise.all([api.dashboard(uid, signal), api.userAgents(uid, signal)]);
          return { dashboard, agents };
        },
    [uid],
  );

  if (error?.code === "user_not_found") {
    return (
      <div className="max-w-xl">
        <ErrorState error={error} title="This session no longer exists" />
        <p className="mt-4 text-sm text-ink-soft">The backend database may have been reset. Start again to create a fresh plan.</p>
        <Button
          className="mt-5"
          onClick={() => {
            setUserId(null);
            navigate("/");
          }}
        >
          Start again
        </Button>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="Your plan could not be loaded" />;
  if (loading || !data) return <DashboardSkeleton />;

  const { dashboard: d, agents } = data;
  const plan = d.plan;
  const name = d.profile?.full_name ?? d.user.name;

  return (
    <div className="animate-rise">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">
            Dynamic Career Comeback Plan · v{plan.version}
            {plan.updated_at && ` · updated ${timeAgo(plan.updated_at)}`}
          </p>
          <h1 className="mt-1 page-title">
            {greeting()}, {firstName(name)}.
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-ink-soft">{plan.goal}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {d.user.is_demo && <Pill tone="ochre">Fictional demo persona</Pill>}
          <Pill tone={plan.data.ai_mode === "demo" ? "neutral" : "sage"}>
            {plan.data.ai_mode === "demo" ? "Rule-based demo agents" : "Claude-assisted agents"}
          </Pill>
        </div>
      </header>

      {!d.user.has_profile ? (
        <NoProfileYet />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:self-start">
            <NextStep plan={plan} />
          </div>
          <div className="lg:col-span-4">
            <ReadinessPanel readiness={plan.data.readiness} />
          </div>

          <div className="lg:col-span-4">
            <CareerSummaryCard summary={plan.data.career_summary} profile={d.profile} />
          </div>
          <div className="lg:col-span-8">
            <SkillGapsCard gaps={plan.data.priority_gaps} targetRole={plan.data.career_summary?.target_role ?? null} />
          </div>

          <div className="lg:col-span-7">
            <LearningProgressCard roadmap={plan.data.learning_roadmap} />
          </div>
          <div className="lg:col-span-5">
            <OpportunitiesCard items={plan.data.suitable_opportunities} />
          </div>

          <section className="mt-4 lg:col-span-12" aria-labelledby="agents-heading">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="eyebrow">Behind your plan</p>
                <h2 id="agents-heading" className="mt-1 section-title">
                  The agents working for you
                </h2>
              </div>
            </div>
            <AgentRoster agents={agents.agents} />
          </section>

          <div className="lg:col-span-8">
            <ActivityFeed logs={d.recent_activity} />
          </div>
          <div className="flex flex-col gap-5 lg:col-span-4">
            <PlanHistory changes={plan.change_log} />
            <InterviewPrepCard tips={plan.data.interview_preparation} completed={d.interviews.completed} latestScore={d.interviews.latest_score} />
          </div>
        </div>
      )}
    </div>
  );
}

function NoProfileYet() {
  return (
    <div className="card max-w-2xl p-8">
      <h2 className="section-title">Let's start with where you left off.</h2>
      <p className="mt-3 text-ink-soft">Your plan is built from your background. Upload a resume or answer a few questions and the agents will take it from there.</p>
      <ButtonLink to="/onboarding" className="mt-6">
        Add my background
      </ButtonLink>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your plan">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-4 h-12 w-96 max-w-full" />
      <div className="mt-10 grid gap-5 lg:grid-cols-12">
        <Skeleton className="h-80 lg:col-span-8" />
        <Skeleton className="h-80 lg:col-span-4" />
        <Skeleton className="h-64 lg:col-span-4" />
        <Skeleton className="h-64 lg:col-span-8" />
      </div>
    </div>
  );
}
