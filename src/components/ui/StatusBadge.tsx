'use client';

/**
 * Sentez UI/UX Katmanı
 * Mikro Bildirim Rozetleri & Erişilebilir Bilgi Modalı (WCAG 2.1 AA Uyumlu)
 *
 * Yeşil (Onaylı/Tik), Sarı (Uyarı/Üçgen), Kırmızı (Risk/Kalkan) kalkan göstergeleri.
 */

import React, { useState } from 'react';
import { SecurityStatusLevel } from '@/types';

export interface StatusBadgeProps {
  status: SecurityStatusLevel;
  meritScore: number;
  botScore: number;
  isClickbait?: boolean;
  isManipulatedMedia?: boolean;
  inferenceTimeMs?: number;
  contentSnippet?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  meritScore,
  botScore,
  isClickbait = false,
  isManipulatedMedia = false,
  inferenceTimeMs = 35,
  contentSnippet = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Status configuration complying with WCAG 2.1 AA contrast ratio (> 4.5:1)
  const statusConfig = {
    verified: {
      bgColor: 'bg-emerald-950/80 hover:bg-emerald-900/90',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/50',
      icon: (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Doğrulanmış İçerik',
    },
    warning: {
      bgColor: 'bg-amber-950/80 hover:bg-amber-900/90',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/50',
      icon: (
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      label: 'Şüpheli Nitelik',
    },
    risk: {
      bgColor: 'bg-rose-950/80 hover:bg-rose-900/90',
      textColor: 'text-rose-300',
      borderColor: 'border-rose-500/50',
      icon: (
        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'Yüksek Risk / Bot',
    },
  };

  const config = statusConfig[status];

  return (
    <>
      {/* Accessible Micro Notification Badge */}
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label={`Sentez Güvenlik Analizi: ${config.label}, Liyakat Skoru: ${meritScore}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bgColor} ${config.borderColor} ${config.textColor} text-xs font-medium transition-all duration-200 shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950`}
      >
        {config.icon}
        <span>{config.label}</span>
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 text-[10px] font-mono border border-slate-700">
          %{meritScore}
        </span>
      </button>

      {/* Detailed Modal Window */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
                  {config.icon}
                </div>
                <div>
                  <h3 id="modal-title" className="text-base font-semibold tracking-wide">
                    Sentez Uç YZ Analiz Raporu
                  </h3>
                  <p className="text-xs text-slate-400">
                    %100 İstemci Tarafı Güvenlik Motoru ($0 API Maliyeti)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Kapat"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Content Snippet */}
            {contentSnippet && (
              <div className="mb-4 p-3 bg-slate-950/60 rounded-lg text-xs italic text-slate-300 border border-slate-800/80">
                &ldquo;{contentSnippet}&rdquo;
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="block text-[11px] text-slate-400 font-medium">Liyakat Skoru</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">%{meritScore}</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="block text-[11px] text-slate-400 font-medium">Botnet İhtimali</span>
                <span className={`text-2xl font-bold font-mono ${botScore > 0.6 ? 'text-rose-400' : 'text-slate-200'}`}>
                  %{(botScore * 100).toFixed(0)}
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="space-y-2 mb-4 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400">Tık Tuzağı (Clickbait)</span>
                <span className={isClickbait ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                  {isClickbait ? 'Tespit Edildi' : 'Temiz'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400">Medya Tahrifatı (pHash)</span>
                <span className={isManipulatedMedia ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                  {isManipulatedMedia ? 'Manipüle Edilmiş' : 'Özgün Medya'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400">Çıkarım Süresi (WASM/WebGPU)</span>
                <span className="font-mono text-cyan-400">{inferenceTimeMs} ms</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>KVKK / GDPR Uyumlu Yerli Motor</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
