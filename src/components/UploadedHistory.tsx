import React from 'react';
import { ExternalLink, CheckCircle2, Film, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { UploadedFileRecord } from '../types';
import { formatBytes, TARGET_FOLDER_URL } from '../lib/drive';

interface UploadedHistoryProps {
  files: UploadedFileRecord[];
}

export const UploadedHistory: React.FC<UploadedHistoryProps> = ({ files }) => {
  if (files.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Archivos Subidos en esta Sesión ({files.length})
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> En Drive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Disponibles inmediatamente en la carpeta compartida de Google Drive
          </p>
        </div>

        <a
          href={TARGET_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
        >
          <span>Abrir Carpeta</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-rose-50/40 border border-slate-200/80 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500 shadow-2xs">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-5 h-5 text-rose-500" />
                ) : file.type.startsWith('video/') ? (
                  <Film className="w-5 h-5 text-indigo-500" />
                ) : (
                  <FileText className="w-5 h-5 text-slate-500" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatBytes(file.size)} • {file.uploadedAt}
                </p>
              </div>
            </div>

            <a
              href={file.webViewLink || TARGET_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex-shrink-0"
              title="Ver en Google Drive"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
