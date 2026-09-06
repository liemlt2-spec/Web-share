import React from 'react';
import {
  AlignLeft,
  CheckCircle2,
  LayoutGrid,
  Plus,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  CategoryId,
  EducationLevelId,
  FilterState,
  Language,
  VN_SUBJECTS,
  ViewMode,
} from '../types';
import { translations } from '../translations';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  lang: Language;
  totalResults: number;
  approvedCount: number;
  famousCount: number;
  onOpenSubmit?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  lang,
  totalResults,
  approvedCount,
  famousCount,
  onOpenSubmit,
}) => {
  const t = translations[lang];

  const handleCategoryChange = (category: CategoryId | 'ALL') => {
    onFilterChange({ ...filters, category });
  };

  const handleLevelChange = (educationLevel: EducationLevelId | 'ALL') => {
    onFilterChange({ ...filters, educationLevel });
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    onFilterChange({ ...filters, sortBy });
  };

  const toggleFamousFilter = (isFamous: boolean) => {
    onFilterChange({ ...filters, onlyFamous: isFamous });
  };

  const handleResetFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: 'ALL',
      educationLevel: 'ALL',
      sortBy: 'newest',
      onlyFamous: false,
    });
  };

  const isFiltered =
    filters.category !== 'ALL' ||
    filters.educationLevel !== 'ALL' ||
    filters.searchQuery !== '';

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs mb-5 space-y-3">
      {/* 1. Thanh điều khiển chính: Hai Tab rõ ràng [📤 Bài đăng tải] & [⭐ Nổi tiếng] cùng cụm Icon chế độ xem */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 flex-wrap sm:flex-nowrap">
        {/* Bên trái: 2 Tab phân biệt rõ ràng */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Tab 1: Bài đăng tải của giáo viên/học sinh/người dùng */}
          <button
            id="tab-user-submitted-btn"
            onClick={() => toggleFamousFilter(false)}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              !filters.onlyFamous
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-500/20 ring-2 ring-indigo-300/40'
                : 'bg-slate-100/90 text-slate-700 border-slate-200/80 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
            title="Xem các mô phỏng do thầy cô và cộng đồng đăng tải"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Bài đăng tải</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                !filters.onlyFamous
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {approvedCount}
            </span>
          </button>

          {/* Tab 2: Mô phỏng nổi tiếng quốc tế (PhET, GeoGebra, NetSim...) */}
          <button
            id="tab-famous-btn"
            onClick={() => toggleFamousFilter(true)}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              filters.onlyFamous
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20 ring-2 ring-amber-300/50'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
            }`}
            title="Xem các nền tảng mô phỏng nổi tiếng thế giới (PhET, GeoGebra, NetSim...)"
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                filters.onlyFamous ? 'text-amber-100 fill-amber-100' : 'text-amber-600 fill-amber-500'
              }`}
            />
            <span className="whitespace-nowrap">Nổi tiếng</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                filters.onlyFamous
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-200/90 text-amber-950'
              }`}
            >
              {famousCount}
            </span>
          </button>
        </div>

        {/* Bên phải: Nút Đăng tải + Cụm chế độ xem [☰ Rút gọn] [⊞ Mở rộng] */}
        <div className="flex items-center space-x-2 ml-auto">
          {/* Nút Đăng tải tiện lợi ngay trên thanh công cụ */}
          {onOpenSubmit && (
            <button
              id="filterbar-open-submit-btn"
              onClick={onOpenSubmit}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Đăng tải bài mô phỏng của bạn"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden md:inline">Đăng tải</span>
            </button>
          )}

          {/* Cụm chế độ xem: [☰ Rút gọn] & [⊞ Mở rộng] */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
            {/* Rút gọn */}
            <button
              id="view-mode-compact-btn"
              onClick={() => onViewModeChange('compact')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ xem rút gọn (Tên & Lĩnh vực)"
              aria-label="Chế độ xem rút gọn"
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            {/* Mở rộng */}
            <button
              id="view-mode-expanded-btn"
              onClick={() => onViewModeChange('expanded')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'expanded'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ xem mở rộng (Đầy đủ mockup & QR)"
              aria-label="Chế độ xem mở rộng"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hàng bộ lọc: Môn học, Cấp học, Sắp xếp theo - ĐƯỢC TỐI ƯU TRÊN MỌI THIẾT BỊ */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 items-center">
        {/* Môn học / Lĩnh vực (Category) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 truncate">
            {t.categoryLabel}
          </label>
          <select
            id="filter-category-select"
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value as CategoryId | 'ALL')}
            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 text-[11px] sm:text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 transition-colors truncate cursor-pointer"
          >
            <option value="ALL">📁 {t.allCategories}</option>
            {VN_SUBJECTS.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cấp học phù hợp (Education Level) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 truncate">
            {t.levelLabel}
          </label>
          <select
            id="filter-level-select"
            value={filters.educationLevel}
            onChange={(e) => handleLevelChange(e.target.value as EducationLevelId | 'ALL')}
            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 text-[11px] sm:text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 transition-colors truncate cursor-pointer"
          >
            <option value="ALL">🎓 {t.allLevels}</option>
            {Object.entries(t.educationLevelNames).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Sắp xếp theo (Sort By) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 truncate">
            {t.sortBy}
          </label>
          <select
            id="filter-sort-select"
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 text-[11px] sm:text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 transition-colors truncate cursor-pointer"
          >
            <option value="newest">🕒 {t.sortNewest}</option>
            <option value="most_liked">❤️ {t.sortMostLiked}</option>
            <option value="most_viewed">👁️ {t.sortMostViewed}</option>
            <option value="oldest">⏳ {t.sortOldest}</option>
          </select>
        </div>
      </div>

      {/* Tóm tắt kết quả lọc & Nút Đặt lại bộ lọc */}
      {(isFiltered || totalResults === 0) && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            {filters.onlyFamous ? (
              <span>
                Tìm thấy <strong>{totalResults}</strong> mô phỏng nổi tiếng phù hợp
              </span>
            ) : (
              <span>
                Hiển thị <strong>{totalResults}</strong> mô phỏng đã duyệt phù hợp
              </span>
            )}
          </span>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
