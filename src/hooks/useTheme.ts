import { useState, useEffect } from "react";

export function useTheme() {
  const [themeSetting, setThemeSetting] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem("mixwizard-theme") as any;
    return (saved === "light" || saved === "dark" || saved === "system") ? saved : "dark";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    localStorage.setItem("mixwizard-theme", themeSetting);
    
    if (themeSetting === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      
      const listener = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      setResolvedTheme(themeSetting);
    }
  }, [themeSetting]);

  return {
    themeSetting,
    setThemeSetting,
    resolvedTheme,
    themeMode: resolvedTheme
  };
}
