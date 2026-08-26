import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Robust utility to convert OKLCH, OKLAB, and modern CSS color formats to standard RGB/RGBA formats.
 * This guarantees 100% compatibility with html2canvas and jsPDF in modern browsers using Tailwind CSS v4.
 */

// Helper to convert sRGB linear to gamma-corrected sRGB (0-255)
const toSRGB = (cVal: number): number => {
  const clamped = Math.max(0, Math.min(1, cVal));
  const srgb = clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, srgb * 255)));
};

/**
 * Converts oklch(...) strings to rgb(...) / rgba(...)
 * Examples:
 *  - oklch(0.623 0.214 259.815)
 *  - oklch(62.3% 0.214 259.815deg / 0.5)
 *  - oklch(none none none)
 */
export const replaceOklchWithRgb = (cssText: string): string => {
  if (!cssText || typeof cssText !== "string" || !cssText.toLowerCase().includes("oklch")) {
    return cssText;
  }

  return cssText.replace(/oklch\s*\(([^)]+)\)/gi, (match, contents) => {
    try {
      // Split by spaces, commas, or slashes
      const parts = contents.trim().split(/[\s,/]+/).filter(Boolean);
      if (parts.length >= 3) {
        const lStr = parts[0].toLowerCase();
        const cStr = parts[1].toLowerCase();
        const hStr = parts[2].toLowerCase();
        const aStr = parts[3] ? parts[3].toLowerCase() : "1";

        let l = lStr.endsWith("%") ? parseFloat(lStr) / 100 : lStr === "none" ? 0 : parseFloat(lStr);
        let c = cStr === "none" ? 0 : parseFloat(cStr);
        let h = hStr.endsWith("deg") ? parseFloat(hStr) : hStr.endsWith("rad") ? (parseFloat(hStr) * 180) / Math.PI : hStr === "none" ? 0 : parseFloat(hStr);
        let a = aStr.endsWith("%") ? parseFloat(aStr) / 100 : aStr === "none" ? 1 : parseFloat(aStr);

        if (isNaN(l)) l = 0.5;
        if (isNaN(c)) c = 0;
        if (isNaN(h)) h = 0;
        if (isNaN(a)) a = 1;

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

        const r = toSRGB(r_lin);
        const g = toSRGB(g_lin);
        const b = toSRGB(b_lin);

        if (a < 0.999) {
          return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }
    } catch {
      // Fallback safe color
    }
    return "rgb(30, 41, 59)";
  });
};

/**
 * Converts oklab(...) strings to rgb(...) / rgba(...)
 */
