'use client';
import React, { useState } from 'react';
import { CommunityDetectionResult, BotAnalysisResult } from '@/types';

interface NSosyalRightPanelProps {
  isDarkMode: boolean;
  graphResult: CommunityDetectionResult | null;
  liveBio: BotAnalysisResult | null;
  onBotAttack: () => void;
  onBridge: () => void;
}

export const NSosyalRightPanel: React.FC<NSosyalRightPanelProps> = ({
  isDarkMode,
  graphResult,
  liveBio,
}) => {
  const [sentezOpen, setSentezOpen] = useState(true);

  const trendingItems = [
    { tag: '#TeknofestMaviVatan', count: '793 gönderi' },
    { tag: '#Mevlid', count: '399 gönderi' },
    { tag: '#TEKNOFEST', count: '658 gönderi' },
    { tag: '#MuhammedMustafa', count: '227 gönderi' },
    { tag: '#Muhammed', count: '1,4B gönderi' },
  ];

  const communities = graphResult ? Object.entries(graphResult.communityClusters) : [];
  const communityColors = ['emerald', 'cyan', 'purple', 'amber', 'rose'];

  return (
    <aside className="w-72 shrink-0 sticky top-0 h-screen overflow-y-auto p-4 space-y-4">
      {/* 1. NSosyal Popüler List (Original top placement) */}
      <div className={`rounded-2xl p-4 border ${
        isDarkMode ? 'bg-[#0f1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Popüler
          </h3>
          <span className="text-[11px] font-medium text-slate-400 hover:text-cyan-500 cursor-pointer">
            Tümünü gör &gt;
          </span>
        </div>

        <div className="space-y-3">
          {trendingItems.map((item) => (
            <div
              key={item.tag}
              className={`flex items-start justify-between pb-2 border-b last:border-0 last:pb-0 ${
                isDarkMode ? 'border-slate-800/80' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-cyan-500 font-bold text-sm">#</span>
                <div>
                  <p className={`text-xs font-semibold hover:underline cursor-pointer ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {item.tag.replace('#', '')}
                  </p>
                  <p className="text-[10px] text-slate-500">{item.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sentez Extension Overlay Block (Collapsible Sentez Panel) */}
      <div className={`rounded-2xl border transition-all ${
        isDarkMode ? 'bg-[#0d1017] border-cyan-900/40' : 'bg-cyan-50/50 border-cyan-200 shadow-sm'
      }`}>
        {/* Accordion Header */}
        <button
          onClick={() => setSentezOpen(!sentezOpen)}
          className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>🛡️ Sentez Analiz Paneli</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              Katman 1-3
            </span>
          </div>
          <span className="text-xs transform transition-transform duration-200" style={{ transform: sentezOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>

        {/* Collapsible Content */}
        {sentezOpen && (
          <div className="p-3 pt-0 space-y-3 text-xs border-t border-cyan-900/30">
            {/* Louvain Graph Block */}
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-[#121622] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] text-purple-400">🕸️ Louvain Graf Motoru</span>
                <span className="text-[9px] text-slate-500 font-mono">Katman 3</span>
              </div>

              {graphResult ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-2 bg-slate-900/60 rounded-lg text-center border border-slate-800">
                      <p className="text-[9px] text-slate-400">Modülerlik (Q)</p>
                      <p className="text-base font-bold font-mono text-purple-400">{graphResult.modularityScore}</p>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-lg text-center border border-slate-800">
                      <p className="text-[9px] text-slate-400">Topluluk Sayısı</p>
                      <p className="text-base font-bold font-mono text-cyan-400">{communities.length}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {communities.slice(0, 3).map(([cId, members], i) => {
                      const isEcho = graphResult.echoChambers.includes(Number(cId));
                      const color = communityColors[i % communityColors.length];
                      return (
                        <div
                          key={cId}
                          className={`flex items-center justify-between p-1.5 rounded-lg text-[10px] border ${
                            isEcho ? 'border-amber-700/50 bg-amber-950/20' : 'border-slate-800/80 bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full bg-${color}-400`} />
                            <span className="text-slate-300">Topluluk #{cId}</span>
                          </div>
                          <span className="text-slate-400">{members.length} üye {isEcho ? '🔒' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="p-2 text-center text-slate-500 text-[10px]">Hesaplanıyor...</div>
              )}
            </div>

            {/* Live Biometrics Radar */}
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-[#121622] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] text-cyan-400">🧬 Biyometri Radarı</span>
                <span className="text-[9px] text-slate-500 font-mono">Katman 1</span>
              </div>
              <div className="space-y-1 text-[10px]">
                {[
                  ['Dwell Time', `${liveBio?.features.dwellTimeMean ?? 112} ms`],
                  ['Flight Time', `${liveBio?.features.flightTimeMean ?? 145} ms`],
                  ['Yazma Hızı', `${liveBio?.features.typingSpeedCPM ?? 280} CPM`],
                  ['Fare Jitter', `${liveBio?.features.mouseJitterEntropy ?? 0.18}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between p-1 rounded bg-slate-900/40">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-mono text-cyan-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
