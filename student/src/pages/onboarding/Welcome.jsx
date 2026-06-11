import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bot, Code, Cpu, MonitorPlay, Zap, Sparkles, Rocket, Lightbulb, Wrench } from "lucide-react";

export default function Welcome() {
  const nav = useNavigate();
  const handleNext = () => nav("/login");

  // Stagger variants for the right content
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-[100dvh] w-full relative bg-[#060a11] text-white overflow-x-hidden overflow-y-auto flex flex-col p-4 sm:p-6 justify-center">
      
      {/* --- Animated Background Glows --- */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-[-10%] left-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-cyan-600/20 rounded-full blur-[100px] md:blur-[150px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.3, 0.15],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="fixed bottom-[-10%] right-[-10%] w-[400px] md:w-[700px] h-[400px] md:h-[700px] bg-indigo-600/20 rounded-full blur-[100px] md:blur-[150px] pointer-events-none"
      />

      {/* BACKGROUND DOT GRID (Animated) */}
      <motion.div 
        animate={{ backgroundPosition: ["0px 0px", "24px 24px"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="fixed inset-0 opacity-[0.04] pointer-events-none [background-image:radial-gradient(rgba(255,255,255,1)_1.5px,transparent_1.5px)] [background-size:24px_24px]" 
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="relative z-10 max-w-6xl w-full mx-auto my-auto flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10 md:gap-12 lg:gap-16">
        
        {/* LEFT: ANIMATED HERO VISUAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="w-full md:w-1/2 flex justify-center items-center relative min-h-[260px] sm:min-h-[350px] md:min-h-[380px] lg:min-h-[420px]"
        >
          {/* Central Glowing Orb */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 bg-gradient-to-tr from-blue-500/40 via-cyan-400/30 to-purple-500/40 rounded-full blur-[35px] md:blur-[50px]"
          />
          
          {/* Core Main Icon Box */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 bg-white/[0.05] backdrop-blur-2xl border border-white/20 p-6 sm:p-8 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_0_30px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Bot className="w-14 h-14 sm:w-16 sm:h-16 md:w-16 md:h-16 lg:w-20 lg:h-20 text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] relative z-10" strokeWidth={1.5} />
            <Sparkles size={24} className="absolute top-2 right-2 md:top-3 md:right-3 lg:top-4 lg:right-4 text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />
          </motion.div>

          {/* Floating Orbiting Icons */}
          {/* Icon 1: Coding */}
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0], rotate: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-[8%] left-[8%] sm:top-10 sm:left-12 md:top-12 md:left-6 lg:top-16 lg:left-10 bg-blue-500/10 backdrop-blur-xl border border-blue-400/30 p-3 sm:p-4 md:p-4 lg:p-5 rounded-xl md:rounded-2xl shadow-xl"
          >
            <Code className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-blue-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]" />
          </motion.div>

          {/* Icon 2: Electronics / IoT */}
          <motion.div
            animate={{ y: [0, 25, 0], x: [0, -15, 0], rotate: [15, -5, 15] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[8%] right-[8%] sm:bottom-10 sm:right-12 md:bottom-16 md:right-6 lg:bottom-20 lg:right-8 bg-purple-500/10 backdrop-blur-xl border border-purple-400/30 p-3 sm:p-4 md:p-4 lg:p-5 rounded-xl md:rounded-2xl shadow-xl"
          >
            <Cpu className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 text-purple-300 drop-shadow-[0_0_10px_rgba(216,180,254,0.5)]" />
          </motion.div>

          {/* Icon 3: Scratch / Fun */}
          <motion.div
            animate={{ y: [0, -15, 0], x: [0, -20, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-[20%] left-[2%] sm:bottom-20 sm:left-6 md:bottom-24 md:left-2 lg:bottom-28 lg:left-2 bg-pink-500/10 backdrop-blur-xl border border-pink-400/30 p-2 sm:p-3 md:p-3 lg:p-4 rounded-lg md:rounded-2xl shadow-xl"
          >
            <MonitorPlay className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-pink-300 drop-shadow-[0_0_10px_rgba(249,168,212,0.5)]" />
          </motion.div>

          {/* Icon 4: Energy / Robotics */}
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, 20, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute top-[20%] right-[2%] sm:top-20 sm:right-6 md:top-20 md:right-0 lg:top-24 lg:right-0 bg-yellow-500/10 backdrop-blur-xl border border-yellow-400/30 p-2 sm:p-3 md:p-3 lg:p-4 rounded-lg md:rounded-2xl shadow-xl"
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" />
          </motion.div>
        </motion.div>

        {/* RIGHT: TEXT + CHIPS + BUTTON */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left relative z-10"
        >
          {/* HEADING */}
          <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-transparent bg-clip-text drop-shadow-[0_0_20px_rgba(6,182,212,0.3)] block sm:inline mt-1 sm:mt-0">
              SteamBuddies
            </span>
          </motion.h1>

          <motion.div variants={itemVariants} className="flex items-center gap-3 mt-2 lg:mt-3 text-gray-400 font-medium">
            <div className="h-[1px] w-8 bg-gray-600 hidden md:block" />
            <span className="uppercase tracking-widest text-[10px] sm:text-xs font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">by Hidden Lamp</span>
          </motion.div>

          {/* EXTRA DESCRIPTION */}
          <motion.p variants={itemVariants} className="mt-4 sm:mt-5 lg:mt-6 text-sm sm:text-base md:text-sm lg:text-lg text-gray-300/90 max-w-lg leading-relaxed font-light px-2 sm:px-0">
            A guided space where imagination meets technology. 
            <span className="font-semibold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] block mt-1"> Code the future, build intelligent robots, design 3D wonders, </span> 
            and bring your wildest ideas to life through hands-on projects!
          </motion.p>

          {/* FEATURE CHIPS */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 md:gap-3 lg:gap-4 mt-5 md:mt-5 lg:mt-8 mb-5 md:mb-5 lg:mb-8"
          >
            <Chip icon={<Lightbulb className="w-4 h-4 md:w-4 lg:w-5 md:h-4 lg:h-5 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]"/>} text="Learn" color="from-yellow-500/20 to-yellow-600/5" border="border-yellow-500/30" textColor="text-yellow-100" />
            <Chip icon={<Wrench className="w-4 h-4 md:w-4 lg:w-5 md:h-4 lg:h-5 text-orange-300 drop-shadow-[0_0_8px_rgba(253,186,116,0.8)]"/>} text="Build" color="from-orange-500/20 to-orange-600/5" border="border-orange-500/30" textColor="text-orange-100" />
            <Chip icon={<Rocket className="w-4 h-4 md:w-4 lg:w-5 md:h-4 lg:h-5 text-rose-300 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]"/>} text="Grow" color="from-rose-500/20 to-rose-600/5" border="border-rose-500/30" textColor="text-rose-100" />
          </motion.div>

          {/* SMALL BULLET POINTS */}
          <motion.ul variants={itemVariants} className="hidden md:flex flex-col gap-3 lg:gap-4 text-xs md:text-sm lg:text-base text-gray-300 mb-6 lg:mb-8 w-full max-w-lg">
            <li className="flex items-center gap-3 lg:gap-4 group bg-white/[0.02] p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-white/[0.05] hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />
              </div>
              <span className="group-hover:text-white font-medium transition-colors">Step-by-step interactive lessons designed for <span className="text-cyan-300 font-bold">classes 4–12</span></span>
            </li>
            <li className="flex items-center gap-3 lg:gap-4 group bg-white/[0.02] p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-white/[0.05] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]" />
              </div>
              <span className="group-hover:text-white font-medium transition-colors">Projects that connect <span className="text-blue-300 font-bold">theory</span> with real-world applications</span>
            </li>
            <li className="flex items-center gap-3 lg:gap-4 group bg-white/[0.02] p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-white/[0.05] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,1)]" />
              </div>
              <span className="group-hover:text-white font-medium transition-colors">Track progress, earn <span className="text-purple-300 font-bold">badges</span> and build a strong portfolio</span>
            </li>
          </motion.ul>

          {/* NEXT BUTTON */}
          <motion.div variants={itemVariants} className="w-full sm:w-auto pb-2 sm:pb-0">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              className="w-full sm:w-auto group relative overflow-hidden px-8 md:px-10 lg:px-12 py-3.5 lg:py-4 rounded-xl lg:rounded-2xl text-white text-sm md:text-base lg:text-lg font-bold shadow-[0_10px_30px_-10px_rgba(6,182,212,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(6,182,212,0.8)] transition-all bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 border border-white/10"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
              <span className="relative z-10 flex items-center justify-center gap-2 lg:gap-3">
                Let's Get Started <span className="text-lg lg:text-xl group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </motion.button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

/* CHIP COMPONENT */
function Chip({ icon, text, color = "from-white/10 to-white/5", border = "border-white/10", textColor = "text-gray-100" }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.05 }}
      className={`px-3 py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 rounded-xl bg-gradient-to-br ${color} border ${border} backdrop-blur-lg text-xs md:text-sm lg:text-base font-bold flex items-center gap-1.5 md:gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-colors relative overflow-hidden group`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="flex items-center justify-center relative z-10">{icon}</span>
      <span className={`${textColor} tracking-wide relative z-10 drop-shadow-sm`}>{text}</span>
    </motion.div>
  );
}