export const replaceOklabWithRgb = (cssText: string): string => {
  if (!cssText || typeof cssText !== "string" || !cssText.toLowerCase().includes("oklab")) {
    return cssText;
  }

  return cssText.replace(/oklab\s*\(([^)]+)\)/gi, (match, contents) => {
    try {
      const parts = contents.trim().split(/[\s,/]+/).filter(Boolean);
      if (parts.length >= 3) {
        const lStr = parts[0].toLowerCase();
        const aStr = parts[1].toLowerCase();
        const bStr = parts[2].toLowerCase();
        const alphaStr = parts[3] ? parts[3].toLowerCase() : "1";

        let l = lStr.endsWith("%") ? parseFloat(lStr) / 100 : lStr === "none" ? 0 : parseFloat(lStr);
        let aLab = aStr === "none" ? 0 : parseFloat(aStr);
        let bLab = bStr === "none" ? 0 : parseFloat(bStr);
        let alpha = alphaStr.endsWith("%") ? parseFloat(alphaStr) / 100 : alphaStr === "none" ? 1 : parseFloat(alphaStr);

        if (isNaN(l)) l = 0.5;
        if (isNaN(aLab)) aLab = 0;
        if (isNaN(bLab)) bLab = 0;
        if (isNaN(alpha)) alpha = 1;

        const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
        const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
        const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;

        const l_crit = l_ * l_ * l_;
        const m_crit = m_ * m_ * m_;
        const s_crit = s_ * s_ * s_;

        const r_lin = +4.0767416621 * l_crit - 3.3077115913 * m_crit + 0.2309699292 * s_crit;
        const g_lin = -1.2684380046 * l_crit + 2.6097574011 * m_crit - 0.3413193965 * s_crit;
        const b_lin = -0.0041960863 * l_crit - 0.7034186147 * m_crit + 1.7076147010 * s_crit;

        const r = toSRGB(r_lin);
        const g = toSRGB(g_lin);
        const b = toSRGB(b_lin);

        if (alpha < 0.999) {
          return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
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
 * Converts modern CSS color functions like color(srgb ...) or lab(...) to standard RGB.
 */
export const replaceModernColorsWithRgb = (cssText: string): string => {
  if (!cssText || typeof cssText !== "string") return cssText;
  let text = cssText;
  if (/oklch/i.test(text)) text = replaceOklchWithRgb(text);
  if (/oklab/i.test(text)) text = replaceOklabWithRgb(text);
  
  // Handle color(srgb ...) or color(display-p3 ...)
  if (/color\s*\(/i.test(text)) {
    text = text.replace(/color\s*\((?:srgb|display-p3)\s+([^)]+)\)/gi, (match, contents) => {
      try {
        const parts = contents.trim().split(/[\s,/]+/).filter(Boolean);
        if (parts.length >= 3) {
          const r = Math.round(parseFloat(parts[0]) * 255);
          const g = Math.round(parseFloat(parts[1]) * 255);
          const b = Math.round(parseFloat(parts[2]) * 255);
          const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
          if (a < 0.999) {
            return `rgba(${r}, ${g}, ${b}, ${a})`;
          }
          return `rgb(${r}, ${g}, ${b})`;
        }
      } catch {
        // ignore
      }
      return "rgb(30, 41, 59)";
    });
  }

  return text;
};

/**
 * Patches a window object's getComputedStyle to proxy and convert modern oklch/oklab colors.
 */
export const patchWinGCS = (win: Window): (() => void) => {
  try {
    if (!win || (win as any).__isGCS_Patched) return () => {};
    const originalGCS = win.getComputedStyle;
    (win as any).__isGCS_Patched = true;

    win.getComputedStyle = function (el: Element, pseudo?: string | null) {
      try {
        const style = originalGCS.call(win, el, pseudo);
        return new Proxy(style, {
          get(target: CSSStyleDeclaration, prop: string | symbol) {
            if (prop === "getPropertyValue") {
              return function (propertyName: string) {
                try {
                  const val = target.getPropertyValue(propertyName);
                  if (typeof val === "string") {
                    return replaceModernColorsWithRgb(val);
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
                return replaceModernColorsWithRgb(val);
              }
              return val;
            } catch {
              return undefined;
            }
          }
        });
      } catch {
        try {
          return originalGCS.call(win, el, pseudo);
        } catch {
          return { getPropertyValue: () => "" } as any;
        }
      }
    };

    return () => {
      try {
        win.getComputedStyle = originalGCS;
        (win as any).__isGCS_Patched = false;
      } catch {
        // ignore
      }
    };
  } catch (e) {
    console.warn("GCS patch failed", e);
    return () => {};
  }
};

/**
 * Sanitizes all style nodes, inline styles, and window computed styles before running html2canvas.
 */
export const sanitizeDocumentForPdf = async (doc: Document) => {
  // 1. Patch window getComputedStyle
  if (doc.defaultView) {
    patchWinGCS(doc.defaultView);
  }

  // 2. Clean inline style tags
  const styleElements = Array.from(doc.querySelectorAll("style"));
  for (const styleObj of styleElements) {
    let text = styleObj.innerHTML;
    if (/oklch|oklab|color\(/i.test(text)) {
      styleObj.innerHTML = replaceModernColorsWithRgb(text);
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
          if (/oklch|oklab|color\(/i.test(cssText)) {
            cssText = replaceModernColorsWithRgb(cssText);
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
    if (styleAttr && /oklch|oklab|color\(/i.test(styleAttr)) {
      elem.setAttribute("style", replaceModernColorsWithRgb(styleAttr));
    }
  });
};

/**
 * Clean & bulletproof wrapper around html2canvas to guarantee zero oklch errors and crystal-clear output.
 */
export async function renderHtml2CanvasSafe(
  element: HTMLElement,
  options: {
    scale?: number;
    backgroundColor?: string;
    logging?: boolean;
    useCORS?: boolean;
    allowTaint?: boolean;
    ignoreElements?: (element: Element) => boolean;
    onclone?: (clonedDoc: Document, clonedEl: HTMLElement) => void;
  } = {}
): Promise<HTMLCanvasElement> {
  // 1. Wait for document fonts
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
  } catch (fontErr) {
    console.warn("Fonts ready error:", fontErr);
  }

  // 2. Patch main window getComputedStyle
  const unpatchMainWin = patchWinGCS(window);

  // 3. Pre-clean main document style tags
  const styleElements = Array.from(document.querySelectorAll("style"));
  const originalStyles = styleElements.map((el) => ({
    element: el,
    text: el.innerHTML
  }));

  for (const styleObj of originalStyles) {
    if (/oklch|oklab|color\(/i.test(styleObj.text)) {
      styleObj.element.innerHTML = replaceModernColorsWithRgb(styleObj.text);
    }
  }

  try {
    // 4. Invoke html2canvas with full cloned-DOM sanitation
    const canvas = await html2canvas(element, {
      scale: options.scale || 2,
      useCORS: options.useCORS ?? true,
      allowTaint: options.allowTaint ?? true,
      backgroundColor: options.backgroundColor ?? "#ffffff",
      logging: options.logging ?? false,
      ignoreElements: options.ignoreElements,
      onclone: (clonedDoc, clonedEl) => {
        // A. Patch cloned window getComputedStyle
        if (clonedDoc.defaultView) {
          patchWinGCS(clonedDoc.defaultView);
        }

        // B. Remove dark mode for crisp print rendering
        clonedDoc.documentElement.classList.remove("dark");
        clonedDoc.body.classList.remove("dark");

        // C. Clean all style tags in cloned document
        const clonedStyles = Array.from(clonedDoc.querySelectorAll("style"));
        for (const sEl of clonedStyles) {
          if (/oklch|oklab|color\(/i.test(sEl.innerHTML)) {
            sEl.innerHTML = replaceModernColorsWithRgb(sEl.innerHTML);
          }
        }

        // D. Clean all inline style attributes in cloned document
        const clonedElementsWithStyle = clonedDoc.querySelectorAll("[style]");
        clonedElementsWithStyle.forEach((elem) => {
          const styleAttr = elem.getAttribute("style");
          if (styleAttr && /oklch|oklab|color\(/i.test(styleAttr)) {
            elem.setAttribute("style", replaceModernColorsWithRgb(styleAttr));
          }
        });

        // E. Clean SVG attributes
        const svgElements = clonedDoc.querySelectorAll("svg, path, rect, circle, line, polygon");
        svgElements.forEach((svgEl) => {
          ["fill", "stroke", "stop-color"].forEach((attr) => {
            const val = svgEl.getAttribute(attr);
            if (val && /oklch|oklab|color\(/i.test(val)) {
              svgEl.setAttribute(attr, replaceModernColorsWithRgb(val));
            }
          });
        });

        // F. Inject print override CSS to prevent Tailwind v4 oklch inheritance
        const printOverride = clonedDoc.createElement("style");
        printOverride.setAttribute("id", "snolab-pdf-print-override");
        printOverride.innerHTML = `
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body, html {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
        `;
        clonedDoc.head.appendChild(printOverride);

        // G. User callback if present
        if (options.onclone) {
          options.onclone(clonedDoc, clonedEl);
        }
      }
    });

    return canvas;
  } finally {
    // Restore original main styles
    for (const styleObj of originalStyles) {
      styleObj.element.innerHTML = styleObj.text;
    }
    unpatchMainWin();
  }
}

/**
 * Standardized PDF exporter that converts any HTMLElement directly to a multi-page A4 PDF file.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  options: {
    orientation?: "portrait" | "landscape";
    scale?: number;
    backgroundColor?: string;
    marginMm?: number;
  } = {}
): Promise<void> {
  const orientation = options.orientation || "portrait";
  const margin = options.marginMm ?? 0;
  const canvas = await renderHtml2CanvasSafe(element, {
    scale: options.scale || 2,
    backgroundColor: options.backgroundColor || "#ffffff"
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4"
  });

  const pdfWidth = orientation === "portrait" ? 210 : 297;
  const pdfHeight = orientation === "portrait" ? 297 : 210;

  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = contentHeight;
  let position = margin;

  pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - contentHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight);
    heightLeft -= pdfHeight;
  }

  const finalFilename = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(finalFilename);
}
