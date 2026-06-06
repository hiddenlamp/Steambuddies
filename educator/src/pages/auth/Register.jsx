// educator/src/pages/auth/Register.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { registerEducatorApi } from "../../api/auth.api";
import { getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function Register() {
  const nav = useNavigate();
  const handleBack = () => nav(-1);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [educator, setEducator] = useState({
    fullName: "",
    email: "",
    educatorId: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      if (educator.password !== educator.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const payload = {
        fullName: educator.fullName.trim(),
        email: educator.email.trim(),
        educatorId: educator.educatorId.trim(),
        password: educator.password,
      };

      await registerEducatorApi(payload);
      nav("/login");
    } catch (err) {
      const msg = getApiError(err, "Registration failed. Please try again.");
      setError(msg);
      console.error("REGISTER ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#05070f] text-white overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_60%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.22),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-2xl max-h-full flex flex-col gap-4 min-h-0">
        <div>
          <motion.button
            onClick={handleBack}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{
              scale: 1.06,
              x: -3,
              boxShadow: "0 0 18px rgba(56,189,248,0.7)",
            }}
            whileTap={{ scale: 0.94, boxShadow: "0 0 0 rgba(0,0,0,0)" }}
            className="inline-flex items-center gap-3 px-4 py-2 
            text-sm font-medium rounded-2xl
            bg-white/10 backdrop-blur-md border border-white/20
            text-white hover:text-cyan-300 shadow-[0_4px_20px_rgba(0,0,0,0.35)]
            transition-all duration-300 active:scale-95 w-fit"
          >
            <motion.span
              animate={{ x: [0, -2, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "mirror",
              }}
              className="text-xl text-cyan-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.9)]"
            >
              ←
            </motion.span>
            <span className="hidden sm:inline text-xs md:text-sm uppercase tracking-[0.15em]">
              Back
            </span>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-3xl bg-white/5 border border-white/15 shadow-[0_18px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl px-6 py-7 md:px-8 md:py-9 flex flex-col min-h-0"
        >
          <div className="flex items-center gap-4 mb-5 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-black/60 flex items-center justify-center border border-white/20">
              <img
                src={logo}
                alt="SteamBuddies"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold">
                Educator Registration
              </h1>
              <p className="mt-1 text-xs md:text-sm text-gray-300/90">
                Register as a verified Educator to manage class materials.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-3 shrink-0 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-3 py-2">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto pr-2 custom-scroll space-y-4 min-h-0"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={educator.fullName}
                  onChange={(e) =>
                    setEducator((s) => ({ ...s, fullName: e.target.value }))
                  }
                  required
                />
                <Field
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  value={educator.email}
                  onChange={(e) =>
                    setEducator((s) => ({ ...s, email: e.target.value }))
                  }
                  required
                />
                <Field
                  label="Educator ID"
                  placeholder="Enter your assigned Educator ID"
                  value={educator.educatorId}
                  onChange={(e) =>
                    setEducator((s) => ({
                      ...s,
                      educatorId: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Password"
                  type="password"
                  placeholder="Create password"
                  value={educator.password}
                  onChange={(e) =>
                    setEducator((s) => ({ ...s, password: e.target.value }))
                  }
                  required
                />
                <Field
                  label="Confirm password"
                  type="password"
                  placeholder="Re-enter password"
                  value={educator.confirmPassword}
                  onChange={(e) =>
                    setEducator((s) => ({
                      ...s,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] text-gray-300/90">
                Note: Educator registrations require verification and confirmation by admin before you can access school dashboards.
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.02, y: -1 }}
              whileTap={loading ? {} : { scale: 0.97 }}
              className={cn(
                "mt-4 w-full py-2.5 shrink-0 rounded-full text-sm md:text-base font-semibold",
                "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500",
                "shadow-[0_10px_40px_rgba(59,130,246,0.8)]",
                loading && "opacity-70 cursor-not-allowed",
              )}
            >
              {loading ? "Registering..." : "Create Educator Account"}
            </motion.button>
          </form>

          <div className="mt-4 text-center text-[11px] md:text-xs shrink-0 text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => nav("/login")}
              className="text-cyan-300 hover:text-cyan-200 font-medium"
            >
              Login here
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-200">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-black/60 border border-white/15 px-4 py-2.5 text-sm outline-none
        focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-500"
      />
    </div>
  );
}
