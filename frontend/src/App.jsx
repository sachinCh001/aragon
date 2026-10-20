import React from 'react';
import { UploadProvider, useUpload } from './context/UploadContext';
import { useImageUpload } from './hooks/useImageUpload';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import MobileUpload from './components/MobileUpload';
import ProgressBar from './components/ProgressBar';
import UploadedPhotos from './components/UploadedPhotos';
import PhotoRequirements from './components/PhotoRequirements';
import PhotoRestrictions from './components/PhotoRestrictions';
import BottomBar from './components/BottomBar';

function UploadPage() {
  useImageUpload();
  const { images } = useUpload();

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header />
      
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1280px] gap-10 px-8 pt-8">
          {/* Left Column - Upload Instructions */}
          <div className="flex w-full max-w-[416px] flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M23 16c-.265 0-.52.105-.707.293C22.105 16.48 22 16.735 22 17v2c0 .796-.316 1.559-.879 2.121A2.996 2.996 0 0 1 19 22h-2c-.265 0-.52.105-.707.293A1.004 1.004 0 0 0 17 24h2c1.326-.002 2.597-.529 3.534-1.466A4.992 4.992 0 0 0 24 19v-2c0-.265-.105-.52-.293-.707A1.004 1.004 0 0 0 23 16Z" fill="#F97315" />
                  <path d="M12 11c.791 0 1.564-.235 2.222-.674A3.97 3.97 0 0 0 15.695 8.53a3.892 3.892 0 0 0-1.772-4.359A3.97 3.97 0 0 0 10.47 3.305 3.892 3.892 0 0 0 8.674 7.778 3.97 3.97 0 0 0 12 11Zm0-6c.396 0 .782.117 1.111.337.329.22.585.532.737.898.151.365.19.767.114 1.155-.077.388-.268.744-.547 1.024-.28.28-.636.47-1.024.547a1.97 1.97 0 0 1-1.156-.114 1.97 1.97 0 0 1-.897-.736A1.97 1.97 0 0 1 10 7c0-.53.21-1.04.586-1.414A2.005 2.005 0 0 1 12 5Z" fill="#F97315" />
                </svg>
                <h2 className="text-2xl font-semibold text-black">Upload photos</h2>
              </div>
              <ul className="mt-2 space-y-2 text-sm text-[#707070]">
                <li className="flex items-center gap-2">
                  <span>📷</span> Upload 6-10 photos
                </li>
                <li className="flex items-center gap-2">
                  <span>📱</span> Mix of selfies and mid-range shots
                </li>
                <li className="flex items-center gap-2">
                  <span>💡</span> Ensure photos are in good lighting
                </li>
                <li className="flex items-center gap-2">
                  <span>🔒</span> Your photos stay private
                </li>
              </ul>
            </div>
            
            <UploadZone />
            <MobileUpload />
          </div>

          {/* Right Column - Uploaded Images & Info */}
          <div className="flex w-full flex-col gap-6">
            <ProgressBar />
            
            <div className="flex flex-col gap-4">
              <UploadedPhotos />
              <PhotoRequirements />
              <PhotoRestrictions />
            </div>
          </div>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}

export default function App() {
  return (
    <UploadProvider>
      <UploadPage />
    </UploadProvider>
  );
}