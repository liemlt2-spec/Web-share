/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FilterState,
  Language,
  ViewMode,
  WebProject,
} from './types';
import { INITIAL_PROJECTS } from './data/initialData';
import { translations } from './translations';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { FilterBar } from './components/FilterBar';
import { ProjectCard } from './components/ProjectCard';
import { TimelineLayerCard } from './components/TimelineLayerCard';
import { CompactListItem } from './components/CompactListItem';
import { QRCodeModal } from './components/QRCodeModal';
import { SubmitModal } from './components/SubmitModal';
import { AdminModal } from './components/AdminModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { Globe, Plus, Sparkles } from 'lucide-react';
import {
  getStoredScriptUrl,
  isAutoSyncEnabled,
  pushSingleProjectToSheet,
  upsertProjectToSheet,
  fetchProjectsFromSheet,
} from './services/googleSync';
import { getWebsiteScreenshotUrl } from './utils/screenshot';

const STORAGE_KEY_PROJECTS = 'webhub_projects_data_v3';
const STORAGE_KEY_LANG = 'webhub_language_preference';
const STORAGE_KEY_ADMIN = 'webhub_admin_session';

// Helper to ensure famous platforms and community submissions are cleanly separated
const sanitizeAndMigrateProjects = (loadedList: WebProject[]): WebProject[] => {
  // Các dữ liệu mẫu cũ đã được gỡ khỏi bản khởi tạo (demo bài đăng tải, pending, mục ghép cũ)
  const deprecatedSampleIds = new Set<string>([
    'proj-phys-1',
    'proj-chem-1',
    'proj-math-1',
    'proj-bio-1',
    'proj-hist-1',
    'proj-lit-1',
    'proj-eng-1',
    'proj-pending-1',
  ]);

  const famousKeywords = [
    'phet',
    'geogebra',
    'netsim',
    'packet-tracer',
    'falstad',
    'desmos',
    'scratch',
    'biodigital',
    'algorithm-visualizer',
    'molview',
  ];

  const initialFamous = INITIAL_PROJECTS.filter((p) => p.isFamous);

  const updated: WebProject[] = loadedList
    .filter((p) => !deprecatedSampleIds.has(p.id))
    .map((p) => {
      const isFamousMatch = famousKeywords.some(
        (kw) =>
          p.url.toLowerCase().includes(kw) ||
          p.id.toLowerCase().includes(kw) ||
          p.title.toLowerCase().includes(kw)
      );
      return {
        ...p,
        isFamous: isFamousMatch || !!p.isFamous,
      };
    });

  // Ensure all standard famous simulations from INITIAL_PROJECTS are included
  for (const fam of initialFamous) {
    if (!updated.some((p) => p.id === fam.id || p.url === fam.url)) {
      updated.push(fam);
    }
  }

  return updated;
};

