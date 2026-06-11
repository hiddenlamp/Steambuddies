import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../../utils/data";

export default function Doubts() {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetch(`${API_BASE_URL}/doubts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setDoubts(data.doubts);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const createNewDoubt = async () => {
    const text = prompt("What is your doubt?");
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/doubts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ initialMessage: text })
      });
      const data = await res.json();
      if (data.ok && data.doubt) {
        navigate(`/doubts/${data.doubt._id}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error creating doubt");
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white pt-24 pb-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-blue-400" /> My Doubts
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createNewDoubt}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" /> Ask New Doubt
          </motion.button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center text-white/50 py-10">Loading your doubts...</div>
        ) : doubts.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-xl">
            <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No doubts asked yet</h3>
            <p className="text-white/50 text-sm max-w-sm mx-auto">Ask a question to your educator, and they will help you out!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {doubts.map(d => (
              <motion.div
                key={d._id}
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={() => navigate(`/doubts/${d._id}`)}
                className="cursor-pointer bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-5 rounded-2xl flex items-center justify-between transition-all"
              >
                <div>
                  <h4 className="text-lg font-bold text-white line-clamp-1">{d.messages[0]?.text || "No message"}</h4>
                  <p className="text-xs text-white/50 mt-1">{new Date(d.createdAt).toLocaleString()} • {d.messages.length} messages</p>
                </div>
                <div>
                  {d.status === "open" ? (
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20">Open</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20">Resolved</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
