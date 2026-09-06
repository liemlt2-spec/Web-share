import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Play,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import { WebProject } from '../types';
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

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: WebProject[];
  onSyncProjects: (newProjects: WebProject[]) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSyncProjects,
}) => {
  const [scriptUrl, setScriptUrl] = useState(() => getStoredScriptUrl());
  const [isUrlSaved, setIsUrlSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(() => getLastSyncTime());
  const [autoSync, setAutoSync] = useState<boolean>(() => isAutoSyncEnabled());
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'code'>('config');

  useEffect(() => {
    if (isOpen) {
      setScriptUrl(getStoredScriptUrl());
      setLastSync(getLastSyncTime());
      setAutoSync(isAutoSyncEnabled());
      setSyncStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Save Script URL
  const handleSaveUrl = () => {
    const clean = scriptUrl.trim();
    setStoredScriptUrl(clean);
    setIsUrlSaved(true);
    setTimeout(() => setIsUrlSaved(false), 2500);

    if (clean) {
      setSyncStatusMsg({
        type: 'info',
        text: 'Đã lưu đường dẫn Google Apps Script. Bấm "Tải dữ liệu từ Sheets" để kiểm tra kết nối!',
      });
    } else {
      setSyncStatusMsg({
        type: 'info',
        text: 'Đã xóa cấu hình kết nối Google Apps Script.',
      });
    }
  };

  // 2. Fetch Projects From Sheet
  const handleFetch = async () => {
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

      if (result.data.length > 0) {
        onSyncProjects(result.data);
      }
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: result.message,
      });
    }
  };

  // 3. Push Current Projects to Sheet
  const handlePush = async () => {
    if (!scriptUrl.trim()) {
      setSyncStatusMsg({
        type: 'error',
        text: 'Vui lòng dán và lưu đường dẫn Google Apps Script trước khi tải lên.',
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

  // 4. Toggle Auto Sync
  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setAutoSyncEnabled(enabled);
  };

  // 5. Copy Apps Script Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  const famousCount = projects.filter((p) => p.isFamous).length;
  const userCount = projects.filter((p) => !p.isFamous).length;

  return (
    <div
      id="google-sync-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="google-sync-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide flex items-center space-x-2">
                <span>Quản Lý & Đồng Bộ Google Sheets</span>
                {scriptUrl ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-mono border border-emerald-400/40">
                    Đã cấu hình
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-mono border border-amber-400/40">
                    Chưa kết nối
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-emerald-100/80">
                Kiểm soát cả bài đăng tải và các trang mô phỏng nổi tiếng qua bảng tính Google Sheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Kết nối & Đồng bộ</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hướng dẫn cài đặt</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Mã nguồn Apps Script (Code.gs)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: CONFIG & SYNC */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Data Overview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-indigo-700 text-xs font-bold mb-0.5">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Bài đăng tải</span>
                  </div>
                  <div className="text-xl font-extrabold text-indigo-900">{userCount}</div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">Cột IsFamous = FALSE</div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-amber-800 text-xs font-bold mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Trang nổi tiếng</span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-900">{famousCount}</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">Cột IsFamous = TRUE</div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-slate-700">Trạng thái đồng bộ</div>
                  <div className="text-xs text-slate-500 truncate">
                    {lastSync ? new Date(lastSync).toLocaleTimeString('vi-VN') : 'Chưa đồng bộ'}
                  </div>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-slate-600 font-medium mt-1">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Tự động nạp dữ liệu ngầm</span>
                  </label>
                </div>
              </div>

              {/* URL Input Box */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Dán đường link Google Apps Script (Web App URL) vào đây:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="google-script-url-input"
                      type="text"
                      value={scriptUrl}
                      onChange={(e) => setScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    />
                    {scriptUrl && (
                      <button
                        onClick={() => setScriptUrl('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    id="save-script-url-btn"
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUrlSaved ? 'Đã lưu!' : 'Lưu URL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Bạn có thể dán <strong>Web App URL</strong> (đuôi <strong>/exec</strong> là bản chính thức cho mọi người dùng) hoặc dán thẳng <strong>link Google Sheets</strong> — hệ thống sẽ tự động nhận diện và kết nối. Lưu ý: URL đuôi <strong>/dev</strong> chỉ hoạt động khi bạn đang đăng nhập Google để test.
                </p>
              </div>

              {/* Two-Way Actions */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <div className="text-xs font-bold text-slate-900">Thao tác truy xuất & đẩy dữ liệu:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Pull Data */}
                  <button
                    id="pull-from-sheets-btn"
                    onClick={handleFetch}
                    disabled={isSyncing}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Đang truy xuất...' : 'Tải dữ liệu từ Google Sheets'}</span>
                  </button>

                  {/* Push Data */}
                  <button
                    id="push-to-sheets-btn"
                    onClick={handlePush}
                    disabled={isSyncing}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Đẩy {projects.length} mô phỏng lên Sheets</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>Mẹo:</strong> Nếu bạn vừa tạo file Google Sheets mới toanh, hãy bấm nút <strong>"Đẩy {projects.length} mô phỏng lên Sheets"</strong> để hệ thống tự động tạo các cột tiêu đề và nạp đầy đủ danh mục mô phỏng mẫu ban đầu!
                </p>
              </div>

              {/* Status Banner */}
              {syncStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2.5 ${
                    syncStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : syncStatusMsg.type === 'error'
                      ? 'bg-rose-50 text-rose-900 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                  }`}
                >
                  {syncStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : syncStatusMsg.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  ) : (
                    <Zap className="w-4 h-4 shrink-0 text-indigo-600" />
                  )}
                  <span className="flex-1 font-medium">{syncStatusMsg.text}</span>
                </div>
              )}

              {/* Column Control Table Guide */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-slate-900">Cách kiểm soát 2 nhóm dữ liệu trực tiếp trong Sheets:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="font-bold text-indigo-700 flex items-center space-x-1">
                      <span>📤</span>
                      <span>1. Bài đăng tải (Cộng đồng / Thầy cô):</span>
                    </div>
                    <p className="text-slate-600">
                      Cột <strong>IsFamous</strong> điền <code>FALSE</code> (hoặc để trống).
                    </p>
                    <p className="text-slate-500">Hiển thị ở tab [Bài đăng tải] trên trang chủ.</p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="font-bold text-amber-800 flex items-center space-x-1">
                      <span>⭐</span>
                      <span>2. Trang mô phỏng nổi tiếng (PhET, GeoGebra...):</span>
                    </div>
                    <p className="text-slate-600">
                      Cột <strong>IsFamous</strong> điền <code>TRUE</code>.
                    </p>
                    <p className="text-slate-500">Hiển thị khi người dùng bấm tab [Nổi tiếng].</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <h4 className="font-bold text-emerald-950">Quy trình 5 bước cài đặt Google Apps Script</h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Chỉ mất 2 phút cài đặt một lần duy nhất, bạn sẽ có một hệ thống cơ sở dữ liệu đám mây miễn phí, kiểm soát hoàn toàn trên Google Sheets cá nhân.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Tạo một bảng tính Google Sheets</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    Mở Google Drive của bạn -&gt; Bấm nút <strong>Mới (+) -&gt; Google Trang tính (Google Sheets)</strong>. Bạn có thể đặt tên bất kỳ (Ví dụ: <em>WebHub_Database</em>).
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Mở Apps Script</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    Trên thanh menu của Google Sheets, chọn <strong>Tiện ích mở rộng (Extensions) -&gt; Apps Script</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Dán đoạn mã Code.gs</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    Chuyển sang tab <strong>"Mã nguồn Apps Script"</strong> ở trên, bấm <strong>"Sao chép mã"</strong>. Trong trình soạn thảo Apps Script, xóa hết nội dung cũ rồi dán toàn bộ đoạn mã này vào. Nhấn <strong>Lưu (Ctrl + S)</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Triển khai dưới dạng Ứng dụng web (Web App)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-7 space-y-1">
                    <p>Ở góc trên bên phải, bấm nút <strong>Triển khai (Deploy) -&gt; Tùy chọn triển khai mới (New deployment)</strong>.</p>
                    <p>Bấm vào biểu tượng bánh răng bên trái -&gt; Chọn <strong>Ứng dụng web (Web app)</strong>.</p>
                    <p>• Mô tả: <em>WebHub API</em></p>
                    <p>• Thực thi dưới dạng (Execute as): <strong>Tôi (Me)</strong></p>
                    <p>• Người có quyền truy cập (Who has access): <strong className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">Bất kỳ ai (Anyone)</strong> (Bắt buộc để website có thể đọc được dữ liệu mà không bị chặn).</p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">5</span>
                    <span>Sao chép Web App URL và dán vào WebHub</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    Sau khi cấp quyền, Google sẽ cấp cho bạn một đường link <strong>Web App URL</strong> có đuôi <code>/exec</code>. Hãy copy link đó dán vào ô nhập liệu ở Tab <strong>"Kết nối & Đồng bộ"</strong> và bấm <strong>Lưu</strong>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPS SCRIPT CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900">
                  Mã nguồn Code.gs (Đã tối ưu phân loại IsFamous & CORS):
                </div>
                <button
                  id="copy-script-code-btn"
                  onClick={handleCopyCode}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
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
                      <span>Sao chép mã Code.gs</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
