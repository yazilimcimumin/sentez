'use client';
import React, { useState, useRef } from 'react';
import { NSosyalLeftMenu } from '@/components/ui/NSosyalLeftMenu';
import { NSosyalRightPanel } from '@/components/ui/NSosyalRightPanel';
import { useKeystrokeDynamics } from '@/hooks/useKeystrokeDynamics';
import { analyzeSemantics } from '@/lib/ai/semanticDemo';
import { PerceptualHashAnalyzer } from '@/lib/security/pHash';
import { AdjacencyMatrixManager } from '@/lib/graph/adjacencyMatrix';
import { LouvainCommunityDetector } from '@/lib/graph/louvain';
import { StatusBadge } from '@/components/ui/StatusBadge';

type PostStatus = 'verified' | 'warning' | 'risk';

interface Post {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  time: string;
  text: string;
  img?: string;
  likes: number;
  reposts: number;
  comments: number;
  views: number;
  badge: {
    status: PostStatus;
    merit: number;
    bot: number;
    clickbait: boolean;
    tampered: boolean;
    ms: number;
  };
  bridgeTag?: string;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Sentez AI Araştırma Lab',
    handle: '@sentez_ai',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&q=80',
    time: '4dk',
    text: '🚀 TEKNOFEST Sosyal İnovasyon yarışması için geliştirdiğimiz "Sentez" mimarisi yayında!\n\nYapay zekâ destekli güvenlik, dezenformasyon ve içerik doğrulama analizi artık merkezi sunuculara ihtiyaç duymadan doğrudan kullanıcı tarayıcısında (WASM/Edge) 35ms altında çalışıyor.',
    img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    likes: 342,
    reposts: 89,
    comments: 24,
    views: 1450,
    badge: { status: 'verified', merit: 96, bot: 0.02, clickbait: false, tampered: false, ms: 32 },
  },
  {
    id: 'p2',
    author: 'Dr. Selin Yılmaz',
    handle: '@selin_yilmaz',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
    time: '14dk',
    text: 'Sentez mimarisinde KVKK ve GDPR uyumunu %100 doğal olarak sağlıyoruz. Kullanıcının klavye ritmi, görsel pHash parmak izi ve metinsel anlamsal vektörleri hiçbir harici sunucuya gönderilmeden cihaz seviyesinde işleniyor. $0 API maliyeti!',
    likes: 184,
    reposts: 42,
    comments: 16,
    views: 890,
    badge: { status: 'verified', merit: 92, bot: 0.04, clickbait: false, tampered: false, ms: 34 },
  },
  {
    id: 'p3',
    author: 'Trend Bot 99',
    handle: '@trendhaber99',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
    time: '32dk',
    text: 'ŞOK! İNANAMAYACAKSINIZ! BÜYÜK GİZEM ÇÖZÜLDÜ ACİL PAYLAŞIN HERKESE ULAŞTIRIN!!! BEDAVA COIN KAZANIN!',
    likes: 9,
    reposts: 2,
    comments: 78,
    views: 1250,
    badge: { status: 'risk', merit: 14, bot: 0.91, clickbait: true, tampered: false, ms: 28 },
  },
  {
    id: 'p4',
    author: 'Prof. Canan Dağ',
    handle: '@canan_akademi',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80',
    time: '2sa',
    text: 'Sosyal medyada yankı odaları ve kutuplaşma ciddi bir sorun. Louvain topluluk tespiti algoritması ve Köprü İçerik mekanizması sayesinde algoritma seviyesinde kapsayıcılık sağlanabiliyor.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    likes: 203,
    reposts: 89,
    comments: 34,
    views: 2100,
    badge: { status: 'verified', merit: 88, bot: 0.06, clickbait: false, tampered: false, ms: 37 },
    bridgeTag: '🌉 Köprü İçerik',
  },
];

