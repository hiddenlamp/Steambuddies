import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import hero from "../../assets/language.webp";

export default function LanguageSelect() {
  const nav = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (!selected) return;
    // localStorage.setItem("lang", selected);
    nav("/login");
  };

  const handleBack = () => nav(-1);

  const copy = useMemo(
    () => ({
      title: "Choose your language",
      sub: "You can switch language later from settings any time.",
    }),
    []
  );

  return (
    <div className="relative h-[100svh] w-full bg-black text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.20),transparent_60%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.20),transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:18px_18px]" />

      {/* CONTENT (no scroll) */}
      <div className="relative z-10 h-full">
        <div className="mx-auto h-full w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-full flex flex-col">
            {/* TOP BAR */}
            <div className="pt-[max(env(safe-area-inset-top),14px)] shrink-0">
              <div className="flex items-center justify-between">
                
                <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.18em] text-white/60 uppercase">
                  Step 1 / 2
                </span>
              </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 min-h-0 grid items-center gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-10">
              {/* LEFT */}
              <div className="min-h-0 flex flex-col items-center lg:items-start justify-center">
                <motion.img
                  src={hero}
                  alt="Choose language"
                  className="
                    object-contain
                    w-[clamp(220px,55vw,520px)]
                    max-h-[34svh]
                    sm:max-h-[36svh]
                    lg:max-h-[44svh]
                  "
                  initial={{ y: -16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  className="mt-3 sm:mt-4 text-center lg:text-left w-full"
                >
                  <h1 className="text-[20px] sm:text-3xl md:text-4xl font-extrabold leading-tight">
                    {copy.title}
                  </h1>
                  <p className="mt-1.5 text-[11px] sm:text-sm text-gray-300/90 max-w-xl mx-auto lg:mx-0 line-clamp-2">
                    {copy.sub}
                  </p>
                </motion.div>
              </div>

              {/* RIGHT */}
              <div className="min-h-0 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.16, duration: 0.35 }}
                  className="
                    w-full max-w-xl mx-auto lg:mx-0
                    rounded-[26px]
                    border border-white/10
                    bg-white/5 backdrop-blur-xl
                    shadow-[0_20px_70px_rgba(0,0,0,0.45)]
                    p-3 sm:p-4
                  "
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <LanguageCard
                      label="English"
                      code="en"
                      description="Recommended for most content."
                      icon="🌐"
                      selected={selected === "en"}
                      onClick={() => setSelected("en")}
                    />
                    <LanguageCard
                      label="हिन्दी"
                      code="hi"
                      description="हिंदी में सीखने के लिए चुनें।"
                      icon="🇮🇳"
                      selected={selected === "hi"}
                      onClick={() => setSelected("hi")}
                    />
                  </div>

                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <div className="text-[10px] sm:text-xs text-white/65 font-semibold">
                      {selected ? `Selected: ${selected.toUpperCase()}` : "Select a language to continue."}
                    </div>

                    <motion.button
                      whileHover={selected ? { scale: 1.03 } : {}}
                      whileTap={selected ? { scale: 0.96 } : {}}
                      onClick={handleNext}
                      disabled={!selected}
                      className={`
                        w-full sm:w-auto
                        px-8 py-2.5 rounded-2xl
                        text-sm font-extrabold
                        transition-all
                        ${
                          selected
                            ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_10px_28px_rgba(59,130,246,0.60)]"
                            : "bg-white/10 text-white/50 cursor-not-allowed border border-white/10"
                        }
                      `}
                    >
                      Next →
                    </motion.button>
                  </div>
                </motion.div>

                
              </div>
            </div>

            {/* SAFE AREA BOTTOM (no scroll) */}
            <div className="h-[max(env(safe-area-inset-bottom),12px)] shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LanguageCard({ label, code, description, icon, selected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full text-left rounded-2xl
        px-4 py-3 sm:px-5 sm:py-4
        border transition-all flex items-center gap-3 sm:gap-4
        ${
          selected
            ? "border-cyan-400 bg-white/10 shadow-[0_0_22px_rgba(56,189,248,0.40)]"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        }
      `}
    >
      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-black/60 flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-sm sm:text-base truncate">{label}</span>
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-gray-400 shrink-0">
            {code.toUpperCase()}
          </span>
        </div>
        <p className="mt-1 text-[11px] sm:text-xs text-gray-300/80 line-clamp-2">
          {description}
        </p>
      </div>

      <div className={`w-4 h-4 rounded-full border shrink-0 ${selected ? "border-cyan-400 bg-cyan-400" : "border-gray-500"}`} />
    </motion.button>
  );
}
