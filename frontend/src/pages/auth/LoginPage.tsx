import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Sparkles, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../../theme/ThemeToggle";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const redirectUrl = await login(email, password);
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Top bar with ThemeToggle */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-line">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-jelly-purple to-jelly-strawberry text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-ink">
            ReStart<span className="text-jelly-strawberry">Her</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/register"
            className="text-sm font-bold text-plum-600 hover:text-plum-700 hover:underline"
          >
            Create account
          </Link>
        </div>
      </header>

      {/* Main Form container */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Jelly Hero card */}
          <div className="card p-8 shadow-jelly">
            <div className="mb-6 text-center">
              <span className="eyebrow text-jelly-purple">Welcome Back</span>
              <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Sign in to your account</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Continue your career comeback journey with your dedicated AI agents and mentors.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rosewood-600/20 bg-rosewood-100/50 p-3.5 text-sm text-rosewood-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-ink-faint" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="field pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-plum-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-ink-faint" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-ink-faint hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="jelly-btn mt-2 flex h-11 w-full items-center justify-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-blueberry text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick-fill demo section */}
            <div className="mt-8 border-t border-line pt-6">
              <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-faint">
                <UserCheck className="h-3.5 w-3.5 text-jelly-purple" />
                <span>Instant Demo Login (Judge / Tester)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("priya@restarther.org", "PriyaSecure123!")}
                  className="rounded-xl border border-line bg-paper-deep/60 px-2.5 py-2 text-center text-xs font-bold text-ink transition hover:border-jelly-purple hover:bg-white"
                >
                  <div className="text-jelly-strawberry">Learner</div>
                  <div className="text-[10px] font-normal text-ink-faint">Priya Raman</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("trainer@restarther.org", "TrainerSecure123!")}
                  className="rounded-xl border border-line bg-paper-deep/60 px-2.5 py-2 text-center text-xs font-bold text-ink transition hover:border-jelly-purple hover:bg-white"
                >
                  <div className="text-jelly-lime">Trainer</div>
                  <div className="text-[10px] font-normal text-ink-faint">Ananya Mentor</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("admin@restarther.org", "AdminSecure123!")}
                  className="rounded-xl border border-line bg-paper-deep/60 px-2.5 py-2 text-center text-xs font-bold text-ink transition hover:border-jelly-purple hover:bg-white"
                >
                  <div className="text-jelly-purple">Admin</div>
                  <div className="text-[10px] font-normal text-ink-faint">Platform Ops</div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom link */}
          <p className="mt-6 text-center text-xs text-ink-soft">
            Don't have an account yet?{" "}
            <Link to="/register" className="font-bold text-plum-600 hover:underline">
              Create a free learner account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
