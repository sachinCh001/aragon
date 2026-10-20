# Aragon.ai Photo Upload

A full-stack clone of Aragon.ai's **"Upload photos"** step. Users drop 6–10 photos; the backend
validates each one asynchronously (format, size, resolution, blur, face, duplicates) and pushes
the verdict back to the browser in real time, sorted into **Accepted** and **Rejected** with a reason.

> Built for a 2-hour technical interview. The *why* behind each choice is in
> [DECISIONS.md](./DECISIONS.md); a manual test script is in [QA.md](./QA.md).

## How it works

```
 Browser (React)                        API (Express)                 Worker (BullMQ)
 ───────────────                        ─────────────                 ───────────────
 1. pick/drop files
 2. client checks: format, ≤25 MB, ≤10
 3. POST /api/images/upload ──────────▶ 4. sniff real file type (magic bytes)
                                        5. size check, store original in S3 temp/
                                        6. insert row (PENDING), enqueue job
    ◀────────── 202 + image ids ─────── 
                                                                      7. download from S3
                                                                      8. HEIC→JPEG, EXIF rotate
                                                                      9. validate (first failure wins):
                                                                         resolution → blur → face → similarity
                                                                     10. ACCEPTED: store processed JPEG, save hash
                                                                         REJECTED: save reason, delete original
 11. card turns green/red  ◀── Socket.io ◀── Redis pub/sub ◀──────── 12. publish result
     (3 s status polling is the fallback if a socket event is missed)
```

| Piece | Tech | Role |
|---|---|---|
| Frontend | React 19, Tailwind 3, Axios, socket.io-client | Upload UI, previews, live status |
| API | Node 18+, Express 5, Multer, Socket.io | Upload endpoint, status/list/delete, push to browsers |
| Worker | BullMQ, sharp, heic-decode, face-api (tfjs-node) | Image validation pipeline |
| Database | PostgreSQL 15 via Sequelize | Image metadata, status, hashes |
| Queue / pub-sub | Redis | Job queue + worker→API socket bridge |
| Storage | AWS S3 (SDK v3) | Originals (`temp/`) and processed images (`processed/`) |

## Validation rules

Each rule produces a user-facing reason. The first failure stops the pipeline.

| # | Rule | Where | Default | Rejection message |
|---|---|---|---|---|
| 1 | Format must be JPEG / PNG / HEIC | client (MIME or extension) **and** server (magic bytes) | – | "Unsupported file type. Only JPEG, PNG and HEIC are allowed." |
| 2 | File too small / too large | server (+ client for max) | 30 KB – 25 MB | "File is too small (…)" |
| 3 | Resolution too low | worker | 512×512 | "Resolution too low (…)" |
| 4 | Blurry | worker (variance of Laplacian, 800 px copy) | score ≥ 100 | "Image is too blurry (focus score N…)" |
| 5 | No face / face too small | worker (tiny face detector) | face ≥ 5 % of frame | "No face detected." / "Face is too small…" |
| 6 | Multiple faces | worker | exactly 1 | "Multiple faces detected (N)…" |
| 7 | Too similar to an accepted photo | worker (256-bit dHash, Hamming ≤ 24) | per user | "Too similar to a photo you already uploaded." |

Corrupt files are rejected as "File is corrupted or is not a valid image." All thresholds can be
tuned through environment variables (see below).

## Quick start

**Prerequisites:** Node 18+ (20 recommended; `@tensorflow/tfjs-node` has no prebuilt binary for older Node), Docker (for Postgres + Redis), and an AWS S3 bucket with credentials.

```bash
# 1. Postgres + Redis
docker compose up -d            # Postgres on localhost:55432, Redis on 6379

# 2. Backend
cd backend
cp .env.example .env            # then fill in the AWS_* values
npm install
npm run dev:api                 # terminal 1 – API on :5000
npm run dev:worker              # terminal 2 – validation worker (images stay PENDING without it)

# 3. Frontend
cd ../frontend
npm install
npm start                       # http://localhost:3000
```

**S3 setup:** create a private bucket and an IAM user whose policy allows
`s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::YOUR_BUCKET/*`
(a permissions boundary on the user must allow them too). The app only ever hands out presigned
URLs, so the bucket never needs to be public. Optional: a lifecycle rule expiring `temp/` after 1 day.

## Configuration (`backend/.env`)

See [`backend/.env.example`](./backend/.env.example). Required: `DB_*`, `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`. Optional tunables:

| Variable | Default | Meaning |
|---|---|---|
| `PORT` / `CORS_ORIGIN` | 5000 / `http://localhost:3000` | API port, allowed browser origin |
| `MAX_FILE_MB` / `MIN_FILE_KB` | 25 / 30 | File size bounds |
| `MIN_WIDTH` / `MIN_HEIGHT` | 512 / 512 | Minimum resolution |
| `BLUR_THRESHOLD` | 100 | Minimum Laplacian variance |
| `MIN_FACE_RATIO` | 0.05 | Minimum face area ÷ image area |
| `SIMILARITY_DISTANCE` | 24 | Max Hamming distance (of 256 bits) to count as a duplicate |
| `WORKER_CONCURRENCY` | 1 | Parallel jobs (keep 1 – see DECISIONS.md) |
| `AWS_ENDPOINT` | – | Only for S3-compatible stores such as MinIO |

Frontend (optional `frontend/.env`): `REACT_APP_API_URL` (default `http://localhost:5000/api`),
`REACT_APP_WS_URL` (default `http://localhost:5000`).

## API

Base path `/api/images`. Full details in [backend/README.md](./backend/README.md).

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/upload` | Multipart: `userId` + up to 10 `images`. Returns `202` with one entry per file |
| `GET` | `/:id/status` | Status and rejection reason |
| `GET` | `/:id/file` | Presigned URL for an accepted image |
| `GET` | `/user/:userId` | All of a user's images |
| `DELETE` | `/:id` | Delete the record and its S3 objects |
| `GET` | `/health` (at root) | Liveness |

Socket.io event `imageStatus` → `{ imageId, status: "ACCEPTED" | "REJECTED", reason? }`, delivered to the room named by the user's id.

## Project structure

```
backend/
  src/
    app.js                  # Express + Socket.io bootstrap
    config/                 # env (loaded first!), database, redis, queue
    routes/ controllers/    # HTTP layer
    services/               # S3Service, SocketService, ImageValidator
    strategies/             # Resolution, Blur, Face, Similarity (one class per rule)
    repositories/ models/   # Sequelize access
    workers/imageProcessor.js
    models/tiny_face_detector/   # face-api weights
  test/validation.test.js   # node --test
frontend/src/
  context/UploadContext.jsx # reducer: pending → uploading → processing → accepted/rejected
  hooks/                    # useImageUpload (auto-upload + polling), useWebSocket
  components/               # UploadZone, UploadedPhotos, ImagePreview, ProgressBar, BottomBar …
  services/                 # api.js, user.js (anonymous id)
```

## Testing

```bash
cd backend && npm test      # unit tests: file sniffing, resolution, blur, similarity, face model
```

End-to-end cases (17) are listed in [QA.md](./QA.md).

## Known limitations

- **No real authentication.** The frontend generates an anonymous UUID in `localStorage`; anyone holding it can list or delete that user's photos.
- Thresholds were tuned on a handful of sample photos, not a real dataset.
- Uploads pass through the API in memory (≤ 25 MB × 10). At scale: direct-to-S3 presigned uploads.
- No DB migrations (`sync({ alter: true })` in development).

See [DECISIONS.md](./DECISIONS.md) for the reasoning and what I would do next.
