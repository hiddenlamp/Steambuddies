import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import hero from "../../assets/onboarding.png";

export default function Welcome() {
  const nav = useNavigate();
  const handleNext = () => nav("/language");

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden flex items-center justify-center p-4 sm:p-6">

      {/* LIGHT GLOW BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,150,240,0.18),transparent_70%)]" />

      {/* MAIN CONTENT WRAPPER */}
      <div className="relative z-10 max-w-6xl w-full flex flex-col md:flex-row items-center md:items-center justify-center gap-10 md:gap-16">
        
        {/* LEFT: IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full md:w-1/2 flex justify-center"
        >
          <motion.img
            src={hero}
            alt="SteamBuddies"
            className="w-[85%] max-w-[420px] md:w-full md:max-w-[480px] object-contain"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </motion.div>

        {/* RIGHT: TEXT + CHIPS + BUTTON */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left"
        >
          {/* HEADING */}
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text">
              SteamBuddies
            </span>
          </h1>

          <p className="text-gray-300 mt-2 text-sm md:text-base">
            by Hidden Lamp
          </p>

          {/* EXTRA DESCRIPTION (mainly for big screen) */}
          <p className="mt-4 text-xs md:text-sm text-gray-300/90 max-w-md">
            SteamBuddies is a guided learning space for students to explore
            <span className="font-medium text-white"> Robotics, 3D Printing, Electronics, Scratch, IoT,</span> 
            and <span className="font-medium text-white">Coding</span> through structured modules and practical projects.
          </p>

          {/* FEATURE CHIPS */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex items-center gap-3 mt-5 mb-6"
          >
            <Chip icon="💡" text="Learn" />
            <Chip icon="🛠️" text="Build" />
            <Chip icon="🚀" text="Grow" />
          </motion.div>

          {/* SMALL BULLET POINTS (desktop me zyada useful) */}
          <ul className="hidden md:block text-sm text-gray-300/90 space-y-1 mb-4">
            <li>• Step-by-step lessons designed for classes 4–10</li>
            <li>• Projects that connect theory with real-world applications</li>
            <li>• Track progress, earn badges and build a strong portfolio</li>
          </ul>

          {/* NEXT BUTTON */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleNext}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-sm md:text-base font-semibold shadow-[0_8px_30px_rgba(59,130,246,0.6)]"
          >
            Next →
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

/* CHIP COMPONENT */
function Chip({ icon, text }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs md:text-sm font-medium flex items-center gap-1"
    >
      <span className="text-lg">{icon}</span>
      <span>{text}</span>
    </motion.div>
  );
}
