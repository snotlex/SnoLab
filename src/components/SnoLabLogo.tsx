import React from "react";
import { motion } from "motion/react";
import { useTheme } from "../hooks/useTheme";

interface SnoLabLogoProps {
  className?: string;
  iconOnly?: boolean;
  themeMode?: "light" | "dark";
}

export const SnoLabLogo: React.FC<SnoLabLogoProps> = ({
  className = "h-10 w-auto",
  iconOnly = false,
  themeMode: propThemeMode,
}) => {
  const { themeMode: hookThemeMode } = useTheme();
  const theme = propThemeMode || hookThemeMode;
  const isDark = theme === "dark";

  return (
    <div className={`relative flex items-center ${className} select-none notranslate`} translate="no" style={{ aspectRatio: iconOnly ? "1/1" : "3.5/1" }}>
      {/* Light Theme Logo Container */}
      <motion.div
        translate="no"
        initial={false}
        animate={{ opacity: isDark ? 0 : 1, y: isDark ? 4 : 0 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className={`absolute inset-0 flex items-center gap-3 notranslate ${
          isDark ? "pointer-events-none" : ""
        }`}
      >
        <svg
          viewBox={iconOnly ? "280 0 140 120" : "0 0 420 120"}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Defs / Gradients */}
          <defs>
            {/* Blue Gradient for 'Lab' and Hexagon */}
            <linearGradient id="lab-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C2FF" />
              <stop offset="100%" stopColor="#0055FF" />
            </linearGradient>

            <linearGradient id="panel-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            <linearGradient id="panel-grad-light-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Cube Shading Gradients */}
            <linearGradient id="cube-top-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
            <linearGradient id="cube-left-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="cube-right-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* Text "SnoLab" */}
          {!iconOnly && (
            <text
              x="20"
              y="78"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="58"
              letterSpacing="-0.03em"
            >
              <tspan fill="#0B1F3A">Sno</tspan>
              <tspan fill="url(#lab-grad-light)">Lab</tspan>
            </text>
          )}

          {/* Hexagon Icon Group */}
          <g id="hexagon-icon-light">
            {/* Hexagon Panels (Outer Ring) */}
            
            {/* Panel 1: Top-Right (Gradient) */}
            <path
              d="M 340,12 L 381.6,36 L 364.25,46 L 340,32 Z"
              fill="url(#panel-grad-light)"
            />

            {/* Panel 2: Right-Middle (Deep Blue with aggregates) */}
            <path
              d="M 381.6,36 L 381.6,84 L 364.25,74 L 364.25,46 Z"
              fill="#0B1F3A"
            />
            {/* Aggregate dots on Panel 2 */}
            <circle cx="372" cy="52" r="1.8" fill="#FFFFFF" opacity="0.9" />
            <circle cx="376" cy="60" r="1.3" fill="#FFFFFF" opacity="0.9" />
            <circle cx="373" cy="68" r="2.2" fill="#FFFFFF" opacity="0.9" />
            <circle cx="377" cy="74" r="1.5" fill="#FFFFFF" opacity="0.9" />

            {/* Panel 3: Bottom-Right (Gradient) */}
            <path
              d="M 381.6,84 L 340,108 L 340,88 L 364.25,74 Z"
              fill="url(#panel-grad-light-2)"
            />

            {/* Panel 4: Bottom-Left (Deep Blue with aggregates) */}
            <path
              d="M 340,108 L 298.4,84 L 315.75,74 L 340,88 Z"
              fill="#0B1F3A"
            />
            {/* Aggregate dots on Panel 4 */}
            <circle cx="328" cy="85" r="1.8" fill="#FFFFFF" opacity="0.9" />
            <circle cx="332" cy="93" r="1.3" fill="#FFFFFF" opacity="0.9" />
            <circle cx="318" cy="81" r="2.2" fill="#FFFFFF" opacity="0.9" />

            {/* Panel 5: Left-Middle (Gradient) */}
            <path
              d="M 298.4,84 L 298.4,36 L 315.75,46 L 315.75,74 Z"
              fill="url(#panel-grad-light)"
            />

            {/* Panel 6: Top-Left (Deep Blue with aggregates) */}
            <path
              d="M 298.4,36 L 340,12 L 340,32 L 315.75,46 Z"
              fill="#0B1F3A"
            />
            {/* Aggregate dots on Panel 6 */}
            <circle cx="316" cy="33" r="1.8" fill="#FFFFFF" opacity="0.9" />
            <circle cx="326" cy="31" r="1.3" fill="#FFFFFF" opacity="0.9" />
            <circle cx="323" cy="38" r="2.2" fill="#FFFFFF" opacity="0.9" />

            {/* Central 3D Cube */}
            {/* Top Face */}
            <polygon points="340,45 353,52.5 340,60 327,52.5" fill="url(#cube-top-light)" />
            {/* Left Face */}
            <polygon points="340,60 327,52.5 327,67.5 340,75" fill="url(#cube-left-light)" />
            {/* Right Face */}
            <polygon points="340,60 353,52.5 353,67.5 340,75" fill="url(#cube-right-light)" />
          </g>
        </svg>
      </motion.div>

      {/* Dark Theme Logo Container */}
      <motion.div
        translate="no"
        initial={false}
        animate={{ opacity: isDark ? 1 : 0, y: isDark ? 0 : -4 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className={`absolute inset-0 flex items-center gap-3 notranslate ${
          !isDark ? "pointer-events-none" : ""
        }`}
      >
        <svg
          viewBox={iconOnly ? "280 0 140 120" : "0 0 420 120"}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Defs / Gradients / Glows */}
          <defs>
            {/* Soft Blue Glow for Dark Mode */}
            <filter id="glow-dark" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Blue Gradient for 'Lab' and Hexagon */}
            <linearGradient id="lab-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C2FF" />
              <stop offset="100%" stopColor="#0055FF" />
            </linearGradient>

            <linearGradient id="panel-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            <linearGradient id="panel-grad-dark-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Cube Shading Gradients */}
            <linearGradient id="cube-top-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
            <linearGradient id="cube-left-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="cube-right-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* Subtle blue background glow (<10% opacity) */}
          <circle cx="340" cy="60" r="70" fill="#00C2FF" opacity="0.06" filter="url(#glow-dark)" />

          {/* Text "SnoLab" */}
          {!iconOnly && (
            <text
              x="20"
              y="78"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="58"
              letterSpacing="-0.03em"
            >
              <tspan fill="#FFFFFF">Sno</tspan>
              <tspan fill="url(#lab-grad-dark)">Lab</tspan>
            </text>
          )}

          {/* Hexagon Icon Group */}
          <g id="hexagon-icon-dark">
            {/* Hexagon Panels (Outer Ring) */}
            
            {/* Panel 1: Top-Right (Gradient) */}
            <path
              d="M 340,12 L 381.6,36 L 364.25,46 L 340,32 Z"
              fill="url(#panel-grad-dark)"
            />

            {/* Panel 2: Right-Middle (Deep Blue with aggregates) */}
            <path
              d="M 381.6,36 L 381.6,84 L 364.25,74 L 364.25,46 Z"
              fill="#0B1F3A"
            />
            {/* Aggregate dots on Panel 2 */}
            <circle cx="372" cy="52" r="1.8" fill="#FFFFFF" opacity="0.9" />
            <circle cx="376" cy="60" r="1.3" fill="#FFFFFF" opacity="0.9" />
            <circle cx="373" cy="68" r="2.2" fill="#FFFFFF" opacity="0.9" />
            <circle cx="377" cy="74" r="1.5" fill="#FFFFFF" opacity="0.9" />

            {/* Panel 3: Bottom-Right (Gradient) */}
            <path
              d="M 381.6,84 L 340,108 L 340,88 L 364.25,74 Z"
              fill="url(#panel-grad-dark-2)"
            />

            {/* Panel 4: Bottom-Left (Deep Blue with aggregates) */}
            <path
              d="M 340,108 L 298.4,84 L 315.75,74 L 340,88 Z"
              fill="#0B1F3A"
            />
            {/* Aggregate dots on Panel 4 */}
            <circle cx="328" cy="85" r="1.8" fill="#FFFFFF" opacity="0.9" />
            <circle cx="332" cy="93" r="1.3" fill="#FFFFFF" opacity="0.9" />
            <circle cx="318" cy="81" r="2.2" fill="#FFFFFF" opacity="0.9" />

            {/* Panel 5: Left-Middle (Gradient) */}
            <path
              d="M 298.4,84 L 298.4,36 L 315.75,46 L 315.75,74 Z"
              fill="url(#panel-grad-dark)"
            />

            {/* Panel 6: Top-Left (Deep Blue with aggregates) */}
            <path
              d="M 298.4,36 L 340,12 L 340,32 L 315.75,46 Z"
              fill="#0B1F3A"
            />
            {/* Aggregate dots on Panel 6 */}
            <circle cx="316" cy="33" r="1.8" fill="#FFFFFF" opacity="0.9" />
            <circle cx="326" cy="31" r="1.3" fill="#FFFFFF" opacity="0.9" />
            <circle cx="323" cy="38" r="2.2" fill="#FFFFFF" opacity="0.9" />

            {/* Central 3D Cube */}
            {/* Top Face */}
            <polygon points="340,45 353,52.5 340,60 327,52.5" fill="url(#cube-top-dark)" />
            {/* Left Face */}
            <polygon points="340,60 327,52.5 327,67.5 340,75" fill="url(#cube-left-dark)" />
            {/* Right Face */}
            <polygon points="340,60 353,52.5 353,67.5 340,75" fill="url(#cube-right-dark)" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
};
