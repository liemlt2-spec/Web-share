import React, { useState } from 'react';
import {
  Clock,
  ExternalLink,
  Eye,
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

interface TimelineLayerCardProps {
  project: WebProject;
  index: number;
  lang: Language;
  isAdmin: boolean;
  onOpenQR: (project: WebProject) => void;
  onDeleteRequest: (project: WebProject) => void;
  onLike: (projectId: string) => void;
  onVisit: (projectId: string, url: string) => void;
}

export const TimelineLayerCard: React.FC<TimelineLayerCardProps> = ({
  project,
  index,
  lang,
  isAdmin,
  onOpenQR,
  onDeleteRequest,
  onLike,
  onVisit,
}) => {
  const t = translations[lang];
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(project.id);
  };

  const handleVisit = () => {
    onVisit(project.id, project.url);
    window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id={`timeline-layer-${project.id}`}
      className="relative flex flex-col lg:flex-row items-stretch gap-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-xl transition-all duration-300"
    >
      {/* Chronological Layer Badge */}
      <div className="absolute -top-3 left-6 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-sm">
        <Clock className="w-3 h-3" />
        <span>Lớp ảnh #{index + 1} • {formatTimeAgo(project.createdAt, lang)}</span>
      </div>

      {/* Left / Top: Browser Mockup Frame in Wide Screen view */}
      <div className="w-full lg:w-1/2 pt-2 lg:pt-0">
        <BrowserMockupFrame
          url={project.url}
          title={project.title}
          previewImage={project.previewImage}
          onClick={handleVisit}
          aspectRatio="video"
        />
      </div>

      {/* Right / Bottom: Full Details & Controls */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-4">
        <div>
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
              {t.countryNames[project.country] || project.country}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {t.categoryNames[project.category] || project.category}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {t.educationLevelNames[project.educationLevel] || project.educationLevel}
            </span>
          </div>

          <h3
            onClick={handleVisit}
            className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {project.title}
          </h3>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {project.description}
          </p>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Meta & Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.authorName}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.views} lượt xem</span>
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                isLiked
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{project.likes + (isLiked ? 1 : 0)}</span>
            </button>

            <button
              onClick={() => onOpenQR(project)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.generateQR}</span>
            </button>

            <button
              onClick={handleVisit}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t.visitWebsite}</span>
            </button>

            {isAdmin && (
              <button
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
    </div>
  );
};
