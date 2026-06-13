import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CuteLamp from "./CuteLamp";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function AuthLayout({ children, isPasswordFocused, inputLength }) {
  const [isLightOn, setIsLightOn] = useState(false);

  const isOff = !isLightOn || isPasswordFocused;

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0a0f18] text-white overflow-x-hidden flex flex-col md:flex-row">
      {/* Background Dimming when Lamp is Off */}
      <AnimatePresence>
        {isOff && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 bg-black/80 pointer-events-none transition-opacity duration-500"
          />
        )}
      </AnimatePresence>

      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Lamp Section */}
      <div className={cn(
        "relative z-10 w-full md:w-1/2 flex flex-col items-center justify-center p-4 pt-8 md:p-8",
        isLightOn ? "hidden md:flex" : "flex"
      )}>
        <CuteLamp 
          isOff={isOff} 
          inputLength={inputLength} 
          toggleLight={() => setIsLightOn(prev => !prev)} 
        />

        {/* Mobile Prompt Message */}
        <AnimatePresence>
          {!isLightOn && (
            <motion.div
              key="mobile-prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex md:hidden flex-col items-center text-center mt-4"
            >
              <h2 className="text-2xl font-bold text-white/90 mb-2 drop-shadow-md">
                It's dark here!
              </h2>
              <p className="text-sm text-gray-400 max-w-xs cursor-pointer" onClick={() => setIsLightOn(true)}>
                Tap or pull the lamp cord to turn on the light and reveal the login form.
              </p>
              <motion.div 
                 animate={{ y: [0, 8, 0] }} 
                 transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                 className="mt-4 text-2xl text-white/30"
               >
                 ↑
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Section */}
      <div className={cn(
        "relative z-20 w-full md:w-1/2 flex items-center justify-center p-4 pb-8 md:p-8",
        !isLightOn ? "hidden md:flex" : "flex"
      )}>
        <AnimatePresence mode="wait">
          {isLightOn ? (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                boxShadow: isPasswordFocused 
                  ? "0 0 40px rgba(132, 204, 22, 0.15), inset 0 0 20px rgba(132, 204, 22, 0.05)" 
                  : "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
              }}
              exit={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              className={cn(
                "relative w-full max-w-md max-h-[90dvh] md:max-h-[calc(100dvh-4rem)] rounded-[2rem] bg-gradient-to-b from-white/[0.05] to-white/[0.01] backdrop-blur-2xl flex flex-col shadow-2xl",
                "transition-colors duration-300"
              )}
            >
              {/* --- Animated Light Border --- */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none rounded-[2rem] overflow-hidden"
                style={{
                  padding: "1.5px",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                }}
              >
                {/* The spinning gradient */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                  className="absolute inset-[-100%] aspect-square m-auto opacity-80"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 60%, rgba(132,204,22,0.3) 80%, rgba(253,224,71,0.9) 100%)",
                  }}
                />
                <div className="absolute inset-0 bg-white/[0.08]" />
              </div>

              {/* Animated Inner Background Glows */}
              <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden">
                <motion.div
                  animate={{
                    x: ["-20%", "20%", "50%", "0%", "-20%"],
                    y: ["-20%", "50%", "0%", "20%", "-20%"],
                    scale: [1, 1.2, 0.8, 1.1, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                  className="absolute -top-10 -left-10 w-64 h-64 bg-lime-500/10 rounded-full blur-[70px]"
                />
                <motion.div
                  animate={{
                    x: ["20%", "-20%", "-50%", "0%", "20%"],
                    y: ["20%", "-50%", "0%", "-20%", "20%"],
                    scale: [1, 0.8, 1.2, 0.9, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                  className="absolute -bottom-10 -right-10 w-64 h-64 bg-yellow-500/10 rounded-full blur-[70px]"
                />
              </div>

              <div className="relative z-10 w-full h-full px-6 py-8 md:px-10 md:py-10 flex flex-col flex-1 min-h-0 overflow-y-auto custom-scroll">
                {children}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="prompt-message"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.5, type: "spring" }}
              className="hidden md:flex flex-col items-center text-center mt-[-20px] md:mt-0"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-2 drop-shadow-md">
                It's dark here!
              </h2>
              <p className="text-sm md:text-base text-gray-400 max-w-xs md:max-w-sm cursor-pointer" onClick={() => setIsLightOn(true)}>
                Tap or pull the lamp cord to turn on the light and reveal the login form.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
