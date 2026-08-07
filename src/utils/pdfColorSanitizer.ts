/**
 * Utility to convert OKLCH and OKLAB color strings to RGB/RGBA formats
 * to prevent html2canvas crashes in modern browsers with Tailwind CSS v4.
 */

export const replaceOklchWithRgb = (cssText: string): string => {
  if (!cssText || !cssText.includes("oklch")) return cssText;

  return cssText.replace(/oklch\s*\(([^)]+)\)/gi, (match, contents) => {
    try {
      const parts = contents.split(/[\s,/\s]+/).filter(Boolean);
      if (parts.length >= 3) {
        let lStr = parts[0];
        let cStr = parts[1];
        let hStr = parts[2];
        let aStr = parts[3];

        let l = parseFloat(lStr);
        if (lStr.includes("%")) {
          l = parseFloat(lStr) / 100;
        }
        let c = parseFloat(cStr);
        let h = parseFloat(hStr);
        let a = aStr !== undefined ? parseFloat(aStr) : 1;
        if (aStr && aStr.includes("%")) {
          a = parseFloat(aStr) / 100;
        }

        const hRad = (h * Math.PI) / 180;
        const aLab = c * Math.cos(hRad);
        const bLab = c * Math.sin(hRad);

        const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
        const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
        const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;

        const l_crit = l_ * l_ * l_;
        const m_crit = m_ * m_ * m_;
        const s_crit = s_ * s_ * s_;

        const r_lin = +4.0767416621 * l_crit - 3.3077115913 * m_crit + 0.2309699292 * s_crit;
        const g_lin = -1.2684380046 * l_crit + 2.6097574011 * m_crit - 0.3413193965 * s_crit;
        const b_lin = -0.0041960863 * l_crit - 0.7034186147 * m_crit + 1.7076147010 * s_crit;

        const toSRGB = (cVal: number) => {
          const clamped = Math.max(0, Math.min(1, cVal));
          return clamped <= 0.0031308
            ? clamped * 12.92
            : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
        };

        const r = Math.round(toSRGB(r_lin) * 255);
        const g = Math.round(toSRGB(g_lin) * 255);
        const b = Math.round(toSRGB(b_lin) * 255);

        if (a < 1) {
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }
    } catch {
      // fallback
    }
    return "rgb(30, 41, 59)";
  });
};

export const replaceOklabWithRgb = (cssText: string): string => {
  if (!cssText || !cssText.includes("oklab")) return cssText;

  return cssText.replace(/oklab\s*\(([^)]+)\)/gi, (match, contents) => {
    try {
      const parts = contents.split(/[\s,/\s]+/).filter(Boolean);
      if (parts.length >= 3) {
        let lStr = parts[0];
        let aStr = parts[1];
        let bStr = parts[2];
        let alphaStr = parts[3];

        let l = parseFloat(lStr);
        if (lStr.includes("%")) l /= 100;

        let aLab = parseFloat(aStr);
        let bLab = parseFloat(bStr);
        let alpha = alphaStr !== undefined ? parseFloat(alphaStr) : 1;
        if (alphaStr && alphaStr.includes("%")) alpha /= 100;

        const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
        const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
        const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;

        const l_crit = l_ * l_ * l_;
        const m_crit = m_ * m_ * m_;
        const s_crit = s_ * s_ * s_;

        const r_lin = +4.0767416621 * l_crit - 3.3077115913 * m_crit + 0.2309699292 * s_crit;
        const g_lin = -1.2684380046 * l_crit + 2.6097574011 * m_crit - 0.3413193965 * s_crit;
        const b_lin = -0.0041960863 * l_crit - 0.7034186147 * m_crit + 1.7076147010 * s_crit;

        const toSRGB = (cVal: number) => {
          const clamped = Math.max(0, Math.min(1, cVal));
          return clamped <= 0.0031308
            ? clamped * 12.92
            : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
        };

        const r = Math.round(toSRGB(r_lin) * 255);
        const g = Math.round(toSRGB(g_lin) * 255);
        const b = Math.round(toSRGB(b_lin) * 255);

        if (alpha < 1) {
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }
    } catch {
      // fallback
    }
    return "rgb(30, 41, 59)";
  });
};

