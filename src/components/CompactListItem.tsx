import React from 'react';
import { ExternalLink, QrCode, Sparkles, Trash2, User } from 'lucide-react';
import { WebProject, Language } from '../types';
import { translations } from '../translations';

interface CompactListItemProps {
  project: WebProject;
  lang: Language;
  isAdmin: boolean;
  onOpenQR: (project: WebProject) => void;
  onDeleteRequest: (project: WebProject) => void;
  onLike: (projectId: string) => void;
  onVisit: (projectId: string, url: string) => void;
}

export const CompactListItem: React.FC<CompactListItemProps> = ({
  project,
  lang,
  isAdmin,
  onOpenQR,
  onDeleteRequest,
  onVisit,
}) => {
  const t = translations[lang];

  const handleVisit = () => {
    onVisit(project.id, project.url);
    window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center justify-between py-2.5 px-3.5 bg-white hover:bg-slate-50/90 rounded-xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-sm transition-all gap-3">
      {/* Tên mô phỏng, Lĩnh vực và Ghi chú tác giả */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 flex-1 overflow-hidden">
        {project.isFamous && (
          <span
            title="Mô phỏng nổi tiếng"
            className="p-1 rounded-md bg-amber-50 text-amber-500 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        )}

        <h4
          onClick={handleVisit}
          className="font-bold text-slate-900 text-xs sm:text-sm truncate hover:text-indigo-600 cursor-pointer shrink-1 min-w-[80px]"
          title={project.title}
        >
          {project.title}
        </h4>

        {/* Lĩnh vực (Category badge) */}
        <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[11px] font-semibold">
          {t.categoryNames[project.category] || project.category}
        </span>

        {/* Ghi chú tác giả / Đơn vị (ví dụ: Thầy..., Trường..., Nước...) */}
        {project.authorName && (
          <span
            className="shrink-0 inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100/90 border border-slate-200/70 text-slate-600 text-[11px] font-medium max-w-[130px] sm:max-w-[200px] truncate"
            title={`Ghi chú tác giả: ${project.authorName}`}
          >
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{project.authorName}</span>
          </span>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center space-x-1.5 shrink-0">
        <button
          onClick={() => onOpenQR(project)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
          title={t.generateQR}
        >
          <QrCode className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleVisit}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
          title={t.visitWebsite}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {isAdmin && (
          <button
            onClick={() => onDeleteRequest(project)}
            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Xóa bài (Admin)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
