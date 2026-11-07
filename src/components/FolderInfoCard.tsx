import React, { useState } from 'react';
import { FolderCheck, ExternalLink, Copy, Check, ShieldCheck } from 'lucide-react';
import { TARGET_FOLDER_ID, TARGET_FOLDER_URL } from '../lib/drive';

export const FolderInfoCard: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(TARGET_FOLDER_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/60 via-rose-50/50 to-pink-50/60 border border-rose-200/70 rounded-2xl p-4 sm:p-5 shadow-xs transition hover:shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-white text-rose-600 rounded-xl shadow-xs border border-rose-100 flex-shrink-0">
            <FolderCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm sm:text-base">
                Carpeta de Destino en Google Drive
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Pública con acceso de edición
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ID: <span className="font-mono text-slate-600 select-all">{TARGET_FOLDER_ID}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>

          <a
            href={TARGET_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir en Drive</span>
          </a>
        </div>
      </div>
    </div>
  );
};
