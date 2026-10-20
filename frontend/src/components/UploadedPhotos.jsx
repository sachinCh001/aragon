import React from 'react';
import { useUpload } from '../context/UploadContext';
import ImagePreview from './ImagePreview';

export default function UploadedPhotos() {
  const { images, acceptedImages, rejectedImages } = useUpload();

  if (images.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#f8f8f8] px-6 py-4">
      <details open>
        <summary className="flex cursor-pointer items-center justify-between py-2">
          <h3 className="text-xl font-semibold text-black">Uploaded photos</h3>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-180">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        
        <div className="mt-4 flex flex-col gap-4">
          {/* Accepted Images */}
          {acceptedImages.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-green-600">
                Accepted ({acceptedImages.length})
              </h4>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-4">
                {acceptedImages.map((img) => (
                  <ImagePreview key={img.id} image={img} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Images */}
          {rejectedImages.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-red-600">
                Rejected ({rejectedImages.length})
              </h4>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-4">
                {rejectedImages.map((img) => (
                  <ImagePreview key={img.id} image={img} />
                ))}
              </div>
            </div>
          )}

          {/* Pending/Processing Images */}
          {images.filter((img) => !['accepted', 'rejected'].includes(img.status)).length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-yellow-600">Processing</h4>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-4">
                {images
                  .filter((img) => !['accepted', 'rejected'].includes(img.status))
                  .map((img) => (
                    <ImagePreview key={img.id} image={img} />
                  ))}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="flex items-center gap-2.5 rounded-lg border border-[#93c5fd] bg-[#ebf2fe] px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 13 16" fill="none">
              <path d="M5.29 10.5h2.42l-.46-2.69c.23-.12.42-.3.55-.54.13-.24.2-.5.2-.78 0-.41-.15-.76-.44-1.05-.29-.29-.65-.44-1.06-.44-.41 0-.77.15-1.06.44-.29.29-.44.65-.44 1.06 0 .28.07.54.2.78.13.23.32.41.55.54l-.46 2.68zM6.5 16c-1.88-.46-3.43-1.52-4.66-3.18C.61 11.15 0 9.3 0 7.27V2.5L6.5 0 13 2.5v4.77c0 2.03-.61 3.88-1.84 5.55C9.93 14.48 8.38 15.54 6.5 16z" fill="#4274E9" />
            </svg>
            <span className="text-sm font-medium text-black">
              As a paid product, we value user privacy and transparency.
            </span>
          </div>
        </div>
      </details>
    </div>
  );
}