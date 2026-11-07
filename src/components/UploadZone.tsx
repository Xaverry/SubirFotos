import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Film,
  FileText,
  X,
  Plus,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatBytes } from '../lib/drive';

interface SelectedFileItem {
  id: string;
  file: File;
  previewUrl?: string;
}

interface UploadZoneProps {
  onFilesSelected: (files: File[], dedication?: string) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedFileItem[]>([]);
  const [dedication, setDedication] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFileList = (files: FileList | File[]) => {
    const newItems: SelectedFileItem[] = [];
    Array.from(files).forEach((file) => {
      let previewUrl: string | undefined = undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
      });
    });

    setSelectedItems((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
      e.target.value = '';
    }
  };

  const removeSelectedItem = (id: string) => {
    setSelectedItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAllSelected = () => {
    selectedItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedItems([]);
  };

  const handleSubmitUpload = () => {
    if (selectedItems.length === 0) return;
    const filesToUpload = selectedItems.map((item) => item.file);
    onFilesSelected(filesToUpload, dedication.trim() || undefined);
    clearAllSelected();
    setDedication('');
  };

  const totalBytesSelected = selectedItems.reduce((acc, curr) => acc + curr.file.size, 0);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (selectedItems.length === 0) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-rose-500 bg-rose-50/70 scale-[1.01]'
            : selectedItems.length > 0
            ? 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 cursor-default'
            : 'border-slate-300 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/30'
        }`}
      >
        {selectedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 mb-4 transform group-hover:scale-105 transition">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3 border border-emerald-200/60">
              <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              <span>Subida directa sin iniciar sesión</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Arrastra tus fotos y videos aquí
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 mb-6">
              Sube tus recuerdos al instante sin tener que dar permisos a ninguna cuenta
            </p>

            {/* Quick Action Buttons */}
            <div
              className="flex flex-wrap items-center justify-center gap-3 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm cursor-pointer active:scale-95"
              >
                <ImageIcon className="w-4 h-4 text-rose-300" />
                <span>Elegir fotos / archivos</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition border border-rose-200 cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Tomar Foto / Video</span>
              </button>
            </div>
          </div>
        ) : (
          /* Preview Grid when files are selected */
          <div onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="text-left">
                <span className="font-bold text-slate-800 text-base">
                  {selectedItems.length} {selectedItems.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  ({formatBytes(totalBytesSelected)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>Añadir más</span>
                </button>
                <button
                  type="button"
                  onClick={clearAllSelected}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg cursor-pointer transition"
                >
                  Limpiar lista
                </button>
              </div>
            </div>

            {/* Thumbnail cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto p-1 text-left">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-xl border border-slate-200 p-2 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                >
                  <button
                    type="button"
                    onClick={() => removeSelectedItem(item.id)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-sm cursor-pointer z-10 transition transform group-hover:scale-110"
                    title="Quitar archivo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {item.previewUrl ? (
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 mb-2">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-lg bg-slate-100 flex flex-col items-center justify-center text-slate-400 mb-2">
                      {item.file.type.startsWith('video/') ? (
                        <Film className="w-8 h-8 text-indigo-400" />
                      ) : (
                        <FileText className="w-8 h-8 text-slate-400" />
                      )}
                      <span className="text-[10px] uppercase font-semibold mt-1">
                        {item.file.name.split('.').pop()}
                      </span>
                    </div>
                  )}

                  <div className="text-left">
                    <p className="text-xs font-medium text-slate-800 truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(item.file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dedication / Note / Name Input */}
            <div className="mt-5 pt-4 border-t border-slate-200 text-left">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tu nombre o dedicatoria para los novios (opcional):
              </label>
              <input
                type="text"
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                placeholder="Ejemplo: Familia Ramírez - ¡Felicidades y que viva el amor!"
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Upload Button */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSubmitUpload}
                disabled={disabled}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-base font-bold rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 transition shadow-md shadow-rose-200 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  Subir {selectedItems.length} {selectedItems.length === 1 ? 'foto a Drive' : 'fotos a Drive'}
                </span>
                <Sparkles className="w-4 h-4 text-rose-200" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
