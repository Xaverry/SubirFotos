import React from 'react';
import { User } from 'firebase/auth';
import { ExternalLink, QrCode, LogOut, FolderHeart, Sparkles } from 'lucide-react';
import { TARGET_FOLDER_URL, triggerZipDownload } from '../lib/drive';
import { GoogleSignInButton } from './GoogleSignInButton';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenQR: () => void;
  isLoggingIn: boolean;
  totalUploadedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
  onOpenQR,
  isLoggingIn,
  totalUploadedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                FotosBoda
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                <Sparkles className="w-3 h-3" /> Drive
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Sube tus fotos y videos al álbum compartido
            </p>
          </div>
        </div>

        {/* Actions & User State */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Download Source Code ZIP */}
          <button
            type="button"
            onClick={triggerZipDownload}
            title="Descargar código fuente en archivo ZIP"
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden lg:inline">Descargar ZIP</span>
          </button>

          {/* QR Code / Share trigger */}
          <button
            type="button"
            onClick={onOpenQR}
            title="Ver código QR para invitados"
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">Código QR</span>
          </button>

          {/* Direct Drive Folder Link */}
          <a
            href={TARGET_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir carpeta en Google Drive"
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer border border-blue-200/60"
          >
            <ExternalLink className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Ver Carpeta</span>
          </a>

          {/* User auth state */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-9 h-9 rounded-full ring-2 ring-rose-300 object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-sm ring-2 ring-rose-200">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[120px]">
                    {user.displayName || 'Invitado'}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[120px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pl-1">
              <GoogleSignInButton
                onClick={onLogin}
                loading={isLoggingIn}
                variant="outline"
                label="Entrar"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
