'use client';

import React, { useState, useEffect, useRef } from 'react';
import { KeystrokeDynamicsAnalyzer } from '@/lib/security/keystroke';
import { OnnxSemanticEngine } from '@/lib/ai/onnxBridge';
import { AdjacencyMatrixManager } from '@/lib/graph/adjacencyMatrix';
import { LouvainCommunityDetector } from '@/lib/graph/louvain';
import { BridgeFeedAlgorithm, PostMetaData } from '@/lib/graph/bridgeFeed';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BotAnalysisResult, SemanticAnalysisResult, CommunityDetectionResult, BridgeContentRecommendation } from '@/types';

export default function Home() {
  // Layer 1 State
  const [keystrokeText, setKeystrokeText] = useState('');
  const [botAnalysis, setBotAnalysis] = useState<BotAnalysisResult | null>(null);
  const keystrokeAnalyzerRef = useRef<KeystrokeDynamicsAnalyzer | null>(null);

  // Layer 2 State
  const [analysisInput, setAnalysisInput] = useState('TEKNOFEST 2026 kapsamında geliştirdiğimiz Sentez projesi uçta hesaplama ile tamamen yerli ve güvenli sosyal ağ motorudur.');
  const [semanticResult, setSemanticResult] = useState<SemanticAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Layer 3 State
  const [graphResult, setGraphResult] = useState<CommunityDetectionResult | null>(null);
  const [bridgePosts, setBridgePosts] = useState<BridgeContentRecommendation[]>([]);

  useEffect(() => {
    // Initialize Layer 1 Analyzer
    keystrokeAnalyzerRef.current = new KeystrokeDynamicsAnalyzer();

    // Auto-run initial semantic analysis
    handleSemanticAnalysis(analysisInput);

    // Auto-run initial Louvain graph algorithm
    runGraphDemo();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (keystrokeAnalyzerRef.current) {
      keystrokeAnalyzerRef.current.recordKeyDown(e.key);
      const res = keystrokeAnalyzerRef.current.analyze();
      setBotAnalysis(res);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (keystrokeAnalyzerRef.current) {
      keystrokeAnalyzerRef.current.recordKeyUp(e.key);
      const res = keystrokeAnalyzerRef.current.analyze();
      setBotAnalysis(res);
    }
  };

  const handleSemanticAnalysis = async (textToAnalyze: string) => {
    setIsAnalyzing(true);
    const res = await OnnxSemanticEngine.analyzeText(`post-${Date.now()}`, textToAnalyze);
    setSemanticResult(res);
    setIsAnalyzing(false);
  };

  const runGraphDemo = () => {
    const mockEdges = [
      { sourceUserId: 'userA', targetUserId: 'userB', weight: 5, type: 'follow' as const },
      { sourceUserId: 'userB', targetUserId: 'userC', weight: 4, type: 'comment' as const },
      { sourceUserId: 'userA', targetUserId: 'userC', weight: 3, type: 'like' as const },

      { sourceUserId: 'userX', targetUserId: 'userY', weight: 5, type: 'follow' as const },
      { sourceUserId: 'userY', targetUserId: 'userZ', weight: 5, type: 'repost' as const },

      // Cross-community light connection
      { sourceUserId: 'userC', targetUserId: 'userX', weight: 1, type: 'like' as const },
    ];

    const manager = new AdjacencyMatrixManager();
    manager.buildMatrix(mockEdges);

    const commRes = LouvainCommunityDetector.detectCommunities(manager);
    setGraphResult(commRes);

    const candidatePosts: PostMetaData[] = [
      {
        id: 'post-101',
        authorId: 'userX',
        meritScore: 88,
        tags: ['teknoloji', 'inovasyon'],
        embedding: [],
      },
      {
        id: 'post-102',
        authorId: 'userY',
        meritScore: 42,
        tags: ['gündem'],
        embedding: [],
      },
    ];

    const bridges = BridgeFeedAlgorithm.generateBridgeFeed('userA', candidatePosts, commRes);
    setBridgePosts(bridges);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none opacity-25">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-600/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono text-xl font-bold">
                SENTEZ
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                  Edge Social AI & Security Engine
                </h1>
                <p className="text-xs text-slate-400">
                  TEKNOFEST Sosyal İnovasyon • $0 API Maliyeti • KVKK / GDPR Uyumlu
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Main Thread Isolator: Active
            </span>
          </div>
        </header>

        {/* 3 Layer Architecture Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KATMAN 1: İSTEMCİ GÜVENLİK KATMANI */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-emerald-400 uppercase">
                  Katman 1
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  WASM & Biometrics
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">İstemci Güvenlik Katmanı</h2>
              <p className="text-xs text-slate-400 mt-1">
                Keystroke Dynamics (Milisaniyelik Klavye Vuruş Ritmi) ile Bot Tespit Canlı Testi
              </p>

              <div className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Aşağıdaki alana klavyeden doğal ritminizle metin yazın:
                </label>
                <textarea
                  value={keystrokeText}
                  onChange={(e) => setKeystrokeText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  placeholder="Buraya yazarken vuruş milisaniyeleriniz arka planda işlenir..."
                  className="w-full h-24 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono"
                />
              </div>

              {/* Bot Analysis Live Stats */}
              {botAnalysis && (
                <div className="mt-4 p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bot Skoru:</span>
                    <span className={`font-mono font-bold ${botAnalysis.isBot ? 'text-rose-400' : 'text-emerald-400'}`}>
                      %{(botAnalysis.botScore * 100).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Dwell Time Mean (Ort. Basış):</span>
                    <span className="font-mono text-cyan-300">{botAnalysis.features.dwellTimeMean} ms</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Flight Time StdDev (Varyans):</span>
                    <span className="font-mono text-cyan-300">{botAnalysis.features.flightTimeStdDev} ms</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Yazma Hızı:</span>
                    <span className="font-mono text-cyan-300">{botAnalysis.features.typingSpeedCPM} CPM</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Medya Parmak İzi: pHash WASM</span>
              <StatusBadge
                status={botAnalysis?.isBot ? 'risk' : 'verified'}
                meritScore={botAnalysis?.isBot ? 20 : 95}
                botScore={botAnalysis?.botScore || 0.05}
              />
            </div>
          </section>

          {/* KATMAN 2: ANLAMSAL NİTELİK KATMANI */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-cyan-400 uppercase">
                  Katman 2
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                  ONNX WebGPU / WASM
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">Anlamsal Nitelik Katmanı</h2>
              <p className="text-xs text-slate-400 mt-1">
                INT8 distilbert-base-turkish-cased ONNX Modeli & Kosinüs Liyakat Skoru
              </p>

              <div className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Analiz Edilecek İçerik:
                </label>
                <textarea
                  value={analysisInput}
                  onChange={(e) => setAnalysisInput(e.target.value)}
                  className="w-full h-24 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
                <button
                  onClick={() => handleSemanticAnalysis(analysisInput)}
                  disabled={isAnalyzing}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl text-xs transition-all shadow-md focus:outline-none"
                >
                  {isAnalyzing ? 'Uç YZ Çıkarımı Yapılıyor (30-50ms)...' : 'İçeriği Analiz Et ($0 Maliyet)'}
                </button>
              </div>

              {/* Semantic Analysis Output */}
              {semanticResult && (
                <div className="mt-4 p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Liyakat Skoru:</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      %{semanticResult.meritScore} / 100
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tık Tuzağı (Clickbait):</span>
                    <span className={semanticResult.isClickbait ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                      {semanticResult.isClickbait ? 'Evet' : 'Hayır'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Çıkarım Süresi:</span>
                    <span className="font-mono text-emerald-400">{semanticResult.inferenceTimeMs} ms</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Model: distilbert-tr-int8</span>
              <StatusBadge
                status={semanticResult?.isClickbait ? 'warning' : 'verified'}
                meritScore={semanticResult?.meritScore || 85}
                botScore={0.02}
                isClickbait={semanticResult?.isClickbait}
                inferenceTimeMs={semanticResult?.inferenceTimeMs}
              />
            </div>
          </section>

          {/* KATMAN 3: GRAF TABANLI AKIŞ KATMANI */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-purple-400 uppercase">
                  Katman 3
                </span>
                <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                  Louvain Graph Engine
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">Graf Tabanlı Akış Katmanı</h2>
              <p className="text-xs text-slate-400 mt-1">
                Louvain Topluluk Tespiti & Yankı Odası Kıran Köprü İçerik Algoritması
              </p>

              {graphResult && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Modülerlik Skoru (Q):</span>
                      <span className="font-mono font-bold text-purple-300">
                        {graphResult.modularityScore}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tespit Edilen Topluluklar:</span>
                      <span className="font-mono text-slate-200">
                        {Object.keys(graphResult.communityClusters).length} Küme
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Filtre Balonu (Yankı Odası):</span>
                      <span className="font-mono text-amber-400">
                        {graphResult.echoChambers.length > 0 ? 'Kutuplaşma Tespit Edildi' : 'Dengeli Dağılım'}
                      </span>
                    </div>
                  </div>

                  {/* Bridge Content Recommendations */}
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-300">
                      Dağıtılan Köprü İçerikler:
                    </span>
                    {bridgePosts.map((bridge) => (
                      <div
                        key={bridge.postId}
                        className="p-2.5 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-purple-300 font-semibold">{bridge.postId}</span>
                          <span className="text-[10px] bg-purple-900/80 px-2 py-0.5 rounded text-purple-200">
                            Köprü Skoru: {bridge.bridgeScore}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-tight">{bridge.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Algoritma: Louvain (Client-Side)</span>
              <button
                onClick={runGraphDemo}
                className="px-3 py-1 bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-purple-200 rounded-lg text-xs font-medium"
              >
                Grafı Yeniden Hesapla
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
