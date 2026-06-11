import React from "react";
import { motion } from "framer-motion";
import { Wrench, Box, Layers, Gamepad2, Bot, ExternalLink, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tools = [
  {
    id: "tinkercad",
    name: "Tinkercad",
    category: "3D Designing",
    desc: "A free, easy-to-use web app that equips the next generation of designers and engineers with the foundational skills for innovation: 3D design, electronics, and coding.",
    icon: Box,
    url: "https://www.tinkercad.com/",
    tone: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/10"
  },
  {
    id: "anycubic",
    name: "Anycubic Slicer",
    category: "3D Slicing",
    desc: "Turn your 3D models into printable files with ease. Anycubic Slicer is specifically tailored for making your 3D printing fast, reliable, and highly detailed.",
    icon: Layers,
    url: "https://www.anycubic.com/pages/anycubic-slicer-software",
    tone: "from-orange-500 to-amber-400",
    bg: "bg-orange-500/10"
  },
  {
    id: "scratch",
    name: "Scratch",
    category: "Game & Animations",
    desc: "Program your own interactive stories, games, and animations. Scratch helps young people learn to think creatively, reason systematically, and work collaboratively.",
    icon: Gamepad2,
    url: "https://scratch.mit.edu/",
    tone: "from-purple-500 to-pink-400",
    bg: "bg-purple-500/10"
  },
  {
    id: "mblock",
    name: "mBlock",
    category: "Robotics",
    desc: "A powerful coding platform designed for STEM education. It supports block-based programming and text-based coding to control robots, create games, and train AI models.",
    icon: Bot,
    url: "https://mblock.makeblock.com/",
    tone: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-500/10"
  }
];

export default function ReferenceTools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#05050a] text-white pt-24 pb-28 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-3">
              <Wrench className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
              Reference Tools
            </h1>
            <p className="text-white/60 mt-2 font-medium">Explore standard tools for 3D design, coding, robotics, and more.</p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8 flex flex-col h-full"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tool.tone}`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={`p-4 rounded-2xl ${tool.bg} border border-white/5`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                    <ExternalLink className="w-4 h-4 text-white/70" />
                  </div>
                </div>

                <div className="relative z-10 flex-grow">
                  <div className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">{tool.category}</div>
                  <h3 className="text-2xl font-black text-white mb-3 group-hover:text-blue-300 transition-colors">{tool.name}</h3>
                  <p className="text-white/60 text-sm leading-relaxed font-medium">
                    {tool.desc}
                  </p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
