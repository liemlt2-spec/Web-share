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
import { Language, WebProject } from '../types';
import { translations } from '../translations';
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
import { getLocaleCode } from '../utils/screenshot';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: WebProject[];
  onSyncProjects: (newProjects: WebProject[]) => void;
  lang: Language;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSyncProjects,
  lang,
}) => {
  const t = translations[lang];
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
        text: t.gsSavedUrlMsg,
      });
    } else {
      setSyncStatusMsg({
        type: 'info',
        text: t.gsClearedMsg,
      });
    }
  };

  // 2. Fetch Projects From Sheet
  const handleFetch = async () => {
    if (!scriptUrl.trim()) {
      setSyncStatusMsg({
        type: 'error',
        text: t.gsNeedUrlFirst,
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
        text: t.gsPushNeedUrl,
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
                <span>{t.gsTitle}</span>
                {scriptUrl ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-mono border border-emerald-400/40">
                    {t.gsConfigured}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-mono border border-amber-400/40">
                    {t.gsNotConnected}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-emerald-100/80">
                {t.gsHeaderDesc}
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
            <span>{t.gsTabConnect}</span>
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
            <span>{t.gsTabGuide}</span>
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
            <span>{t.gsTabCode}</span>
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
                    <span>{t.gsUploadPosts}</span>
                  </div>
                  <div className="text-xl font-extrabold text-indigo-900">{userCount}</div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">{t.gsColFalse}</div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-amber-800 text-xs font-bold mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.gsFamousPages}</span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-900">{famousCount}</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">{t.gsColTrue}</div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-slate-700">{t.gsSyncStatus}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {lastSync ? new Date(lastSync).toLocaleString(getLocaleCode(lang)) : t.gsNotSynced}
                  </div>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-slate-600 font-medium mt-1">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>{t.gsAutoLoad}</span>
                  </label>
                </div>
              </div>

              {/* URL Input Box */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  {t.gsUrlLabel}
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
                    <span>{isUrlSaved ? t.gsSaved : t.gsSaveUrl}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {t.gsUrlNote}
                </p>
              </div>

              {/* Two-Way Actions */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <div className="text-xs font-bold text-slate-900">{t.gsActionsTitle}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Pull Data */}
                  <button
                    id="pull-from-sheets-btn"
                    onClick={handleFetch}
                    disabled={isSyncing}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? t.gsFetching : t.gsFetch}</span>
                  </button>

                  {/* Push Data */}
                  <button
                    id="push-to-sheets-btn"
                    onClick={handlePush}
                    disabled={isSyncing}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>{t.gsPushCount.replace('{count}', String(projects.length))}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.gsPushTip.replace('{count}', String(projects.length))}
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
                <div className="font-bold text-slate-900">{t.gsControlGuide}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="font-bold text-indigo-700 flex items-center space-x-1">
                      <span>📤</span>
                      <span>{t.gsG1Title}</span>
                    </div>
                    <p className="text-slate-600">{t.gsG1Desc}</p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="font-bold text-amber-800 flex items-center space-x-1">
                      <span>⭐</span>
                      <span>{t.gsG2Title}</span>
                    </div>
                    <p className="text-slate-600">{t.gsG2Desc}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <h4 className="font-bold text-emerald-950">{t.gsGuideTitle}</h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {t.gsGuideIntro}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>{t.gsStep1}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    {t.gsStep1Desc}
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>{t.gsStep2}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    {t.gsStep2Desc}
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>{t.gsStep3}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    {t.gsStep3Desc}
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>{t.gsStep4}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-7 space-y-1">
                    <p>{t.gsStep4Desc}</p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">5</span>
                    <span>{t.gsStep5}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    {t.gsStep5Desc}
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
                  {t.gsCodeTitle}
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
                      <span>{t.gsCodeCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.gsCopyCode}</span>
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
