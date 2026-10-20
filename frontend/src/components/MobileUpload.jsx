import React from 'react';

export default function MobileUpload() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="mb-2 flex items-center gap-1 text-left text-base font-bold">
        <svg width="24" height="24" viewBox="0 0 20 21" fill="none">
          <path d="M5.83 19.67C5.37 19.67 4.98 19.5 4.66 19.18C4.33 18.85 4.17 18.46 4.17 18V3C4.17 2.54 4.33 2.15 4.66 1.82C4.98 1.5 5.37 1.33 5.83 1.33H14.17C14.62 1.33 15.02 1.5 15.34 1.82C15.67 2.15 15.83 2.54 15.83 3V5.58C16.08 5.68 16.28 5.83 16.44 6.04C16.59 6.25 16.67 6.49 16.67 6.75V8.42C16.67 8.68 16.59 8.92 16.44 9.12C16.28 9.33 16.08 9.49 15.83 9.58V18C15.83 18.46 15.67 18.85 15.34 19.18C15.02 19.5 14.62 19.67 14.17 19.67H5.83ZM5.83 18H14.17V3H5.83V18Z" fill="#1D1D1E" />
        </svg>
        Or upload from your mobile
      </div>

      <div className="flex h-[280px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-secondary bg-white transition-all hover:border-custom-orange">
        <div className="my-8 flex flex-col items-center justify-center gap-3">
          <p className="text-base font-bold text-black">Scan the QR code</p>
          <div className="rounded-md border border-border-secondary p-1">
            <div className="flex h-[140px] w-[140px] items-center justify-center bg-gray-100">
              <span className="text-sm text-gray-400">QR Code</span>
            </div>
          </div>
          <p className="cursor-pointer text-sm font-medium text-[#707070] underline hover:text-custom-orange">
            How do I upload from my phone?
          </p>
        </div>
      </div>
    </div>
  );
}