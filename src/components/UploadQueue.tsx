import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  X,
  FileCheck2,
} from 'lucide-react';
import { UploadItem } from '../types';
import { formatBytes } from '../lib/drive';

interface UploadQueueProps {
  items: UploadItem[];
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onClearCompleted: () => void;
}

export const UploadQueue: React.FC<UploadQueueProps> = ({
  items,
  onRetry,
  onCancel,
  onClearCompleted,
}) => {
  if (items.length === 0) return null;

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const uploadingCount = items.filter((i) => i.status === 'uploading').length;
  const queuedCount = items.filter((i) => i.status === 'queued').length;
  const errorCount = items.filter((i) => i.status === 'error').length;

  const totalBytes = items.reduce((acc, curr) => acc + curr.totalBytes, 0);
  const totalUploadedBytes = items.reduce((acc, curr) => acc + curr.bytesUploaded, 0);
  const overallPercentage = totalBytes > 0 ? Math.round((totalUploadedBytes / totalBytes) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-6">
      {/* Header and overall progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Estado de Subida ({completedCount}/{items.length})
            </h3>
            {uploadingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatBytes(totalUploadedBytes)} de {formatBytes(totalBytes)} transferidos
          </p>
        </div>

        {completedCount > 0 && uploadingCount === 0 && queuedCount === 0 && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="self-start sm:self-auto text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            Limpiar lista
          </button>
        )}
      </div>

      {/* Overall Progress Bar */}
      {(uploadingCount > 0 || queuedCount > 0) && (
        <div className="mb-5">
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
            <span>{overallPercentage}% completado en total</span>
            <span>{uploadingCount} activos • {queuedCount} en cola</span>
          </div>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-2xl border transition ${
              item.status === 'completed'
                ? 'bg-emerald-50/40 border-emerald-200/60'
                : item.status === 'error'
                ? 'bg-rose-50/50 border-rose-200'
                : item.status === 'uploading'
                ? 'bg-blue-50/30 border-blue-200/80'
                : 'bg-slate-50/60 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : item.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : item.status === 'uploading' ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      ·
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{formatBytes(item.file.size)}</span>
                    {item.uploadSpeed && item.uploadSpeed > 0 && item.status === 'uploading' && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">
                          {formatBytes(item.uploadSpeed)}/s
                        </span>
                      </>
                    )}
                    {item.errorMessage && (
                      <span className="text-rose-600 font-medium truncate max-w-xs">
                        • {item.errorMessage}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & Links */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.status === 'completed' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    ¡Listo!
                  </span>
                )}

                {item.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => onRetry(item.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reintentar</span>
                  </button>
                )}

                {item.status === 'uploading' && (
                  <button
                    type="button"
                    onClick={() => onCancel(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Cancelar subida"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Individual progress bar */}
            {item.status === 'uploading' && (
              <div className="mt-2.5">
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-150"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>{formatBytes(item.bytesUploaded)} de {formatBytes(item.totalBytes)}</span>
                  <span className="font-semibold text-blue-600">{item.progress}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
