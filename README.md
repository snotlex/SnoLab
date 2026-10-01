# SnoLab Concrete Mix Calculator

SnoLab Concrete Mix Calculator is a highly polished, professional-grade, industrial concrete mix design system utilizing the **Dreux-Gorisse** formulation methodology. Engineered for professional civil engineers, material scientists, ready-mix batch plants, and academic laboratories, this system combines standard mechanical models with real-time optimization, chemical dosage modeling, and comprehensive validation gates.

---

## 🏗️ 1. Project Overview

The calculator provides a full-stack, responsive, and bilingual interface (English/Arabic/French) that translates raw structural requirements (target characteristic strength, environmental exposure classes, aggregate properties, and pouring conditions) into precise material recipe cards.

### Key Capabilities
- **Advanced Dreux-Gorisse Engine**: Fully automated dry and wet batch recipe generation.
- **Sieve Analysis & Particle Grading**: Interactive grading curve generator showing the reference Bolomey/Dreux line alongside custom aggregate distribution.
- **SSD & Moisture Correction**: Real-time adjustment of added mixing water and raw aggregate quantities based on stockpiles' moisture and absorption states.
- **Thermal & Heat of Hydration Simulation**: Predictive thermodynamic graphing to evaluate peak internal temperatures and cracking risks in massive concrete pours.
- **Dynamic Cost Optimization**: Direct link between raw component mass and bulk volume to optimize cost per cubic meter ($/m³ or localized currency).
- **Local-First Storage**: Projects, saved mixes, materials, and working sessions are stored locally in the user's browser through IndexedDB and localStorage; no account or cloud database is required.

---

## 📐 2. Engineering Calculation Method

The system is powered by the classic French **Dreux-Gorisse (NF P 18-500)** mix design method, implemented with strict mathematical fidelity. The key steps are:

### A. Target Average Strength ($f_{cm}$)
To guarantee the characteristic 28-day strength ($f_{ck}$), the engine determines the average target strength ($f_{cm}$) using standard deviation factors representing quality control levels:
$$f_{cm} = f_{ck} + k \cdot \sigma$$
- **High Quality Control ($\sigma = 4 \text{ MPa}$)**: For industrial ready-mix plants.
- **Normal Control ($\sigma = 6 \text{ MPa}$)**: Default site mixing.
- **Low Control ($\sigma = 8 \text{ MPa}$)**: Manual volume-based batching.

### B. Water/Cement Ratio ($W/C$)
The Water/Cement ratio is computed using the modified Bolomey formula:
$$\frac{C}{W} = \frac{f_{cm}}{G \cdot \sigma_c} + 0.5$$
Where:
- $\sigma_c$ is the cement class strength (32.5, 42.5, or 52.5 MPa).
- $G$ is the quality coefficient of the aggregates (ranging from 0.35 to 0.65 based on aggregate quality and size $D_{\text{max}}$).

### C. Water Content ($W$)
Initial water content is evaluated as a function of the maximum aggregate size ($D_{\text{max}}$) and adjusted according to the targeted slump (workability):
$$W_{\text{base}} = f(D_{\text{max}})$$
$$W_{\text{adjusted}} = W_{\text{base}} + \Delta W_{\text{slump}}$$

### D. Cement Content ($C$)
The target cement dosage is calculated by:
$$C = W_{\text{adjusted}} \times \left(\frac{C}{W}\right)$$
- If $C$ falls below the minimum regulatory binder limit (e.g., $300 \text{ kg/m³}$ for reinforced concrete under EN 206), it is automatically elevated.
- If $C$ exceeds the thermal safety threshold ($550 \text{ kg/m³}$), a critical feasibility warning is triggered to prevent severe thermal cracking.

