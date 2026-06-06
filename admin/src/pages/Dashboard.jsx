import React, { useEffect, useState } from "react";
import { Users, GraduationCap, Presentation, BookOpen, Activity, Loader2 } from "lucide-react";
import { getAdminMetrics } from "../api/admin.api";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await getAdminMetrics();
      setMetrics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: "Total Students", value: metrics?.students || 0, icon: GraduationCap, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Total Educators", value: metrics?.educators || 0, icon: Presentation, color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { title: "Active Courses", value: metrics?.courses || 0, icon: BookOpen, color: "text-fuchsia-400", bg: "bg-fuchsia-400/10" },
    { title: "Total Activities", value: metrics?.activities || 0, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">Welcome Back, Admin</h1>
        <p className="text-white/60 font-semibold">Here is what's happening on your platform today.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${card.bg}`} />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-4xl font-black mb-1">{card.value}</h3>
                  <p className="text-white/50 text-sm font-bold uppercase tracking-wider">{card.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