export default function App() {
  // 1. Language state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    return (saved as Language) || 'vi';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY_LANG, newLang);
  };

  const t = translations[lang];

  // 2. Admin Authentication State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ADMIN) === 'true';
  });

  const handleSetIsAdmin = (val: boolean) => {
    setIsAdmin(val);
    localStorage.setItem(STORAGE_KEY_ADMIN, val ? 'true' : 'false');
  };

  // 3. Projects State (Loaded from localStorage with clean migration across all versions or Initial Seed)
  const [projects, setProjects] = useState<WebProject[]>(() => {
    try {
      const storageKeys = [
        'webhub_projects_data_v4',
        'webhub_projects_data_v3',
        'webhub_projects_data_v2',
        'webhub_projects_data_v1',
        'webhub_projects_data',
      ];
      const mergedList: WebProject[] = [];
      for (const key of storageKeys) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (
                  item &&
                  item.id &&
                  !mergedList.some(
                    (existing) => existing.id === item.id || existing.url === item.url
                  )
                ) {
                  // Giữ nguyên trạng thái (approved / pending / rejected) khi tải lại
                  mergedList.push({ ...item });
                }
              }
            }
          } catch {
            // ignore JSON error
          }
        }
      }

      if (mergedList.length > 0) {
        return sanitizeAndMigrateProjects(mergedList);
      }
    } catch {
      // Fallback
    }
    return INITIAL_PROJECTS;
  });

  // Save projects to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [projects]);

  // 4. View Mode & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('expanded');
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'ALL',
    educationLevel: 'ALL',
    sortBy: 'newest',
    onlyFamous: false,
  });

  // 5. Modals State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [selectedQRProject, setSelectedQRProject] = useState<WebProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<WebProject | null>(null);

  // Background non-blocking auto-sync from Google Sheets on initial load
  useEffect(() => {
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      fetchProjectsFromSheet(scriptUrl)
        .then((result) => {
          if (result.success && result.data && result.data.length > 0) {
            setProjects(result.data);
          }
        })
        .catch((err) => {
          console.warn('Background Google Sheets sync notice:', err);
        });
    }
  }, []);

  // 6. Action Handlers
  const handleLike = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handleVisit = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, views: p.views + 1 } : p))
    );
  };

  const handleSubmitNewProject = (
    data: Omit<WebProject, 'id' | 'createdAt' | 'views' | 'likes'>
  ) => {
    // Tự tạo ảnh đại diện (screenshot) nếu người dùng không tải ảnh lên
    const thumbnail =
      (data.previewImage && data.previewImage.trim()) ||
      getWebsiteScreenshotUrl(data.url);

    const newProject: WebProject = {
      ...data,
      id: `proj-${Date.now()}`,
      status: 'pending', // Chờ admin duyệt trước khi hiển thị công khai
      createdAt: new Date().toISOString(),
      views: 1,
      likes: 0,
      previewImage: thumbnail,
    };
    setProjects((prev) => [newProject, ...prev]);
    // Chuyển về tab "Bài đăng tải" mặc định
    setFilters((prev) => ({ ...prev, onlyFamous: false }));

    // Đẩy bài mới (trạng thái pending) lên Google Sheets nếu đã cấu hình
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      pushSingleProjectToSheet(scriptUrl, newProject);
    }
  };

  const handleApprove = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
    );

    // Đồng bộ toàn bộ thông tin bài (gồm ảnh đại diện) lên Google Sheets
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      upsertProjectToSheet(scriptUrl, { ...project, status: 'approved' });
    }
  };

  const handleReject = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
    );

    // Đồng bộ trạng thái từ chối (kèm toàn bộ thông tin) lên Google Sheets
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      upsertProjectToSheet(scriptUrl, { ...project, status: 'rejected' });
    }
  };

  const handleConfirmDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleExportData = () => {
    const jsonStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webhub-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (imported: WebProject[]) => {
    setProjects(imported);
    alert(`Đã nhập thành công ${imported.length} website vào hệ thống.`);
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục về danh sách mẫu ban đầu không?')) {
      setProjects(INITIAL_PROJECTS);
      localStorage.removeItem(STORAGE_KEY_PROJECTS);
    }
  };

  // 7. Filtering & Sorting Logic
  const approvedProjects = useMemo(
    () => projects.filter((p) => p.status === 'approved'),
    [projects]
  );
  const defaultApprovedCount = useMemo(
    () => approvedProjects.filter((p) => !p.isFamous).length,
    [approvedProjects]
  );
  const famousCount = useMemo(
    () => approvedProjects.filter((p) => !!p.isFamous).length,
    [approvedProjects]
  );

  const filteredProjects = useMemo(() => {
    return approvedProjects
      .filter((project) => {
        // Nếu người dùng bật nút "Nổi tiếng": hiển thị các mô phỏng nổi tiếng (PhET, GeoGebra, NetSim...)
        // Mặc định: hiển thị các bài mô phỏng do chúng ta duyệt trực tiếp trên trang web
        if (filters.onlyFamous) {
          if (!project.isFamous) return false;
        } else {
          if (project.isFamous) return false;
        }

        // Category / Subject filter
        if (filters.category !== 'ALL') {
          const cat = filters.category;
          const subjectAliases: Record<string, string[]> = {
            toan: ['toan', 'math'],
            vat_ly: ['vat_ly', 'physics', 'stem'],
            hoa_hoc: ['hoa_hoc', 'chemistry'],
            sinh_hoc: ['sinh_hoc', 'biology', 'health_medicine'],
            tin_hoc: ['tin_hoc', 'informatics', 'computer_science'],
            ngu_van: ['ngu_van', 'literature'],
            tieng_anh: ['tieng_anh', 'english', 'languages'],
            lich_su: ['lich_su', 'history', 'history_society'],
            dia_li: ['dia_li', 'geography'],
            khtn_stem: ['khtn_stem', 'stem', 'natural_sciences'],
            cong_nghe: ['cong_nghe', 'tools_utilities'],
            khac: ['khac', 'general', 'arts_design'],
          };
          const matches = (subjectAliases[cat] || [cat]).includes(project.category);
          if (!matches) return false;
        }

        // Education Level filter
        if (
          filters.educationLevel !== 'ALL' &&
          project.educationLevel !== filters.educationLevel
        ) {
          return false;
        }

        // Search Query
        if (filters.searchQuery.trim() !== '') {
          const query = filters.searchQuery.toLowerCase();
          const matchTitle = project.title.toLowerCase().includes(query);
          const matchDesc = project.description.toLowerCase().includes(query);
          const matchAuthor = project.authorName.toLowerCase().includes(query);
          const matchUrl = project.url.toLowerCase().includes(query);
          const matchTags = project.tags.some((tag) =>
            tag.toLowerCase().includes(query)
          );
          if (!matchTitle && !matchDesc && !matchAuthor && !matchUrl && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (filters.sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (filters.sortBy === 'most_liked') {
          return b.likes - a.likes;
        }
        if (filters.sortBy === 'most_viewed') {
          return b.views - a.views;
        }
        return 0;
      });
  }, [approvedProjects, filters]);

  const pendingCount = projects.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <Header
        lang={lang}
        onLanguageChange={handleLanguageChange}
        searchQuery={filters.searchQuery}
        onSearchChange={(query) => setFilters({ ...filters, searchQuery: query })}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSubmit={() => setIsSubmitOpen(true)}
        pendingCount={pendingCount}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        hasGoogleSync={Boolean(getStoredScriptUrl())}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Streamlined Banner Hero */}
        <StatsBanner
          projects={projects}
          lang={lang}
          onOpenSubmit={() => setIsSubmitOpen(true)}
        />

        {/* Filter and View Mode Switcher */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          lang={lang}
          totalResults={filteredProjects.length}
          approvedCount={defaultApprovedCount}
          famousCount={famousCount}
          onOpenSubmit={() => setIsSubmitOpen(true)}
        />

        {/* Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t.noWebsitesFound}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              Hãy thử chọn môn học khác, xóa từ khóa tìm kiếm hoặc bấm nút Nổi tiếng để khám phá thêm!
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() =>
                  setFilters({
                    searchQuery: '',
                    category: 'ALL',
                    educationLevel: 'ALL',
                    sortBy: 'newest',
                    onlyFamous: false,
                  })
                }
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t.clearFilters}
              </button>
              <button
                onClick={() => setIsSubmitOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs"
              >
                {t.submitWebsite}
              </button>
            </div>
          </div>
        ) : (
          /* Render based on View Mode: Expanded (Đầy đủ mockup, QR, mô tả) vs Compact (Chỉ Tên & Lĩnh vực) */
          <>
            {viewMode === 'expanded' ? (
              <div
                id="projects-expanded-view"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    lang={lang}
                    isAdmin={isAdmin}
                    onOpenQR={(p) => setSelectedQRProject(p)}
                    onDeleteRequest={(p) => setProjectToDelete(p)}
                    onLike={handleLike}
                    onVisit={handleVisit}
                  />
                ))}
              </div>
            ) : (
              <div id="projects-compact-view" className="space-y-2 max-w-4xl mx-auto">
                {filteredProjects.map((project) => (
                  <CompactListItem
                    key={project.id}
                    project={project}
                    lang={lang}
                    isAdmin={isAdmin}
                    onOpenQR={(p) => setSelectedQRProject(p)}
                    onDeleteRequest={(p) => setProjectToDelete(p)}
                    onLike={handleLike}
                    onVisit={handleVisit}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">{t.appName}</span>
            <span>—</span>
            <span>{t.appTagline}</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              {isAdmin ? t.adminMode : t.adminPortal}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="text-slate-600 hover:text-slate-900"
            >
              {t.submitWebsite}
            </button>
            <span>•</span>
            <span className="text-slate-400">Vercel & GitHub Ready</span>
          </div>
        </div>
      </footer>

      {/* QR Code Modal */}
      <QRCodeModal
        project={selectedQRProject}
        isOpen={!!selectedQRProject}
        onClose={() => setSelectedQRProject(null)}
        lang={lang}
      />

      {/* Website Submission Modal */}
      <SubmitModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmit={handleSubmitNewProject}
        lang={lang}
        isAdmin={isAdmin}
      />

      {/* Admin Panel & Moderation Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isAdmin={isAdmin}
        setIsAdmin={handleSetIsAdmin}
        projects={projects}
        onApprove={handleApprove}
        onReject={handleReject}
        onDeleteRequest={(p) => setProjectToDelete(p)}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onSyncProjects={(syncedProjects) => setProjects(syncedProjects)}
        lang={lang}
      />

      {/* Google Sheets Apps Script Sync Modal */}
      <GoogleSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
        projects={projects}
        onSyncProjects={(syncedProjects) => setProjects(syncedProjects)}
      />

      {/* Delete Confirmation Modal (Admin safety requirement) */}
      <DeleteConfirmModal
        project={projectToDelete}
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        lang={lang}
      />
    </div>
  );
}
