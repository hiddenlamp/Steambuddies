import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import { SETTINGS_SECTIONS, LANGUAGES } from "../../utils/data";
import { 
  User, Bell, Palette, Globe, Shield, Info, 
  ChevronRight, Check, Moon, Sun
} from "lucide-react";

const iconMap = {
  account: User,
  notifications: Bell,
  appearance: Palette,
  language: Globe,
  privacy: Shield,
  about: Info,
};

export default function Settings() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { language, setLanguage } = useContext(LanguageContext);
  const [activeSection, setActiveSection] = useState("appearance");
  
  const [notifications, setNotifications] = useState({
    courses: true,
    quests: true,
    mocktests: false,
    announcements: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030008] text-gray-900 dark:text-white pb-24 font-sans transition-colors duration-300">
      
      {/* Background decorations for dark mode */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] hidden dark:block" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-[80px] hidden dark:block" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 inline-block">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-white/60 font-medium mt-2">
            Customize your SteamBuddies experience
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Menu */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-72 shrink-0 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-3xl p-3 shadow-xl dark:shadow-2xl dark:backdrop-blur-xl"
          >
            <nav className="flex flex-col gap-1">
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = iconMap[section.id] || User;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                      isActive 
                        ? "text-blue-600 dark:text-white font-bold" 
                        : "text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white font-medium"
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-50 dark:bg-white/10 z-0"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={`w-5 h-5 z-10 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white/80'}`} />
                    <span className="z-10">{section.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto z-10 opacity-50" />}
                  </button>
                );
              })}
            </nav>
          </motion.div>

          {/* Content Area */}
          <motion.div 
            layout
            className="flex-1 w-full min-h-[500px] bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-xl dark:shadow-2xl dark:backdrop-blur-xl relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* ── Appearance ── */}
                {activeSection === "appearance" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Appearance</h2>
                      <p className="text-gray-500 dark:text-white/60 text-sm font-medium">Customize the look and feel of your platform.</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                            Theme Preference
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">Switch between Light and Dark mode.</p>
                        </div>
                        <Toggle checked={theme === "dark"} onChange={toggleTheme} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Language ── */}
                {activeSection === "language" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Language</h2>
                      <p className="text-gray-500 dark:text-white/60 text-sm font-medium">Select your preferred learning language.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {LANGUAGES.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className={`flex items-center p-4 rounded-2xl transition-all duration-300 border-2 text-left group ${
                              isSelected 
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500" 
                                : "border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/30 bg-transparent"
                            }`}
                          >
                            <span className="text-2xl mr-4 drop-shadow-md">{lang.flag}</span>
                            <span className={`font-bold ${isSelected ? 'text-blue-700 dark:text-white' : 'text-gray-700 dark:text-white/70'}`}>
                              {lang.label}
                            </span>
                            {isSelected && (
                              <motion.div initial={{scale: 0}} animate={{scale: 1}} className="ml-auto w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4" />
                              </motion.div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Notifications ── */}
                {activeSection === "notifications" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Notifications</h2>
                      <p className="text-gray-500 dark:text-white/60 text-sm font-medium">Choose what updates you want to receive.</p>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(notifications).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.02]">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white capitalize">{key}</h3>
                            <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">Receive updates about {key}.</p>
                          </div>
                          <Toggle
                            checked={val}
                            onChange={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Account ── */}
                {activeSection === "account" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Account Details</h2>
                      <p className="text-gray-500 dark:text-white/60 text-sm font-medium">Manage your personal profile information.</p>
                    </div>
                    
                    <div className="p-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">Profile Management</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                          Your profile settings, school details, and progress are securely managed in your dedicated profile space.
                        </p>
                        <a href="/profile" className="inline-block mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-600/30 text-sm">
                          Go to Profile
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Privacy & About ── */}
                {(activeSection === "privacy" || activeSection === "about") && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white capitalize">{activeSection}</h2>
                      <p className="text-gray-500 dark:text-white/60 text-sm font-medium">
                        {activeSection === 'privacy' ? 'Your security is our priority.' : 'Learn more about SteamBuddies.'}
                      </p>
                    </div>

                    <div className="p-8 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                        {activeSection === 'privacy' ? <Shield className="w-8 h-8 text-white" /> : <Info className="w-8 h-8 text-white" />}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {activeSection === 'privacy' ? 'End-to-End Security' : 'SteamBuddies Platform'}
                      </h3>
                      <p className="text-gray-600 dark:text-white/70 max-w-md leading-relaxed text-sm">
                        {activeSection === 'privacy' 
                          ? 'We strictly protect your educational data. We never sell or share your personal information with third parties. Your learning journey remains completely private.' 
                          : 'A next-generation STEAM learning platform empowering students and educators worldwide with interactive 3D tools, quests, and modern curriculum.'}
                      </p>
                      {activeSection === 'about' && (
                        <div className="mt-6 px-4 py-2 bg-gray-200 dark:bg-white/10 rounded-lg text-sm font-mono font-bold text-gray-600 dark:text-white/60">
                          v1.0.0 (Latest)
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 ${
        checked ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-gray-300 dark:bg-gray-700'
      }`}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
          checked ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
