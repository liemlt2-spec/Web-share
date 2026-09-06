import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { WebProject, Language } from '../types';
import { translations } from '../translations';
import { extractDomain } from '../utils/screenshot';

interface DeleteConfirmModalProps {
  project: WebProject | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
  lang: Language;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  project,
  isOpen,
  onClose,
  onConfirm,
  lang,
}) => {
  const t = translations[lang];

  if (!isOpen || !project) return null;

  return (
    <div
      id="delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="delete-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col"
      >
        {/* Header with warning badge */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/70">
          <div className="flex items-center space-x-2 text-rose-700">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-rose-900 text-sm">{t.confirmDeleteTitle}</h3>
              <p className="text-[11px] text-rose-600">Quyền quản trị viên (Admin Only)</p>
            </div>
          </div>
          <button
            id="delete-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details about the website to delete */}
        <div className="p-6 flex flex-col space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.confirmDeleteDesc}
          </p>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
              {project.previewImage ? (
                <img
                  src={project.previewImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                  WEB
                </div>
              )}
            </div>
            <div className="overflow-hidden text-left flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{project.title}</h4>
              <p className="text-[11px] text-slate-500 font-mono truncate">{extractDomain(project.url)}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Tác giả: {project.authorName}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="delete-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {t.cancelBtn}
            </button>
            <button
              id="delete-confirm-action-btn"
              type="button"
              onClick={() => {
                onConfirm(project.id);
                onClose();
              }}
              className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.confirmDeleteBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
