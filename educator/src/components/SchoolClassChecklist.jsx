import React, { useEffect, useState } from "react";
import { Check, School as SchoolIcon, Layers } from "lucide-react";
import { api } from "../api/axios";

export default function SchoolClassChecklist({
  selectedSchools,
  onChangeSchools,
  selectedClasses,
  onChangeClasses
}) {
  const [assignedSchools, setAssignedSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hardcode classes from 2 to 12 as requested
  const allClasses = Array.from({ length: 11 }, (_, i) => `Class ${i + 2}`);

  useEffect(() => {
    let mounted = true;
    const token = (localStorage.getItem("accessToken") || "").trim();

    async function fetchSchools() {
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const res = await api.get("/educator/schools", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache"
          }
        });
        if (mounted) {
          const data = res?.data ?? res ?? {};
          const raw = Array.isArray(data?.items) ? data.items :
                      Array.isArray(data?.schools) ? data.schools :
                      Array.isArray(data) ? data : [];
                      
          // Support both simple string arrays and object arrays
          const list = raw.map(s => {
            if (typeof s === 'string') return { _id: s, name: s };
            return {
              _id: String(s?._id || s?.id || "").trim(),
              name: String(s?.name || s?.schoolName || s?.title || "Unknown School").trim(),
            };
          }).filter(x => x._id && x.name);
          
          setAssignedSchools(list);
        }
      } catch (err) {
        console.error("Failed to fetch assigned schools:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSchools();
    return () => { mounted = false; };
  }, []);

  const toggleSchool = (schId) => {
    if (selectedSchools.includes(schId)) {
      onChangeSchools(selectedSchools.filter(s => s !== schId));
    } else {
      onChangeSchools([...selectedSchools, schId]);
    }
  };

  const toggleClass = (cls) => {
    if (selectedClasses.includes(cls)) {
      onChangeClasses(selectedClasses.filter(c => c !== cls));
    } else {
      onChangeClasses([...selectedClasses, cls]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Schools Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <SchoolIcon className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Target Schools</h3>
        </div>
        <p className="mb-3 text-[11px] text-white/60 font-medium">
          Select which schools should see this. Only your assigned schools are shown. Leave empty to target all your schools.
        </p>

        {loading ? (
          <div className="text-[12px] text-white/50">Loading your schools...</div>
        ) : assignedSchools.length === 0 ? (
          <div className="text-[12px] text-red-300">No schools assigned to you.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedSchools.map(sch => {
              const isSelected = selectedSchools.includes(sch._id);
              return (
                <button
                  key={sch._id}
                  type="button"
                  onClick={() => toggleSchool(sch._id)}
                  className={`
                    flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all border
                    ${isSelected 
                      ? "bg-cyan-500/20 border-cyan-400/30 text-cyan-200" 
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"}
                  `}
                >
                  <div className={`
                    flex h-4 w-4 items-center justify-center rounded border
                    ${isSelected ? "border-cyan-400 bg-cyan-400" : "border-white/30"}
                  `}>
                    {isSelected && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
                  </div>
                  {sch.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Classes Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-5 w-5 text-fuchsia-400" />
          <h3 className="text-sm font-bold text-white">Target Classes</h3>
        </div>
        <p className="mb-3 text-[11px] text-white/60 font-medium">
          Select which classes should see this. Leave empty to target all classes.
        </p>

        <div className="flex flex-wrap gap-2">
          {allClasses.map(cls => {
            const isSelected = selectedClasses.includes(cls);
            return (
              <button
                key={cls}
                type="button"
                onClick={() => toggleClass(cls)}
                className={`
                  flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all border
                  ${isSelected 
                    ? "bg-fuchsia-500/20 border-fuchsia-400/30 text-fuchsia-200" 
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"}
                `}
              >
                <div className={`
                  flex h-4 w-4 items-center justify-center rounded border
                  ${isSelected ? "border-fuchsia-400 bg-fuchsia-400" : "border-white/30"}
                `}>
                  {isSelected && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
                </div>
                {cls}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
