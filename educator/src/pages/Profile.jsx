import React, { useEffect, useState } from "react";
import { User, School, Check, Loader2, Save } from "lucide-react";
import { api } from "../api/axios";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [schools, setSchools] = useState([]);
  const [assignedSchools, setAssignedSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profRes, schRes] = await Promise.all([
        api.get("/profile/me"),
        api.get("/schools") // Global schools route or educator specific
      ]);
      const userData = profRes.data?.user || {};
      setProfile(userData);
      setAssignedSchools(userData.assignedSchools || []);
      setSchools(schRes.data || []);
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSchool = (schoolName) => {
    setAssignedSchools(prev => 
      prev.includes(schoolName) 
        ? prev.filter(s => s !== schoolName)
        : [...prev, schoolName]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/profile/me", { assignedSchools });
      alert("Profile updated successfully!");
      // Update local storage user if needed
      const raw = localStorage.getItem("steam_user");
      if (raw) {
         const userObj = JSON.parse(raw);
         userObj.assignedSchools = assignedSchools;
         localStorage.setItem("steam_user", JSON.stringify(userObj));
      }
    } catch (err) {
      alert("Failed to save profile: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <User className="h-8 w-8 text-cyan-400" />
          Educator Profile
        </h1>
        <p className="text-white/60 font-semibold">Manage your account details and school assignments.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Read Only Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Account Details</h2>
            <div>
              <label className="block text-sm font-semibold text-white/50">Full Name</label>
              <div className="text-lg font-medium text-white">{profile?.fullName || "-"}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/50">Educator ID</label>
              <div className="text-lg font-medium text-white">{profile?.educatorId || "-"}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/50">Email</label>
              <div className="text-lg font-medium text-white">{profile?.email || "-"}</div>
            </div>
          </div>

          {/* Edit Schools */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
              <School className="h-5 w-5 text-cyan-400" />
              Assigned Schools
            </h2>
            <p className="text-sm text-white/60 mb-2">Select the schools you want to post content for.</p>
            
            <div className="bg-black/20 border border-white/10 rounded-xl max-h-64 overflow-y-auto p-2 space-y-1">
              {schools.length === 0 ? (
                <p className="text-xs text-white/40 p-2 italic">No schools available.</p>
              ) : (
                schools.map(sch => (
                  <label 
                    key={sch._id} 
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                      assignedSchools.includes(sch.name) ? 'bg-cyan-500/20 border border-cyan-500/30' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      assignedSchools.includes(sch.name) 
                        ? "bg-cyan-500 border-cyan-500" 
                        : "border-white/20"
                    }`}>
                      {assignedSchools.includes(sch.name) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-sm ${assignedSchools.includes(sch.name) ? "text-cyan-200 font-bold" : "text-white/70 font-semibold"}`}>
                      {sch.name}
                    </span>
                  </label>
                ))
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
