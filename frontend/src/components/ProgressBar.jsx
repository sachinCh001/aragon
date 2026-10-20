import React from 'react';
import { useUpload } from '../context/UploadContext';

export default function ProgressBar() {
  const { acceptedImages, minRequired, maxAllowed } = useUpload();
  const count = acceptedImages.length;
  const progressWidth = (count / maxAllowed) * 100;
  const minPosition = (minRequired / maxAllowed) * 100;

  return (
    <div className="sticky top-0 z-10 flex w-full flex-col bg-white pb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1 font-semibold text-black">
          <span>Uploaded {count}</span>
          <span className="text-[#707070]">of</span>
          <span>{maxAllowed}</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-[6px] w-full rounded-full bg-light-border">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-green-500 transition-all duration-150"
            style={{ width: `${progressWidth}%` }}
          />
          {/* Minimum marker */}
          <div
            className="absolute bottom-full flex flex-col items-center gap-1"
            style={{ left: `${minPosition}%`, transform: 'translateX(-50%)', marginBottom: '8px' }}
          >
            <span className="whitespace-nowrap text-xs font-bold uppercase text-[#707070]">
              Minimum of {minRequired} photos
            </span>
            <div className="h-2 w-[2px] bg-[#707070]" />
          </div>
        </div>
      </div>
    </div>
  );
}