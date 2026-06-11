// src/pages/auth/Register.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { registerStudentApi } from "../../api/auth.api";
import { getApiError } from "../../api/axios";
import AuthLayout from "./AuthLayout";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function Register() {
  const nav = useNavigate();
  const handleBack = () => nav(-1);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [student, setStudent] = useState({
    fullName: "",
    phone: "",
    className: "",
    school: "",
    password: "",
    confirmPassword: "",
  });

  const schoolOptions = useMemo(
    () => [
      "UPG high School Morangi",
      "KN +2 High School Ichak",
      "Aasram School Bhelwara",
      "Bihari Girls High School",
      "Kgbv churchu",
      "Project Girls high School Charhi",
      "UPG high school Ango Churchu",
      "KV+2 Arki Khunti",
      "UPG High School Tarub Khunti",
      "PM SHRI UPG MUM Tilmi , Karra Khunti",
      "Pitts Model School Gumia Bokaro",
    ],
    [],
  );

  const classOptions = useMemo(() => ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], []);

  // Generate a random suffix once so it doesn't change on every keystroke
  const [randomSuffix] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [copied, setCopied] = useState(false);

  const generatedStudentId = useMemo(() => {
    const cleanName = student.fullName.toLowerCase().replace(/[^a-z]/g, "");
    if (!cleanName) return "";

    // Take up to first 4 letters of the name and convert to uppercase
    const namePart = cleanName.slice(0, 4).toUpperCase();
    
    // Combine name with the fixed random suffix
    return `${namePart}-${randomSuffix}`;
  }, [student.fullName, randomSuffix]);

  const handleCopy = () => {
    if (!generatedStudentId) return;
    navigator.clipboard.writeText(generatedStudentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      if (student.password !== student.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (!student.className || !student.school) {
        setError("Please select both class and school.");
        return;
      }

      const payload = {
        fullName: student.fullName.trim(),
        email: generatedStudentId, // Use generated ID instead of email
        phone: student.phone.trim(),
        className: String(student.className).trim(),
        school: String(student.school).trim(),
        password: student.password,
      };

      await registerStudentApi(payload);
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
    <AuthLayout isPasswordFocused={isPasswordFocused} inputLength={student.fullName.length}>
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
                alt="Steam Buddies"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold">
                Create your{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text">
                  SteamBuddies
                </span>{" "}
                account
              </h1>
              <p className="mt-1 text-xs md:text-sm text-gray-300/90">
                Students can sign up here.
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
                  label="Student full name"
                  placeholder="Enter full name"
                  value={student.fullName}
                  onChange={(e) =>
                    setStudent((s) => ({ ...s, fullName: e.target.value }))
                  }
                  required
                />
                <Field
                  label="Phone number"
                  placeholder="Enter phone number"
                  value={student.phone}
                  onChange={(e) =>
                    setStudent((s) => ({ ...s, phone: e.target.value }))
                  }
                  required
                />

                {generatedStudentId && (
                  <div className="md:col-span-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3 mb-1 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-cyan-300 font-medium mb-1">Your Student ID (Use this to login):</p>
                      <p className="text-xl font-bold text-white tracking-wider">{generatedStudentId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 transition flex items-center justify-center"
                      title="Copy ID"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                )}

                <CustomSelect
                  label="Class"
                  value={student.className}
                  onChange={(val) => setStudent((s) => ({ ...s, className: val }))}
                  options={classOptions}
                  placeholder="Select class"
                  required
                />

                <CustomSelect
                  label="School name"
                  value={student.school}
                  onChange={(val) => setStudent((s) => ({ ...s, school: val }))}
                  options={schoolOptions}
                  placeholder="Select school"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Password"
                  type="password"
                  placeholder="Create password"
                  value={student.password}
                  onChange={(e) =>
                    setStudent((s) => ({ ...s, password: e.target.value }))
                  }
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                />
                <Field
                  label="Confirm password"
                  type="password"
                  placeholder="Re-enter password"
                  value={student.confirmPassword}
                  onChange={(e) =>
                    setStudent((s) => ({
                      ...s,
                      confirmPassword: e.target.value,
                    }))
                  }
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                />
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
              {loading ? "Creating..." : "Create student account"}
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
    </AuthLayout>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  onFocus,
  onBlur,
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
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-black/60 border border-white/15 px-4 py-2.5 text-sm outline-none
        focus:border-green-400 focus:ring-1 focus:ring-green-500 placeholder:text-gray-500 transition-colors"
      />
    </div>
  );
}

function CustomSelect({ label, value, onChange, options, placeholder, required }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1 relative" ref={ref}>
      <label className="text-xs font-medium text-gray-200">
        {label} {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div 
        className={`w-full rounded-2xl bg-black/60 border ${open ? 'border-cyan-400 ring-1 ring-cyan-500' : 'border-white/15'} px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors shadow-inner`}
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-white" : "text-gray-500"}>{value || placeholder}</span>
        <svg className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      
      {open && (
        <div className="absolute z-50 top-full mt-2 w-full max-h-56 overflow-y-auto rounded-2xl bg-[#0f172a] border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.9)] custom-scroll">
          {options.map((opt) => (
            <div 
              key={opt}
              className={`px-4 py-3 text-sm cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0 ${value === opt ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-300'}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
