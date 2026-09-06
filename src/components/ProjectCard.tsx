import React, { useState } from 'react';
import {
  ExternalLink,
  Heart,
  QrCode,
  Share2,
  Trash2,
  User,
} from 'lucide-react';
import { WebProject, Language } from '../types';
import { translations } from '../translations';
import { BrowserMockupFrame } from './BrowserMockupFrame';
import { formatTimeAgo } from '../utils/screenshot';

interface ProjectCardProps {
  project: WebProject;
  lang: Language;
  isAdmin: boolean;
  onOpenQR: (project: WebProject) => void;
  onDeleteRequest: (project: WebProject) => void;
  onLike: (projectId: string) => void;
  onVisit: (projectId: string, url: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  lang,
  isAdmin,
  onOpenQR,
  onDeleteRequest,
  onLike,
  onVisit,
}) => {
  const t = translations[lang];
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike(project.id);
  };

  const handleVisit = () => {
    onVisit(project.id, project.url);
    window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.title,
          text: project.description,
          url: project.url,
        });
      } else {
        await navigator.clipboard.writeText(project.url);
        alert(t.copied);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div
      id={`project-card-${project.id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
    >
      {/* Top Media: Browser Mockup Frame */}
      <div className="p-3 bg-slate-50/50 border-b border-slate-100">
        <BrowserMockupFrame
          url={project.url}
          title={project.title}
          previewImage={project.previewImage}
          onClick={handleVisit}
          aspectRatio="video"
        />
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Badges: Country, Education Level, Category, Time Ago */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
              {t.countryNames[project.country] || project.country}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {t.categoryNames[project.category] || project.category}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {t.educationLevelNames[project.educationLevel] || project.educationLevel}
            </span>
            <span className="ml-auto text-[10px] text-slate-400 font-medium">
              {formatTimeAgo(project.createdAt, lang)}
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={handleVisit}
            className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors cursor-pointer"
            title={project.title}
          >
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Submitter Info & Tags */}
        <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5 truncate max-w-[180px]" title={`Ghi chú tác giả: ${project.authorName}`}>
            <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] shrink-0">
              <User className="w-2.5 h-2.5" />
            </div>
            <span className="truncate font-medium text-slate-700">{project.authorName}</span>
          </div>

          {/* Like button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              isLiked ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{project.likes + (isLiked ? 1 : 0)}</span>
          </button>
        </div>

        {/* Bottom Interactive Action Row */}
        <div className="pt-1 flex items-center justify-between gap-2">
          {/* Primary Action: Visit Web */}
          <button
            id={`visit-btn-${project.id}`}
            onClick={handleVisit}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="truncate">{t.visitWebsite}</span>
          </button>

          {/* Secondary Action: QR Code Button */}
          <button
            id={`qr-btn-${project.id}`}
            onClick={() => onOpenQR(project)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1 transition-colors"
            title={t.generateQR}
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">{t.generateQR}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Chia sẻ link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Admin Delete Action Button (with safety confirmation) */}
          {isAdmin && (
            <button
              id={`delete-btn-${project.id}`}
              onClick={() => onDeleteRequest(project)}
              className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
              title="Xóa bài (Admin)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
