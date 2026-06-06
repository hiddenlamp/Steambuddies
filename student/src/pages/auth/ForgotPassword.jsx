import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { api, getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function ForgotPassword() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const emailOk = useMemo(() => {
    const e = email.trim().toLowerCase();
    return /^\S+@\S+\.\S+$/.test(e);
  }, [email]);

  const canSubmit = useMemo(() => !loading && emailOk, [loading, emailOk]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus({ type: "", msg: "" });

    const cleanEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      // ✅ REAL API CALL (Backend: /api/auth/forgot-password)
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });

      setStatus({
        type: "success",
        msg: res?.message || "Reset link sent! Please check your email inbox/spam.",
      });

      // Optional: auto redirect
      // setTimeout(() => nav("/login"), 2000);
    } catch (err) {
      setStatus({
        type: "error",
        msg: getApiError(err, "Failed to send reset link. Try again."),
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
              <img src={logo} alt="Hidden Lamp" className="w-12 h-12 object-contain" />
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-white/90">
              Forgot{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text">
                Password?
              </span>
            </h1>

            <p className="mt-2 text-xs md:text-sm text-gray-300/90">
              Enter your registered email to receive a password{" "}
              <br className="hidden sm:block" />
              reset link.
            </p>
          </div>

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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your email"
                className={cn(
                  "w-full rounded-2xl bg-black/60 border border-white/15 px-4 py-3 text-sm outline-none",
                  "focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-500",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              />
              {!emailOk && email.trim().length > 0 ? (
                <p className="text-[11px] text-red-300">Please enter a valid email.</p>
              ) : null}
            </div>

            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.03, y: -1 } : {}}
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              className={cn(
                "mt-2 w-full py-3 rounded-2xl text-sm md:text-base font-semibold",
                "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500",
                "shadow-[0_10px_40px_rgba(59,130,246,0.8)]",
                !canSubmit && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
