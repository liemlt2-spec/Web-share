import React from 'react';
import { Eye, Globe, Plus } from 'lucide-react';
import { Language, WebProject } from '../types';
import { translations } from '../translations';

interface StatsBannerProps {
  projects: WebProject[];
  lang: Language;
  onOpenSubmit: () => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  projects,
  lang,
  onOpenSubmit,
}) => {
  const t = translations[lang];
  const approvedProjects = projects.filter((p) => p.status === 'approved');
  const totalViews = approvedProjects.reduce((acc, p) => acc + p.views, 0);
  const formattedViews = totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews;

  return (
    <div
      id="hero-compact-banner"
      className="flex items-center justify-between py-2 px-3 sm:py-2.5 sm:px-5 mb-4 sm:mb-5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm gap-2"
    >
      {/* Short clean title */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <span className="font-extrabold text-xs sm:text-base tracking-wide text-white">
          {t.appName}
        </span>
      </div>

      {/* Action: "Đăng tải website" with small view count badge (without the word "lượt xem") */}
      <button
        id="hero-share-website-btn"
        onClick={onOpenSubmit}
        className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 sm:space-x-2 shrink-0 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="whitespace-nowrap">{t.submitWebsite}</span>
        <span
          className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-200 text-[10px] sm:text-[11px] font-mono font-medium border border-indigo-400/30 flex items-center space-x-1 shrink-0"
          title={t.viewsCount.replace('{count}', String(formattedViews))}
        >
          <Eye className="w-3 h-3 text-indigo-300" />
          <span>{formattedViews}</span>
        </span>
      </button>
    </div>
  );
};
