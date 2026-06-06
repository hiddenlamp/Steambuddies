import React from "react";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function StatCard({ title, value, subtitle, icon, gradient, theme }) {
  return (
    <div className="
      relative overflow-hidden rounded-3xl p-5 border transition-all duration-300
      bg-white/80 border-slate-200/80 shadow-[0_15px_30px_rgba(0,0,0,0.02)]
      dark:bg-slate-950/50 dark:border-white/5 dark:shadow-[0_15px_40px_rgba(0,0,0,0.45)]
      backdrop-blur-md hover:border-slate-300 dark:hover:border-white/10
    ">
      {/* Category gradient background glow */}
      <div className={cn("absolute -right-20 -top-20 h-44 w-44 rounded-full bg-gradient-to-tr blur-3xl opacity-20 dark:opacity-10", gradient)} />
      
      <div className="relative flex items-center justify-between gap-3 z-10">
        <div>
          <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
            {title}
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white leading-none">
            {value}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            {subtitle}
          </div>
        </div>
        
        {/* Icon Frame */}
        <div className="
          w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0
          bg-slate-50 border-slate-200/60 text-slate-700
          dark:bg-white/5 dark:border-white/5 dark:text-slate-300
        ">
          {icon}
        </div>
      </div>
    </div>
  );
}
