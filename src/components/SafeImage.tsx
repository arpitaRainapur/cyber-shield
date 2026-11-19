import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({ src, alt, className = '', fallbackTitle }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-slate-200 text-slate-700 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <ShieldCheck className="w-12 h-12 text-emerald-700 mb-3" aria-hidden="true" />
        <p className="font-medium text-sm text-slate-700 max-w-xs">{fallbackTitle || alt}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
