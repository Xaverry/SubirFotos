import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, Copy, Check, QrCode, Sparkles, ExternalLink } from 'lucide-react';
import { TARGET_FOLDER_URL } from '../lib/drive';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrType, setQrType] = useState<'app' | 'folder'>('app');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const appUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const currentUrl = qrType === 'app' ? appUrl : TARGET_FOLDER_URL;

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      currentUrl,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) console.error('Error generating QR code:', error);
      }
    );
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${qrType === 'app' ? 'Subir-Fotos' : 'Carpeta-Drive'}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Código QR para Invitados
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Colócalo en mesas o carteles para que cualquier persona escanee con su celular y suba sus fotos
        </p>

        {/* Toggle between App link and Folder link */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setQrType('app')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              qrType === 'app'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            App de Subida
          </button>
          <button
            type="button"
            onClick={() => setQrType('folder')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              qrType === 'folder'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Carpeta Drive Directa
          </button>
        </div>

        {/* QR Code Canvas Canvas Area */}
        <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-200/80 shadow-inner mb-4">
          <canvas ref={canvasRef} className="rounded-lg max-w-full" />
        </div>

        <p className="text-[11px] text-slate-400 mb-5 break-all line-clamp-1 px-4">
          {currentUrl}
        </p>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition border border-rose-200 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
