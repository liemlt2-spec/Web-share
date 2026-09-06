import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Globe2,
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Shield,
  Trash2,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react';
import { WebProject, Language } from '../types';
import { translations } from '../translations';
import { extractDomain, formatTimeAgo } from '../utils/screenshot';
import {
  getStoredScriptUrl,
  setStoredScriptUrl,
  getLastSyncTime,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  fetchProjectsFromSheet,
  pushProjectsToSheet,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../services/googleSync';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  projects: WebProject[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDeleteRequest: (project: WebProject) => void;
  onExportData: () => void;
  onImportData: (data: WebProject[]) => void;
  onResetData: () => void;
  onSyncProjects?: (newProjects: WebProject[]) => void;
  lang: Language;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  setIsAdmin,
  projects,
  onApprove,
  onReject,
  onDeleteRequest,
  onExportData,
  onImportData,
  onResetData,
  onSyncProjects,
  lang,
}) => {
  const t = translations[lang];

  // Login credentials
  const [adminId, setAdminId] = useState(() => {
    return localStorage.getItem('webhub_admin_id') || 'admin';
  });

  // Tabs
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'google_sync' | 'backup'>('pending');

  // Google Apps Script / Drive Sync State
  const [scriptUrl, setScriptUrl] = useState(() => getStoredScriptUrl());
  const [isUrlSaved, setIsUrlSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(() => getLastSyncTime());
  const [autoSync, setAutoSync] = useState<boolean>(() => isAutoSyncEnabled());
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScriptUrl(getStoredScriptUrl());
      setLastSync(getLastSyncTime());
      setAutoSync(isAutoSyncEnabled());
      setSyncStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Admin Login (chỉ cần ID Quản trị viên, không yêu cầu mật khẩu)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = adminId.trim();
    setIsAdmin(true);
    localStorage.setItem('webhub_admin_id', cleanId || 'admin');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    onClose();
  };

  // Save Google Apps Script URL
  const handleSaveScriptUrl = () => {
    const clean = scriptUrl.trim();
    setStoredScriptUrl(clean);
    setIsUrlSaved(true);
    setTimeout(() => setIsUrlSaved(false), 2500);

    if (clean) {
      setSyncStatusMsg({
        type: 'info',
        text: 'Đã lưu đường dẫn Google Apps Script vào hệ thống. Bạn có thể bấm "Kiểm tra kết nối" hoặc "Tải dữ liệu".',
      });
    } else {
      setSyncStatusMsg({
        type: 'info',
        text: 'Đã xóa cấu hình kết nối Google Apps Script.',
      });
    }
  };

  // Toggle Auto-Sync
  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setAutoSyncEnabled(enabled);
  };

  // Test Connection or Fetch Data from Google Sheets
  const handleFetchFromSheet = async () => {
    if (!scriptUrl.trim()) {
      setSyncStatusMsg({
        type: 'error',
        text: 'Vui lòng dán đường link Google Apps Script Web App URL trước khi thực hiện.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);

    const result = await fetchProjectsFromSheet(scriptUrl);
    setIsSyncing(false);

    if (result.success && result.data) {
      setLastSync(new Date().toISOString());
      setSyncStatusMsg({
        type: 'success',
        text: result.message,
      });

      if (onSyncProjects && result.data.length > 0) {
        onSyncProjects(result.data);
      } else if (onImportData && result.data.length > 0) {
        onImportData(result.data);
      }
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: result.message,
      });
    }
  };

  // Push all projects from Web to Google Sheets
  const handlePushToSheet = async () => {
    if (!scriptUrl.trim()) {
      setSyncStatusMsg({
        type: 'error',
        text: 'Vui lòng dán đường link Google Apps Script Web App URL trước khi đồng bộ.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);

    const result = await pushProjectsToSheet(scriptUrl, projects);
    setIsSyncing(false);

    if (result.success) {
      setLastSync(new Date().toISOString());
      setSyncStatusMsg({
        type: 'success',
        text: result.message,
      });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: result.message,
      });
    }
  };

  // Copy Google Apps Script Code
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportData(parsed);
          }
        } catch {
          alert('Tệp JSON không hợp lệ.');
        }
      };
      reader.readAsText(file);
    }
  };

  const pendingList = projects.filter((p) => p.status === 'pending');
  const approvedList = projects.filter((p) => p.status === 'approved');

  return (
    <div
      id="admin-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="admin-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-wide">{t.adminDashboardTitle}</h3>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    ID: {adminId || 'admin'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {isAdmin
                  ? 'Toàn quyền kiểm duyệt, phân loại và kết nối đồng bộ Google Sheets / Drive'
                  : 'Nhập ID Quản trị viên để truy cập bảng điều khiển'}
              </p>
            </div>
          </div>
          <button
            id="admin-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If NOT logged in: Show Admin ID Form */}
        {!isAdmin ? (
          <div className="p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-1">{t.loginAdmin}</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Nhập ID Quản trị viên để kiểm duyệt bài viết và cấu hình đồng bộ Google Cloud.
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-3.5 text-left">
              {/* ID Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.adminIdLabel}</span>
                </label>
                <input
                  id="admin-id-input"
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder={t.adminIdPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                id="admin-submit-login-btn"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 mt-2"
              >
                <Shield className="w-4 h-4" />
                <span>Mở Quyền Quản Trị Viên</span>
              </button>
            </form>
          </div>
        ) : (
          /* Logged In View */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border-b border-slate-200/80 flex-wrap gap-2">
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                {/* Tab 1: Pending */}
                <button
                  id="tab-pending-btn"
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    activeTab === 'pending'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t.pendingApprovals}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'pending'
                        ? 'bg-indigo-700 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pendingList.length}
                  </span>
                </button>

                {/* Tab 2: Approved */}
                <button
                  id="tab-approved-btn"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    activeTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã duyệt ({approvedList.length})</span>
                </button>

                {/* Tab 3: Google Sheets & Apps Script Sync (Requested) */}
                <button
                  id="tab-google-sync-btn"
                  onClick={() => setActiveTab('google_sync')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    activeTab === 'google_sync'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Đồng bộ Google Sheets</span>
                  {scriptUrl ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Đã cấu hình Google Cloud" />
                  ) : null}
                </button>

                {/* Tab 4: Backup & JSON */}
                <button
                  id="tab-backup-btn"
                  onClick={() => setActiveTab('backup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    activeTab === 'backup'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sao lưu JSON</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="admin-logout-btn"
                  onClick={handleLogout}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50"
                >
                  {t.exitAdmin}
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* TAB 1: PENDING QUEUE */}
              {activeTab === 'pending' && (
                <div>
                  {pendingList.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">Không có bài viết nào đang chờ duyệt</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tất cả đề xuất từ cộng đồng đã được xử lý xong!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-2">
                        Các bài viết dưới đây do người dùng đóng góp. Bạn hãy kiểm tra link và nhấn <strong>Duyệt</strong> để hiển thị công khai trên trang chủ hoặc <strong>Từ chối</strong>.
                      </p>
                      {pendingList.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-amber-50/40 border border-amber-200/70 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Chờ duyệt
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {formatTimeAgo(item.createdAt, lang)}
                              </span>
                              <span className="text-xs font-semibold text-indigo-700">
                                {t.countryNames[item.country] || item.country}
                              </span>
                              <span className="text-[11px] text-slate-600">
                                • {t.categoryNames[item.category]} • {t.educationLevelNames[item.educationLevel]}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                            <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>

                            <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1 flex-wrap gap-y-1">
                              <span className="font-mono text-indigo-600 truncate max-w-xs">{item.url}</span>
                              <span>Tác giả: <strong>{item.authorName}</strong></span>
                              {item.authorContact && <span>({item.authorContact})</span>}
                            </div>
                          </div>

                          {/* Approval Actions */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Mở link</span>
                            </a>

                            <button
                              onClick={() => onReject(item.id)}
                              className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                            >
                              {t.rejectBtn}
                            </button>

                            <button
                              onClick={() => onApprove(item.id)}
                              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t.approveBtn}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: APPROVED WEBSITES MANAGEMENT */}
              {activeTab === 'all' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500 mb-2">
                    Danh sách các website đã được duyệt đang công khai trên trang chủ. Bạn có thể xóa bất kỳ bài nào với chức năng xác nhận an toàn.
                  </p>
                  {approvedList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
                    >
                      <div className="overflow-hidden flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs truncate">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({extractDomain(item.url)})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {t.categoryNames[item.category]} • {t.countryNames[item.country]} • {t.educationLevelNames[item.educationLevel]} • Lượt xem: {item.views}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                          title="Mở website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onDeleteRequest(item)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                          title="Xác nhận xóa website"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: GOOGLE SHEETS & APPS SCRIPT CLOUD SYNC (The Core Requested Feature) */}
              {activeTab === 'google_sync' && (
                <div className="space-y-5">
                  {/* Top Intro Card */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900">
                          Đồng bộ hóa dữ liệu qua Google Sheets & Apps Script
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        Dữ liệu website (cả đã duyệt, chờ duyệt và mockup) sẽ được lưu trữ và kiểm soát tập trung trên file Google Sheets của bạn. Bạn có thể duyệt bài trực tiếp trên Google Sheets hoặc trên website này.
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      {scriptUrl ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1.5 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Đã liên kết Cloud</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                          Chưa có URL Apps Script
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Input Box for Google Apps Script Web App URL */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Dán đường link Google Apps Script (Web App URL) hoặc link Google Drive:
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={scriptUrl}
                            onChange={(e) => setScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pr-10"
                          />
                          {scriptUrl && (
                            <button
                              onClick={() => setScriptUrl('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                              title="Xóa link"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <button
                          onClick={handleSaveScriptUrl}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isUrlSaved ? 'Đã lưu!' : 'Lưu URL'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        URL này được tạo khi bạn chọn <strong>Triển khai (Deploy) -&gt; Ứng dụng web (Web App)</strong> trong Google Apps Script của bảng tính.
                      </p>
                    </div>

                    {/* Sync Actions Bar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        {/* Fetch from Sheet */}
                        <button
                          onClick={handleFetchFromSheet}
                          disabled={isSyncing}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Đang đồng bộ...' : 'Tải dữ liệu từ Google Sheets'}</span>
                        </button>

                        {/* Push to Sheet */}
                        <button
                          onClick={handlePushToSheet}
                          disabled={isSyncing}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Đẩy {projects.length} website lên Sheets</span>
                        </button>
                      </div>

                      {/* Auto Sync Toggle */}
                      <label className="flex items-center space-x-2 cursor-pointer select-none text-xs text-slate-700 font-medium self-end sm:self-center">
                        <input
                          type="checkbox"
                          checked={autoSync}
                          onChange={(e) => handleToggleAutoSync(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Tự động đồng bộ khi có bài mới</span>
                      </label>
                    </div>

                    {/* Status Alert Banner */}
                    {syncStatusMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                          syncStatusMsg.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : syncStatusMsg.type === 'error'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {syncStatusMsg.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : syncStatusMsg.type === 'error' ? (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        ) : (
                          <Zap className="w-4 h-4 shrink-0 text-indigo-600" />
                        )}
                        <span className="flex-1">{syncStatusMsg.text}</span>
                      </div>
                    )}

                    {lastSync && (
                      <div className="text-[11px] text-slate-400">
                        Lần đồng bộ gần nhất: <strong>{new Date(lastSync).toLocaleString('vi-VN')}</strong>
                      </div>
                    )}
                  </div>

                  {/* Step by Step Guide & One-Click Copy Apps Script Code */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-900">
                          Mã nguồn Google Apps Script (Code.gs) & Hướng dẫn cài đặt
                        </h4>
                      </div>

                      <button
                        onClick={handleCopyScript}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs ${
                          isCodeCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isCodeCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã sao chép mã!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép mã Google Apps Script</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 4-Step Instructions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">1</span>
                          <span>Tạo file Google Sheets</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Mở Google Drive của bạn, bấm <strong>Mới -&gt; Google Trang tính (Sheets)</strong> và đặt tên bất kỳ (VD: WebHub_Database).
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">2</span>
                          <span>Mở Apps Script & Dán mã</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Trong Google Sheet, chọn menu <strong>Tiện ích mở rộng (Extensions) -&gt; Apps Script</strong>. Dán toàn bộ đoạn mã sao chép ở đây vào rồi bấm <strong>Lưu (Ctrl + S)</strong>.
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">3</span>
                          <span>Triển khai dưới dạng Web App</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Góc trên bên phải, bấm <strong>Triển khai (Deploy) -&gt; Tùy chọn triển khai mới (New deployment)</strong>. Chọn biểu tượng bánh răng -&gt; <strong>Ứng dụng web (Web app)</strong>.
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">4</span>
                          <span>Chọn quyền "Bất kỳ ai" & Dán URL</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Tại mục <em>Người có quyền truy cập</em>, chọn <strong>Bất kỳ ai (Anyone)</strong>. Sau đó sao chép Web App URL dán vào ô nhập liệu ở trên!
                        </p>
                      </div>
                    </div>

                    {/* Preview of Code Box */}
                    <div className="relative">
                      <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                        {GOOGLE_APPS_SCRIPT_CODE}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BACKUP & EXPORT/IMPORT JSON */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                    <h4 className="text-xs font-bold text-indigo-900 mb-1">
                      {t.vercelDeployTip}
                    </h4>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Để lưu trữ dữ liệu ngoại tuyến hoặc đưa vào kho lưu trữ GitHub và triển khai Vercel, bạn có thể tải về tệp JSON sao lưu hoặc khôi phục dữ liệu bất cứ lúc nào.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={onExportData}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all text-left flex flex-col justify-between"
                    >
                      <Download className="w-5 h-5 text-indigo-600 mb-2" />
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{t.exportData}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Tải toàn bộ danh sách về máy (.json)</div>
                      </div>
                    </button>

                    <label className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all text-left flex flex-col justify-between cursor-pointer">
                      <Upload className="w-5 h-5 text-emerald-600 mb-2" />
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{t.importData}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Tải lên file JSON để khôi phục</div>
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={onResetData}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-amber-300 transition-all text-left flex flex-col justify-between"
                    >
                      <RotateCcw className="w-5 h-5 text-amber-600 mb-2" />
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{t.resetDefault}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Khôi phục danh mục mẫu ban đầu</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
