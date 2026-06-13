import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "../../utils/data";

export default function ReelsPlayer({ reels, initialIndex, onClose, token }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [localReels, setLocalReels] = useState([...reels]);

  const currentReel = localReels[currentIndex];

  const handleNext = () => {
    if (currentIndex < localReels.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reels/${currentReel._id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = [...localReels];
        updated[currentIndex].likes += 1;
        setLocalReels(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") handleNext();
      if (e.key === "ArrowUp") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-md"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
          <X size={24} />
        </button>

        <div className="relative w-full max-w-sm h-[85vh] bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Controls */}
          {currentIndex > 0 && (
            <button onClick={handlePrev} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-black/50 rounded-full text-white/80 hover:text-white">
              <ChevronUp size={24} />
            </button>
          )}
          {currentIndex < localReels.length - 1 && (
            <button onClick={handleNext} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-black/50 rounded-full text-white/80 hover:text-white">
              <ChevronDown size={24} />
            </button>
          )}

          {/* Video Player */}
          {currentReel.videoUrl.includes("youtube") ? (
            <iframe 
              src={`${currentReel.videoUrl.replace("watch?v=", "embed/").replace("shorts/", "embed/")}?autoplay=1&loop=1&controls=0`}
              className="w-full h-full pointer-events-none" 
              allow="autoplay; encrypted-media"
              frameBorder="0"
            ></iframe>
          ) : (
            <video 
              src={currentReel.videoUrl} 
              autoPlay 
              loop 
              playsInline
              className="w-full h-full object-cover" 
            />
          )}

          {/* Overlay Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div className="flex items-end justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    {currentReel.authorId?.fullName?.[0] || "U"}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{currentReel.authorId?.fullName || "User"}</p>
                    <p className="text-white/60 text-[10px] leading-tight">
                      {currentReel.authorId?.school || "No School"} • {currentReel.authorId?.classLevel || "General"}
                    </p>
                  </div>
                </div>
                <p className="text-white/90 text-sm line-clamp-3">{currentReel.caption}</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
                  <div className="p-3 bg-white/10 rounded-full group-hover:bg-rose-500/20 transition">
                    <Heart size={24} className="text-white group-hover:text-rose-500 group-hover:fill-rose-500 transition" />
                  </div>
                  <span className="text-white font-bold text-xs">{currentReel.likes}</span>
                </button>
                <div className="flex flex-col items-center gap-1">
                  <div className="p-3 bg-white/10 rounded-full">
                    <Eye size={24} className="text-white" />
                  </div>
                  <span className="text-white font-bold text-xs">{currentReel.views}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