### E. Reference Grading Curve & Compacity ($γ$)
The Bolomey reference point $K$ (separation between sand and gravel fractions) is dynamically computed at $d = 5 \text{ mm}$:
$$K = K_{\text{base}} + \Delta K_{\text{slump}} + \Delta K_{\text{pumping}} + \Delta K_{\text{silica}}$$
The compacity coefficient $\gamma$ determines the absolute volume of the solid aggregates:
$$V_{\text{solids}} = 1000 \cdot \gamma - \frac{C}{\rho_c} - W - V_{\text{air}}$$

### F. Moisture and Absorption Adjustments
To translate theoretical design weights (SSD - Saturated Dry Surface) to physical batch weights, the stockpiles' moisture levels ($w$) and absorption capacities ($Ab$) are resolved:
$$W_{\text{added}} = W_{\text{design}} - \sum \left( \text{Weight}_{\text{agg}} \times (w_i - Ab_i) \right)$$
$$\text{Weight}_{\text{wet}} = \text{Weight}_{\text{dry}} \times (1 + w_i)$$

---

## 💻 3. Installation

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed on your system.

1. Clone the repository and navigate to the project root:
   ```bash
   git clone <repository-url>
   cd snolab-concrete-mix-calculator
   ```

2. Clean any stale builds and install dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will boot and bind to port `3000` (accessible via `http://localhost:3000`).

   The `predev` check verifies that the QR dependency is installed before Vite starts. If a cloned Windows working copy reports `Failed to resolve import "qrcode"`, run `npm install` once (or simply rerun `npm run dev`; the preflight will install missing dependencies automatically).

   To verify QR PNG generation independently of the browser, run:

   ```bash
   npm run test:qr
   ```

---

## 🔒 4. Environment Variables

Create a `.env` file in the root directory. You can use `.env.example` as a template:

