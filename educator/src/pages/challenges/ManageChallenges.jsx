import { useState, useEffect } from "react";
import { Plus, Check, Loader2, Target, Award, Eye, Zap, Sparkles, Trash2 } from "lucide-react";
import { API_BASE_URL } from "../../utils/data";
import { motion, AnimatePresence } from "framer-motion";

const THEMES = [
  { id: "cyan", name: "Space Cyan", from: "from-cyan-400", to: "to-blue-600", text: "text-cyan-500", ring: "ring-cyan-500" },
  { id: "purple", name: "Galaxy Purple", from: "from-purple-500", to: "to-indigo-600", text: "text-purple-500", ring: "ring-purple-500" },
  { id: "orange", name: "Solar Orange", from: "from-orange-400", to: "to-rose-500", text: "text-orange-500", ring: "ring-orange-500" },
  { id: "emerald", name: "Bio Emerald", from: "from-emerald-400", to: "to-teal-600", text: "text-emerald-500", ring: "ring-emerald-500" },
  { id: "rose", name: "Nebula Rose", from: "from-rose-400", to: "to-pink-600", text: "text-rose-500", ring: "ring-rose-500" },
];

export default function ManageChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [points, setPoints] = useState(40);
  const [selectedTheme, setSelectedTheme] = useState("cyan");
  const [targetSchools, setTargetSchools] = useState([]);

  const [statsModal, setStatsModal] = useState({ isOpen: false, data: null, loading: false, challengeTitle: "" });

  const token = localStorage.getItem("accessToken") || "";
  const user = JSON.parse(localStorage.getItem("steam_user") || "{}");
  const mySchools = user.assignedSchools || [];

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/challenges/my-challenges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) setChallenges(data.challenges);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const toggleSchool = (sch) => {
    setTargetSchools(prev => prev.includes(sch) ? prev.filter(s => s !== sch) : [...prev, sch]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || options.some(o => !o.trim())) return alert("Please fill all fields.");
    
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/challenges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ question, options, correctOptionIndex: correctOption, points, theme: selectedTheme, targetSchools })
      });
      const data = await res.json();
      if (data.ok) {
        setQuestion("");
        setOptions(["", "", "", ""]);
        setCorrectOption(0);
        setPoints(40);
        setTargetSchools([]);
        fetchChallenges();
      } else {
        alert(data.message || "Failed to post");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting challenge");
    } finally {
      setSaving(false);
    }
  };

  const openStats = async (challenge) => {
    setStatsModal({ isOpen: true, loading: true, data: null, challengeTitle: challenge.question });
    try {
      const res = await fetch(`${API_BASE_URL}/challenges/${challenge._id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setStatsModal(prev => ({ ...prev, loading: false, data }));
      } else {
        alert(data.message || "Failed to load stats");
        setStatsModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error(err);
      alert("Error loading stats");
      setStatsModal(prev => ({ ...prev, loading: false }));
    }
  };

  const deleteChallenge = async (id) => {
    if (!window.confirm("Are you sure you want to delete this challenge? It will be removed from all student dashboards immediately.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/challenges/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        fetchChallenges();
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting challenge");
    }
  };

  const activeTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Target className="text-rose-500" />
            Today's Challenges
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Design premium daily challenges for students. They earn XP instantly upon solving.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
        
        {/* LEFT COLUMN: Builder Form */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[28px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" /> Create New Quest
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Theme Picker */}
            <div>
              <label className="block text-sm font-semibold mb-3">Card Theme</label>
              <div className="flex flex-wrap gap-3">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative w-12 h-12 rounded-2xl bg-gradient-to-tr ${theme.from} ${theme.to} flex items-center justify-center transition-all ${selectedTheme === theme.id ? `ring-2 ring-offset-2 dark:ring-offset-slate-900 ${theme.ring} scale-110` : "opacity-70 hover:opacity-100"}`}
                  >
                    {selectedTheme === theme.id && <Check size={16} className="text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-semibold mb-2">Question Text</label>
              <textarea 
                required
                rows={3}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                placeholder="What is the powerhouse of the cell?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center justify-between">
                <span>Answers</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full uppercase tracking-widest">Select Correct</span>
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {options.map((opt, i) => (
                  <div key={i} className={`relative flex items-center rounded-2xl border transition-all ${correctOption === i ? `${activeTheme.ring} border-transparent ring-2 bg-white dark:bg-slate-800 shadow-md` : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30'}`}>
                    <input 
                      type="radio" 
                      name="correctOption" 
                      checked={correctOption === i} 
                      onChange={() => setCorrectOption(i)}
                      className="absolute left-4 w-5 h-5 cursor-pointer opacity-0 z-10"
                    />
                    <div className={`ml-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${correctOption === i ? `border-transparent bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to}` : 'border-slate-300 dark:border-slate-600'}`}>
                      {correctOption === i && <Check size={12} className="text-white" />}
                    </div>
                    <input 
                      required
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => handleOptionChange(i, e.target.value)}
                      className="w-full py-3 pr-4 pl-3 bg-transparent outline-none font-medium text-sm z-20"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Target Schools */}
            {mySchools.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Target Schools</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Optional</span>
                </label>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 max-h-40 overflow-y-auto space-y-1">
                  {mySchools.map(sch => (
                    <label 
                      key={sch} 
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                        targetSchools.includes(sch) ? 'bg-indigo-500/10' : 'hover:bg-slate-200 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <input 
                         type="checkbox" 
                         className="hidden" 
                         checked={targetSchools.includes(sch)} 
                         onChange={() => toggleSchool(sch)} 
                      />
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        targetSchools.includes(sch) 
                          ? "bg-indigo-500 border-indigo-500" 
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {targetSchools.includes(sch) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-sm ${targetSchools.includes(sch) ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-600 dark:text-slate-400 font-medium"}`}>
                        {sch}
                      </span>
                    </label>
                  ))}
                  <p className="text-xs text-slate-400 pt-1 px-1 italic">
                    If no school is selected, the challenge will be visible to all your assigned schools.
                  </p>
                </div>
              </div>
            )}

            {/* Points & Submit */}
            <div className="flex flex-col sm:flex-row gap-4 items-end pt-2">
              <div className="w-full sm:w-32">
                <label className="block text-sm font-semibold mb-2">Reward (XP)</label>
                <div className="relative">
                  <Award size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    value={points}
                    onChange={e => setPoints(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 outline-none font-bold"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className={`flex-1 py-3 px-6 bg-gradient-to-r ${activeTheme.from} ${activeTheme.to} text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-${activeTheme.id}-500/25`}
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Publish Challenge
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Preview */}
        <div className="flex flex-col items-center justify-start pt-4 sm:pt-10">
          <h3 className="text-xs font-black tracking-[0.2em] uppercase text-slate-400 mb-6 flex items-center gap-2">
            <Eye size={14} /> Live Student Preview
          </h3>
          
          <div className="w-[340px] md:w-[380px] scale-95 md:scale-100 origin-top">
            <div className={`relative overflow-hidden rounded-[32px] p-[2px] bg-gradient-to-tr ${activeTheme.from} ${activeTheme.to} shadow-[0_30px_60px_rgba(0,0,0,0.25)]`}>
              <div className="relative rounded-[30px] px-6 py-8 overflow-hidden backdrop-blur-2xl bg-white/90 dark:bg-slate-950/80">
                
                {/* Visual Effects */}
                <div className="absolute inset-0 bg-grid-mesh opacity-10 pointer-events-none" />
                <div className={`absolute -top-16 -left-16 w-40 h-40 rounded-full blur-3xl opacity-20 bg-gradient-to-r ${activeTheme.from} ${activeTheme.to}`} />

                <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-gradient-to-r ${activeTheme.from} ${activeTheme.to} text-white shadow-sm`}>
                    ⚡ Today's Challenge
                  </span>
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Award size={14} className={activeTheme.text} />
                    {points} XP
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-snug relative z-10 min-h-[60px]">
                  {question || "Type a question to see preview..."}
                </h3>

                <div className="space-y-3 mt-6 relative z-10">
                  {options.map((opt, i) => (
                    <div
                      key={i}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        correctOption === i 
                          ? `border-transparent bg-gradient-to-r ${activeTheme.from} ${activeTheme.to} text-white shadow-md scale-[1.02]`
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <span className="text-sm font-bold opacity-90">{opt || `Option ${i + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Past Challenges */}
      <div className="mt-16">
        <h2 className="text-2xl font-black mb-6">Past Challenges</h2>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : challenges.length === 0 ? (
          <div className="text-center p-10 bg-slate-100 dark:bg-slate-800/50 rounded-3xl text-slate-500">
            No challenges posted yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map(c => {
              const cTheme = THEMES.find(t => t.id === c.theme) || THEMES[0];
              return (
                <div key={c._id} className="relative group overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${cTheme.from} ${cTheme.to} opacity-[0.05] group-hover:opacity-[0.15] rounded-bl-full transition-opacity`} />
                  
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(c.activeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 font-black text-xs ${cTheme.text} bg-${cTheme.id}-500/10 px-2 py-1 rounded-full`}>
                        <Award size={12}/> {c.points} XP
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteChallenge(c._id); }}
                        className="p-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        title="Delete Challenge"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="font-bold text-sm mb-4 line-clamp-2">{c.question}</p>
                  
                  <div className="space-y-1.5">
                    {c.options.map((opt, i) => (
                      <div key={i} className={`px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between ${
                        i === c.correctOptionIndex 
                          ? `bg-gradient-to-r ${cTheme.from} ${cTheme.to} text-white shadow-sm` 
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                      }`}>
                        <span className="truncate pr-2">{opt}</span>
                        {i === c.correctOptionIndex && <Check size={12} className="shrink-0" />}
                      </div>
                    ))}
                  </div>

                  {/* View Stats Button */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => openStats(c)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs transition-colors"
                    >
                      <Eye size={14} /> View Analytics
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      <AnimatePresence>
        {statsModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Challenge Analytics</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{statsModal.challengeTitle}</p>
                </div>
                <button 
                  onClick={() => setStatsModal({ isOpen: false, data: null, loading: false, challengeTitle: "" })}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  ✕
                </button>
              </div>

              {statsModal.loading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : statsModal.data ? (
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 text-center">
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{statsModal.data.stats.totalAttempts}</div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-500/70 mt-1">Total Attempts</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 text-center">
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{statsModal.data.stats.correctAttempts}</div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-500/70 mt-1">Correct</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 text-center">
                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{statsModal.data.stats.accuracy}%</div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-blue-500/70 mt-1">Accuracy</div>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm mb-4 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">Student Responses</h4>
                  
                  {statsModal.data.attempts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">No students have attempted this challenge yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {statsModal.data.attempts.map(attempt => (
                        <div key={attempt._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs overflow-hidden">
                              {attempt.studentId?.avatar ? (
                                <img src={attempt.studentId.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                attempt.studentId?.fullName?.[0] || "?"
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{attempt.studentId?.fullName || "Unknown Student"}</div>
                              <div className="text-[10px] text-slate-500">{new Date(attempt.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-slate-500 px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                              Selected: Option {attempt.selectedOptionIndex + 1}
                            </span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${attempt.isCorrect ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                              {attempt.isCorrect ? <Check size={12} /> : "✕"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
