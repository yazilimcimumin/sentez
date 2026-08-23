'use client';
import React, { useState } from 'react';

interface MetricsPanelProps { onClose: () => void; }

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
    <div className="w-full max-w-lg bg-[#0f1117] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-white">⚡ Edge/WASM Performans Metrikleri</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'API Maliyeti', val: '$0 / Sorgu', color: 'text-emerald-400', sub: 'Sıfır sunucu harcaması' },
          { label: 'INT8 ONNX Çıkarım', val: '30–50 ms', color: 'text-cyan-400', sub: 'WASM / WebGPU' },
          { label: 'Model Boyutu', val: '28 MB', color: 'text-purple-400', sub: '440 MB → INT8 sıkıştırma' },
          { label: 'pHash Analiz', val: '< 5 ms', color: 'text-amber-400', sub: 'Canvas API dHash + Hamming' },
          { label: 'Bot Tespit', val: 'Anlık', color: 'text-rose-400', sub: '4-vektör füzyon skoru' },
          { label: 'KVKK/GDPR', val: '%100 Uyumlu', color: 'text-emerald-400', sub: 'Veri cihaz dışına çıkmaz' },
        ].map(m => (
          <div key={m.label} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-400 mb-1">{m.label}</p>
            <p className={`text-xl font-bold font-mono ${m.color}`}>{m.val}</p>
            <p className="text-[10px] text-slate-500 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
      <div className="p-4 bg-slate-900 border border-emerald-800/40 rounded-xl">
        <p className="text-[11px] font-bold text-emerald-400 mb-2">Neden Edge Computing?</p>
        <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
          <li>Merkezi GPU sunucu maliyeti: <strong>$0</strong> (rakipler: $5–50k/ay)</li>
          <li>Kullanıcı artışında ölçekleme maliyeti: <strong>$0</strong></li>
          <li>Veri ihlali riski: <strong>Sıfır</strong> (hesaplama cihazda kalır)</li>
          <li>Tepki süresi: <strong>35ms</strong> vs bulut ~200-500ms</li>
        </ul>
      </div>
      <button onClick={onClose} className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm">
        Kapat
      </button>
    </div>
  </div>
);

interface LeftMenuProps { onMetrics: () => void; }

export const LeftMenu: React.FC<LeftMenuProps> = ({ onMetrics }) => {
  const items = [
    { icon: '🏠', label: 'Ana Sayfa', active: true },
    { icon: '🔔', label: 'Bildirimler' },
    { icon: '💬', label: 'Mesajlar' },
    { icon: '🔍', label: 'Keşfet' },
    { icon: '👥', label: 'Topluluklar' },
    { icon: '🔖', label: 'Kaydedilenler' },
    { icon: '❤️', label: 'Beğeniler' },
    { icon: '⚙️', label: 'Ayarlar' },
  ];
  return (
    <aside className="h-full flex flex-col gap-2 py-4 px-2">
      <div className="flex items-center gap-2 px-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-lg">S</div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Sentez</p>
          <p className="text-[10px] text-slate-400">Edge Social AI</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {items.map(it => (
          <button key={it.label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              it.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            <span>{it.icon}</span><span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-2 space-y-2 pb-2">
        <button onClick={onMetrics}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
          ⚡ $0 Edge Metrikleri
        </button>
        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-400 text-center">
          TEKNOFEST 2026 · Sosyal İnovasyon<br/>
          <span className="text-emerald-400 font-mono font-bold">%100 Client-Side</span>
        </div>
      </div>
    </aside>
  );
};