```env
# Server Port Configuration
PORT=3000

# Node Environment
NODE_ENV=development

# Required to access /api/admin/* endpoints (generate with: openssl rand -hex 32)
ADMIN_API_TOKEN=replace_with_a_long_random_token

# Explicit public URL used by activation emails and phone QR download links
# Use http://localhost:3000 only for local development; production requires public HTTPS.
PUBLIC_APP_URL=http://localhost:3000

# HMAC secret for signed report-download tokens (generate with: openssl rand -hex 32)
REPORT_DOWNLOAD_SECRET=replace_with_a_long_random_secret

# Report-download link lifetime in milliseconds (default: 7 days)
REPORT_DOWNLOAD_TTL_MS=604800000

# Google Gemini API Key (Secret key used server-side for AI engineering recommendations)
GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: Do not prefix `GEMINI_API_KEY` with `VITE_` as it is kept strictly secure on the Node.js Express server backend. Never commit real values for `ADMIN_API_TOKEN`, `REPORT_DOWNLOAD_SECRET`, `GEMINI_API_KEY`, SMTP credentials, or any other secret.*

### Administrative API security

All `/api/admin/*` routes require `Authorization: Bearer <ADMIN_API_TOKEN>`. The server fails closed with `503` when the token is not configured and returns `401` for missing or invalid tokens. Keep the token only in the server environment, never in frontend code or committed files. Set `PUBLIC_APP_URL` in production so activation and phone QR links do not depend on an untrusted `Host` header. `REPORT_DOWNLOAD_SECRET` signs QR report links and must remain stable across deployments. `REPORT_DOWNLOAD_TTL_MS` controls their lifetime; `604800000` equals seven days. The QR report endpoint requires HTTPS in production and returns the PDF with `Content-Disposition: attachment`.

---

## 💾 5. Local Storage

SnoLab is local-first and does not require Firebase, authentication, or a cloud database. The active project, saved mixes, custom materials, laboratory records, and recovery backups are stored in the browser using IndexedDB and localStorage. Use the built-in project export/import controls to move a `.snlab` project file between devices or create an external backup.

---

## 🧪 6. Testing

The project has a comprehensive and strict automated test suite implemented in Vitest, including unit testing for the calculation engine, SSD moisture corrections, volume closure, and compliance scanning.

To run the tests:
```bash
npm test
```

Run the server security smoke tests separately:
```bash
ADMIN_API_TOKEN=local-test-token npm run test:security
```

The smoke suite starts an isolated development server and checks the health endpoint, security headers, missing/invalid/valid admin tokens, email input validation, and admin rate limiting. It does not send a real email because SMTP credentials are not provided by the test command.

Run the lightweight API load smoke test:
```bash
npm run test:load
```

It runs concurrent health and authenticated admin requests for a short bounded period, reports p95 latency, and fails on network errors or HTTP 5xx responses. The test also accepts `LOAD_SMOKE_CONCURRENCY`, `LOAD_SMOKE_DURATION_MS`, and `LOAD_SMOKE_PORT` for controlled staging runs. Both smoke tests run automatically in GitHub Actions.

Run browser end-to-end tests after building the production bundle:
```bash
npm run build
npm run test:e2e
```

The Playwright smoke flow checks the landing page, Arabic/English language switching, starting a new project, and a mobile viewport. CI installs Chromium, builds the production server, and runs the same flow headlessly.

### Test Scope
- `dreuxGorisseCore.ts`: Validates mathematical calculations, $W/C$ curves, and Bolomey adjustments.
- `methodApplicabilityGate.ts`: Tests the strict structural applicability borders.
- `arabic-leak-detection.test.ts`: Audits i18n localization constraints to ensure engine-level operations cleanly isolate localization dictionaries.

---

## 🚀 7. Build and Deploy

To compile the application into a production-ready containerized package:

1. Build both frontend assets and backend server:
   ```bash
   npm run build
   ```
   - **Frontend**: Compiles React assets using Vite into static files inside the `dist/` directory.
   - **Backend**: Compiles the Express `server.ts` into a fast, self-contained CommonJS bundle at `dist/server.cjs` using `esbuild`.

2. Run the production server:
   ```bash
   npm start
   ```

---

## ⚠️ 8. Method Applicability & Safety Boundaries

The Dreux-Gorisse method is highly reliable for standard civil engineering concrete, but has strict safety boundaries enforced by our **Method Applicability Gate**:

- **Applicable Range ($C20 - C40$)**: Fully applicable. High precision across all workability ranges.
- **Limited Applicability Range ($C45 - C50$)**: Marginal accuracy. Triggers warnings indicating reduced mathematical precision in Dreux structural models. Laboratory trial batches are highly recommended.
- **Not Applicable Range ($>C50$ or $f_{ck} \ge 60 \text{ MPa}$)**: Fails structural verification gates. The standard Dreux-Gorisse assumptions under-estimate water-binder dynamics for High-Strength Concrete (HSC). Shows results in a diagnostic-only view.
- **Ultra-High Cement Safeguard ($C > 550 \text{ kg/m³}$)**: Restricts results and triggers a critical error warning to prevent high thermal shrinkage and cracking.
- **Specialized Concretes (SCC, Lightweight, Recycled, Mass, Extreme Slump)**: Triggers warning gates to remind engineers of specialized testing requirements (e.g., L-Box for Self-Compacting, pre-wetting for lightweight, and low-heat cement with mineral admixtures for mass pours).

---

## ⚖️ 9. Professional Engineering Disclaimer

> **IMPORTANT TECHNICAL NOTICE**: The calculations, grading curves, thermal graphs, and raw material mixtures produced by the SnoLab Concrete Mix Calculator are mathematical estimations based on classical empirical formulas (NF P 18-500). They do not replace local aggregate variations, real-world cement chemistry, or site-specific conditions. 
> 
> **All mix formulations MUST be verified and certified through physical trial batches in a certified, licensed concrete materials testing laboratory before batch-plant deployment or structural casting.** SnoLab and its developers assume no responsibility or structural liability for material failures, cracking, or strength deviations in real-world structures.
