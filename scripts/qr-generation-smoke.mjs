import assert from "node:assert/strict";
import QRCode from "qrcode";

const reportUrl = "https://snolab.example.com/api/reports/signed-token-for-test/download";
const dataUrl = await QRCode.toDataURL(reportUrl, {
  width: 280,
  margin: 3,
  errorCorrectionLevel: "H",
  color: { dark: "#0f172a", light: "#ffffff" }
});

assert.match(dataUrl, /^data:image\/png;base64,/);
const pngBytes = Buffer.from(dataUrl.slice("data:image/png;base64,".length), "base64");
assert.deepEqual([...pngBytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.ok(pngBytes.length > 500, "QR PNG should contain a non-trivial image payload");
console.log(`[SnoLab] QR generation passed (${pngBytes.length} PNG bytes).`);
