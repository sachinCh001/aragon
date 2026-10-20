import React from 'react';

export default function PhotoRestrictions() {
  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fff5f5] px-6 py-4">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between py-2">
          <div className="flex items-center gap-1">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M22.577 9.469 9.423 22.622M25.5 16a9.5 9.5 0 1 1-19 0 9.5 9.5 0 0 1 19 0Z" stroke="#FF4E64" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-lg font-bold text-black">Photo Restrictions</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-180">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="pb-4 pt-2">
          <ul className="space-y-2 text-sm text-[#707070]">
            <li className="flex items-center gap-2">
              <span className="text-red-500">✗</span> No blurry or low-quality images
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">✗</span> No group photos (single person only)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">✗</span> No photos where face is too small
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">✗</span> No duplicate or very similar photos
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
}