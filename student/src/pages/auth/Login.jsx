// src/pages/auth/Login.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { loginApi } from "../../api/auth.api";
import { getApiError } from "../../api/axios";
import { setAccessToken } from "../../api/courses.api";
import AuthLayout from "./AuthLayout";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function Login() {
  const nav = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  
  // States for the lamp animation
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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

      const res = await loginApi({ role: "student", identifier, password });
      const { data, token, refresh, user } = extract(res);

      if (!token) throw new Error("Access token not received from server.");

      localStorage.setItem("accessToken", token);
      if (refresh) localStorage.setItem("refreshToken", refresh);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      setAccessToken(token);
      setStatus({ type: "success", msg: "Login successful!" });

      setTimeout(() => {
        nav("/home");
      }, 200);
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setStatus({ type: "error", msg: getApiError(err, "Login failed") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout isPasswordFocused={isPasswordFocused} inputLength={identifier.length}>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
          }
        }}
        className="flex flex-col h-full"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
          }}
          className="flex flex-col items-center text-center mb-6 shrink-0"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <img src={logo} alt="Steam Buddies" className="w-10 h-10 object-contain drop-shadow-md" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Login to{" "}
            <span className="bg-gradient-to-r from-lime-400 to-yellow-400 text-transparent bg-clip-text drop-shadow-sm">
              SteamBuddies
            </span>
          </h1>

          <p className="mt-2 text-xs md:text-sm text-gray-400">
            Access your STEAM lab content, projects and progress.
          </p>
        </motion.div>

        {status?.msg ? (
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              show: { opacity: 1, scale: 1 }
            }}
            className={cn(
              "mb-4 shrink-0 text-xs rounded-xl px-4 py-3 border backdrop-blur-sm",
              status.type === "success"
                ? "text-lime-300 bg-lime-500/10 border-lime-500/20 shadow-[0_0_15px_rgba(132,204,22,0.1)]"
                : "text-red-300 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
            )}
          >
            {status.msg}
          </motion.div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 custom-scroll space-y-4 min-h-0">
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -10 },
              show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
            }}
            className="space-y-1.5"
          >
            <label className="text-[13px] font-medium text-gray-300 ml-1">
              User ID
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="Enter your ID"
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none
              focus:border-lime-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-lime-400/10 placeholder:text-gray-500 transition-all duration-300"
            />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, x: -10 },
              show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
            }}
            className="space-y-1.5"
          >
            <label className="text-[13px] font-medium text-gray-300 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                placeholder="Enter your password"
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none
                focus:border-yellow-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-yellow-400/10 placeholder:text-gray-500 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-gray-400 hover:text-white transition-colors px-2 py-1 bg-white/5 rounded-md"
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1 }
            }}
            className="flex items-center justify-end text-[11px] text-gray-400 pt-1"
          >
            <button type="button" className="hover:text-lime-300 transition-colors" onClick={() => nav("/forgot-password")}>
              Forgot password?
            </button>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
            }}
            className="pt-2"
          >
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className={cn(
                "w-full py-3 rounded-xl text-sm md:text-base font-bold tracking-wide relative overflow-hidden group border border-lime-500/20",
                loading ? "bg-white/10 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-lime-500 to-yellow-500 text-slate-900 shadow-[0_10px_30px_-10px_rgba(132,204,22,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(132,204,22,0.8)] transition-all duration-300"
              )}
            >
              <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">{loading ? "Logging in..." : "Login"}</span>
            </motion.button>
          </motion.div>
        </form>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { delay: 0.4 } }
          }}
          className="mt-6 shrink-0 text-center text-xs text-gray-400"
        >
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => nav("/register")}
            className="text-lime-400 hover:text-lime-300 font-semibold transition-colors drop-shadow-md"
          >
            Create one
          </button>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
