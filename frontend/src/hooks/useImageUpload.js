import { useCallback, useEffect, useRef } from 'react';
import { useUpload } from '../context/UploadContext';
import { useWebSocket } from './useWebSocket';
import { getImageStatus, uploadImages, errorMessage } from '../services/api';
import { getUserId } from '../services/user';

const POLL_MS = 3000;

export const USER_ID = getUserId();

export function useImageUpload() {
  const { images, updateStatus, startUpload, uploadSuccess, failUpload, completeUpload } = useUpload();

  const handleStatusUpdate = useCallback(
    (data) => updateStatus(data.imageId, data.status, data.reason),
    [updateStatus]
  );

  useWebSocket(USER_ID, handleStatusUpdate);

  // Upload as soon as files are added so the user gets validation feedback immediately.
  // Rejected-on-the-client files never reach this point (status 'rejected').
  useEffect(() => {
    const pending = images.filter((img) => img.status === 'pending');
    if (pending.length === 0) return;

    const ids = pending.map((img) => img.id);
    startUpload(ids); // flips them to 'uploading' so this effect won't pick them up twice

    uploadImages(pending.map((img) => img.file), USER_ID)
      .then(({ images: results }) => {
        const unmapped = [];
        pending.forEach((local, i) => {
          const res = results[i];
          if (!res || !res.imageId) {
            unmapped.push(local.id); // transient server-side failure for this file
            return;
          }
          uploadSuccess(local.id, res.imageId);
          if (res.status === 'REJECTED') updateStatus(res.imageId, 'REJECTED', res.reason);
        });
        if (unmapped.length) failUpload(unmapped, 'Upload failed. Please add this photo again.');
      })
      .catch((error) => failUpload(ids, errorMessage(error)))
      .finally(completeUpload);
  }, [images]);

  // Safety net for a missed socket event (dropped connection, or the result
  // arriving before the upload response has mapped local -> server ids).
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    const timer = setInterval(async () => {
      const waiting = imagesRef.current.filter((img) => img.status === 'processing' && img.serverId);
      await Promise.all(
        waiting.map(async (img) => {
          try {
            const res = await getImageStatus(img.serverId);
            if (res.status !== 'PENDING') updateStatus(img.serverId, res.status, res.rejectionReason);
          } catch {
            /* transient; try again next tick */
          }
        })
      );
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [updateStatus]);
}

