import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Public & Auth Pages
import LandingPage from "@/pages/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { UnauthorizedPage } from "@/pages/auth/UnauthorizedPage";

// Learner / Listener Pages
import { ListenerDashboard } from "@/pages/learner/ListenerDashboard";
import { ListenerIntakePage } from "@/pages/learner/ListenerIntakePage";
import { ListenerTutorPage } from "@/pages/learner/ListenerTutorPage";
import { ListenerJobScoutPage } from "@/pages/learner/ListenerJobScoutPage";
import { ListenerApplicationsPage } from "@/pages/learner/ListenerApplicationsPage";
import { ListenerProgressPage } from "@/pages/learner/ListenerProgressPage";
import { ListenerCoursesPage } from "@/pages/learner/ListenerCoursesPage";
import { ListenerNotificationsPage } from "@/pages/learner/ListenerNotificationsPage";
import { ListenerSettingsPage } from "@/pages/learner/ListenerSettingsPage";

// Shared Agent Hub Pages
import { AgentsHubPage } from "@/pages/AgentsHubPage";
import { AgentViewPage } from "@/pages/AgentViewPage";

// Trainer Pages
import { TrainerDashboard } from "@/pages/trainer/TrainerDashboard";
import { TrainerListenersPage } from "@/pages/trainer/TrainerListenersPage";
import { TrainerListenerDetailPage } from "@/pages/trainer/TrainerListenerDetailPage";
import { TrainerAssignTaskPage } from "@/pages/trainer/TrainerAssignTaskPage";
import { TrainerSessionsPage } from "@/pages/trainer/TrainerSessionsPage";
import { TrainerAssessmentsPage } from "@/pages/trainer/TrainerAssessmentsPage";
import { TrainerReportsPage } from "@/pages/trainer/TrainerReportsPage";
import { TrainerAgentsPage } from "@/pages/trainer/TrainerAgentsPage";
import { TrainerSettingsPage } from "@/pages/trainer/TrainerSettingsPage";

// Admin Pages
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminListenersPage } from "@/pages/admin/AdminListenersPage";
import { AdminTrainersPage } from "@/pages/admin/AdminTrainersPage";
import { AdminAdminsPage } from "@/pages/admin/AdminAdminsPage";
import { AdminRolesPage } from "@/pages/admin/AdminRolesPage";
import { AdminAgentsPage } from "@/pages/admin/AdminAgentsPage";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";
import { AdminDatabaseHealthPage } from "@/pages/admin/AdminDatabaseHealthPage";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";

// Original Core Pages (preserved for backwards-compatibility)
import DashboardPage from "@/pages/DashboardPage";
import LearningPage from "@/pages/LearningPage";
import InterviewPage from "@/pages/InterviewPage";
import OnboardingPage from "@/pages/OnboardingPage";
import ProfilePage from "@/pages/ProfilePage";
import SkillsPage from "@/pages/SkillsPage";
import OpportunitiesPage from "@/pages/OpportunitiesPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import AgentsPage from "@/pages/AgentsPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Learner / Listener Workspace */}
      <Route
        path="/app"
        element={
          <ProtectedRoute allowedRoles={["listener", "trainer", "admin"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ListenerDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="intake" element={<ListenerIntakePage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="journey" element={<LearningPage />} />
        <Route path="courses" element={<ListenerCoursesPage />} />
        <Route path="tutor" element={<ListenerTutorPage />} />
        <Route path="interview" element={<InterviewPage />} />
        <Route path="job-scout" element={<ListenerJobScoutPage />} />
        <Route path="applications" element={<ListenerApplicationsPage />} />
        <Route path="progress" element={<ListenerProgressPage />} />
        <Route path="agents" element={<AgentsHubPage />} />
        <Route path="agents/:agentKey" element={<AgentViewPage />} />
        <Route path="notifications" element={<ListenerNotificationsPage />} />
        <Route path="settings" element={<ListenerSettingsPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Trainer Workspace */}
      <Route
        path="/trainer"
        element={
          <ProtectedRoute allowedRoles={["trainer", "admin"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TrainerDashboard />} />
        <Route path="listeners" element={<TrainerListenersPage />} />
        <Route path="listeners/:id" element={<TrainerListenerDetailPage />} />
        <Route path="assign-task" element={<TrainerAssignTaskPage />} />
        <Route path="sessions" element={<TrainerSessionsPage />} />
        <Route path="assessments" element={<TrainerAssessmentsPage />} />
        <Route path="reports" element={<TrainerReportsPage />} />
        <Route path="agents" element={<TrainerAgentsPage />} />
        <Route path="agents/:agentKey" element={<AgentViewPage backUrl="/trainer/agents" />} />
        <Route path="settings" element={<TrainerSettingsPage />} />
      </Route>

      {/* Admin Workspace */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="listeners" element={<AdminListenersPage />} />
        <Route path="trainers" element={<AdminTrainersPage />} />
        <Route path="admins" element={<AdminAdminsPage />} />
        <Route path="roles" element={<AdminRolesPage />} />
        <Route path="agents" element={<AdminAgentsPage />} />
        <Route path="agents/:agentKey" element={<AgentViewPage backUrl="/admin/agents" />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="database" element={<AdminDatabaseHealthPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Redirect all legacy URLs directly to unified modern workspace */}
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/onboarding" element={<Navigate to="/app/intake" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/skills" element={<Navigate to="/app/skills" replace />} />
      <Route path="/learning" element={<Navigate to="/app/journey" replace />} />
      <Route path="/interview" element={<Navigate to="/app/interview" replace />} />
      <Route path="/opportunities" element={<Navigate to="/app/job-scout" replace />} />
      <Route path="/applications" element={<Navigate to="/app/applications" replace />} />
      <Route path="/agents" element={<Navigate to="/app/agents" replace />} />
      <Route path="/agents/:agentKey" element={<Navigate to="/app/agents" replace />} />

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
