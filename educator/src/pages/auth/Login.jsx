// educator/src/pages/auth/Login.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { loginApi } from "../../api/auth.api";
import { getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function Login() {
  const nav = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const extract = (res) => {
    const data = res?.data ?? res ?? {};
    const token =
      data?.accessToken ||
      data?.token ||
      data?.jwt ||
      data?.access_token ||
      data?.data?.accessToken ||
      data?.data?.token ||
      "";

    const refresh =
      data?.refreshToken ||
      data?.refresh_token ||
      data?.data?.refreshToken ||
      "";

    const user = data?.user || data?.data?.user || data?.profile || null;

    return { data, token, refresh, user };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", msg: "" });

    try {
      setLoading(true);

      const res = await loginApi({ role: "educator", identifier, password });
      const { data, token, refresh, user } = extract(res);

      if (!token) throw new Error("Access token not received from server.");

      localStorage.setItem("accessToken", token);
      if (refresh) localStorage.setItem("refreshToken", refresh);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      setStatus({ type: "success", msg: "Login successful!" });

      setTimeout(() => {
        nav("/educator");
      }, 200);
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setStatus({ type: "error", msg: getApiError(err, "Login failed") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#05070f] text-white overflow-hidden flex items-center justify-center p-4 sm:p-6">
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
              <img src={logo} alt="SteamBuddies" className="w-12 h-12 object-contain" />
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold">
              Educator Console
            </h1>

            <p className="mt-2 text-xs md:text-sm text-gray-300/90">
              Log in to manage courses, syllabus, activities and tests.
            </p>
          </div>

          {status?.msg ? (
            <div
              className={cn(
                "mb-3 shrink-0 text-xs rounded-2xl px-3 py-2 border",
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
              <label className="text-xs font-medium text-gray-200">
                Educator ID / Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Enter Educator ID or email"
                className="w-full rounded-2xl bg-black/60 border border-white/15 px-4 py-2.5 text-sm outline-none
                focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-200">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full rounded-2xl bg-black/60 border border-white/15 px-4 py-2.5 text-sm outline-none
                  focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 hover:text-gray-100"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span />
              <button type="button" className="hover:text-cyan-300">
                Forgot password?
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.03, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              className={cn(
                "mt-4 w-full shrink-0 py-2.5 rounded-full text-sm md:text-base font-semibold",
                "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_10px_40px_rgba(59,130,246,0.8)]",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>
          </form>

          <div className="mt-4 shrink-0 text-center text-[11px] md:text-xs text-gray-400">
            Don&apos;t have an educator account?{" "}
            <button
              type="button"
              onClick={() => nav("/register")}
              className="text-cyan-300 hover:text-cyan-200 font-medium"
            >
              Request Access / Sign Up
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
