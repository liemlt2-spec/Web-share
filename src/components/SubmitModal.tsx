import React, { useState } from 'react';
import { CheckCircle2, Globe, Sparkles, Upload, X } from 'lucide-react';
import { BrowserMockupFrame } from './BrowserMockupFrame';
import { CategoryId, CountryCode, EducationLevelId, Language, VN_SUBJECTS, WebProject } from '../types';
import { translations } from '../translations';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: Omit<WebProject, 'id' | 'createdAt' | 'views' | 'likes'>) => void;
  lang: Language;
  isAdmin: boolean;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  lang,
  isAdmin,
}) => {
  const t = translations[lang];

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState<CountryCode>('VN');
  const [category, setCategory] = useState<CategoryId>('toan');
  const [educationLevel, setEducationLevel] = useState<EducationLevelId>('general');
  const [authorName, setAuthorName] = useState('');
  const [authorContact, setAuthorContact] = useState('');
  const [customThumbnail, setCustomThumbnail] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const tags = tagsInput
      ? tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [category, country];

    onSubmit({
      url: normalizedUrl,
      title: title.trim(),
      description: description.trim() || 'Website chia sẻ bởi cộng đồng.',
      country,
      category,
      educationLevel,
      status: 'approved',
      authorName: authorName.trim() || 'Thành viên cộng đồng',
      authorContact: authorContact.trim(),
      previewImage: customThumbnail.trim() || undefined,
      tags,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');
      setAuthorName('');
      setAuthorContact('');
      setCustomThumbnail('');
      setTagsInput('');
      onClose();
    }, 2200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomThumbnail(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      id="submit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="submit-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t.submitModalTitle}</h3>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Quyền Admin: Website được duyệt và hiển thị ngay lập tức.'
                  : t.submitModalSubtitle}
              </p>
            </div>
          </div>
          <button
            id="submit-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t.submitSuccess}</h3>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              Bài mô phỏng đã được đăng tải và hiển thị thành công trên trang chủ!
            </p>
          </div>
        ) : (
          /* Form Content with scroll */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {/* Website URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.websiteUrlLabel} <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-website-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.websiteUrlPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Hỗ trợ mọi liên kết Vercel, GitHub Pages, trường học, sản phẩm giáo dục hoặc website riêng.
              </p>
            </div>

            {/* Title & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.websiteTitleLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-website-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.websiteTitlePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.descriptionLabel}
                </label>
                <textarea
                  id="input-website-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Two Essential Classifications: Category and Education Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              {/* Category / Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.categoryLabel}
                </label>
                <select
                  id="select-website-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-indigo-500 truncate"
                >
                  {VN_SUBJECTS.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Education Level (Cấp học) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.levelLabel}
                </label>
                <select
                  id="select-website-level"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value as EducationLevelId)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-indigo-500 truncate"
                >
                  {Object.entries(t.educationLevelNames).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Author info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.authorLabel}
                </label>
                <input
                  id="input-author-name"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={t.authorPlaceholder}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.contactLabel}
                </label>
                <input
                  id="input-author-contact"
                  type="text"
                  value={authorContact}
                  onChange={(e) => setAuthorContact(e.target.value)}
                  placeholder={t.contactPlaceholder}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Thẻ từ khóa (Cách nhau bằng dấu phẩy)
              </label>
              <input
                id="input-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="VD: Toán 3D, Vercel, Mã nguồn mở, THCS"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Thumbnail upload or custom URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.thumbnailLabel}
              </label>
              <p className="text-[11px] text-slate-500 mb-2">{t.thumbnailHint}</p>

              <div className="flex items-center gap-2">
                <input
                  id="input-thumbnail-url"
                  type="url"
                  value={customThumbnail}
                  onChange={(e) => setCustomThumbnail(e.target.value)}
                  placeholder="https://... dán link ảnh tùy chỉnh (tùy chọn)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center space-x-1 shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Tải ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Real-time Browser Mockup Preview */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>{t.previewMockup}</span>
              </div>
              <div className="max-w-md mx-auto">
                <BrowserMockupFrame
                  url={url || 'https://my-app.vercel.app'}
                  title={title || 'Tiêu đề website của bạn'}
                  previewImage={customThumbnail}
                  aspectRatio="video"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-3">
              <button
                id="submit-project-confirm-btn"
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.submitBtn}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
