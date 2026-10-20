import React, { useRef } from 'react';
import { useUpload } from '../context/UploadContext';

export default function UploadZone() {
  const fileInputRef = useRef(null);
  const { addFiles, images } = useUpload();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="mb-2 flex items-center gap-1 text-left text-base font-bold">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8 21V19H10V17H4C3.45 17 2.98 16.8 2.59 16.41C2.2 16.02 2 15.55 2 15V5C2 4.45 2.2 3.98 2.59 3.59C2.98 3.2 3.45 3 4 3H20C20.55 3 21.02 3.2 21.41 3.59C21.8 3.98 22 4.45 22 5V15C22 15.55 21.8 16.02 21.41 16.41C21.02 16.8 20.55 17 20 17H14V19H16V21H8ZM4 15H20V5H4V15Z" fill="#1D1D1E" />
        </svg>
        Upload from your computer
      </div>

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed border-border-secondary bg-white transition-all duration-300 hover:border-custom-orange"
      >
        <button className="inline-flex items-center gap-2 rounded-md bg-custom-orange px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90">
          <svg width="16" height="16" viewBox="0 0 17 16" fill="none">
            <path d="M7.5 12V3.85L4.9 6.45L3.5 5L8.5 0L13.5 5L12.1 6.45L9.5 3.85V12H7.5ZM2.5 16C1.95 16 1.48 15.8 1.09 15.41C0.7 15.02 0.5 14.55 0.5 14V11H2.5V14H14.5V11H16.5V14C16.5 14.55 16.3 15.02 15.91 15.41C15.52 15.8 15.05 16 14.5 16H2.5Z" fill="currentColor" />
          </svg>
          Upload files
        </button>
        <div className="px-5 text-center">
          <p className="text-[13px] font-semibold text-[#707070]">
            or <span className="text-custom-orange">drag and drop</span> your photos
          </p>
          <span className="text-xs text-[#9a9a9a]">PNG, JPG, HEIC up to 25MB</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/heic,image/heif,.heic,.heif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}