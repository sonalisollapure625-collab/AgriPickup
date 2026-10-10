import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils.js';
import { Sprout, RefreshCw, AlertCircle } from 'lucide-react';

export default function PlantImage({
  src,
  alt = 'Plant',
  className = 'w-full h-full object-cover',
  fallbackIcon = true,
  fallbackText = 'No photo uploaded',
}) {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const resolvedSrc = getImageUrl(src);

  // If no image reference was provided in the database record
  if (!resolvedSrc) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 ${className}`}>
        {fallbackIcon && <Sprout className="w-8 h-8 mb-1.5 opacity-40 text-emerald-600" />}
        <span className="text-[11px] text-slate-400 font-medium">{fallbackText}</span>
      </div>
    );
  }

  // If image network request failed
  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 p-3 text-center ${className}`}>
        <AlertCircle className="w-6 h-6 text-amber-500 mb-1" />
        <span className="text-[10px] text-slate-500 font-medium mb-1.5">Image failed to load</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setHasError(false);
            setRetryKey((k) => k + 1);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-300 text-[10px] text-slate-700 hover:bg-slate-100 font-semibold shadow-2xs"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <img
      key={retryKey}
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
