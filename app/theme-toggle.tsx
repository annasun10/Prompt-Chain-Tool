"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-lg border px-3 py-2 text-sm ${
          theme === "light" ? "font-semibold" : ""
        }`}
      >
        Light
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-lg border px-3 py-2 text-sm ${
          theme === "dark" ? "font-semibold" : ""
        }`}
      >
        Dark
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`rounded-lg border px-3 py-2 text-sm ${
          theme === "system" ? "font-semibold" : ""
        }`}
      >
        System
      </button>
    </div>
  );
}