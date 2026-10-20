# Frontend

React 19 + Tailwind 3 (Create React App). See the [root README](../README.md) for the overview and quick start.

```bash
npm install
npm start        # http://localhost:3000 — backend (API + worker) must be running
npm run build
```

Optional `.env`: `REACT_APP_API_URL` (default `http://localhost:5000/api`), `REACT_APP_WS_URL` (default `http://localhost:5000`).

## Behaviour

1. **Add files** by clicking *Upload files* or dragging onto the drop zone.
2. **Client validation** runs immediately: format (JPEG/PNG/HEIC — by MIME type, or by extension when the browser reports none, as Chrome does for HEIC), max 25 MB, max 10 active photos. Failures appear as a red card with the reason and are never sent to the server.
3. **Auto-upload:** valid files are posted at once; cards show a spinner while the server processes them.
4. **Live results:** the server pushes `imageStatus` over Socket.io; photos move into **Accepted** or **Rejected** with the reason shown on the card. A 3-second status poll covers a missed event.
5. **Continue** unlocks once 6 photos are accepted. Removing a card also deletes it on the server.
6. HEIC previews aren't supported by most browsers, so those cards show a placeholder (the upload itself is fine).

## State

`context/UploadContext.jsx` — a reducer. Image lifecycle:

```
pending ─▶ uploading ─▶ processing ─▶ accepted
   │            │             └──────▶ rejected
   └────────────┴─────────────────────▶ rejected   (client check failed or request failed)
```

| File | Responsibility |
|---|---|
| `hooks/useImageUpload.js` | Auto-uploads `pending` images, maps local → server ids, polls status |
| `hooks/useWebSocket.js` | Socket connection; re-subscribes on reconnect |
| `services/api.js` | Axios calls to the REST API |
| `services/user.js` | Anonymous per-browser user id kept in `localStorage` (stand-in for auth) |
| `constants.js` | Limits and the format check |
| `components/` | `UploadZone`, `UploadedPhotos`, `ImagePreview`, `ProgressBar`, `BottomBar`, static info panels |

The sidebar "scan the QR code" box is a visual placeholder only.
