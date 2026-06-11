import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Heart, MessageCircle, Play, Trash2 } from "lucide-react";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../../utils/data";

const THEMES = [
  "from-blue-500 to-purple-500",
  "from-pink-500 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-blue-500",
  "from-indigo-500 to-violet-600"
];

const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("/")) {
    return API_BASE_URL.replace("/api", "") + url;
  }
  return url;
};

// --- SHORTS VIEWER MODAL ---
const ShortsViewer = ({ shorts, initialIndex, onClose, token, language, onDeleteShort }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const currentShort = shorts[currentIndex];
  const videoRef = useRef(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    try {
      const u1 = JSON.parse(localStorage.getItem("steam_user"));
      const u2 = JSON.parse(localStorage.getItem("user"));
      setCurrentUserId(u1?.id || u1?._id || u2?.id || u2?._id || null);
    } catch(e) {}
  }, []);
  
  const handleNext = () => {
    if (currentIndex < shorts.length - 1) setCurrentIndex(prev => prev + 1);
    else onClose(); // Close if at end
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };
  
  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE_URL}/reels/${currentShort._id}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      // Optimistically update
      currentShort.likes = (currentShort.likes || 0) + 1;
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(language === "en" ? "Delete this story?" : "क्या आप इसे हटाना चाहते हैं?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reels/${currentShort._id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        onDeleteShort(currentShort._id);
        if (shorts.length <= 1) {
          onClose();
        } else {
          // Move to next or previous if it's the last one
          if (currentIndex >= shorts.length - 1) {
             setCurrentIndex(prev => prev - 1);
          }
        }
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-advance text/images after 5s
  useEffect(() => {
    if (currentShort && currentShort.mediaType !== "video") {
      const timer = setTimeout(() => {
        handleNext();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentShort]);

  // Mark as seen
  useEffect(() => {
    if (!currentShort || !currentUserId) return;
    const isSeen = currentShort.viewers?.some(v => v._id === currentUserId || v === currentUserId);
    if (!isSeen) {
      fetch(`${API_BASE_URL}/reels/${currentShort._id}/seen`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      }).catch(console.error);
    }
  }, [currentShort, currentUserId, token]);

  if (!currentShort) return null;

  const authorName = currentShort.authorId?.fullName || "User";
  const authorPic = currentShort.authorId?.profilePic || "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix";

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center sm:p-4">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition"
      >
        <X size={24} />
      </button>

      {/* Prev Area */}
      <div className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer" onClick={handlePrev} />
      {/* Next Area */}
      <div className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer" onClick={handleNext} />

      {/* Story Container */}
      <div className="w-full h-full sm:w-[400px] sm:h-[90vh] sm:rounded-[2rem] overflow-hidden relative bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 ring-1 ring-white/5 flex flex-col justify-center backdrop-blur-xl">
        
        {/* Progress Bars */}
        <div className="absolute top-2 left-0 right-0 z-20 flex gap-1 px-2">
          {shorts.map((s, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-white transition-all duration-300 ${
                  idx < currentIndex ? 'w-full' : idx === currentIndex && s.mediaType !== 'video' ? 'w-full animate-[progress_5s_linear]' : 'w-0'
                }`} 
              />
            </div>
          ))}
        </div>

        {/* Author Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center gap-3 px-4 drop-shadow-md">
          <img src={authorPic} alt={authorName} className="w-10 h-10 rounded-full border-2 border-white/50 object-cover" />
          <div className="text-white text-sm font-bold">{authorName}</div>
          <div className="text-white/60 text-xs ml-auto">
            {new Date(currentShort.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Media Layer */}
        {currentShort.mediaType === "video" ? (
          <video 
            ref={videoRef}
            src={getMediaUrl(currentShort.mediaUrl)} 
            className="w-full h-full object-contain sm:object-cover"
            loop
            autoPlay
            playsInline
            controls={false}
          />
        ) : currentShort.mediaType === "image" ? (
          <img 
            src={getMediaUrl(currentShort.mediaUrl)} 
            className="w-full h-full object-contain sm:object-cover"
            alt="Story"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center p-8 bg-gradient-to-br ${currentShort.bgColor || 'from-indigo-500 to-purple-600'}`}>
            <h2 className="text-white text-3xl md:text-4xl font-black text-center leading-tight drop-shadow-lg">
              {currentShort.textContent}
            </h2>
          </div>
        )}

        {/* Bottom Actions & Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none">
          {currentShort.caption && (
            <p className="text-white text-sm font-medium mb-4 drop-shadow-md">
              {currentShort.caption}
            </p>
          )}
          
          <div className="flex items-center gap-4 pointer-events-auto">
            <button 
              onClick={handleLike}
              className="flex items-center gap-1.5 p-2 rounded-full hover:bg-white/10 transition group"
            >
              <Heart className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
              <span className="text-white font-bold">{currentShort.likes || 0}</span>
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition group">
              <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            {currentUserId && (currentShort.authorId?._id === currentUserId || currentShort.authorId === currentUserId) && (
              <button 
                onClick={handleDelete}
                className="ml-auto p-2 rounded-full hover:bg-red-500/20 transition group text-white hover:text-red-400"
                title="Delete Story"
              >
                <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};


// --- CREATE SHORT MODAL ---
const CreateShortModal = ({ onClose, token, language, onCreated }) => {
  const [tab, setTab] = useState("image"); // image, video, text
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadType, setUploadType] = useState("url"); // 'url' or 'file'
  const [textContent, setTextContent] = useState("");
  const [bgColor, setBgColor] = useState(THEMES[0]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("mediaType", tab);
      
      if (tab === "text") {
        formData.append("textContent", textContent);
        formData.append("bgColor", bgColor);
      } else {
        formData.append("caption", caption);
        if (uploadType === "file" && mediaFile) {
          formData.append("file", mediaFile);
        } else {
          formData.append("mediaUrl", mediaUrl);
        }
      }
      
      const res = await fetch(`${API_BASE_URL}/reels`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
        body: formData // Use FormData instead of JSON
      });
      
      const data = await res.json();
      if (data.ok) {
        if (data.reel.status === "pending") {
          alert(language === "en" ? "Your story has been sent to your educator for approval." : "आपकी स्टोरी आपके शिक्षक को अनुमोदन के लिए भेज दी गई है।");
        }
        onCreated(data.reel);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-lg dark:text-white">
            {language === "en" ? "Create STEAM Short" : "स्टीम शॉर्ट बनाएं"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
            {["image", "video", "text"].map(t => (
              <button 
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg transition ${tab === t ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
              >
                {t === "image" ? (language === "en" ? "Image" : "चित्र") :
                 t === "video" ? (language === "en" ? "Video" : "वीडियो") : 
                 (language === "en" ? "Text" : "पाठ")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "text" ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    {language === "en" ? "What's on your mind?" : "आपके मन में क्या है?"}
                  </label>
                  <textarea 
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    required
                    className={`w-full h-32 p-4 rounded-xl text-white font-bold text-center text-xl resize-none outline-none placeholder:text-white/50 bg-gradient-to-br ${bgColor}`}
                    placeholder={language === "en" ? "Type something awesome..." : "कुछ बढ़िया टाइप करें..."}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    {language === "en" ? "Background Color" : "पृष्ठभूमि का रंग"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map(theme => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setBgColor(theme)}
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${theme} ${bgColor === theme ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setUploadType("url")} className={`px-3 py-1 text-xs font-bold rounded-lg ${uploadType === 'url' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    {language === "en" ? "Paste URL" : "URL पेस्ट करें"}
                  </button>
                  <button type="button" onClick={() => setUploadType("file")} className={`px-3 py-1 text-xs font-bold rounded-lg ${uploadType === 'file' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    {language === "en" ? "Upload File" : "फ़ाइल अपलोड करें"}
                  </button>
                </div>
                
                {uploadType === "url" ? (
                  <div>
                    <input 
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/media.jpg"
                    />
                  </div>
                ) : (
                  <div>
                    <input 
                      type="file"
                      accept={tab === "video" ? "video/*" : "image/*"}
                      onChange={(e) => setMediaFile(e.target.files[0])}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                )}
                
                {mediaUrl && tab === "image" && uploadType === "url" && (
                   <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100">
                     <img src={mediaUrl} className="w-full h-full object-cover" alt="Preview" onError={(e) => e.target.style.display='none'} />
                   </div>
                )}
                {mediaFile && tab === "image" && uploadType === "file" && (
                   <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100">
                     <img src={URL.createObjectURL(mediaFile)} className="w-full h-full object-cover" alt="Preview" />
                   </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    {language === "en" ? "Caption (Optional)" : "कैप्शन (वैकल्पिक)"}
                  </label>
                  <input 
                    type="text"
                    value={caption || ""}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={language === "en" ? "Write a short caption..." : "एक छोटा कैप्शन लिखें..."}
                  />
                </div>
              </>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{language === "en" ? "Post Story" : "स्टोरी पोस्ट करें"}</>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};


// --- MAIN STEAM SHORTS SECTION ---
export default function STEAMShortsSection({ language }) {
  const [token, setToken] = useState("");
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeViewerIndex, setActiveViewerIndex] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    try {
      const u1 = JSON.parse(localStorage.getItem("steam_user"));
      const u2 = JSON.parse(localStorage.getItem("user"));
      setCurrentUserId(u1?.id || u1?._id || u2?.id || u2?._id || null);
    } catch(e) {}
  }, []);

  // Socket setup
  useEffect(() => {
    const socket = io(API_BASE_URL.replace("/api", ""));
    socket.on("reel_liked", (data) => {
      setShorts(prev => prev.map(s => s._id === data.id ? { ...s, likes: data.likes } : s));
    });
    socket.on("reel_seen", (data) => {
      setShorts(prev => prev.map(s => {
        if (s._id === data.id) {
          const v = s.viewers || [];
          if (!v.some(x => x._id === data.viewerId || x === data.viewerId)) {
             return { ...s, views: data.views, viewers: [...v, data.viewerId] };
          }
          return { ...s, views: data.views };
        }
        return s;
      }));
    });
    return () => socket.disconnect();
  }, []);

  // Sync token
  useEffect(() => {
    const t = (localStorage.getItem("accessToken") || "").trim();
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchShorts();
  }, [token]);

  const fetchShorts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reels`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setShorts(data.reels || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newShort) => {
    // Populate the authorId immediately for UI purposes
    const userStr = localStorage.getItem("steam_user") || localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        newShort.authorId = {
          _id: user.id || user._id,
          fullName: user.name || user.fullName,
          profilePic: user.profilePic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name || user.fullName}`
        };
      } catch (e) {}
    }
    setShorts(prev => [newShort, ...prev]);
  };

  const handleDeleteShort = (id) => {
    setShorts(prev => prev.filter(s => s._id !== id));
  };

  const userPic = (() => {
    try {
      return JSON.parse(localStorage.getItem("steam_user"))?.profilePic || "https://api.dicebear.com/7.x/adventurer/svg?seed=user";
    } catch {
      return "https://api.dicebear.com/7.x/adventurer/svg?seed=user";
    }
  })();

  return (
    <div className="w-full relative py-4">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}} />
      
      {/* Horizontal Scroll Area */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2 items-start" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        {/* ADD STORY BUTTON */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={() => setIsCreateOpen(true)}>
          <div className="relative w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]">
            {/* User Avatar */}
            <div className="w-full h-full rounded-full border-[3px] border-transparent p-0.5 relative">
              <img src={userPic} alt="Your Story" className="w-full h-full rounded-full object-cover bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-95" />
            </div>
            {/* Plus Icon Overlay */}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg">
              <Plus size={14} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
            {language === "en" ? "Your story" : "आपकी स्टोरी"}
          </span>
        </div>

        {loading && shorts.length === 0 && (
          [1,2,3,4].map(i => (
             <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
               <div className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full bg-slate-200 dark:bg-white/10" />
               <div className="w-16 h-3 rounded bg-slate-200 dark:bg-white/10" />
             </div>
          ))
        )}

        {!loading && shorts.map((short, idx) => {
          const isOwnStory = (short.authorId?._id === currentUserId) || (short.authorId === currentUserId);
          const isUnseen = !isOwnStory && !(short.viewers || []).some(v => (v._id || v) === currentUserId);
          return (
            <div 
              key={short._id} 
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              onClick={() => setActiveViewerIndex(idx)}
            >
              <div className={`relative w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full p-[3px] shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                {isUnseen ? (
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 animate-[spin_4s_linear_infinite] rounded-full" />
                ) : (
                  <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 rounded-full" />
                )}
                <div className="w-full h-full rounded-full border-2 border-white dark:border-[#030008] overflow-hidden bg-slate-100 dark:bg-slate-800 relative z-10">
                  <img 
                    src={short.authorId?.profilePic || "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"} 
                    alt={short.authorId?.fullName || "User"} 
                    className={`w-full h-full object-cover ${short.status === 'rejected' ? 'grayscale opacity-50' : ''}`} 
                  />
                </div>
                {/* Status Badges */}
                {short.status === "pending" && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-slate-900 z-20 whitespace-nowrap shadow-sm">
                    {language === "en" ? "Pending" : "लंबित"}
                  </div>
                )}
                {short.status === "rejected" && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-slate-900 z-20 whitespace-nowrap shadow-sm">
                    {language === "en" ? "Rejected" : "अस्वीकृत"}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 w-16 truncate text-center">
                {short.authorId?.fullName?.split(" ")[0] || "User"}
              </span>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isCreateOpen && (
          <CreateShortModal 
            onClose={() => setIsCreateOpen(false)} 
            token={token} 
            language={language}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeViewerIndex !== null && (
          <ShortsViewer 
            shorts={shorts}
            initialIndex={activeViewerIndex}
            onClose={() => setActiveViewerIndex(null)}
            token={token}
            language={language}
            onDeleteShort={handleDeleteShort}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
