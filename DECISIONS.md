# Decisions & trade-offs

Opinionated on purpose. Each entry: what I chose, why, and what I gave up.

## Architecture

**Upload returns 202; a BullMQ worker does the validation.**
Face detection and blur scoring take hundreds of ms per image. Doing 10 of them inside the
request would tie up the API and time out on slow machines. Cost: two processes and Redis.

**Worker → browser via the Socket.io Redis emitter (not a direct socket).**
The worker is a separate process and holds no connections, so it publishes through Redis and the
API's Redis adapter delivers it to the right room. The first version called `notifyUser` inside
the worker, where `io` was `null` – it silently did nothing.

**WebSocket for push, 3 s polling as a safety net.**
Sockets drop, and a result can arrive before the upload response has mapped local → server ids.
Polling `GET /:id/status` for images still "processing" makes both cases self-heal. Cost: a few
cheap requests while something is in flight.

**Upload starts as soon as files are added.**
The brief asks for real-time feedback, so waiting for a "Continue" click defeats it. Continue now
only gates on "≥ 6 accepted photos".

**Strategy pattern for validators, ordered cheapest-first.**
Resolution → blur → face → similarity, short-circuiting on the first failure. Adding a rule is one
class. Cost: one rejection reason per photo (the first failure), not all of them.

## Validation choices

| Rule | Implementation | Why / trade-off |
|---|---|---|
| Too small (file) | `< 30 KB` rejected at upload | Free to check; catches thumbnails and screenshots of nothing |
| Too small (resolution) | `< 512×512` after EXIF rotation | Rotation first, so a portrait phone photo isn't measured sideways |
| Format | Magic bytes (JPEG/PNG/HEIC), not MIME | Browsers send `""` for HEIC and MIME is attacker-controlled |
| Blur | Variance of Laplacian on an 800 px greyscale copy | Fixed size makes the threshold comparable across cameras; one global threshold is crude (a shallow-depth-of-field portrait with a sharp face can still score low) |
| Face | `tiny_face_detector` (face-api), single face, face ≥ 5 % of frame | Fast and runs in Node with no GPU. Less accurate than SSD/RetinaFace on small or angled faces |
| Multiple faces | Same detector, `count > 1` | Inherits the detector's false positives |
| Similar | 256-bit dHash, Hamming ≤ 24 vs the user's accepted photos | dHash survives resize/recompression/brightness. Not semantic: two different shots of the same person are *not* "similar" |

All thresholds are env-tunable (`backend/.env.example`) because I could not tune them on a real
dataset in the time box. That is the first thing I would do with more time.

## Backend

- **Postgres + Sequelize**, index on `(userId, status)`; the similarity lookup selects only
  `pHash` for `ACCEPTED` rows instead of loading whole rows.
- **Worker concurrency = 1.** Similarity compares against *accepted* rows, so two parallel jobs
  for one user could both accept near-duplicates. Correct over fast; at scale I'd serialise per
  user (BullMQ groups / advisory lock) rather than globally.
- **Retries:** 3 attempts with exponential backoff. Infra errors (S3/DB blip) retry and only mark
  the photo rejected after the last attempt; corrupt files are rejected immediately (retrying
  can't help).
- **Secure handling:** size/count limits in Multer, magic-byte sniffing, S3 keys built from
  UUIDs (never the client filename), HEIC decoded to a fresh JPEG (re-encoding strips payloads and
  EXIF), presigned URLs for reads, `userId` validated as UUID, stack traces never returned outside
  `development`, CORS pinned to one origin.
- **Rejections at upload time** (bad type, tiny file) are stored as `REJECTED` rows so the client
  gets an id and the UI treats every outcome the same way.
- **REST:** `POST /upload`, `GET /:id/status`, `GET /:id/file`, `GET /user/:userId`, `DELETE /:id`.

## Frontend

- `useReducer` context. Client validation (format by MIME *or* extension, 25 MB, max 10) produces
  a local `rejected` card with a reason instead of silently dropping files.
- The anonymous `userId` is a UUID in `localStorage`, so two testers don't share a similarity pool.
- HEIC previews fail in most browsers; the card falls back to a placeholder rather than a broken image.

## Known gaps (deliberately not done in 2 hours)

- **No real auth.** The `userId` is effectively a bearer token; anyone with it can list/delete that
  user's photos. Production: session auth and per-request ownership checks.
- **No migrations** (`sync({ alter: true })` in dev only).
- **Memory-buffered uploads** (≤ 25 MB × 10 per request). At scale: presigned direct-to-S3 uploads,
  then enqueue from an S3 event.
- **Thresholds untuned**, no ML-based quality model, no virus scanning.
- **Orphan cleanup:** temp objects from a crashed request aren't swept; an S3 lifecycle rule on
  `temp/` (1 day) would handle that.
- Face detection is tested only for the "no face" path (no face fixture in the repo).
