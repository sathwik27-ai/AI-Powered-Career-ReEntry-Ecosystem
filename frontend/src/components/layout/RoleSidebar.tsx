import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Sparkles,
  Map,
  BookOpen,
  HelpCircle,
  Mic,
  Briefcase,
  FileText,
  BarChart3,
  Bot,
  Settings,
  Users,
  CheckSquare,
  Calendar,
  FileCheck,
  Shield,
  Database,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface RoleSidebarProps {
  onClose?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

export function RoleSidebar({ onClose }: RoleSidebarProps) {
  const { user } = useAuth();
  const role = user?.role || "listener";

  const listenerLinks: NavItem[] = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/profile", label: "My Profile", icon: User },
    { to: "/app/intake", label: "Profile Intake AI", icon: Sparkles, badge: "AI" },
    { to: "/app/skills", label: "Skill Gap Explainer", icon: TrendingUp, badge: "AI" },
    { to: "/app/journey", label: "Learning Roadmap", icon: Map },
    { to: "/app/courses", label: "My Courses", icon: BookOpen },
    { to: "/app/tutor", label: "Tutor Coach AI", icon: HelpCircle, badge: "AI" },
    { to: "/app/interview", label: "Interview Prep", icon: Mic },
    { to: "/app/job-scout", label: "Job Scout AI", icon: Briefcase, badge: "AI" },
    { to: "/app/applications", label: "Applications", icon: FileText },
    { to: "/app/progress", label: "Progress & Analytics", icon: BarChart3 },
    { to: "/app/agents", label: "All 6 AI Agents", icon: Bot, highlight: true },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ];

  const trainerLinks: NavItem[] = [
    { to: "/trainer", label: "Trainer Dashboard", icon: LayoutDashboard },
    { to: "/trainer/listeners", label: "My Learners", icon: Users },
    { to: "/trainer/assign-task", label: "Assign Tasks", icon: CheckSquare },
    { to: "/trainer/sessions", label: "Sessions", icon: Calendar },
    { to: "/trainer/assessments", label: "Assessments", icon: FileCheck },
    { to: "/trainer/reports", label: "Cohort Reports", icon: BarChart3 },
    { to: "/trainer/agents", label: "AI Mentorship Tools", icon: Bot, highlight: true },
    { to: "/trainer/settings", label: "Settings", icon: Settings },
  ];

  const adminLinks: NavItem[] = [
    { to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
    { to: "/admin/listeners", label: "Manage Learners", icon: Users },
    { to: "/admin/trainers", label: "Manage Trainers", icon: Users },
    { to: "/admin/admins", label: "Manage Admins", icon: Shield },
    { to: "/admin/roles", label: "Roles & Permissions", icon: Layers },
    { to: "/admin/agents", label: "AI Agent Registry", icon: Bot, highlight: true },
    { to: "/admin/analytics", label: "Platform Analytics", icon: BarChart3 },
    { to: "/admin/database", label: "Database Health", icon: Database },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const links = role === "admin" ? adminLinks : role === "trainer" ? trainerLinks : listenerLinks;

  return (
    <aside className="flex h-full flex-col justify-between overflow-y-auto border-r border-line bg-surface/95 px-3 py-4 backdrop-blur-md">
      <div className="space-y-1">
        <div className="mb-3 px-3">
          <span className="eyebrow text-ink-faint">
            {role === "admin" ? "Administration" : role === "trainer" ? "Trainer Workspace" : "Learner Workspace"}
          </span>
        </div>

        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/app" || link.to === "/trainer" || link.to === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-jelly-purple to-jelly-blueberry text-white shadow-jelly"
                    : link.highlight
                    ? "bg-jelly-purple/10 text-jelly-purple hover:bg-jelly-purple/20"
                    : "text-ink-soft hover:bg-paper-deep hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : link.highlight ? "text-jelly-purple" : "text-ink-faint"
                      }`}
                    />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-jelly-purple/15 text-jelly-purple"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="mt-6 border-t border-line pt-4 px-3">
        <div className="rounded-xl bg-paper-deep/70 p-3 text-xs text-ink-soft">
          <div className="font-bold text-ink">ReStartHer 2.0</div>
          <p className="mt-0.5 text-[11px] text-ink-faint">Adaptive AI Career Return Ecosystem</p>
        </div>
      </div>
    </aside>
  );
}
