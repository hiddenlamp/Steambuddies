import { useState, useEffect } from "react";
import { Plus, Check, Loader2, Sparkles, Trash2, Users } from "lucide-react";
import io from "socket.io-client";
import { API_BASE_URL } from "../../utils/data";

const THEMES = [
  "from-blue-500 to-purple-500",
  "from-pink-500 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-blue-500",
  "from-indigo-500 to-violet-600"
];

export default function ManageReels() {
  const [reels, setReels] = useState([]);
  const [pendingReels, setPendingReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mainTab, setMainTab] = useState("mine"); // "mine" or "pending"
  
  const [tab, setTab] = useState("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadType, setUploadType] = useState("url");
  const [textContent, setTextContent] = useState("");
  const [bgColor, setBgColor] = useState(THEMES[0]);
  const [caption, setCaption] = useState("");

  const token = localStorage.getItem("accessToken") || "";

  useEffect(() => {
    fetchReels();
    fetchPendingReels();
  }, []);

  const fetchReels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reels/my-reels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) setReels(data.reels);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reels/pending/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) setPendingReels(data.reels || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this short to be public?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reels/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setPendingReels(prev => prev.filter(r => r._id !== id));
        fetchReels(); // It might go into 'all' reels, but here 'mine' is only educator's. Doesn't matter.
        alert("Story approved and is now public!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this short? The student will be notified.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reels/${id}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setPendingReels(prev => prev.filter(r => r._id !== id));
        alert("Story rejected.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const socket = io(API_BASE_URL.replace("/api", ""));
    socket.on("reel_liked", (data) => {
      setReels(prev => prev.map(s => s._id === data.id ? { ...s, likes: data.likes } : s));
    });
    socket.on("reel_seen", (data) => {
      setReels(prev => prev.map(s => {
        if (s._id === data.id) {
          const v = s.viewers || [];
          if (!v.some(x => x._id === data.viewerId || x === data.viewerId)) {
             return { ...s, views: data.views, viewers: [...v, { _id: data.viewerId, fullName: "New Viewer" }] };
          }
          return { ...s, views: data.views };
        }
        return s;
      }));
    });
    return () => socket.disconnect();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this short?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reels/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setReels(reels.filter(r => r._id !== id && r.id !== id));
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting short");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab !== "text" && uploadType === "url" && !mediaUrl) return alert("Please provide a media URL.");
    if (tab !== "text" && uploadType === "file" && !mediaFile) return alert("Please provide a media file.");
    if (tab === "text" && !textContent) return alert("Please provide text content.");
    
    try {
      setSaving(true);
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
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (data.ok) {
        setMediaUrl("");
        setTextContent("");
        setCaption("");
        fetchReels();
        alert("STEAM Short posted successfully!");
      } else {
        alert(data.message || "Failed to post");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting short");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Sparkles className="text-pink-500" />
          Manage STEAM Shorts
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Share stories with your students or approve their submissions!
        </p>

        {/* TOP TABS */}
        <div className="flex gap-4 mt-6 border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setMainTab("mine")}
            className={`pb-3 px-2 font-bold transition-all border-b-2 ${mainTab === "mine" ? 'border-pink-500 text-pink-600 dark:text-pink-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Your Shorts
          </button>
          <button 
            onClick={() => setMainTab("pending")}
            className={`pb-3 px-2 font-bold transition-all border-b-2 flex items-center gap-2 ${mainTab === "pending" ? 'border-pink-500 text-pink-600 dark:text-pink-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Student Submissions
            {pendingReels.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                {pendingReels.length} New
              </span>
            )}
          </button>
        </div>
      </div>

      {mainTab === "mine" ? (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus size={18} /> Post a New Short
          </h2>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
            {["image", "video", "text"].map(t => (
              <button 
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg transition ${tab === t ? 'bg-white dark:bg-slate-700 shadow text-pink-600 dark:text-pink-400' : 'text-slate-500'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "text" ? (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">Text Content</label>
                  <textarea 
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    required
                    className={`w-full h-32 p-4 rounded-xl text-white font-bold text-center text-xl resize-none outline-none placeholder:text-white/50 bg-gradient-to-br ${bgColor}`}
                    placeholder="Type something awesome..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Background Color</label>
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
                  <button type="button" onClick={() => setUploadType("url")} className={`px-3 py-1 text-xs font-bold rounded-lg ${uploadType === 'url' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    Paste URL
                  </button>
                  <button type="button" onClick={() => setUploadType("file")} className={`px-3 py-1 text-xs font-bold rounded-lg ${uploadType === 'file' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    Upload File
                  </button>
                </div>
                
                {uploadType === "url" ? (
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      {tab === "video" ? "Video URL (MP4)" : "Image URL"}
                    </label>
                    <input 
                      required
                      type="url"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-pink-500"
                      placeholder={`https://example.com/${tab === "video" ? "video.mp4" : "image.jpg"}`}
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      {tab === "video" ? "Upload Video (MP4)" : "Upload Image"}
                    </label>
                    <input 
                      required
                      type="file"
                      accept={tab === "video" ? "video/*" : "image/*"}
                      onChange={e => setMediaFile(e.target.files[0])}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-pink-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-1">Caption</label>
                  <textarea 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-pink-500"
                    placeholder="Check out this cool science experiment!"
                    value={caption || ""}
                    onChange={e => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={saving}
              className="w-full mt-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              Post Short
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Your Posted Shorts</h2>
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : reels.length === 0 ? (
            <div className="text-center p-10 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-slate-500">
              No shorts posted yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {reels.map(r => (
                <div key={r._id} className={`relative rounded-xl overflow-hidden aspect-[9/16] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end group ${r.mediaType === 'text' ? `bg-gradient-to-br ${r.bgColor}` : 'bg-black'}`}>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(r._id || r.id)}
                    className="absolute top-2 right-2 z-20 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Delete Short"
                  >
                    <Trash2 size={16} />
                  </button>

                  {r.mediaType === "video" && (
                     <video src={r.mediaUrl?.startsWith('/') ? API_BASE_URL.replace('/api', '') + r.mediaUrl : r.mediaUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  )}
                  {r.mediaType === "image" && (
                     <img src={r.mediaUrl?.startsWith('/') ? API_BASE_URL.replace('/api', '') + r.mediaUrl : r.mediaUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  )}
                  {r.mediaType === "text" && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <p className="text-white text-center font-bold text-sm drop-shadow-md">{r.textContent}</p>
                    </div>
                  )}

                  <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end">
                    {r.caption && <p className="text-xs text-white line-clamp-2">{r.caption}</p>}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-[11px] font-bold text-white drop-shadow">
                        <span className="flex items-center gap-1">❤️ {r.likes || 0}</span>
                        <span className="flex items-center gap-1">👁️ {r.views || 0}</span>
                      </div>
                    </div>

                    {r.viewers && r.viewers.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <div className="flex items-center gap-1 text-[10px] text-white/80 font-medium mb-1">
                          <Users size={10} /> Viewed by:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {r.viewers.slice(0, 3).map((v, i) => (
                            <span key={i} className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white truncate max-w-[60px]" title={v.fullName}>
                              {v.fullName?.split(" ")[0] || "User"}
                            </span>
                          ))}
                          {r.viewers.length > 3 && (
                            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white">
                              +{r.viewers.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      ) : (
      /* PENDING REELS TAB */
      <div>
        <h2 className="text-xl font-bold mb-6">Pending Approvals from Students</h2>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : pendingReels.length === 0 ? (
          <div className="text-center p-16 bg-slate-100 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 flex flex-col items-center">
            <Check size={48} className="text-green-500 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">All caught up!</h3>
            <p>No student shorts are pending approval right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {pendingReels.map(r => (
              <div key={r._id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
                
                {/* Author Info */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <img src={r.authorId?.profilePic || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" alt="Student" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{r.authorId?.fullName || "Student"}</p>
                    <p className="text-[10px] text-slate-500 truncate">{r.authorId?.school || "School"} • Class {r.authorId?.classLevel || "N/A"}</p>
                  </div>
                </div>

                {/* Media Container */}
                <div className={`relative aspect-[9/16] ${r.mediaType === 'text' ? `bg-gradient-to-br ${r.bgColor}` : 'bg-black'}`}>
                  {r.mediaType === "video" && (
                    <video src={r.mediaUrl?.startsWith('/') ? API_BASE_URL.replace('/api', '') + r.mediaUrl : r.mediaUrl} className="absolute inset-0 w-full h-full object-contain" controls />
                  )}
                  {r.mediaType === "image" && (
                    <img src={r.mediaUrl?.startsWith('/') ? API_BASE_URL.replace('/api', '') + r.mediaUrl : r.mediaUrl} className="absolute inset-0 w-full h-full object-contain" />
                  )}
                  {r.mediaType === "text" && (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      <p className="text-white font-bold text-lg leading-tight drop-shadow-md">{r.textContent}</p>
                    </div>
                  )}
                </div>

                {/* Caption & Actions */}
                <div className="p-4 flex flex-col flex-1">
                  {r.caption && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-3 flex-1">{r.caption}</p>
                  )}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => handleApprove(r._id)} className="flex-1 py-2 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 font-bold rounded-xl transition flex justify-center items-center gap-1 text-sm">
                      <Check size={16} /> Approve
                    </button>
                    <button onClick={() => handleReject(r._id)} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-bold rounded-xl transition flex justify-center items-center gap-1 text-sm">
                      <Trash2 size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
