'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MultiVectorBiometricsAnalyzer } from '@/lib/security/biometrics';
import { OnnxSemanticEngine } from '@/lib/ai/onnxBridge';
import { PerceptualHashAnalyzer } from '@/lib/security/pHash';
import { AdjacencyMatrixManager } from '@/lib/graph/adjacencyMatrix';
import { LouvainCommunityDetector } from '@/lib/graph/louvain';
import { PostCard } from '@/components/ui/PostCard';
import type { SocialPost, BotAnalysisResult, CommunityDetectionResult } from '@/types';

const SEED_POSTS: SocialPost[] = [
  {
    id: 'p1', authorName: 'Dr. Selin Yılmaz', authorHandle: '@selin_yilmaz',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
    timestamp: '12 dk önce',
    content: 'Sentez projemiz; merkezi AI API maliyetlerini sıfırlayan, WASM + ONNX ile doğrudan tarayıcıda çalışan istemci taraflı güvenlik motorudur. Kullanıcı verisi hiçbir zaman sunucuya gitmiyor.',
    likes: 142, reposts: 38, comments: 12, communityId: 0,
    badge: { status: 'verified', meritScore: 91, botScore: 0.04, isClickbait: false, isManipulatedMedia: false, inferenceTimeMs: 34 },
  },
  {
    id: 'p2', authorName: 'Trend Haber Botu', authorHandle: '@trendhaber99',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
    timestamp: '28 dk önce',
    content: 'ŞOK! İNANAMAYACAKSINIZ! BU VİDEOYU HEMEN İZLE VE PAYLAŞ! ACİL DUYURU!!!',
    likes: 9, reposts: 3, comments: 78, communityId: 1,
    badge: { status: 'risk', meritScore: 14, botScore: 0.91, isClickbait: true, isManipulatedMedia: false, inferenceTimeMs: 29 },
  },
  {
    id: 'p3', authorName: 'Mehmet Demir', authorHandle: '@mehmet_dev',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    timestamp: '1 saat önce',
    content: 'Louvain algoritması gerçekten harika bir topluluk tespiti yöntemi. Graf modülerlik skoru Q hesabı ile yankı odalarını matematiksel olarak tespit etmek çok güçlü.',
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
    likes: 67, reposts: 21, comments: 8, communityId: 0,
    badge: { status: 'verified', meritScore: 84, botScore: 0.08, isClickbait: false, isManipulatedMedia: false, inferenceTimeMs: 41 },
  },
];

