import React from 'react';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  variant?: 'primary' | 'outline' | 'large';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  loading = false,
  label = 'Iniciar sesión con Google',
  variant = 'large',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`group relative inline-flex items-center justify-center gap-3 font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed ${
        variant === 'large'
          ? 'px-6 py-3.5 text-base rounded-2xl bg-white text-slate-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]'
          : variant === 'primary'
          ? 'px-5 py-2.5 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]'
          : 'px-4 py-2 text-sm rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      ) : (
        <svg
          className="w-5 h-5 flex-shrink-0"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span className={variant === 'primary' ? 'text-white' : 'text-slate-800'}>
        {loading ? 'Conectando...' : label}
      </span>
    </button>
  );
};
