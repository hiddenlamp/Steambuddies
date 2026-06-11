// src/pages/auth/ResetPassword.jsx
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/logo.png";
import { resetPasswordApi } from "../../api/auth.api";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  // ✅ safer token read (works reliably on refresh + when url changes)
  const token = useMemo(() => params.get("token") || "", [params.toString()]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!token) return false;
    if (loading) return false;
    if (password.length < 6) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [token, loading, password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus({ type: "", msg: "" });

    try {
      setLoading(true);

      // ✅ send newPassword (backend best practice)
      const res = await resetPasswordApi({ token, newPassword: password });

      setStatus({
        type: "success",
        msg: res?.message || "Password updated successfully! Please login.",
      });

      setTimeout(() => nav("/login"), 900);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err?.message || "Reset failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_60%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.22),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md max-h-full flex flex-col gap-4 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-3xl bg-white/5 border border-white/15 shadow-[0_18px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl px-6 py-7 md:px-8 md:py-9 flex flex-col min-h-0"
        >
          <div className="flex flex-col items-center text-center mb-5 shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-black/60 flex items-center justify-center mb-3 border border-white/20">
              <img src={logo} alt="Steam Buddies" className="w-12 h-12 object-contain" />
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold">
              Reset{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text">
                Password
              </span>
            </h1>

            <p className="mt-2 text-xs md:text-sm text-gray-300/90">
              Set a new password for your account.
            </p>
          </div>

          {!token ? (
            <div className="mb-3 shrink-0 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl px-3 py-2">
              Reset token not found. Please open the link from your email again.
            </div>
          ) : null}

          {status?.msg ? (
            <div
              className={cn(
                "mb-3 text-xs rounded-2xl px-3 py-2 border",
                status.type === "success"
                  ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                  : "text-red-300 bg-red-500/10 border-red-500/30"
              )}
            >
              {status.msg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 custom-scroll space-y-4 min-h-0">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-200">New password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || !token}
                  placeholder="Enter new password"
                  className={cn(
                    "w-full rounded-2xl bg-black/60 border border-white/15 px-4 py-2.5 text-sm outline-none",
                    "focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-500",
                    (loading || !token) && "opacity-70 cursor-not-allowed"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 hover:text-gray-100"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Minimum 6 characters recommended.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-200">Confirm password</label>
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !token}
                placeholder="Re-enter new password"
                className={cn(
                  "w-full rounded-2xl bg-black/60 border border-white/15 px-4 py-2.5 text-sm outline-none",
                  "focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-500",
                  (loading || !token) && "opacity-70 cursor-not-allowed"
                )}
              />
            </div>

            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.03, y: -1 } : {}}
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              className={cn(
                "mt-2 w-full py-2.5 rounded-full text-sm md:text-base font-semibold",
                "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500",
                "shadow-[0_10px_40px_rgba(59,130,246,0.8)]",
                !canSubmit && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? "Updating..." : "Update password"}
            </motion.button>
          </form>

          <div className="mt-4 shrink-0 text-center text-[11px] md:text-xs text-gray-400">
            Back to{" "}
            <button
              type="button"
              onClick={() => nav("/login")}
              className="text-cyan-300 hover:text-cyan-200 font-medium"
            >
              Login
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
