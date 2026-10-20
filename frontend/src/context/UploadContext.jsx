import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { MAX_FILES, MIN_FILES, MAX_FILE_BYTES, isAllowedFormat } from '../constants';

const UploadContext = createContext();

const initialState = {
  images: [],           // { id, file, preview, serverId, status, rejectionReason }
  totalUploaded: 0,
  maxAllowed: MAX_FILES,
  minRequired: MIN_FILES,
  isUploading: false,
  uploadError: null,
};

// Client-side validation: returns a rejection reason, or null if the file may be uploaded.
function clientRejection(file, activeCount, max) {
  if (!isAllowedFormat(file)) return 'Unsupported format. Use JPEG, PNG or HEIC.';
  if (file.size > MAX_FILE_BYTES) return `File is larger than ${MAX_FILE_BYTES / 1024 / 1024}MB.`;
  if (activeCount >= max) return `Maximum of ${max} photos reached.`;
  return null;
}

const isActive = (img) => img.status !== 'rejected';

function uploadReducer(state, action) {
  switch (action.type) {
    case 'ADD_FILES': {
      // payload: [{ id, file, preview }] built outside the reducer (createObjectURL is a side effect).
      let activeCount = state.images.filter(isActive).length;
      const added = action.payload.map((item) => {
        const reason = clientRejection(item.file, activeCount, state.maxAllowed);
        if (!reason) activeCount += 1;
        return {
          ...item,
          serverId: null,
          status: reason ? 'rejected' : 'pending',
          rejectionReason: reason,
        };
      });
      const images = [...state.images, ...added];
      return { ...state, images, totalUploaded: images.filter(isActive).length, uploadError: null };
    }

    case 'REMOVE_IMAGE': {
      const filtered = state.images.filter((img) => img.id !== action.payload);
      return {
        ...state,
        images: filtered,
        totalUploaded: filtered.filter(isActive).length,
      };
    }

    case 'UPLOAD_START': {
      const ids = new Set(action.payload);
      return {
        ...state,
        isUploading: true,
        images: state.images.map((img) => (ids.has(img.id) ? { ...img, status: 'uploading' } : img)),
      };
    }

    case 'UPLOAD_ERROR': {
      const { ids, message } = action.payload;
      const set = new Set(ids);
      const images = state.images.map((img) =>
        set.has(img.id) ? { ...img, status: 'rejected', rejectionReason: message } : img
      );
      return {
        ...state,
        images,
        totalUploaded: images.filter(isActive).length,
        isUploading: images.some((img) => ['uploading', 'processing'].includes(img.status)),
        uploadError: message,
      };
    }

    case 'UPLOAD_SUCCESS': {
      const { localId, serverId } = action.payload;
      return {
        ...state,
        images: state.images.map((img) =>
          img.id === localId ? { ...img, serverId, status: 'processing' } : img
        ),
      };
    }

    case 'STATUS_UPDATE': {
      const { imageId, status, reason } = action.payload;
      const images = state.images.map((img) =>
        img.serverId === imageId
          ? { ...img, status: status.toLowerCase(), rejectionReason: reason || null }
          : img
      );
      return {
        ...state,
        images,
        totalUploaded: images.filter(isActive).length,
        isUploading: images.some((img) => ['uploading', 'processing'].includes(img.status)),
      };
    }

    case 'UPLOAD_COMPLETE':
      return {
        ...state,
        isUploading: state.images.some((img) => ['uploading', 'processing'].includes(img.status)),
      };

    default:
      return state;
  }
}

export function UploadProvider({ children }) {
  const [state, dispatch] = useReducer(uploadReducer, initialState);

  const addFiles = useCallback((files) => {
    const items = files.map((file) => ({
      id: `local-${crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    dispatch({ type: 'ADD_FILES', payload: items });
  }, []);

  const removeImage = useCallback((id) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  }, []);

  const startUpload = useCallback((ids) => {
    dispatch({ type: 'UPLOAD_START', payload: ids });
  }, []);

  const uploadSuccess = useCallback((localId, serverId) => {
    dispatch({ type: 'UPLOAD_SUCCESS', payload: { localId, serverId } });
  }, []);

  const updateStatus = useCallback((imageId, status, reason) => {
    dispatch({ type: 'STATUS_UPDATE', payload: { imageId, status, reason } });
  }, []);

  const failUpload = useCallback((ids, message) => {
    dispatch({ type: 'UPLOAD_ERROR', payload: { ids, message } });
  }, []);

  const completeUpload = useCallback(() => {
    dispatch({ type: 'UPLOAD_COMPLETE' });
  }, []);

  const acceptedImages = state.images.filter((img) => img.status === 'accepted');
  const rejectedImages = state.images.filter((img) => img.status === 'rejected');

  return (
    <UploadContext.Provider
      value={{
        ...state,
        acceptedImages,
        rejectedImages,
        addFiles,
        removeImage,
        startUpload,
        uploadSuccess,
        updateStatus,
        failUpload,
        completeUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider');
  }
  return context;
}