import React, { useState } from 'react';
import { ExternalLink, Globe, Lock, ShieldCheck } from 'lucide-react';
import { extractDomain, getWebsiteScreenshotUrl } from '../utils/screenshot';

interface BrowserMockupFrameProps {
  url: string;
  title: string;
  previewImage?: string;
  onClick?: () => void;
  aspectRatio?: 'video' | 'wide' | 'standard';
}

export const BrowserMockupFrame: React.FC<BrowserMockupFrameProps> = ({
  url,
  title,
  previewImage,
  onClick,
  aspectRatio = 'video',
}) => {
  const [imageError, setImageError] = useState(false);
  const domain = extractDomain(url);
  const screenshotUrl = getWebsiteScreenshotUrl(url, previewImage);

  const aspectClass =
    aspectRatio === 'wide'
      ? 'aspect-[16/9]'
      : aspectRatio === 'standard'
      ? 'aspect-[4/3]'
      : 'aspect-[16/10]';

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Browser chrome header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100/90 border-b border-slate-200/70 select-none text-xs text-slate-600">
        {/* Window controls */}
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/90 inline-block border border-rose-500/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90 inline-block border border-amber-500/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 inline-block border border-emerald-500/20" />
        </div>

        {/* Address bar simulation */}
        <div className="flex-1 max-w-[240px] sm:max-w-[280px] mx-2 flex items-center justify-center space-x-1 px-2.5 py-0.5 bg-white rounded-md border border-slate-200 text-[11px] text-slate-500 truncate shadow-xs">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate font-mono">{domain || 'preview.web'}</span>
        </div>

        {/* External link cue */}
        <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Website Viewport simulation */}
      <div className={`relative w-full ${aspectClass} bg-slate-900 overflow-hidden`}>
        {!imageError && screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt={title}
            onError={() => setImageError(true)}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          /* Fallback sleek simulated screen */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-3">
              <Globe className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="font-semibold text-sm max-w-[85%] truncate text-slate-100">{title}</p>
            <p className="text-xs text-indigo-300 font-mono mt-1 truncate max-w-[90%]">{url}</p>
            <div className="mt-3 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-slate-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Bảo mật HTTPS</span>
            </div>
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-semibold shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mở trang web trực tiếp</span>
          </span>
        </div>
      </div>
    </div>
  );
};
