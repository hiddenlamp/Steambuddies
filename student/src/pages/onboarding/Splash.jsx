import { motion } from "framer-motion";
import logo from "../../assets/logo.png";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => nav("/welcome"), 2600);
    return () => clearTimeout(t);
  }, [nav]);

  const title = "SteamBuddies";

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black text-white flex items-center justify-center p-4">

      {/* BACKGROUND GRADIENT GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_60%)]" />

      {/* FLOATING GLOW ORB LEFT */}
      <motion.div
        className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-cyan-400/20 blur-3xl"
        animate={{ y: [0, -30, 0], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: "mirror" }}
      />

      {/* FLOATING GLOW ORB RIGHT */}
      <motion.div
        className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl"
        animate={{ y: [0, 20, 0], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
      />

      {/* MAIN CARD CONTAINER */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotateX: -20 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-[340px] bg-black/40 border border-white/10 rounded-3xl p-6 shadow-[0_10px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        {/* LOGO + ANIMATED CIRCLE */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
          className="relative flex items-center justify-center mx-auto"
        >

          {/* OUTER NEON RING */}
          <motion.div
            className="absolute w-28 h-28 rounded-full border-[3px] border-cyan-400/40"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.06, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          />

          {/* INNER PURPLE RING */}
          <motion.div
            className="absolute w-[88px] h-[88px] rounded-full border border-purple-500/30"
            animate={{
              rotate: [-360, 0],
              scale: [1, 1.05, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          />

          {/* AMBIENT GLOW */}
          <motion.div
            className="absolute w-36 h-36 rounded-full bg-cyan-400/10 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.45, 0.9, 0.45],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "mirror",
            }}
          />

          {/* LOGO */}
          <motion.img
            src={logo}
            className="relative w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]"
            initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>

        {/* APP NAME */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-7 text-center text-3xl font-extrabold tracking-wide"
        >
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]">
            {title}
          </span>
        </motion.h1>

        {/* DESCRIPTION */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="text-xs text-center text-gray-300 mt-3 leading-relaxed"
        >
          Robotics • Electronics • 3D Printing • Scratch • IoT • Coding  
          <br />
          Unlock your creative power ⚡
        </motion.p>

        {/* LOADING BAR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-6 w-full h-1.5 rounded-full bg-white/10 overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 1.7, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      {/* TAGLINE */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-[11px] uppercase tracking-[0.25em] text-gray-500"
      >
        Powered by Steam Buddies • Learn • Create • Rise 🚀
      </motion.p>
    </div>
  );
}
