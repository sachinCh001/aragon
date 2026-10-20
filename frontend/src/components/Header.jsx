import React from 'react';

export default function Header({ acceptedCount, totalCount }) {
  const progressWidth = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;

  return (
    <header className="sticky top-0 z-50 h-14 w-full border-b border-light-border bg-white shadow-sm">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-5">
        {/* Logo */}
        <div className="flex cursor-pointer items-center gap-3 hover:opacity-80">
          <div className="relative h-7 w-7">
            <svg width="33" height="32" viewBox="0 0 33 32" fill="none">
              <rect x="0.3" width="32" height="32" rx="7.68" fill="url(#logo-grad)" />
              <defs>
                <linearGradient id="logo-grad" x1="7.1" y1="35.6" x2="37.9" y2="-20.4">
                  <stop stopColor="#EB6002" />
                  <stop offset="1" stopColor="#FFB253" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xl font-semibold text-black">Aragon.ai</span>
        </div>

        {/* Progress Bar */}
        <div className="flex w-full max-w-[50%] items-center gap-3 px-5">
          <div className="relative h-[12px] w-full rounded-full bg-light-border">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
              style={{
                width: `${progressWidth}%`,
                background: 'linear-gradient(124deg, #ff534b, #f9b92d)',
              }}
            />
          </div>
        </div>

        {/* Close Button */}
        <button className="flex h-12 w-12 items-center justify-center rounded-xl transition-all hover:bg-neutral-100 active:scale-90">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </header>
  );
}