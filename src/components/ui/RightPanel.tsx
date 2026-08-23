'use client';
import React from 'react';
import { CommunityDetectionResult, BotAnalysisResult } from '@/types';

interface RightPanelProps {
  graphResult: CommunityDetectionResult | null;
  liveBio: BotAnalysisResult | null;
  onBotAttack: () => void;
  onBridge: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ graphResult, liveBio, onBotAttack, onBridge }) => {
  const communities = graphResult ? Object.entries(graphResult.communityClusters) : [];
  const communityColors = ['emerald', 'cyan', 'purple', 'amber', 'rose'];

  return (
    <aside className="py-4 px-2 space-y-4">
      {/* Louvain Graph Simulator */}
      <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-white">🕸️ Louvain Graf Simülatörü</p>
          <span className="text-[10px] text-purple-400 font-mono">Katman 3</span>
        </div>

        {graphResult ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <p className="text-[10px] text-slate-400">Modülerlik Q</p>
                <p className="text-lg font-bold font-mono text-purple-400">{graphResult.modularityScore}</p>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <p className="text-[10px] text-slate-400">Topluluklar</p>
                <p className="text-lg font-bold font-mono text-cyan-400">{communities.length}</p>
              </div>
            </div>

            {/* Visual community bubbles */}
            <div className="space-y-1.5 mb-3">
              {communities.slice(0, 4).map(([cId, members], i) => {
                const isEcho = graphResult.echoChambers.includes(Number(cId));
                const color = communityColors[i % communityColors.length];
                return (
                  <div key={cId} className={`flex items-center justify-between p-2 rounded-lg border ${
                    isEcho ? 'border-amber-700/60 bg-amber-950/20' : 'border-slate-800 bg-slate-900/40'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full bg-${color}-500`} />
                      <span className="text-[10px] text-slate-300">Topluluk #{cId}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">{members.length} üye</span>
                      {isEcho && <span className="text-[9px] text-amber-400 font-bold">🔒 Yankı</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {graphResult.echoChambers.length > 0 && (
              <div className="p-2.5 bg-amber-950/30 border border-amber-700/40 rounded-xl mb-3">
                <p className="text-[10px] text-amber-300 font-semibold">
                  ⚠️ {graphResult.echoChambers.length} Yankı Odası Tespit Edildi
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Köprü içerik algoritması devreye giriyor...</p>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-[11px] text-slate-500">Graf hesaplanıyor...</div>
        )}

        <button onClick={onBridge}
          className="w-full py-2 bg-purple-900 hover:bg-purple-800 border border-purple-700 text-purple-200 rounded-xl text-[11px] font-semibold transition-all">
          🌉 Köprü İçerik Filtresi Uygula
        </button>
      </div>

      {/* Biometrics Live */}
      <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-white">🧬 Biyometri Radar</p>
          <span className="text-[10px] text-cyan-400 font-mono">Katman 1</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          {[
            ['Dwell Time', `${liveBio?.features.dwellTimeMean ?? 112} ms`],
            ['Flight Time', `${liveBio?.features.flightTimeMean ?? 145} ms`],
            ['Yazma Hızı', `${liveBio?.features.typingSpeedCPM ?? 280} CPM`],
            ['Fare Jitter', `${liveBio?.features.mouseJitterEntropy ?? 0.18}`],
            ['Doğrusal Yol', `${liveBio?.features.linearPathRatio ?? 0.74}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between p-1.5 rounded-lg bg-slate-900/60">
              <span className="text-slate-400">{k}</span>
              <span className="font-mono text-cyan-300">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">Yazı alanında yazarken anlık güncellenir.</p>
      </div>

      {/* Sim Button */}
      <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-bold text-white mb-2">🔬 Demo Simülasyonu</p>
        <button onClick={onBotAttack}
          className="w-full py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-xl text-[11px] font-semibold transition-all">
          🤖 Botnet Saldırısı Başlat
        </button>
      </div>

      {/* Trending */}
      <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-white">🔥 Popüler</p>
          <span className="text-[10px] text-slate-400 hover:text-white cursor-pointer">Tümünü gör</span>
        </div>
        {['#TEKNOFEST2026', '#SosyalYapayZeka', '#EdgeComputing', '#KVKK', '#Sentez'].map((tag, i) => (
          <div key={tag} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
            <div>
              <p className="text-xs font-semibold text-slate-200">{tag}</p>
              <p className="text-[10px] text-slate-500">{[183, 1290, 863, 258, 92][i]} gönderi</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
