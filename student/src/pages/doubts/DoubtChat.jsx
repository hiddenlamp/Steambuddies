import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, User, Bot, CheckCircle2, Check, CheckCheck } from "lucide-react";
import { API_BASE_URL } from "../../utils/data";
import { io } from "socket.io-client";

export default function DoubtChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doubt, setDoubt] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");
  const bottomRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchDoubt = () => {
    fetch(`${API_BASE_URL}/doubts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setDoubt(data.doubt);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDoubt();
    
    // Polling as a fallback for real-time updates and marking seen
    let interval;
    if (id) {
      interval = setInterval(() => {
        fetch(`${API_BASE_URL}/doubts/${id}/seen`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.ok) setDoubt(data.doubt);
        })
        .catch(console.error);
      }, 5000);
    }

    const socket = io(API_BASE_URL.replace("/api", ""));
    socket.on("new_notification", () => {
      fetchDoubt();
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [id, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [doubt?.messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/doubts/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.ok) {
        setDoubt(data.doubt);
        setText("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markResolved = async () => {
    try {
      await fetch(`${API_BASE_URL}/doubts/${id}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDoubt();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !doubt) {
    return <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col pt-20 sm:pt-24 pb-20 px-4 sm:px-6 relative">
      <div className="max-w-3xl w-full mx-auto flex flex-col h-[75vh] md:h-[80vh] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/doubts")} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-bold text-white">Doubt Discussion</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doubt?.status === "open" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                {doubt?.status?.toUpperCase()}
              </span>
            </div>
          </div>
          {doubt?.status === "open" && (
            <button onClick={markResolved} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {doubt?.messages.map((msg, i) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-end gap-2 max-w-[85%] md:max-w-[75%]">
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`p-3 sm:p-4 rounded-2xl ${isMe ? "bg-blue-600 rounded-br-sm text-white" : "bg-white/10 rounded-bl-sm text-white border border-white/5"}`}>
                    <div className="text-[10px] font-bold mb-1 opacity-70">{msg.senderName}</div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <div className="text-[9px] opacity-50">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                      {isMe && (
                        msg.seen ? <CheckCheck size={12} className="text-sky-300" /> : <Check size={12} className="opacity-50" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 bg-black/20 border-t border-white/5 flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
          />
          <button type="submit" disabled={!text.trim()} className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-2xl text-white transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
}
