/**
 * DisciplineTrack Local Fingerprint Agent
 * ─────────────────────────────────────────
 * Runs on the workstation where the USB fingerprint scanner is connected.
 * Exposes a WebSocket server on ws://localhost:4444.
 *
 * The web app (running in the browser) connects here to:
 *   1. Enroll — capture template → SHA256 → return hash to web → web stores in Django
 *   2. Verify — capture live template → 1:N match against local cache → return matched hash
 *
 * Why 1:N matching happens HERE (not in Django):
 *   Real scanners produce slightly different template bytes every scan (orientation,
 *   pressure, moisture). SHA256 of scan1 ≠ SHA256 of scan2 for the same finger.
 *   The vendor SDK has a native match() function that returns a score (0-1).
 *   We run match locally, find the winner, and send its STORED hash to Django,
 *   which does a simple exact-hash lookup to return the student record.
 *
 * Hardware support (configure SDK_TYPE below):
 *   "secugen"  — SecuGen FDU02 / FDU04 / FDU05 (most common in East Africa)
 *   "mantra"   — Mantra MFS100 / MFS110
 *   "zkteco"   — ZKTeco SLK20R / Live20R
 *   "mock"     — deterministic simulation (dev / CI)
 *
 * Usage:
 *   npm install
 *   node index.js              # auto-detect scanner
 *   node index.js --mock       # run in mock mode (no hardware needed)
 *   node index.js --port 5555  # custom port
 */

"use strict";

const WebSocket = require("ws");
const crypto = require("crypto");
const path = require("path");
const Database = require("better-sqlite3");

// ── Configuration ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const MOCK_MODE = args.includes("--mock") || process.env.FINGERPRINT_MOCK === "1";
const PORT = (() => {
  const i = args.indexOf("--port");
  return i !== -1 ? parseInt(args[i + 1], 10) : parseInt(process.env.AGENT_PORT ?? "4444", 10);
})();
const API_BASE = process.env.API_BASE ?? "http://localhost:8000/api";
const API_TOKEN = process.env.API_TOKEN ?? ""; // service account JWT for fetching templates
const MATCH_THRESHOLD = parseFloat(process.env.MATCH_THRESHOLD ?? "0.6"); // 0-1

// ── Local template cache (SQLite) ────────────────────────────────────────────
// Stores the template BINARY locally so we can run 1:N matching.
// Only the SHA256 hash is stored in Django — raw biometrics never leave this machine.
const DB_PATH = path.join(__dirname, "templates.db");
const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    hash       TEXT PRIMARY KEY,
    template   BLOB NOT NULL,
    reg_number TEXT NOT NULL,
    finger     TEXT NOT NULL DEFAULT 'right_index',
    enrolled_at INTEGER DEFAULT (strftime('%s','now'))
  )
