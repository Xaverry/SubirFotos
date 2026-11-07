import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import {
  FolderHeart,
  Heart,
  Camera,
  ShieldCheck,
  QrCode,
  Users,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
} from './lib/auth';
import {
  uploadFileViaAppsScript,
  uploadFileToDrive,
  TARGET_FOLDER_ID,
  TARGET_FOLDER_URL,
  triggerZipDownload,
} from './lib/drive';
import { UploadItem, UploadedFileRecord } from './types';
import { Navbar } from './components/Navbar';
import { FolderInfoCard } from './components/FolderInfoCard';
import { UploadZone } from './components/UploadZone';
import { UploadQueue } from './components/UploadQueue';
import { UploadedHistory } from './components/UploadedHistory';
import { QRCodeModal } from './components/QRCodeModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Upload state
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [uploadedHistory, setUploadedHistory] = useState<UploadedFileRecord[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Initialize optional Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(
        err?.message ||
          'No se pudo conectar con tu cuenta de Google. (Recuerda que no es necesario iniciar sesión para subir fotos).'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'],
      });
    } catch {
      // ignore
    }
  };

  // When files are selected from UploadZone
  const handleFilesSelected = (files: File[], dedication?: string) => {
    const newItems: UploadItem[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: 'queued',
      progress: 0,
      bytesUploaded: 0,
      totalBytes: file.size,
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);

    // Process each queued file
    newItems.forEach((item) => {
      processUpload(item, dedication);
    });
  };

  const processUpload = async (item: UploadItem, dedication?: string) => {
    setUploadQueue((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i))
    );

    const controller = new AbortController();
    abortControllersRef.current.set(item.id, controller);

    try {
      // If user is logged in with token, we can use direct API or the Apps Script webhook.
      // The Apps Script webhook guarantees ZERO PERMISSION PROMPTS for everyone!
      let result;
      if (token) {
        try {
          result = await uploadFileToDrive(
            item.file,
            token,
            (bytesUploaded, totalBytes, speed) => {
              const progress = totalBytes > 0 ? Math.round((bytesUploaded / totalBytes) * 100) : 0;
              setUploadQueue((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, progress, bytesUploaded, uploadSpeed: speed } : i
                )
              );
            },
            {
              description: dedication,
              signal: controller.signal,
            }
          );
        } catch (oauthErr) {
          console.warn('OAuth upload error, falling back to Apps Script webhook:', oauthErr);
          result = await uploadFileViaAppsScript(
            item.file,
            dedication,
            (bytesUploaded, totalBytes, speed) => {
              const progress = totalBytes > 0 ? Math.round((bytesUploaded / totalBytes) * 100) : 0;
              setUploadQueue((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, progress, bytesUploaded, uploadSpeed: speed } : i
                )
              );
            },
            { signal: controller.signal }
          );
        }
      } else {
        // Direct zero-permission upload via Google Apps Script
        result = await uploadFileViaAppsScript(
          item.file,
          dedication,
          (bytesUploaded, totalBytes, speed) => {
            const progress = totalBytes > 0 ? Math.round((bytesUploaded / totalBytes) * 100) : 0;
            setUploadQueue((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, progress, bytesUploaded, uploadSpeed: speed } : i
              )
            );
          },
          { signal: controller.signal }
        );
      }

      // Mark completed
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                driveFileId: result.id,
                driveViewLink: result.webViewLink,
              }
            : i
        )
      );

      // Add to session history
      setUploadedHistory((prev) => [
        {
          id: item.id,
          name: item.file.name,
          size: item.file.size,
          type: item.file.type,
          driveFileId: result.id,
          webViewLink: result.webViewLink,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          uploaderName: dedication || user?.displayName || undefined,
        },
        ...prev,
      ]);

      triggerConfetti();
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setUploadQueue((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        console.error('Upload failed:', err);
        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  errorMessage: err?.message || 'Error al subir a Google Drive',
                }
              : i
          )
        );
      }
    } finally {
      abortControllersRef.current.delete(item.id);
    }
  };

  const handleRetry = (id: string) => {
    const item = uploadQueue.find((i) => i.id === id);
    if (!item) return;
    processUpload(item);
  };

  const handleCancel = (id: string) => {
    const controller = abortControllersRef.current.get(id);
    if (controller) {
      controller.abort();
    }
    setUploadQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCompleted = () => {
    setUploadQueue((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-rose-200">
      {/* Navbar */}
      <Navbar
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenQR={() => setIsQRModalOpen(true)}
        isLoggingIn={isLoggingIn}
        totalUploadedCount={uploadedHistory.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Auth Error Banner if any */}
        {authError && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between gap-3">
            <span>{authError}</span>
            <button
              onClick={() => setAuthError(null)}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto pt-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/70 text-rose-700 text-xs font-semibold mb-4 border border-rose-200/60">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
            <span>Álbum Colaborativo • Recuerdos & Fotos</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Comparte tus mejores momentos con nosotros
          </h2>

          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Sube las fotos y videos capturados desde tu teléfono directamente a nuestra carpeta compartida de Google Drive.
          </p>

          {/* Zero permission badge */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/80 shadow-2xs">
              <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              <span>Sin contraseñas ni permisos • Subida directa e instantánea</span>
            </span>
          </div>
        </div>

        {/* Target Folder Information Card */}
        <FolderInfoCard />

        {/* Upload Queue (Shows when uploads are running or completed) */}
        <UploadQueue
          items={uploadQueue}
          onRetry={handleRetry}
          onCancel={handleCancel}
          onClearCompleted={handleClearCompleted}
        />

        {/* Upload Zone (Drag & Drop, Camera, File Selector) */}
        <UploadZone onFilesSelected={handleFilesSelected} />

        {/* Uploaded History for current session */}
        <UploadedHistory files={uploadedHistory} />

        {/* Helpful Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Desde cualquier celular</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Toma fotos en el momento o sube desde tu galería en resolución original sin necesidad de instalar nada.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">100% Sin Permisos Molestos</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tus invitados no necesitan autorizar su cuenta de Google. Seleccionan sus fotos y se suben directamente.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Guardado en tu Google Drive</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Todos los archivos llegan de forma segura a tu carpeta compartida en tiempo real.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white/70 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-4 h-4 text-rose-500" />
            <span className="font-semibold text-slate-700">FotosBoda • Subida a Google Drive</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              type="button"
              onClick={triggerZipDownload}
              className="hover:text-rose-600 font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <span>Descargar código (.ZIP)</span>
            </button>
            <span>•</span>
            <a
              href={TARGET_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition flex items-center gap-1"
            >
              <span>Ver carpeta en Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* QR Code Modal for Event Guests */}
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
    </div>
  );
}
