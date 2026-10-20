# QA checklist (use as the Loom script)

Setup: `docker compose up -d`, `cp backend/.env.example backend/.env`, then `npm run dev:api` and
`npm run dev:worker` in `backend/`, `npm start` in `frontend/`. Unit tests: `cd backend && npm test`.

| # | Case | Expected |
|---|---|---|
| 1 | 6 clear single-face, different photos (JPEG) | All → Accepted; Continue enables |
| 2 | A `.png` and a `.heic` | Accepted; HEIC shows placeholder preview, stored as JPEG in `processed/` |
| 3 | A `.gif` / `.webp` / `.pdf` | Instant local Rejected: "Unsupported format" – no network request |
| 4 | A `.txt` renamed to `.jpg` | Rejected by the server: "Unsupported file type" (magic bytes) |
| 5 | A file > 25 MB | Instant local Rejected |
| 6 | A tiny image (e.g. 200×200) | Rejected: "Resolution too low" |
| 7 | A very small file (< 30 KB) | Rejected: "File is too small" |
| 8 | A blurry photo | Rejected: "too blurry (focus score N…)" |
| 9 | A landscape / no person | Rejected: "No face detected." |
| 10 | Group photo | Rejected: "Multiple faces detected" |
| 11 | Person far away in frame | Rejected: "Face is too small…" |
| 12 | Same photo twice (or resized copy) | 2nd rejected: "Too similar…" |
| 13 | Drop 12 files at once | First 10 processed, the rest rejected "Maximum of 10" |
| 14 | Corrupt JPEG (truncated file) | Rejected: "corrupted or not a valid image" |
| 15 | Stop the worker, upload, restart it | Stays Processing, then resolves (queue durability) |
| 16 | Kill the API mid-processing / refresh | Polling + reconnect pick the result up |
| 17 | Delete a photo | Gone from UI; row + S3 objects removed |
