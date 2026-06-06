// src/context/LanguageContext.jsx
import { createContext, useEffect, useState } from "react";

export const LanguageContext = createContext(null);

export default function LanguageProvider({ children }) {
  const getInitialLanguage = () => {
    const saved = localStorage.getItem("language");
    return saved || "en"; // "en" | "hi"
  };

  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((p) => (p === "en" ? "hi" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
