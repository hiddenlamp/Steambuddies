import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Target, Zap, Check, X as XIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { API_BASE_URL } from "../../utils/data";

const THEMES = {
  cyan: { from: "from-cyan-400", to: "to-blue-600", text: "text-cyan-400", shadow: "shadow-cyan-500/20", ring: "ring-cyan-500", glow: "bg-cyan-400/20" },
  purple: { from: "from-purple-400", to: "to-indigo-600", text: "text-purple-400", shadow: "shadow-purple-500/20", ring: "ring-purple-500", glow: "bg-purple-400/20" },
  orange: { from: "from-orange-400", to: "to-rose-500", text: "text-orange-400", shadow: "shadow-orange-500/20", ring: "ring-orange-500", glow: "bg-orange-400/20" },
  emerald: { from: "from-emerald-400", to: "to-teal-600", text: "text-emerald-400", shadow: "shadow-emerald-500/20", ring: "ring-emerald-500", glow: "bg-emerald-400/20" },
  rose: { from: "from-rose-400", to: "to-pink-600", text: "text-rose-400", shadow: "shadow-rose-500/20", ring: "ring-rose-500", glow: "bg-rose-400/20" },
};

export default function DailyChallengeCard({ challenge, language, token, onAttemptSuccess }) {
  const [attempted, setAttempted] = useState(challenge.hasAttempted || false);
  const [selectedOpt, setSelectedOpt] = useState(challenge.selectedOpt ?? null);
  const [isCorrect, setIsCorrect] = useState(challenge.isCorrect ?? null);
  const [correctOptIndex, setCorrectOptIndex] = useState(challenge.correctOptIndex ?? null); 
  const [isShaking, setIsShaking] = useState(false);

  const tTheme = THEMES[challenge.theme] || THEMES.cyan;

  const handleSelect = async (index) => {
    if (attempted) return;
    
    setSelectedOpt(index);
    try {
      const res = await fetch(`${API_BASE_URL}/challenges/${challenge._id}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ selectedOptionIndex: index })
      });
      const data = await res.json();
      
      if (data.ok) {
        setIsCorrect(data.isCorrect);
        setAttempted(true);
        setCorrectOptIndex(data.correctOptionIndex);

        if (data.isCorrect) {
          // Fire Confetti!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#3b82f6', '#eab308']
          });
          onAttemptSuccess(data.awardedPoints, Math.floor(data.awardedPoints / 3));
        } else {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getOptionStyles = (index) => {
    if (!attempted) {
      return `bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-transparent hover:ring-2 ${tTheme.ring} cursor-pointer hover:shadow-md`;
    }
    
    if (index === correctOptIndex) {
      return "bg-emerald-500 border-transparent text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 z-10 scale-[1.02]";
    }
    
    if (index === selectedOpt && !isCorrect) {
      return "bg-rose-500 border-transparent text-white shadow-lg shadow-rose-500/25";
    }

    return "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed grayscale";
  };

  return (
    <motion.div
      animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-[32px] p-[2px] bg-gradient-to-tr ${tTheme.from} ${tTheme.to} shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
    >
      <div className="relative rounded-[30px] px-6 py-8 overflow-hidden backdrop-blur-2xl bg-white/95 dark:bg-slate-950/90">
        
        {/* Background Visuals */}
        <div className="absolute inset-0 bg-grid-mesh opacity-[0.05] pointer-events-none" />
        <div className={`absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl ${tTheme.glow}`} />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-gradient-to-r ${tTheme.from} ${tTheme.to} text-white shadow-sm flex items-center gap-1.5`}>
            <Zap size={12} className="fill-white" /> 
            {language === "en" ? "Today's Challenge" : "आज की चुनौती"}
          </span>
          <span className={`text-[12px] font-black flex items-center gap-1 ${tTheme.text}`}>
            <Award size={14} className="mb-0.5" />
            {challenge.points} XP
          </span>
        </div>

        {/* Question */}
        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight relative z-10 mb-2">
          {challenge.question}
        </h3>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-6 relative z-10">
          {language === "en" ? "Posted by" : "द्वारा पोस्ट किया गया"} {challenge.educatorId?.fullName || "Educator"}
        </p>

        {/* Options */}
        <div className="space-y-3 relative z-10">
          {challenge.options.map((opt, i) => (
            <button
              key={i}
              disabled={attempted}
              onClick={() => handleSelect(i)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${getOptionStyles(i)}`}
            >
              <span className="font-bold text-sm">{opt}</span>
              
              {attempted && i === correctOptIndex && (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={14} className="text-white drop-shadow-sm" />
                </div>
              )}
              {attempted && i === selectedOpt && !isCorrect && (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <XIcon size={14} className="text-white drop-shadow-sm" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Result Feedback Message */}
        <AnimatePresence>
          {attempted && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`mt-6 p-4 rounded-2xl flex flex-col items-center justify-center text-center border relative z-10 ${
                isCorrect 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : isCorrect === false
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400"
              }`}
            >
              <h4 className="font-black text-sm mb-1 uppercase tracking-wider">
                {isCorrect 
                  ? (language === "en" ? "Awesome Job!" : "बहुत बढ़िया!") 
                  : isCorrect === false
                    ? (language === "en" ? "Incorrect" : "गलत जवाब")
                    : (language === "en" ? "Already Attempted" : "पहले ही प्रयास किया")}
              </h4>
              <p className="text-xs font-semibold opacity-80">
                {isCorrect 
                  ? (language === "en" ? `You earned ${challenge.points} XP + Coins!` : `आपने ${challenge.points} XP + सिक्के जीते!`)
                  : isCorrect === false
                    ? (language === "en" ? "Better luck next time. See the correct answer above." : "अगली बार बेहतर किस्मत। सही उत्तर ऊपर देखें।")
                    : (language === "en" ? "You cannot attempt the same challenge twice." : "आप एक ही चुनौती का दो बार प्रयास नहीं कर सकते।")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
