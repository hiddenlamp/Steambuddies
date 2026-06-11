import React, { useEffect, useState, useRef } from "react";
import { MessageCircle, CheckCircle2, User, Send, Bot } from "lucide-react";
import { API_BASE_URL } from "../../utils/data";
import { motion, AnimatePresence } from "framer-motion";

export default function EducatorDoubts() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDoubtId, setActiveDoubtId] = useState(null);
  const [text, setText] = useState("");
  const token = localStorage.getItem("accessToken");
  const bottomRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchDoubts = () => {
    fetch(`${API_BASE_URL}/doubts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setDoubts(data.doubts);
        }
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDoubts();
    const interval = setInterval(fetchDoubts, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const activeDoubt = doubts.find(d => d._id === activeDoubtId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDoubt?.messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeDoubtId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/doubts/${activeDoubtId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.ok) {
        setText("");
        fetchDoubts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markResolved = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/doubts/${id}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDoubts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && doubts.length === 0) {
    return <div className="text-white/50 p-10">Loading doubts...</div>;
  }

  return (
    <div className="h-[85vh] flex gap-4 overflow-hidden">
      {/* Sidebar: List of Doubts */}
      <div className="w-1/3 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col overflow-hidden backdrop-blur-xl">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-sky-400" /> Doubt Queue
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {doubts.length === 0 ? (
            <p className="text-center text-white/40 mt-10 text-sm">No doubts found from your assigned schools.</p>
          ) : (
            doubts.map(d => (
              <button
                key={d._id}
                onClick={() => setActiveDoubtId(d._id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  activeDoubtId === d._id 
                    ? "bg-white/10 border-sky-400/50" 
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white text-sm line-clamp-1">
                    {d.studentId?.fullName || "Student"}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${d.status === "open" ? "bg-sky-500/20 text-sky-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {d.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-white/50 line-clamp-1">{d.messages[0]?.text}</div>
                <div className="text-[10px] text-white/40 mt-2">{d.classLevel}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col overflow-hidden backdrop-blur-xl">
        {activeDoubt ? (
          <>
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">{activeDoubt.studentId?.fullName}</h3>
                <p className="text-xs text-white/50">{activeDoubt.studentId?.school} • {activeDoubt.classLevel}</p>
              </div>
              {activeDoubt.status === "open" && (
                <button onClick={() => markResolved(activeDoubt._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeDoubt.messages.map((msg, i) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 max-w-[85%]">
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl ${isMe ? "bg-sky-600 rounded-br-sm text-white" : "bg-white/10 rounded-bl-sm text-white border border-white/5"}`}>
                        <div className="text-[10px] font-bold mb-1 opacity-70">{msg.senderName}</div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className="text-[9px] mt-2 opacity-50 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-black/20 border-t border-white/5 flex gap-3">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Reply to student..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-sky-500/50 transition-colors"
              />
              <button type="submit" disabled={!text.trim()} className="p-3 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 rounded-2xl text-white transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/30">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p>Select a doubt to view conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