/**
 * Patches a window object's getComputedStyle to proxy and convert modern oklch/oklab colors.
 */
export const patchWinGCS = (win: Window) => {
  try {
    if (!win || (win as any).__isGCS_Patched) return;
    const original = win.getComputedStyle;
    (win as any).__isGCS_Patched = true;

    win.getComputedStyle = function (el, pseudo) {
      try {
        const style = original.call(win, el, pseudo);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === "getPropertyValue") {
              return function (propertyName: string) {
                try {
                  const val = target.getPropertyValue(propertyName);
                  if (typeof val === "string") {
                    let updatedVal = val;
                    if (/oklch/i.test(updatedVal)) updatedVal = replaceOklchWithRgb(updatedVal);
                    if (/oklab/i.test(updatedVal)) updatedVal = replaceOklabWithRgb(updatedVal);
                    return updatedVal;
                  }
                  return val;
                } catch {
                  return "";
                }
              };
            }
            try {
              const val = (target as any)[prop];
              if (typeof val === "function") return val.bind(target);
              if (typeof val === "string") {
                let updatedVal = val;
                if (/oklch/i.test(updatedVal)) updatedVal = replaceOklchWithRgb(updatedVal);
                if (/oklab/i.test(updatedVal)) updatedVal = replaceOklabWithRgb(updatedVal);
                return updatedVal;
              }
              return val;
            } catch {
              return undefined;
            }
          }
        });
      } catch {
        try {
          return original.call(win, el, pseudo);
        } catch {
          return { getPropertyValue: () => "" } as any;
        }
      }
    };
  } catch (e) {
    console.warn("GCS patch failed", e);
  }
};

/**
 * Sanitizes all style nodes, inline styles, and window computed styles before running html2canvas.
 */
export const sanitizeDocumentForPdf = async (doc: Document) => {
  // 1. Patch main window getComputedStyle
  if (doc.defaultView) {
    patchWinGCS(doc.defaultView);
  }

  // 2. Clean inline style tags
  const styleElements = Array.from(doc.querySelectorAll("style"));
  for (const styleObj of styleElements) {
    let text = styleObj.innerHTML;
    if (/oklch|oklab/i.test(text)) {
      text = replaceOklchWithRgb(text);
      text = replaceOklabWithRgb(text);
      styleObj.innerHTML = text;
    }
  }

  // 3. Process stylesheet links
  const linkElements = Array.from(doc.querySelectorAll("link[rel='stylesheet']")) as HTMLLinkElement[];
  for (const linkEl of linkElements) {
    try {
      const isSameOrigin = !linkEl.href.startsWith("http") || linkEl.href.startsWith(window.location.origin);
      if (isSameOrigin) {
        const res = await fetch(linkEl.href);
        if (res.ok) {
          let cssText = await res.text();
          if (/oklch|oklab/i.test(cssText)) {
            cssText = replaceOklchWithRgb(cssText);
            cssText = replaceOklabWithRgb(cssText);

            const tStyle = doc.createElement("style");
            tStyle.setAttribute("data-temp-clean", "true");
            tStyle.innerHTML = cssText;
            doc.head.appendChild(tStyle);

            linkEl.disabled = true;
          }
        }
      }
    } catch (linkErr) {
      console.warn("Could not fetch/clean stylesheet link:", linkEl.href, linkErr);
    }
  }

  // 4. Sanitize inline element styles
  const elementsWithStyle = doc.querySelectorAll("[style]");
  elementsWithStyle.forEach((elem) => {
    const styleAttr = elem.getAttribute("style");
    if (styleAttr && /oklch|oklab/i.test(styleAttr)) {
      let updatedStyle = replaceOklchWithRgb(styleAttr);
      updatedStyle = replaceOklabWithRgb(updatedStyle);
      elem.setAttribute("style", updatedStyle);
    }
  });
};
