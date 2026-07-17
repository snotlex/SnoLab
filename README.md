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
- **Secure Cloud Storage**: Integration with Google Firebase (Firestore and Auth) to save, manage, and audit concrete formulas.

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

---

## 🔒 4. Environment Variables

Create a `.env` file in the root directory. You can use `.env.example` as a template:

```env
# Server Port Configuration
PORT=3000

# Node Environment
NODE_ENV=development

# Google Gemini API Key (Secret key used server-side for AI engineering recommendations)
GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: Do not prefix `GEMINI_API_KEY` with `VITE_` as it is kept strictly secure on the Node.js Express server backend.*

---

## 🔥 5. Firebase Setup

The application features durable cloud persistence for saving mix recipes and validating material tests.

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Cloud Firestore** in test mode or production mode.
3. Enable **Firebase Authentication** (Email/Password provider).
4. Save your configuration credentials into `firebase-applet-config.json` in the root folder.
5. Deploy security rules:
   ```bash
   # Deploy rules to protect data
   npm run deploy-firebase # if using firebase-cli
   ```

---

## 🧪 6. Testing

The project has a comprehensive and strict automated test suite implemented in Vitest, including unit testing for the calculation engine, SSD moisture corrections, volume closure, and compliance scanning.

To run the tests:
```bash
npm test
```

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
