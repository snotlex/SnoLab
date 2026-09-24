import React from "react";
import { motion } from "motion/react";
import { useTheme } from "../hooks/useTheme";

interface SnoLabLogoProps {
  className?: string;
  iconOnly?: boolean;
  themeMode?: "light" | "dark";
}

/**
 * Official SnoLab brand mark supplied by the product owner.
 * Separate light/dark raster assets keep the white wordmark legible on dark UI
 * while using the navy variant on light surfaces. Both assets retain alpha
 * transparency and are exported at high resolution for crisp scaling.
 */
export const SnoLabLogo: React.FC<SnoLabLogoProps> = ({
  className = "h-10 w-auto",
  iconOnly = false,
  themeMode: propThemeMode,
}) => {
  const { themeMode: hookThemeMode } = useTheme();
  const theme = propThemeMode || hookThemeMode;
  const isDark = theme === "dark";
  const suffix = iconOnly ? "icon-" : "";
  const ratio = iconOnly ? 327 / 419 : 806 / 427;

  return (
    <div
      className={`relative shrink-0 select-none notranslate ${className}`}
      translate="no"
      style={{ aspectRatio: ratio }}
      aria-label="SnoLab"
      role="img"
    >
      <motion.img
        src={`/brand/snolab-official-${suffix}light.webp`}
        alt="SnoLab"
        initial={false}
        animate={{ opacity: isDark ? 0 : 1, y: isDark ? 4 : 0 }}
        transition={{ duration: 0.24, ease: "easeInOut" }}
        className={`absolute inset-0 h-full w-full object-contain object-center ${isDark ? "pointer-events-none" : ""}`}
        draggable={false}
      />
      <motion.img
        src={`/brand/snolab-official-${suffix}dark.webp`}
        alt=""
        aria-hidden="true"
        initial={false}
        animate={{ opacity: isDark ? 1 : 0, y: isDark ? 0 : -4 }}
        transition={{ duration: 0.24, ease: "easeInOut" }}
        className={`absolute inset-0 h-full w-full object-contain object-center ${!isDark ? "pointer-events-none" : ""}`}
        draggable={false}
      />
    </div>
  );
};

export default SnoLabLogo;
