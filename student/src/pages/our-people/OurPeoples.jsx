import React from "react";

export default function OurPeoples() {
  const team = [
    {
      name: "Alex Johnson",
      role: "Lead Developer",
      bio: "Passionate about creating engaging educational experiences.",
      img: "https://i.pravatar.cc/150?img=11",
    },
    {
      name: "Sarah Williams",
      role: "Science Educator",
      bio: "Making complex concepts simple and fun for students.",
      img: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "David Chen",
      role: "3D Artist",
      bio: "Bringing the solar system and human body to life.",
      img: "https://i.pravatar.cc/150?img=13",
    },
    {
      name: "Maria Garcia",
      role: "Community Manager",
      bio: "Connecting students and educators across the platform.",
      img: "https://i.pravatar.cc/150?img=9",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#05050a] text-white pt-28 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Our People
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            Meet the passionate team behind SteamBuddies, dedicated to transforming education through interactive 3D learning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-blue-500/50">
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
              <p className="text-sm font-medium text-blue-400 mb-3">{member.role}</p>
              <p className="text-sm text-white/60 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
