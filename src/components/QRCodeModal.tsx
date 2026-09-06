import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, QrCode, Smartphone, X } from 'lucide-react';
import { generateQrDataUrl } from '../utils/screenshot';
import { WebProject, Language } from '../types';
import { translations } from '../translations';

interface QRCodeModalProps {
  project: WebProject | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  project,
  isOpen,
  onClose,
  lang,
}) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    if (project?.url && isOpen) {
      generateQrDataUrl(project.url).then((url) => {
        setQrSrc(url);
      });
      setCopied(false);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(project.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
    }
  };

  const handleDownload = () => {
    if (!qrSrc) return;
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `QR-${project.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="qr-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{t.qrModalTitle}</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">{project.title}</p>
            </div>
          </div>
          <button
            id="qr-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
            {qrSrc ? (
              <img
                src={qrSrc}
                alt={`QR code for ${project.title}`}
                className="w-56 h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-lg animate-pulse text-xs text-slate-400">
                Đang tạo mã QR...
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full">
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.scanWithPhone}</span>
          </div>

          {/* URL box */}
          <div className="mt-3 w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-mono text-slate-700 break-all select-all flex items-center justify-between gap-2">
            <span className="truncate text-left text-[11px]">{project.url}</span>
            <button
              id="qr-copy-url-btn"
              onClick={handleCopy}
              className="shrink-0 p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
              title={t.copyUrl}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 w-full">
            <button
              id="qr-download-btn"
              onClick={handleDownload}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{t.downloadQR}</span>
            </button>

            <a
              id="qr-direct-visit-link"
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t.visitWebsite}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
