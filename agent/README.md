# DisciplineTrack — Local Fingerprint Agent

This is the bridge between a USB fingerprint scanner and the DisciplineTrack web app.
It runs as a background process on each **workstation** that has a scanner plugged in.

---

## Architecture

```
Browser (DisciplineTrack UI)
        │
        │  WebSocket  ws://localhost:4444
        │
 ┌──────▼──────────────────────┐
 │   agent/index.js            │  ← this process
 │   (Node.js, port 4444)      │
 │                             │
 │  ┌─────────────────────┐   │
 │  │  templates.db        │   │  ← local SQLite (template binaries)
 │  │  (SQLite, on-disk)   │   │     raw biometric data never leaves this machine
 │  └─────────────────────┘   │
 └──────┬──────────────────────┘
        │  FFI / native SDK
        │
 ┌──────▼──────────────────────┐
 │   USB Fingerprint Scanner    │
 │   (SecuGen / Mantra / ZKTeco)│
 └─────────────────────────────┘
```

**Why a local agent?**  
Real fingerprint scanners produce slightly different template bytes on every scan
(pressure, angle, moisture differ). Two scans of the same finger → two different SHA256
hashes. The agent uses the scanner vendor's native SDK `match()` function (which tolerates
small differences) to do **1:N matching locally**, then returns the matched student's
**stored hash** to the web app, which sends it to the Django API for identity confirmation.

---

## Quick Start (mock mode — no hardware needed)

```bash
cd agent
npm install
node index.js --mock
```

The browser at `http://localhost:5173` will show **"Agent ready"** and scans will
work with a simulated fingerprint.

---

## Hardware Setup

### SecuGen (FDU02 / FDU04 / FDU05 — most common in East Africa)

1. **Install the driver** from https://secugen.com/downloads  
   → Windows: `SGFPLIB_SDK_x64.exe`  
   → Linux: `sudo dpkg -i sgfplib_*.deb`

2. **Copy the shared library** into `agent/`:
   - Windows: `SGFPM.dll`
   - Linux: `libsgfplib.so`

3. **Install Node.js native bindings:**
   ```bash
   npm install node-ffi-napi ref-napi ref-struct-di
   ```

4. **Set `SDK_TYPE=secugen`** and wire the FFI calls in `agent/index.js`  
   (see comments in `SecuGenScanner` block — follow SecuGen's SDK manual).

5. Start:
   ```bash
   SDK_TYPE=secugen node index.js
   ```

---

### Mantra MFS100 / MFS110

1. Download the MFS100 SDK from https://www.mantratecapp.com/
2. Copy `mfs100.dll` / `libmfs100.so` to `agent/`
3. Wire FFI calls in the `MantraScanner` block in `index.js`
4. ```bash
   SDK_TYPE=mantra node index.js
   ```

---

### ZKTeco SLK20R / SLK25R

Same approach — download their SDK, wrap with `node-ffi-napi`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SDK_TYPE` | `mock` | `secugen` / `mantra` / `zkteco` / `mock` |
| `AGENT_PORT` | `4444` | WebSocket port |
| `MATCH_THRESHOLD` | `0.6` | Minimum match score (0–1) to accept as a match |
| `FINGERPRINT_MOCK` | `0` | Set `1` to force mock mode regardless of `SDK_TYPE` |
| `API_BASE` | `http://localhost:8000/api` | Django API (used for future template sync) |

---

## WebSocket Protocol

### Browser → Agent

| Message | Description |
|---|---|
| `{ type: "ping" }` | Health check |
| `{ type: "start_enroll", finger: "right_index" }` | Begin enrollment scan |
| `{ type: "start_verify" }` | Begin 1:N verification scan |
| `{ type: "cancel" }` | Cancel current scan |

### Agent → Browser

| Message | Description |
|---|---|
| `{ type: "pong", scanner: "SecuGen FDU04", version: "1.0.0" }` | Ping response |
| `{ type: "status", state: "idle"\|"waiting"\|"scanning"\|"processing" }` | State change |
| `{ type: "finger_placed" }` | Finger detected on sensor |
| `{ type: "quality_warning", score: 0.4 }` | Image quality low |
| `{ type: "enroll_complete", template_hash: "abc…", quality_score: 0.95, finger_used: "right_index" }` | Enrollment done |
| `{ type: "verify_complete", template_hash: "abc…", score: 0.97 }` | Verification matched |
| `{ type: "verify_no_match" }` | No enrolled template matched |
| `{ type: "error", message: "Scanner disconnected" }` | Hardware/SDK error |

---

## Enrollment Flow

```
Browser                     Agent                    Scanner SDK
  │                           │                          │
  │  start_enroll             │                          │
  │ ─────────────────────────►│                          │
  │                           │  capture(finger)         │
  │                           │ ────────────────────────►│
  │                           │     template binary      │
  │  finger_placed            │◄─────────────────────────│
  │◄──────────────────────────│                          │
  │                           │  sha256(template)        │
  │  enroll_complete + hash   │                          │
  │◄──────────────────────────│                          │
  │                           │                          │
  │  POST /api/biometric/enroll/ { reg_number, template_hash }
  │ ──────────────────────────────────────────────────► Django
```

## Verification Flow

```
Browser                     Agent                    Scanner SDK
  │                           │                          │
  │  start_verify             │                          │
  │ ─────────────────────────►│                          │
  │                           │  capture()               │
  │                           │ ────────────────────────►│
  │  finger_placed            │   live template          │
  │◄──────────────────────────│◄─────────────────────────│
  │  status: processing       │                          │
  │◄──────────────────────────│                          │
  │                           │  1:N match(live, cached) │
  │                           │  ← all enrolled templates│
  │  verify_complete + hash   │    from templates.db     │
  │◄──────────────────────────│                          │
  │                           │                          │
  │  POST /api/biometric/verify/ { template_hash: matched_stored_hash }
  │ ──────────────────────────────────────────────────► Django (exact lookup)
```

---

## Security Notes

- `templates.db` stores raw template binaries — **keep it on-site, back it up, restrict access**
- The agent only listens on `127.0.0.1` — it is not exposed to the network
- Raw biometric data never reaches the Django server or any cloud
- Django only stores SHA256 hashes — these cannot be reverse-engineered into fingerprint images
- If a workstation is compromised, invalidate that workstation's templates by re-enrolling
