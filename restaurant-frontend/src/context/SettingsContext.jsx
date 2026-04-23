import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("appSettings");
    return saved ? JSON.parse(saved) : {
      darkMode: false,
      language: "en",
      currency: "EUR",
      timezone: "Europe/Berlin",
      dateFormat: "DD/MM/YYYY",
    };
  });

  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
    
    // Apply dark mode to body
    if (settings.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [settings]);

  const updateSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