export default function Home() {
  const [posts, setPosts] = useState<SocialPost[]>(SEED_POSTS);
  const [content, setContent] = useState('');
  const [mediaMode, setMediaMode] = useState<'none' | 'original' | 'tampered'>('none');
  const [isPosting, setIsPosting] = useState(false);
  const [liveBio, setLiveBio] = useState<BotAnalysisResult | null>(null);
  const [liveMerit, setLiveMerit] = useState<number | null>(null);
  const [graphResult, setGraphResult] = useState<CommunityDetectionResult | null>(null);
  const [pHashLog, setPHashLog] = useState<string>('');
  const bioRef = useRef<MultiVectorBiometricsAnalyzer | null>(null);

  useEffect(() => {
    bioRef.current = new MultiVectorBiometricsAnalyzer();
    runLouvain(SEED_POSTS);
  }, []);

  const runLouvain = (currentPosts: SocialPost[]) => {
    const edges = currentPosts.flatMap((p, i) => [
      { sourceUserId: p.authorHandle, targetUserId: currentPosts[(i + 1) % currentPosts.length].authorHandle, weight: p.likes + p.reposts * 2, type: 'like' as const },
    ]);
    const mgr = new AdjacencyMatrixManager();
    mgr.buildMatrix(edges);
    setGraphResult(LouvainCommunityDetector.detectCommunities(mgr));
  };

  const handleChange = async (val: string) => {
    setContent(val);
    if (val.length > 5) {
      const sem = await OnnxSemanticEngine.analyzeText('live', val);
      setLiveMerit(sem.meritScore);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, type: 'down' | 'up') => {
    if (!bioRef.current) return;
    if (type === 'down') bioRef.current.recordKeyDown(e.key);
    else bioRef.current.recordKeyUp(e.key);
    setLiveBio(bioRef.current.analyze());
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsPosting(true);

    const [sem, bio] = await Promise.all([
      OnnxSemanticEngine.analyzeText(`p-${Date.now()}`, content),
      Promise.resolve(bioRef.current?.analyze() ?? null),
    ]);

    let pHashResult = { isManipulated: false, hammingDistance: 0, analysisMs: 0 };
    if (mediaMode !== 'none') {
      const url = mediaMode === 'original'
        ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'
        : 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80';
      const refHash = PerceptualHashAnalyzer.generateDemoHash('original-ref');
      const curHash = PerceptualHashAnalyzer.generateDemoHash(mediaMode === 'tampered' ? url + '-tampered-xyz' : url);
      const r = PerceptualHashAnalyzer.analyzeManipulation(curHash, refHash);
      pHashResult = r;
      setPHashLog(`Hash: ${curHash} | Hamming: ${r.hammingDistance} | ${r.isManipulated ? '⚠️ Tahrif!' : '✓ Özgün'} | ${r.analysisMs}ms`);
    }

    const botScore = bio?.botScore ?? 0.05;
    const merit = sem.meritScore;
    const status: 'verified' | 'warning' | 'risk' =
      botScore > 0.65 || merit < 30 || pHashResult.isManipulated ? 'risk'
      : sem.isClickbait || merit < 65 ? 'warning' : 'verified';

    const newPost: SocialPost = {
      id: `p-${Date.now()}`,
      authorName: 'Sen (Demo)',
      authorHandle: '@sentez_demo',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
      timestamp: 'Şimdi',
      content,
      mediaUrl: mediaMode !== 'none'
        ? mediaMode === 'original'
          ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'
          : 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80'
        : undefined,
      likes: 1, reposts: 0, comments: 0, communityId: 0,
      badge: {
        status, meritScore: merit, botScore,
        isClickbait: sem.isClickbait,
        isManipulatedMedia: pHashResult.isManipulated,
        inferenceTimeMs: sem.inferenceTimeMs,
      },
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    runLouvain(updated);
    setContent('');
    setMediaMode('none');
    setLiveBio(null);
    setLiveMerit(null);
    bioRef.current?.reset();
    setIsPosting(false);
  };

  const simulateBot = () => {
    const bot: SocialPost = {
      id: `bot-${Date.now()}`,
      authorName: 'BotNet_X' + Math.floor(Math.random() * 999),
      authorHandle: '@autobot_spam',
      authorAvatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=80&q=80',
      timestamp: 'Şimdi · Otomatik Saldırı',
      content: 'ACİL KAZANÇ! TIKLA KAZAN HERKESE DAĞIT ÜCRETSİZ TOKEN COIN!!! KOPYALA PAYLAŞ!!!',
      likes: 1200, reposts: 890, comments: 0, communityId: 2,
      badge: { status: 'risk', meritScore: 8, botScore: 0.97, isClickbait: true, isManipulatedMedia: true, inferenceTimeMs: 28 },
    };
    const updated = [bot, ...posts];
    setPosts(updated);
    runLouvain(updated);
  };

  const injectBridge = () => {
    const bridge: SocialPost = {
      id: `bridge-${Date.now()}`,
      authorName: 'Prof. Ayşe Kaya',
      authorHandle: '@ayse_akademi',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80',
      timestamp: '🌉 Köprü Akışı',
      content: 'Toplumsal kutuplaşmayı azaltmak için farklı perspektiflerden veri okuryazarlığı kritik önem taşıyor. Algoritmik filtre balonları kırılmadan demokratik diyalog mümkün değil.',
      isBridgeContent: true,
      likes: 340, reposts: 120, comments: 45, communityId: 1,
      badge: { status: 'verified', meritScore: 96, botScore: 0.02, isClickbait: false, isManipulatedMedia: false, inferenceTimeMs: 32 },
    };
    setPosts([bridge, ...posts]);
  };

  const handleLike = (id: string) => {
    const updated = posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p);
    setPosts(updated);
    runLouvain(updated);
  };
  const handleRepost = (id: string) => {
    const updated = posts.map(p => p.id === id ? { ...p, reposts: p.reposts + 1 } : p);
    setPosts(updated);
    runLouvain(updated);
  };

  const botPct = liveBio ? Math.round(liveBio.botScore * 100) : null;
  const isBot = liveBio?.isBot;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-lg">S</div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">SENTEZ · Edge Social AI</h1>
            <p className="text-[10px] text-slate-400">TEKNOFEST · %100 Client-Side · $0 API · KVKK Uyumlu</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded-full text-[10px] font-mono border border-slate-800 text-slate-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />WASM Ready
          </span>
          <span className="px-2 py-1 rounded-full text-[10px] font-mono border border-slate-800 text-slate-300">3-Katman Aktif</span>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* LEFT: Nav + Sim */}
        <aside className="md:col-span-3 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Simülasyon</p>
            <button onClick={simulateBot}
              className="w-full py-2.5 px-3 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2">
              🤖 Bot Saldırısı Simüle Et
            </button>
            <button onClick={injectBridge}
              className="w-full py-2.5 px-3 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-200 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2">
              🌉 Köprü İçerik Enjekte Et
            </button>
          </div>

          {/* Louvain Graph Panel */}
          {graphResult && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Katman 3 · Louvain Graf</p>
              <div className="p-3 bg-slate-950 rounded-xl text-[11px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Modülerlik Q:</span>
                  <span className="font-mono text-purple-300 font-bold">{graphResult.modularityScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Topluluk Kümesi:</span>
                  <span className="font-mono text-slate-200">{Object.keys(graphResult.communityClusters).length} küme</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Yankı Odası:</span>
                  <span className={`font-mono font-bold ${graphResult.echoChambers.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {graphResult.echoChambers.length > 0 ? `${graphResult.echoChambers.length} tespit` : 'Yok'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">Komşuluk matrisi + Louvain Phase-1 ΔQ optimizasyonu ile hesaplanır.</p>
            </div>
          )}

          {/* pHash Log */}
          {pHashLog && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Katman 1 · pHash Log</p>
              <p className="text-[10px] font-mono text-cyan-300 break-all leading-relaxed">{pHashLog}</p>
            </div>
          )}
        </aside>

        {/* CENTER: Feed */}
        <main className="md:col-span-6 space-y-5">
          {/* Composer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex gap-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80"
                className="w-10 h-10 rounded-full object-cover border border-slate-700" alt="Sen" />
              <div className="flex-1 space-y-2">
                <textarea
                  value={content}
                  onChange={e => handleChange(e.target.value)}
                  onKeyDown={e => handleKey(e, 'down')}
                  onKeyUp={e => handleKey(e, 'up')}
                  placeholder="Düşünceni paylaş — yazarken 4-vektör biyometri + INT8 semantik analiz anlık çalışır..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
                {/* pHash media selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">pHash Test Medyası:</span>
                  {(['none', 'original', 'tampered'] as const).map(m => (
                    <button key={m} onClick={() => setMediaMode(m)}
                      className={`px-2 py-1 rounded-lg border text-[11px] transition-all ${mediaMode === m
                        ? m === 'tampered' ? 'bg-rose-950 text-rose-300 border-rose-600'
                          : m === 'original' ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                          : 'bg-slate-800 text-slate-200 border-slate-600'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
                      {m === 'none' ? 'Yok' : m === 'original' ? 'Özgün Görsel' : 'Tahrif Edilmiş'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live telemetry */}
            {(botPct !== null || liveMerit !== null) && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-mono">
                <div className="flex gap-4">
                  {liveMerit !== null && <span>Liyakat: <strong className="text-cyan-400">%{liveMerit}</strong></span>}
                  {botPct !== null && <span>Bot İhtimali: <strong className={isBot ? 'text-rose-400' : 'text-emerald-400'}>%{botPct}</strong></span>}
                  {liveBio && <span className="text-slate-500">Dwell: {liveBio.features.dwellTimeMean}ms | Jitter: {liveBio.features.mouseJitterEntropy}</span>}
                </div>
                <span className="text-slate-600">~35ms WASM çıkarım</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">🛡️ Sentez Kalkanı Etkin</span>
              <button onClick={handlePost} disabled={isPosting || !content.trim()}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40">
                {isPosting ? '⏳ Analiz Ediliyor...' : 'Paylaş & Kalkandan Geçir'}
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} />
            ))}
          </div>
        </main>

        {/* RIGHT: Biometrics Inspector */}
        <aside className="md:col-span-3 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Katman 1 · 4-Vektör Biyometri</p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-[11px]">
              {[
                ['Dwell Time (ms)', liveBio?.features.dwellTimeMean ?? 112, 'cyan'],
                ['Dwell StdDev', liveBio?.features.dwellTimeStdDev ?? 28, 'cyan'],
                ['Flight Time (ms)', liveBio?.features.flightTimeMean ?? 145, 'cyan'],
                ['Yazma Hızı (CPM)', liveBio?.features.typingSpeedCPM ?? 280, 'cyan'],
                ['Fare Jitter Eğriliği', liveBio?.features.mouseJitterEntropy ?? 0.18, 'purple'],
                ['Doğrusal Yol Oranı', liveBio?.features.linearPathRatio ?? 0.74, 'purple'],
                ['Yapıştırma (Paste)', liveBio?.features.syntheticPasteCount ?? 0, 'amber'],
              ].map(([label, val, color]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-slate-400">{label as string}:</span>
                  <span className={`font-mono text-${color as string}-300`}>{String(val)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Klavye ritmi + fare mikro-titreme + DOM olay bütünlüğü + pano enjeksiyonu birlikte hesaplanır. Yazı yazdıkça güncellenir.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Katman 2 · Semantik Motor</p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-400">Algoritma:</span><span className="font-mono text-cyan-300">DistilBERT-TR INT8</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Çıkarım:</span><span className="font-mono text-cyan-300">30-50ms</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Vektör Boyutu:</span><span className="font-mono text-cyan-300">128-dim</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Kosinüs Benzerliği:</span><span className="font-mono text-cyan-300">Clickbait + Spam</span></div>
            </div>
            <p className="text-[10px] text-slate-500">Paylaş butonuna basıldığında gerçek analiz çalışır.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
