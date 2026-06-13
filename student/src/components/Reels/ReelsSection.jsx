import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/data";
import ReelsPlayer from "./ReelsPlayer";
import { Play } from "lucide-react";

export default function ReelsSection({ language }) {
  const [reels, setReels] = useState([]);
  const [activeReelIndex, setActiveReelIndex] = useState(null);
  const token = localStorage.getItem("accessToken") || "";

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) setReels(data.reels);
    } catch (err) {
      console.error("Failed to fetch reels", err);
    }
  };

  if (reels.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3 flex items-center gap-2 px-2">
        <Play size={16} className="text-indigo-500 fill-indigo-500" />
        {language === "hi" ? "एजुकेटर रील्स" : "Educator Reels"}
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x hide-scrollbar">
        {reels.map((reel, index) => (
          <div 
            key={reel._id} 
            onClick={() => setActiveReelIndex(index)}
            className="flex-shrink-0 cursor-pointer snap-start group"
          >
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-indigo-500 p-1 mb-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                {reel.videoUrl.includes("youtube") ? (
                  <img src={`https://img.youtube.com/vi/${reel.videoUrl.split(/v=|shorts\//)[1]?.split('&')[0]}/0.jpg`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                ) : (
                  <video src={reel.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play size={20} className="text-white opacity-80" />
                </div>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-center font-semibold text-slate-600 dark:text-slate-300 truncate w-16 md:w-20">
              {reel.authorId?.fullName?.split(" ")[0] || "User"}
            </p>
          </div>
        ))}
      </div>

      {activeReelIndex !== null && (
        <ReelsPlayer 
          reels={reels} 
          initialIndex={activeReelIndex} 
          onClose={() => setActiveReelIndex(null)} 
          token={token}
        />
      )}
    </div>
  );
}
