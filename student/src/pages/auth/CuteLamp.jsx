import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export default function CuteLamp({ isOff, inputLength, toggleLight }) {
  // Move eyes slightly left to right based on text length
  const eyeOffsetX = Math.min(Math.max((inputLength - 10) * 1.2, -12), 12);
  
  const pullY = useMotionValue(0);
  const baseCy = useMotionValue(isOff ? 350 : 320);

  useEffect(() => {
    animate(baseCy, isOff ? 350 : 320, { type: "spring", stiffness: 400, damping: 15 });
  }, [isOff, baseCy]);

  // Automated hint animation to pull the cord
  useEffect(() => {
    let controls;
    if (isOff) {
      const timeout = setTimeout(() => {
        controls = animate(pullY, [0, 25, 0], {
          duration: 1.2,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: "easeInOut"
        });
      }, 800);
      return () => {
        clearTimeout(timeout);
        if (controls) controls.stop();
      };
    } else {
      pullY.set(0);
    }
  }, [isOff, pullY]);

  const totalY = useTransform(
    [baseCy, pullY],
    ([base, pull]) => base + pull
  );
  
  const cordPath = useTransform(totalY, y => `M 125 220 L 100 ${y}`);

  return (
    <div className="relative w-full h-[260px] sm:h-[300px] md:h-[450px] flex justify-center items-end overflow-visible select-none scale-[0.65] sm:scale-90 md:scale-100 origin-bottom">
      
      <svg width="350" height="450" viewBox="0 0 350 450" className="relative z-10 overflow-visible pointer-events-none">
        <defs>
          <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(253, 224, 71, 0.9)" />
            <stop offset="100%" stopColor="rgba(253, 224, 71, 0)" />
          </linearGradient>
          <radialGradient id="bulbGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#eab308" />
          </radialGradient>
        </defs>

        {/* --- Lamp Stand --- */}
        {/* Base shadow */}
        <ellipse cx="175" cy="400" rx="85" ry="12" fill="rgba(0,0,0,0.5)" className="blur-sm" />
        {/* Base */}
        <ellipse cx="175" cy="390" rx="75" ry="15" fill="#94a3b8" />
        <ellipse cx="175" cy="385" rx="75" ry="15" fill="#cbd5e1" />
        
        {/* Pole */}
        <rect x="160" y="220" width="30" height="170" fill="#94a3b8" />
        {/* Pole highlight */}
        <rect x="160" y="220" width="8" height="170" fill="#cbd5e1" />

        {/* --- Light Beam --- */}
        <motion.polygon 
          points="175,220 -150,450 500,450" 
          fill="url(#lightGrad)"
          animate={{ opacity: isOff ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          style={{ transformOrigin: "175px 220px" }}
        />

        {/* --- Pull Cord --- */}
        <motion.path 
          d={cordPath} 
          stroke="#f8fafc" 
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Pull string knob and draggable handle */}
        <motion.g
          className="pointer-events-auto"
          drag="y"
          dragConstraints={{ top: 0, bottom: 60 }}
          dragElastic={0.2}
          dragSnapToOrigin={true}
          onDragStart={() => pullY.stop()}
          onDragEnd={(e, info) => {
            if (info.offset.y > 20 && toggleLight) {
              toggleLight();
            }
          }}
          onClick={() => {
            if (toggleLight) toggleLight();
          }}
          style={{ y: pullY, cursor: "grab", touchAction: "none" }}
          whileTap={{ cursor: "grabbing" }}
        >
          {/* Visible knob */}
          <motion.circle
            cx="100"
            cy={baseCy}
            r="6"
            fill="#cbd5e1"
          />
          {/* Invisible hit area for easier dragging */}
          <motion.circle 
            cx="100" 
            cy={baseCy} 
            r="30" 
            fill="transparent" 
          />
        </motion.g>

        {/* --- Lamp Head (Shade) --- */}
        {/* Inner bulb glow */}
        <ellipse cx="175" cy="235" rx="55" ry="15" fill="url(#bulbGrad)" />
        <motion.ellipse 
          cx="175" cy="235" rx="55" ry="15" fill="#334155" 
          animate={{ opacity: isOff ? 1 : 0 }}
        />

        {/* Shade Outer */}
        <polygon points="125,90 225,90 260,230 90,230" fill="#65a30d" />
        <polygon points="125,90 175,90 190,230 90,230" fill="#84cc16" opacity="0.6" />

        {/* Top rim */}
        <ellipse cx="175" cy="90" rx="50" ry="10" fill="#4d7c0f" />

        {/* Bottom rim */}
        <path d="M 90 230 Q 175 250 260 230" fill="none" stroke="#4d7c0f" strokeWidth="4" />

        {/* --- Face --- */}
        <motion.g animate={{ x: isOff ? 0 : eyeOffsetX }} transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}>
          {/* Left Eye */}
          <motion.path 
            d="M 140 160 Q 148 150 155 160" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ 
              d: isOff ? "M 140 160 Q 148 165 155 160" : "M 140 160 Q 148 150 155 160",
            }}
          />
          <motion.circle 
            cx="147.5" cy="158" r="3" fill="#1e293b" 
            animate={{ opacity: isOff ? 0 : 1 }}
          />
          
          {/* Right Eye */}
          <motion.path 
            d="M 195 160 Q 203 150 210 160" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ 
              d: isOff ? "M 195 160 Q 203 165 210 160" : "M 195 160 Q 203 150 210 160",
            }}
          />
          <motion.circle 
            cx="202.5" cy="158" r="3" fill="#1e293b" 
            animate={{ opacity: isOff ? 0 : 1 }}
          />

          {/* Mouth */}
          <motion.path 
            d="M 162 175 Q 175 195 188 175" 
            fill={isOff ? "transparent" : "#1e293b"}
            stroke="#1e293b" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            animate={{ 
              d: isOff ? "M 168 180 Q 175 178 182 180" : "M 162 175 Q 175 195 188 175",
              fill: isOff ? "transparent" : "#1e293b"
            }}
          />
          {/* Tongue */}
          <motion.path 
            d="M 168 182 Q 175 190 182 182 Z" 
            fill="#ef4444" 
            animate={{ opacity: isOff ? 0 : 1 }}
          />
        </motion.g>

      </svg>
    </div>
  );
}
