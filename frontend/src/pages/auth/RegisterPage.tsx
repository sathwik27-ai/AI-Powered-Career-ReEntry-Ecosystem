import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Sparkles, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../../theme/ThemeToggle";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isWomanVerified, setIsWomanVerified] = useState(true);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isWomanVerified) {
      setError("ReStartHer is exclusively dedicated to women returning to the workforce or advancing in tech. Please confirm your eligibility to continue.");
      return;
    }
    if (!agreed) {
      setError("Please accept the terms and privacy consent to proceed.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const redirectUrl = await register(name, email, password, confirmPassword, isWomanVerified);
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err?.message || "Registration failed. An account with this email may already exist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
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
            to="/login"
            className="text-sm font-bold text-plum-600 hover:text-plum-700 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 shadow-jelly">
            <div className="mb-6 text-center">
              <span className="eyebrow text-jelly-strawberry">Begin Your Comeback</span>
              <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Create Learner Account</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Join thousands of women returning to tech with adaptive learning roadmaps and AI coaching.
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
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-ink-faint" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Raman"
                    className="field pl-10"
                  />
                </div>
              </div>

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
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-ink-faint" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-ink-faint" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="field pl-10"
                  />
                </div>
              </div>

              {/* Mandatory Women Verification Check */}
              <div className="rounded-2xl border border-jelly-strawberry/30 bg-jelly-strawberry/5 p-3.5 transition-all hover:bg-jelly-strawberry/10">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="woman_verify"
                    required
                    checked={isWomanVerified}
                    onChange={(e) => setIsWomanVerified(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-jelly-strawberry text-jelly-strawberry focus:ring-jelly-strawberry"
                  />
                  <label htmlFor="woman_verify" className="text-xs font-bold text-ink leading-snug cursor-pointer">
                    <span className="flex items-center gap-1.5 text-jelly-strawberry">
                      <Sparkles className="h-3.5 w-3.5" />
                      Women in Tech Eligibility Verification
                    </span>
                    <span className="block mt-1 font-medium text-ink-soft text-[11px] leading-relaxed">
                      I verify and confirm that I identify as a woman seeking to return to the workforce, transition, or accelerate my career in technology.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="consent"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-line text-plum-600 focus:ring-plum-500"
                />
                <label htmlFor="consent" className="text-xs text-ink-soft cursor-pointer">
                  I agree to the ReStartHer Terms of Service and Privacy Policy. I consent to having my resume securely analyzed for skill gap identification.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="jelly-btn mt-2 flex h-11 w-full items-center justify-center gap-2 bg-gradient-to-r from-jelly-strawberry to-jelly-purple text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-ink-soft">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-plum-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
