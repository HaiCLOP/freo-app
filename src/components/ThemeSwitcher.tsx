"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun, Palette } from "lucide-react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const themes = [
    { name: "light", icon: Sun, label: "Light" },
    { name: "dark", icon: Moon, label: "Dark" },
    { name: "system", icon: Monitor, label: "System" },
    { name: "mindmarket", icon: Palette, label: "MindMarket" },
  ];

  return (
    <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-full shadow-sm">
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name)}
          className={`p-2 rounded-full transition-colors ${
            theme === t.name
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          }`}
          aria-label={`Switch to ${t.label} theme`}
          title={`Switch to ${t.label} theme`}
        >
          <t.icon size={18} />
        </button>
      ))}
    </div>
  );
}