function runLouvain(posts: Post[]) {
  const mgr = new AdjacencyMatrixManager();
  mgr.buildMatrix(
    posts.flatMap((p, i) => [
      {
        sourceUserId: p.handle,
        targetUserId: posts[(i + 1) % posts.length].handle,
        weight: p.likes + p.reposts * 2,
        type: 'like' as const,
      },
    ])
  );
  return LouvainCommunityDetector.detectCommunities(mgr);
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mediaOnly, setMediaOnly] = useState(false);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [text, setText] = useState('');
  const [mediaMode, setMediaMode] = useState<'none' | 'clean' | 'tampered'>('none');
  const [posting, setPosting] = useState(false);
  const [liveMerit, setLiveMerit] = useState<number | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState<'akis' | 'medya'>('akis');

  const graph = useRef(runLouvain(INITIAL_POSTS));
  const { metrics, onKeyDown, onKeyUp, reset } = useKeystrokeDynamics();

  const handleChange = (val: string) => {
    setText(val);
    if (val.length > 4) {
      setLiveMerit(analyzeSemantics(val).meritScore);
    } else {
      setLiveMerit(null);
    }
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);

    const sem = analyzeSemantics(text);
    const bot = metrics.botScore;
    const refHash = PerceptualHashAnalyzer.generateDemoHash('ref-original');
    const curHash = PerceptualHashAnalyzer.generateDemoHash(
      mediaMode === 'tampered' ? 'tampered-xyz' : 'ref-original'
    );
    const phash = PerceptualHashAnalyzer.analyzeManipulation(curHash, refHash);

    const status: PostStatus =
      bot > 0.65 || sem.meritScore < 30 || phash.isManipulated
        ? 'risk'
        : sem.isClickbait || sem.meritScore < 65
        ? 'warning'
        : 'verified';

    const newPost: Post = {
      id: `p_${Date.now()}`,
      author: 'Sen (NSosyal Kullanıcısı)',
      handle: '@nsosyal_user',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
      time: 'Şimdi',
      text,
      img:
        mediaMode !== 'none'
          ? mediaMode === 'clean'
            ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'
            : 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80'
          : undefined,
      likes: 1,
      reposts: 0,
      comments: 0,
      views: 1,
      badge: {
        status,
        merit: sem.meritScore,
        bot,
        clickbait: sem.isClickbait,
        tampered: phash.isManipulated,
        ms: sem.inferenceMs,
      },
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    graph.current = runLouvain(updated);
    setText('');
    setMediaMode('none');
    reset();
    setLiveMerit(null);
    setPosting(false);
  };

  const addBotAttack = () => {
    const p: Post = {
      id: `bot_${Date.now()}`,
      author: 'BotNet_X' + Math.floor(Math.random() * 999),
      handle: '@botspam_tr',
      avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=80&q=80',
      time: 'Şimdi',
      text: 'ACİL BEDAVA TOKEN KAZAN! KOPYALA PAYLAŞ DAĞIT! COIN AIRDROP TIKLA!!!',
      likes: 990,
      reposts: 720,
      comments: 0,
      views: 4500,
      badge: { status: 'risk', merit: 8, bot: 0.97, clickbait: true, tampered: true, ms: 26 },
    };
    const updated = [p, ...posts];
    setPosts(updated);
    graph.current = runLouvain(updated);
  };

  const addBridgePost = () => {
    const p: Post = {
      id: `bridge_${Date.now()}`,
      author: 'Prof. Canan Dağ',
      handle: '@canan_akademi',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80',
      time: '🌉 Köprü Akışı',
      text: 'Farklı topluluklar arasında ortak zemin bulmak için veri okuryazarlığı kritik. Algoritmik kutuplaşma kırılmadan demokratik diyalog mümkün değil.',
      likes: 340,
      reposts: 120,
      comments: 45,
      views: 1800,
      badge: { status: 'verified', merit: 96, bot: 0.02, clickbait: false, tampered: false, ms: 32 },
      bridgeTag: '🌉 Köprü İçerik',
    };
    setPosts([p, ...posts]);
  };

  const stories = [
    { name: 'sentez_ai', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&q=80' },
    { name: 'teknofest', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=80&q=80' },
    { name: 'cezec_lab', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=80&q=80' },
    { name: 'edge_tech', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&q=80' },
  ];

  // Medya filtresi: Medya sekmesi veya Medya toggle aktifse sadece görselleri göster
  const filteredPosts = (activeTab === 'medya' || mediaOnly)
    ? posts.filter((p) => !!p.img)
    : posts;

  return (
    <div className={`min-h-screen flex justify-center ${
      isDarkMode ? 'bg-[#0b0c10] text-slate-100' : 'bg-[#f4f6f8] text-slate-800'
    }`}>
      {/* Container matching NSosyal layout width */}
      <div className="flex w-full max-w-7xl justify-between">
        {/* 1. Left Nav */}
        <NSosyalLeftMenu
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          mediaEnabled={mediaOnly}
          onToggleMedia={() => {
            const next = !mediaOnly;
            setMediaOnly(next);
            if (next) setActiveTab('medya');
            else setActiveTab('akis');
          }}
        />

        {/* 2. Main Feed Area */}
        <main className={`flex-1 max-w-2xl border-x ${
          isDarkMode ? 'border-slate-800/80 bg-[#0f1117]' : 'border-slate-200 bg-white'
        }`}>
          {/* Header Tabs & Search */}
          <header className={`sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b backdrop-blur-md ${
            isDarkMode ? 'bg-[#0f1117]/90 border-slate-800' : 'bg-white/90 border-slate-200'
          }`}>
            {/* Tabs */}
            <div className="flex items-center gap-8 h-full">
              <button
                onClick={() => {
                  setActiveTab('akis');
                  setMediaOnly(false);
                }}
                className={`relative h-full text-sm font-bold flex items-center transition-colors ${
                  activeTab === 'akis'
                    ? isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Akış
                {activeTab === 'akis' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full" />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('medya');
                  setMediaOnly(true);
                }}
                className={`relative h-full text-sm font-bold flex items-center transition-colors ${
                  activeTab === 'medya'
                    ? isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Medya ({posts.filter(p=>!!p.img).length})
                {activeTab === 'medya' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full" />
                )}
              </button>
            </div>

            {/* Search input & User Avatar */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <span className="text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Arama yap"
                  className="bg-transparent focus:outline-none w-28 text-xs"
                />
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80"
                  className="w-7 h-7 rounded-full object-cover border border-cyan-500/40"
                  alt="Avatar"
                />
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
            </div>
          </header>

          {/* NSosyal Composer */}
          <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80"
                className="w-10 h-10 rounded-full object-cover shrink-0"
                alt="Me"
              />
              <div className="flex-1 space-y-3">
                <textarea
                  value={text}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  onKeyUp={onKeyUp}
                  placeholder="Gönderi oluşturmak için..."
                  className={`w-full h-16 bg-transparent text-sm resize-none focus:outline-none placeholder-slate-500 ${
                    isDarkMode ? 'text-slate-100' : 'text-slate-800'
                  }`}
                />

                {/* NSosyal Composer Icons + Gönder button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                  <div className="flex items-center gap-3 text-slate-400 text-base">
                    <button className="hover:text-cyan-400 transition-colors">🖼️</button>
                    <button className="hover:text-cyan-400 transition-colors">📊</button>
                    <button className="hover:text-cyan-400 transition-colors">ℹ️</button>
                    <button className="hover:text-cyan-400 transition-colors">😊</button>
                    <button className="hover:text-cyan-400 transition-colors">📅</button>
                    <button className="hover:text-cyan-400 transition-colors">💬</button>
                  </div>
                  <button
                    onClick={handlePost}
                    disabled={posting || !text.trim()}
                    className="px-5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-600 text-white hover:brightness-110 disabled:opacity-40 transition-all shadow-md shadow-cyan-500/20"
                  >
                    {posting ? 'Analiz...' : 'Gönder'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sentez Extension Overlay Strip (Placed cleanly UNDER NSosyal's composer) */}
            <div className={`mt-3 p-2.5 rounded-xl border flex flex-wrap items-center justify-between text-[11px] gap-2 ${
              isDarkMode ? 'bg-cyan-950/20 border-cyan-800/40 text-slate-300' : 'bg-cyan-50 border-cyan-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400">🛡️ Sentez Kalkanı:</span>
                {liveMerit !== null && (
                  <span className="font-mono">Liyakat: <strong className="text-cyan-300">%{liveMerit}</strong></span>
                )}
                {metrics.sampleCount > 0 && (
                  <span className="font-mono">
                    Bot: <strong className={metrics.isBot ? 'text-rose-400' : 'text-emerald-400'}>%{Math.round(metrics.botScore * 100)}</strong>
                    <span className="text-[10px] opacity-75 ml-1">({metrics.dwellMean}ms)</span>
                  </span>
                )}
              </div>

              {/* pHash test options */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-400">pHash Medya:</span>
                {(['none', 'clean', 'tampered'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMediaMode(m)}
                    className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${
                      mediaMode === m
                        ? m === 'tampered'
                          ? 'border-rose-500 text-rose-300 bg-rose-950'
                          : m === 'clean'
                          ? 'border-emerald-500 text-emerald-300 bg-emerald-950'
                          : 'border-cyan-500 text-cyan-300 bg-cyan-950'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m === 'none' ? 'Yok' : m === 'clean' ? 'Özgün' : 'Tahrif'}
                  </button>
                ))}
              </div>
            </div>

            {/* Story Circles (NSosyal Signatures) */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800/40 overflow-x-auto">
              {stories.map((st) => (
                <div key={st.name} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                  <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600">
                    <img src={st.img} className="w-full h-full rounded-full object-cover border-2 border-[#0f1117]" alt={st.name} />
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[65px]">{st.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Posts Feed */}
          <div>
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className={`p-4 border-b hover:bg-slate-900/20 transition-colors ${
                  isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                } ${post.bridgeTag ? 'border-l-4 border-l-purple-500' : ''}`}
              >
                <div className="flex gap-3">
                  <img
                    src={post.avatar}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    alt={post.author}
                  />
                  <div className="flex-1 min-w-0">
                    {/* Header line with user info & Sentez Badges */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-bold text-white truncate">{post.author}</span>
                        <span className="text-xs text-cyan-400 font-bold">✓</span>
                        <span className="text-xs text-slate-400 font-mono truncate">{post.handle}</span>
                        <span className="text-xs text-slate-500">· {post.time}</span>
                        {post.bridgeTag && (
                          <span className="text-[10px] font-bold text-purple-400 ml-1">
                            {post.bridgeTag}
                          </span>
                        )}
                      </div>

                      {/* Integrated Sentez Badge */}
                      <div className="shrink-0">
                        <StatusBadge
                          status={post.badge.status}
                          meritScore={post.badge.merit}
                          botScore={post.badge.bot}
                          isClickbait={post.badge.clickbait}
                          isManipulatedMedia={post.badge.tampered}
                          inferenceTimeMs={post.badge.ms}
                          contentSnippet={post.text.slice(0, 80)}
                        />
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-sm text-slate-200 leading-relaxed mb-3 whitespace-pre-line">
                      {post.text}
                    </p>

                    {/* Media Preview (if exists) */}
                    {post.img && (
                      <div className="relative rounded-2xl overflow-hidden mb-3 border border-slate-800/80">
                        <img src={post.img} className="w-full h-64 object-cover" alt="" />
                        <div
                          className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-mono backdrop-blur-md border ${
                            post.badge.tampered
                              ? 'bg-rose-950/90 border-rose-600 text-rose-300'
                              : 'bg-emerald-950/90 border-emerald-600 text-emerald-300'
                          }`}
                        >
                          {post.badge.tampered ? '⚠️ pHash: Tahrif Edilmiş' : '✓ pHash: Özgün Medya'}
                        </div>
                      </div>
                    )}

                    {/* NSosyal Action Bar Icons (💬 Comment, 🔄 Repost, 🚀 Rocket, 📊 Views) */}
                    <div className="flex items-center justify-between text-slate-400 text-xs pt-1">
                      <div className="flex items-center gap-6">
                        <button className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
                          <span>💬</span>
                          <span>{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                          <span>🔄</span>
                          <span>{post.reposts}</span>
                        </button>
                        {/* Rocket icon for Likes - NSosyal Signature! */}
                        <button className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors font-semibold text-cyan-400">
                          <span>🚀</span>
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
                          <span>📊</span>
                          <span>{post.views}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button className="hover:text-slate-200">🔖</button>
                        <button className="hover:text-slate-200">🔗</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* 3. Right Panel (Popüler at top + Collapsible Sentez Analysis at bottom) */}
        <NSosyalRightPanel
          isDarkMode={isDarkMode}
          graphResult={graph.current}
          liveBio={null}
          onBotAttack={addBotAttack}
          onBridge={addBridgePost}
        />
      </div>

      {/* Floating Sentez Demo Control Panel (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 p-3 rounded-2xl bg-[#0f1420]/95 border border-cyan-500/40 backdrop-blur-md shadow-2xl text-xs w-60">
        <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-cyan-900/40 pb-1.5 mb-1">
          <span>🔬 Sentez Demo Kontrolleri</span>
          <span className="text-[9px] px-1 bg-cyan-500/20 rounded">v1.0</span>
        </div>

        <button
          onClick={addBotAttack}
          className="w-full py-1.5 px-3 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 font-medium text-[11px] transition-all text-left flex items-center justify-between"
        >
          <span>🤖 Botnet Saldırısı</span>
          <span className="text-[9px] opacity-75">Simüle et</span>
        </button>

        <button
          onClick={addBridgePost}
          className="w-full py-1.5 px-3 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-200 font-medium text-[11px] transition-all text-left flex items-center justify-between"
        >
          <span>🌉 Köprü İçerik</span>
          <span className="text-[9px] opacity-75">Enjekte et</span>
        </button>

        <button
          onClick={() => setShowMetrics(true)}
          className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold text-[11px] transition-all text-center"
        >
          ⚡ $0 Edge Metrikleri
        </button>
      </div>

      {/* Edge Metrics Modal */}
      {showMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#0f1117] border border-cyan-900/50 rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚡ Edge / WASM Performans Metrikleri</span>
              </h2>
              <button onClick={() => setShowMetrics(false)} className="text-slate-400 hover:text-white text-xl">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                ['API Maliyeti', '$0 / Sorgu', 'text-emerald-400', 'Sıfır sunucu harcaması'],
                ['INT8 ONNX Çıkarım', '30–50 ms', 'text-cyan-400', 'WASM / WebGPU'],
                ['Model Boyutu', '28 MB', 'text-purple-400', '440 MB → INT8 sıkıştırma'],
                ['pHash Analizi', '< 5 ms', 'text-amber-400', 'Canvas API dHash + Hamming'],
                ['Louvain Graf', 'İstemci İçi', 'text-cyan-300', 'graphology-communities-louvain'],
                ['KVKK / GDPR', '%100 Uyumlu', 'text-emerald-400', 'Veri cihaz dışına çıkmaz'],
              ].map(([l, v, c, s]) => (
                <div key={l as string} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400">{l as string}</p>
                  <p className={`text-lg font-bold font-mono ${c as string}`}>{v as string}</p>
                  <p className="text-[9px] text-slate-500">{s as string}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-900 border border-cyan-800/40 rounded-xl text-[11px] space-y-1">
              <p className="text-cyan-400 font-bold">NSosyal Entegrasyon Mimarisi</p>
              <p className="text-slate-300 leading-relaxed">
                Sentez güvenlik ve yapay zekâ katmanları NSosyal arayüzüne istemci tarafında bir tarayıcı uzantısı veya dahili modül şeklinde takılacak şekilde tasarlanmıştır. Tüm matris hesaplamaları doğrudan kullanıcının cihazında koşturulur.
              </p>
            </div>

            <button
              onClick={() => setShowMetrics(false)}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold rounded-xl text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
