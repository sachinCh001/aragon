import React from 'react';
import { useUpload } from '../context/UploadContext';

export default function BottomBar() {
  const { acceptedImages, minRequired, isUploading, uploadError } = useUpload();

  const canContinue = acceptedImages.length >= minRequired && !isUploading;

  let hint = null;
  if (uploadError) hint = <span className="text-red-600">{uploadError}</span>;
  else if (isUploading) hint = <span className="text-[#707070]">Checking your photos…</span>;
  else if (acceptedImages.length < minRequired) {
    hint = (
      <span className="text-[#707070]">
        {acceptedImages.length} of {minRequired} accepted photos needed to continue
      </span>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex w-full flex-col items-center justify-center gap-2 border-t border-light-border bg-white py-4 shadow-lg">
      {hint && <p className="text-sm">{hint}</p>}
      <button
        disabled={!canContinue}
        className={`flex w-80 items-center justify-center rounded-md px-8 py-3 text-base font-semibold text-white transition-all ${
          canContinue
            ? 'bg-custom-orange hover:bg-orange-600 active:scale-95'
            : 'cursor-not-allowed bg-gray-300'
        }`}
      >
        Continue
      </button>
    </div>
  );
}