`);

const insertTemplate = db.prepare(
  "INSERT OR REPLACE INTO templates (hash, template, reg_number, finger) VALUES (?, ?, ?, ?)"
);
const getAllTemplates = db.prepare("SELECT hash, template, reg_number, finger FROM templates");

// ── Scanner abstraction ───────────────────────────────────────────────────────

/**
 * MOCK scanner — deterministic for testing.
 * In mock mode: enrollment always succeeds with a random hash.
 * Verification: always matches the FIRST enrolled template (for demo purposes).
 */
const MockScanner = {
  name: "Mock Scanner (demo mode)",
  open() { console.log("[mock] Scanner opened"); },
  close() {},

  capture(finger) {
    return new Promise((resolve) => {
      console.log(`[mock] Capturing ${finger}…`);
      setTimeout(() => {
        // Generate a deterministic-looking but unique template binary
        const template = crypto.randomBytes(512);
        resolve({ template, quality: 0.94 });
      }, 1500);
    });
  },

  match(liveTemplate, storedTemplate) {
    // Mock: return a high score for the first stored template (demo)
    return 0.97;
  },
};

/**
 * SecuGen scanner — uses the SecuGen SGFPM SDK via FFI.
 *
 * Prerequisites:
 *   1. Install SecuGen USB driver from https://secugen.com/downloads
 *   2. Copy libsgfplib.so (Linux) or SGFPM.dll (Windows) to this directory
 *   3. npm install node-ffi-napi ref-napi ref-struct-di
 *
 * The code below is a skeleton — fill in the actual FFI calls using the
 * SecuGen SDK reference manual (SGFPM_OpenDevice, SGFPM_GetImage,
 * SGFPM_CreateTemplate, SGFPM_MatchTemplate).
 */
const SecuGenScanner = {
  name: "SecuGen FDU USB",
  _fpm: null,

  open() {
    try {
      // eslint-disable-next-line
      const ffi = require("node-ffi-napi");
      // TODO: load the actual SecuGen shared library
      // this._fpm = ffi.Library("libsgfplib", { ... });
      // this._fpm.SGFPM_Create(...)
      // this._fpm.SGFPM_OpenDevice(...)
      console.log("[secugen] SDK loaded — attach your SecuGen scanner.");
    } catch (e) {
      throw new Error(`SecuGen SDK not found: ${e.message}. Run: npm install node-ffi-napi`);
    }
  },

  close() {
    // this._fpm.SGFPM_CloseDevice(...)
  },

  async capture(_finger) {
    // Steps (replace stubs with real SDK calls):
    // 1. SGFPM_SetBrightness(50)
    // 2. SGFPM_GetImageEx(imageBuffer, 3000, callback, 50)  ← blocking or async
    // 3. SGFPM_CreateTemplate(minTemplate, imageBuffer, templateBuffer)
    // 4. SGFPM_GetImageQuality(imageBuffer, &quality)
    throw new Error("SecuGen FFI not yet wired. See agent/index.js for instructions.");
  },

  match(liveTemplate, storedTemplate) {
    // SGFPM_MatchTemplate(template1, template2, SGFPM_FAKE_DETECT_DISABLE, &score)
    // Returns score in range 0-200000 — normalize to 0-1
    throw new Error("SecuGen match not yet wired.");
  },
};

/**
 * Mantra MFS100 — common in India/East Africa.
 *
 * Prerequisites:
 *   Download MFS100 SDK from https://www.mantratecapp.com/
 *   Wrap the native DLL/so with node-ffi-napi.
 */
const MantraScanner = {
  name: "Mantra MFS100",
  open() { console.log("[mantra] MFS100 — wire FFI calls in agent/index.js"); },
  close() {},
  async capture(_finger) { throw new Error("Mantra FFI not yet wired."); },
  match(_live, _stored) { throw new Error("Mantra match not yet wired."); },
};

// Select scanner implementation
function buildScanner() {
  if (MOCK_MODE) return MockScanner;
  const type = (process.env.SDK_TYPE ?? "mock").toLowerCase();
  switch (type) {
    case "secugen": return SecuGenScanner;
    case "mantra":  return MantraScanner;
    default:        return MockScanner;
  }
}

const scanner = buildScanner();
try {
  scanner.open();
} catch (e) {
  console.error(`[agent] Failed to open scanner: ${e.message}`);
  console.error("[agent] Falling back to mock mode.");
  Object.assign(scanner, MockScanner);
  scanner.open();
}

// ── 1:N matching ──────────────────────────────────────────────────────────────
function findBestMatch(liveTemplate) {
  const rows = getAllTemplates.all();
  let bestHash = null;
  let bestScore = 0;
  let bestReg = null;

  for (const row of rows) {
    const score = scanner.match(liveTemplate, row.template);
    if (score > bestScore) {
      bestScore = score;
      bestHash = row.hash;
      bestReg = row.reg_number;
    }
  }

  if (bestScore >= MATCH_THRESHOLD) {
    return { hash: bestHash, score: bestScore, reg_number: bestReg };
  }
  return null;
}

// ── SHA256 helper ─────────────────────────────────────────────────────────────
function sha256hex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ port: PORT, host: "127.0.0.1" });
console.log(`[agent] Fingerprint agent running on ws://127.0.0.1:${PORT}`);
console.log(`[agent] Mode: ${MOCK_MODE ? "MOCK (demo)" : `HARDWARE (${scanner.name})`}`);
console.log(`[agent] Match threshold: ${MATCH_THRESHOLD}`);

wss.on("connection", (ws) => {
  console.log("[agent] Browser connected");
  let activeOp = null; // "enroll" | "verify" | null
  let cancelled = false;

  function send(msg) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    switch (msg.type) {
      case "ping":
        send({ type: "pong", version: "1.0.0", scanner: scanner.name });
        break;

      case "start_enroll": {
        if (activeOp) break;
        activeOp = "enroll";
        cancelled = false;
        const finger = msg.finger ?? "right_index";
        send({ type: "status", state: "waiting" });
        console.log(`[agent] Enroll scan started (${finger})`);

        try {
          const { template, quality } = await scanner.capture(finger);
          if (cancelled) break;

          send({ type: "finger_placed" });
          const hash = sha256hex(template);

          // Store locally for future 1:N matching
          insertTemplate.run(hash, template, "", finger);

          send({
            type: "enroll_complete",
            template_hash: hash,
            quality_score: quality,
            finger_used: finger,
          });
          console.log(`[agent] Enrolled hash: ${hash.slice(0, 16)}…`);
        } catch (e) {
          send({ type: "error", message: e.message });
        } finally {
          activeOp = null;
        }
        break;
      }

      case "start_verify": {
        if (activeOp) break;
        activeOp = "verify";
        cancelled = false;
        send({ type: "status", state: "waiting" });
        console.log("[agent] Verify scan started");

        try {
          const { template, quality } = await scanner.capture("any");
          if (cancelled) break;

          send({ type: "finger_placed" });
          send({ type: "status", state: "processing" });

          const match = findBestMatch(template);
          if (match) {
            send({
              type: "verify_complete",
              template_hash: match.hash,
              score: match.score,
            });
            console.log(`[agent] Verified → ${match.reg_number} (score: ${match.score.toFixed(3)})`);
          } else {
            send({ type: "verify_no_match" });
            console.log("[agent] No match found");
          }
        } catch (e) {
          send({ type: "error", message: e.message });
        } finally {
          activeOp = null;
        }
        break;
      }

      case "cancel":
        cancelled = true;
        activeOp = null;
        send({ type: "status", state: "idle" });
        console.log("[agent] Scan cancelled");
        break;

      default:
        console.log(`[agent] Unknown message type: ${msg.type}`);
    }
  });

  ws.on("close", () => {
    cancelled = true;
    activeOp = null;
    console.log("[agent] Browser disconnected");
  });
});

wss.on("error", (err) => {
  console.error(`[agent] Server error: ${err.message}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[agent] Shutting down…");
  scanner.close();
  db.close();
  wss.close();
  process.exit(0);
});
