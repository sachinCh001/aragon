# Backend

Express API + BullMQ worker. See the [root README](../README.md) for the overview and quick start.

## Processes

| Script | Process | Notes |
|---|---|---|
| `npm run dev:api` / `npm start` | `src/app.js` – REST API + Socket.io server | Needs Postgres and Redis |
| `npm run dev:worker` / `npm run worker` | `src/workers/imageProcessor.js` – validation pipeline | Needs Postgres, Redis, S3. **Must be running**, or images stay `PENDING` |
| `npm test` | `node --test test/` | No external services needed |

Use Node 18+ (20 recommended). Copy `.env.example` to `.env`; every variable is documented in the root README.

## Data model (`images` table)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `userId` | UUID | Indexed together with `status` |
| `status` | `PENDING` \| `ACCEPTED` \| `REJECTED` | |
| `originalName` | string | Display only; never used in storage keys |
| `tempS3Key` | string, null | `temp/<userId>/<uuid>.<ext>`; cleared when processing finishes |
| `finalS3Key` | string, null | `processed/<userId>/<imageId>.jpg`, accepted images only |
| `rejectionReason` | string, null | Shown to the user |
| `pHash` | string(256), null | 256-bit dHash as `0`/`1` characters |

## Endpoints

All under `/api/images`. Errors are `{ "error": "message" }`.

### `POST /upload`
Multipart form: `userId` (UUID) and up to 10 files in field `images`. Limits: 25 MB per file, 10 files.
Returns **202**; the array has one entry per file, in the same order:

```json
{ "images": [
  { "imageId": "…", "status": "PENDING",  "originalname": "a.jpg" },
  { "imageId": "…", "status": "REJECTED", "reason": "Unsupported file type. Only JPEG, PNG and HEIC are allowed.", "originalname": "b.gif" },
  { "status": "FAILED", "error": "Upload failed, please retry", "originalname": "c.png" }
] }
```

`PENDING` means queued; the final result arrives over the socket (or via `GET /:id/status`).
`REJECTED` at this stage covers wrong type and too-small files. `FAILED` is a transient server error
for that file and has no id. Other statuses: `400` bad/missing `userId` or no files, `413` file over the limit.

### `GET /:id/status`
`{ "id", "status", "rejectionReason", "originalName", "createdAt" }` — `404` for unknown or malformed ids.

### `GET /:id/file`
`{ "url": "<presigned S3 URL, 1 h>" }` for `ACCEPTED` images; `409` otherwise.

### `GET /user/:userId`
Array of the same shape as `/status`, oldest first.

### `DELETE /:id`
Removes the row and both S3 objects. `204`.

### Socket.io
Connect with `?userId=<uuid>` (or emit `subscribe` with the id) to join that user's room. Event:
`imageStatus` → `{ imageId, status, reason? }`.

## Worker pipeline

1. Download the original from S3.
2. Normalise: decode HEIC → JPEG, apply EXIF rotation, create a ≤1024 px analysis copy. Undecodable file → rejected immediately.
3. Run strategies in order, stopping at the first failure (`src/strategies/`):
   `ResolutionStrategy` → `BlurDetectionStrategy` → `FaceDetectionStrategy` → `SimilarityStrategy`.
4. Accepted: store a ≤2048 px JPEG under `processed/`, save the hash, delete the original.
   Rejected: save the reason, delete the original.
5. Publish `imageStatus` via the Socket.io Redis emitter.

Failures (S3/DB/model errors) are retried 3× with exponential backoff; only the last failed
attempt marks the image rejected ("We could not process this photo…"). Concurrency is 1 on purpose
so two near-duplicates from the same user can't be accepted in parallel.

### Adding a validation rule
Create a class in `src/strategies/` extending `ValidationStrategy` with
`execute({ buffer, analysis, width, height })` returning `{ isValid, reason?, metadata? }`, then
add it in `workers/imageProcessor.js` (order matters: cheap checks first).

## Security notes

Magic-byte file sniffing (client MIME is not trusted), Multer size/count limits, UUID-only storage
keys, UUID validation on `userId`/`id`, presigned URLs for reads, no stack traces outside
`NODE_ENV=development`, CORS restricted to `CORS_ORIGIN`. Not covered: authentication/authorisation
(see root README).
