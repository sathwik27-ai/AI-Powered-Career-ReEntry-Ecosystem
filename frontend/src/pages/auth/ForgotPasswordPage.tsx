import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, Sparkles, KeyRound } from "lucide-react";
import { api } from "../../api/client";
import { ThemeToggle } from "../../theme/ThemeToggle";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSubmitted(true);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process password reset request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword({ token: resetToken, new_password: newPassword });
      setResetSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
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
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 shadow-jelly">
            <div className="mb-6 text-center">
              <span className="eyebrow text-jelly-blueberry">Security Recovery</span>
              <h1 className="mt-1 text-2xl font-extrabold text-ink">Reset Your Password</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Enter your account email to receive recovery instructions.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rosewood-600/20 bg-rosewood-100/50 p-3.5 text-sm text-rosewood-700">
                {error}
              </div>
            )}

            {resetSuccess ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
                <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  Password Updated Successfully!
                </h4>
                <p className="mt-2 text-xs text-ink-soft">
                  You can now sign in using your new credentials.
                </p>
                <Link
                  to="/login"
                  className="jelly-btn mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-blueberry px-5 py-2.5 text-sm font-bold text-white"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : submitted && resetToken ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="rounded-xl border border-jelly-purple/20 bg-jelly-purple/5 p-3 text-xs text-ink">
                  <span className="font-bold">Recovery Token Generated:</span> Token verified. Set your new password below.
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-ink-faint" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="field pl-10"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="jelly-btn flex h-11 w-full items-center justify-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-blueberry text-sm font-bold text-white disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRequestToken} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Account Email
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
                <button
                  type="submit"
                  disabled={loading}
                  className="jelly-btn flex h-11 w-full items-center justify-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-blueberry text-sm font-bold text-white disabled:opacity-50"
                >
                  {loading ? (
                    "Processing..."
                  ) : (
                    <>
                      <span>Send Recovery Instructions</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-line pt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
