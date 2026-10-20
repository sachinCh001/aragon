import React from 'react';

export default function PhotoRequirements() {
  return (
    <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-6 py-4">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between py-2">
          <div className="flex items-center gap-1">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M25.5 16a9.5 9.5 0 1 1-19 0 9.5 9.5 0 0 1 19 0Z" stroke="#01AC5E" strokeWidth="2" strokeLinecap="round" />
              <path d="m12 16 3 3.5 5.222-6.666" stroke="#01AC5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-lg font-bold text-black">Photo Requirements</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-180">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="pb-4 pt-2">
          <ul className="space-y-2 text-sm text-[#707070]">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Upload 6-10 photos for best results
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Mix of selfies and mid-range shots
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Ensure photos are in good lighting
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Show your face clearly in each photo
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Use high-resolution images (minimum 200x200px)
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
}