'use client';
import React, { useState, useRef } from 'react';
import { useKeystrokeDynamics } from '@/hooks/useKeystrokeDynamics';
import { analyzeSemantics } from '@/lib/ai/semanticDemo';
import { PerceptualHashAnalyzer } from '@/lib/security/pHash';
import { AdjacencyMatrixManager } from '@/lib/graph/adjacencyMatrix';
import { LouvainCommunityDetector } from '@/lib/graph/louvain';
import { StatusBadge } from '@/components/ui/StatusBadge';

type PostStatus = 'verified' | 'warning' | 'risk';
interface Post {
  id: string; author: string; handle: string; avatar: string;
  time: string; text: string; img?: string;
  likes: number; reposts: number; comments: number;
  badge: { status: PostStatus; merit: number; bot: number; clickbait: boolean; tampered: boolean; ms: number; };
  bridgeTag?: string;
}

const SEED: Post[] = [
  { id:'p1', author:'Dr. Selin Yılmaz', handle:'@selin_yilmaz',
    avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
    time:'14 dk', text:'Sentez projemiz ONNX Runtime Web ve WebAssembly sayesinde yapay zeka çıkarımını doğrudan kullanıcı tarayıcısında 35ms altında gerçekleştiriyor. Merkezi sunucu maliyeti: $0.',
    likes:142, reposts:38, comments:12,
    badge:{ status:'verified', merit:91, bot:0.04, clickbait:false, tampered:false, ms:34 } },
  { id:'p2', author:'Trend Bot 99', handle:'@trendhaber99',
    avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
    time:'32 dk', text:'ŞOK! İNANAMAYACAKSINIZ! BÜYÜK GİZEM ÇÖZÜLDÜ ACİL PAYLAŞIN HERKESE ULAŞTIRIN!!!',
    likes:9, reposts:2, comments:78,
    badge:{ status:'risk', merit:14, bot:0.91, clickbait:true, tampered:false, ms:28 } },
  { id:'p3', author:'Mehmet Demir', handle:'@mehmet_dev',
    avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    time:'1 sa',
    text:'Louvain topluluk tespiti algoritması ile sosyal graflarda yankı odalarını matematiksel olarak tespit etmek mümkün. Modülerlik skoru Q bu izolasyonun ölçüsüdür.',
    img:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
    likes:67, reposts:21, comments:8,
    badge:{ status:'verified', merit:86, bot:0.07, clickbait:false, tampered:false, ms:41 } },
  { id:'p4', author:'Ayşe Kaya', handle:'@ayse_kaya',
    avatar:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80',
    time:'2 sa', text:'Veri gizliliği odaklı yapay zeka uygulamaları giderek önem kazanıyor. KVKK ve GDPR uyum maliyetleri düşünüldüğünde edge computing yaklaşımı çok daha sürdürülebilir.',
    likes:203, reposts:89, comments:34,
    badge:{ status:'verified', merit:88, bot:0.06, clickbait:false, tampered:false, ms:37 },
    bridgeTag:'🌉 Köprü İçerik' },
];

function runLouvain(posts: Post[]) {
  const mgr = new AdjacencyMatrixManager();
  mgr.buildMatrix(posts.flatMap((p, i) => [{
    sourceUserId: p.handle,
    targetUserId: posts[(i+1) % posts.length].handle,
    weight: p.likes + p.reposts * 2,
    type: 'like' as const,
  }]));
  return LouvainCommunityDetector.detectCommunities(mgr);
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [text, setText] = useState('');
  const [mediaMode, setMediaMode] = useState<'none'|'clean'|'tampered'>('none');
  const [posting, setPosting] = useState(false);
  const [liveMerit, setLiveMerit] = useState<number|null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const graph = useRef(runLouvain(SEED));

  const { metrics, onKeyDown, onKeyUp, reset } = useKeystrokeDynamics();

  const handleChange = (v: string) => {
    setText(v);
    if (v.length > 4) setLiveMerit(analyzeSemantics(v).meritScore);
    else setLiveMerit(null);
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const sem = analyzeSemantics(text);
    const bot = metrics.botScore;
    const refHash = PerceptualHashAnalyzer.generateDemoHash('ref-original');
    const curHash = PerceptualHashAnalyzer.generateDemoHash(mediaMode === 'tampered' ? 'tampered-xyz' : 'ref-original');
    const phash = PerceptualHashAnalyzer.analyzeManipulation(curHash, refHash);
    const status: PostStatus = (bot > 0.65 || sem.meritScore < 30 || phash.isManipulated) ? 'risk'
      : (sem.isClickbait || sem.meritScore < 65) ? 'warning' : 'verified';
    const newPost: Post = {
      id: `p${Date.now()}`, author: 'Sen (Demo)', handle: '@sentez_demo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
      time: 'Şimdi', text,
      img: mediaMode !== 'none' ? (mediaMode === 'clean'
        ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'
        : 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80') : undefined,
      likes:1, reposts:0, comments:0,
      badge:{ status, merit: sem.meritScore, bot, clickbait: sem.isClickbait, tampered: phash.isManipulated, ms: sem.inferenceMs },
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    graph.current = runLouvain(updated);
    setText(''); setMediaMode('none'); reset(); setLiveMerit(null); setPosting(false);
  };

  const addBot = () => {
    const p: Post = {
      id:`bot${Date.now()}`, author:'BotNet_X'+Math.floor(Math.random()*999),
      handle:'@botspam', avatar:'https://images.unsplash.com/photo-1563089145-599997674d42?w=80&q=80',
      time:'Şimdi · Sim.', text:'ACİL BEDAVA TOKEN KAZAN! KOPYALA PAYLAŞ DAĞIT! COIN AIRDROP TIKLA!!!',
      likes:990, reposts:720, comments:0,
      badge:{status:'risk', merit:8, bot:0.97, clickbait:true, tampered:true, ms:26},
    };
    const u=[p,...posts]; setPosts(u); graph.current=runLouvain(u);
  };

  const addBridge = () => {
    const p: Post = {
      id:`br${Date.now()}`, author:'Prof. Canan Dağ', handle:'@canan_akademi',
      avatar:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80',
      time:'🌉 Köprü Akışı', text:'Farklı topluluklar arasında ortak zemin bulmak için veri okuryazarlığı kritik. Algoritmik kutuplaşma kırılmadan demokratik diyalog mümkün değil.',
      likes:340, reposts:120, comments:45,
      badge:{status:'verified', merit:96, bot:0.02, clickbait:false, tampered:false, ms:32},
      bridgeTag:'🌉 Köprü İçerik',
    };
    setPosts([p,...posts]);
  };

  const g = graph.current;
  const clusters = Object.entries(g.communityClusters);

  return (
    <div className="min-h-screen bg-[#13141a] text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0d0e13]/90 backdrop-blur border-b border-slate-800 h-12 flex items-center px-4 gap-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center font-black text-slate-950">S</div>
        <div className="flex-1 max-w-sm">
          <input readOnly value="Arama yap…" className="w-full bg-slate-800 rounded-full px-3 py-1 text-xs text-slate-400 cursor-default" />
        </div>
        <span className="text-[10px] text-emerald-400 font-mono border border-emerald-700 px-2 py-0.5 rounded-full">TEKNOFEST Demo</span>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        {/* LEFT NAV */}
        <aside className="w-56 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto border-r border-slate-800 flex flex-col gap-1 p-3">
          {[['🏠','Ana Sayfa',true],['🔔','Bildirimler',false],['💬','Mesajlar',false],['🔍','Keşfet',false],['👥','Topluluklar',false],['🔖','Kaydedilenler',false],['❤️','Beğeniler',false],['⚙️','Ayarlar',false]].map(([ic,lb,ac])=>(
            <button key={lb as string} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left ${ac?'bg-emerald-500/15 text-emerald-300':'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <span>{ic as string}</span><span>{lb as string}</span>
            </button>
          ))}
          <div className="mt-auto pt-3 space-y-2">
            <button onClick={()=>setShowMetrics(true)}
              className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:brightness-110 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20">
              ⚡ $0 Edge Metrikleri
            </button>
            <button onClick={addBot} className="w-full py-1.5 px-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-[11px]">🤖 Bot Saldırısı</button>
            <button onClick={addBridge} className="w-full py-1.5 px-2 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 rounded-xl text-[11px]">🌉 Köprü Enjekte</button>
          </div>
        </aside>

        {/* CENTER FEED */}
        <main className="flex-1 max-w-xl border-r border-slate-800 overflow-y-auto">
          {/* Composer */}
          <div className="border-b border-slate-800 p-4 space-y-3">
            <div className="flex gap-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80" className="w-9 h-9 rounded-full object-cover" alt="avatar" />
              <div className="flex-1 space-y-2">
                <textarea value={text} onChange={e=>handleChange(e.target.value)}
                  onKeyDown={onKeyDown} onKeyUp={onKeyUp}
                  placeholder="Gönderi oluşturmak için..."
                  className="w-full h-20 bg-transparent border-b border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">pHash:</span>
                  {(['none','clean','tampered'] as const).map(m=>(
                    <button key={m} onClick={()=>setMediaMode(m)}
                      className={`px-2 py-0.5 rounded-full border text-[10px] transition-all ${mediaMode===m?(m==='tampered'?'border-rose-600 text-rose-300 bg-rose-950':m==='clean'?'border-emerald-600 text-emerald-300 bg-emerald-950':'border-slate-600 text-slate-200 bg-slate-800'):'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                      {m==='none'?'Yok':m==='clean'?'Özgün':'Tahrif'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Live indicators */}
            {(metrics.sampleCount>0||liveMerit!==null)&&(
              <div className="ml-12 p-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4 text-[10px] font-mono">
                {liveMerit!==null&&<span>Liyakat: <span className="text-cyan-400 font-bold">%{liveMerit}</span></span>}
                {metrics.sampleCount>0&&<>
                  <span>Bot: <span className={metrics.isBot?'text-rose-400 font-bold':'text-emerald-400'}>%{Math.round(metrics.botScore*100)}</span></span>
                  <span className="text-slate-600">Dwell:{metrics.dwellMean}ms Std:{metrics.dwellStd}</span>
                </>}
                <span className="ml-auto text-slate-600">[Semantik Vektör Analizi]</span>
              </div>
            )}
            <div className="ml-12 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">🛡️ Sentez Kalkanı</span>
              <button onClick={handlePost} disabled={posting||!text.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-full text-xs">
                {posting?'Analiz…':'Gönder'}
              </button>
            </div>
          </div>

          {/* Posts */}
          {posts.map(post=>(
            <article key={post.id} className={`border-b border-slate-800 p-4 hover:bg-slate-900/30 transition-colors ${post.bridgeTag?'border-l-2 border-l-purple-600':''}`}>
              <div className="flex gap-3">
                <img src={post.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt={post.author} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-white truncate">{post.author}</span>
                      <span className="text-xs text-slate-400 font-mono truncate">{post.handle}</span>
                      <span className="text-xs text-slate-500">· {post.time}</span>
                      {post.bridgeTag&&<span className="text-[10px] text-purple-400 shrink-0">{post.bridgeTag}</span>}
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={post.badge.status} meritScore={post.badge.merit}
                        botScore={post.badge.bot} isClickbait={post.badge.clickbait}
                        isManipulatedMedia={post.badge.tampered} inferenceTimeMs={post.badge.ms}
                        contentSnippet={post.text.slice(0,80)} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed mb-2">{post.text}</p>
                  {post.img&&(
                    <div className="relative rounded-xl overflow-hidden mb-2 border border-slate-800">
                      <img src={post.img} className="w-full h-48 object-cover" alt="" />
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-mono backdrop-blur-sm border ${post.badge.tampered?'bg-rose-950/90 border-rose-600 text-rose-300':'bg-emerald-950/90 border-emerald-600 text-emerald-300'}`}>
                        {post.badge.tampered?'⚠️ pHash: Tahrif':'✓ pHash: Özgün'}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-5 text-slate-500 text-xs">
                    <button className="hover:text-rose-400 transition-colors">❤️ {post.likes}</button>
                    <button className="hover:text-emerald-400 transition-colors">🔄 {post.reposts}</button>
                    <span>💬 {post.comments}</span>
                    <span className="ml-auto font-mono text-[10px] text-slate-600">⚡{post.badge.ms}ms</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </main>

        {/* RIGHT PANEL */}
        <aside className="w-64 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto p-3 space-y-4">
          {/* Louvain */}
          <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-white">🕸️ Louvain Graf</span>
              <span className="text-[10px] text-purple-400 font-mono">Katman 3</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <div className="p-2 bg-slate-900 rounded-xl text-center"><p className="text-[9px] text-slate-400">Q Modülerlik</p><p className="text-base font-bold font-mono text-purple-300">{g.modularityScore}</p></div>
              <div className="p-2 bg-slate-900 rounded-xl text-center"><p className="text-[9px] text-slate-400">Topluluklar</p><p className="text-base font-bold font-mono text-cyan-300">{clusters.length}</p></div>
            </div>
            <div className="space-y-1">
              {clusters.slice(0,4).map(([cid,members],i)=>{
                const isEcho=g.echoChambers.includes(Number(cid));
                const colors=['bg-emerald-500','bg-cyan-500','bg-purple-500','bg-amber-500'];
                return(
                  <div key={cid} className={`flex items-center justify-between p-1.5 rounded-lg ${isEcho?'bg-amber-950/30 border border-amber-800/40':'bg-slate-900/50'}`}>
                    <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${colors[i%4]}`}/><span className="text-[10px] text-slate-300">#{cid}</span></div>
                    <span className="text-[10px] text-slate-400">{(members as string[]).length} üye{isEcho?' 🔒':''}</span>
                  </div>
                );
              })}
            </div>
            {g.echoChambers.length>0&&<p className="text-[10px] text-amber-400 mt-2">⚠️ Yankı odası tespit edildi</p>}
          </div>

          {/* Biometrics */}
          <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-white">🧬 Biyometri</span>
              <span className="text-[10px] text-cyan-400 font-mono">Katman 1</span>
            </div>
            <div className="space-y-1 text-[10px]">
              {[['Dwell',`${metrics.dwellMean||112}ms`],['StdDev',`${metrics.dwellStd||28}ms`],['Flight',`${metrics.flightMean||145}ms`],['CPM',`${metrics.typingSpeedCPM||280}`]].map(([k,v])=>(
                <div key={k} className="flex justify-between p-1 bg-slate-900/60 rounded-lg"><span className="text-slate-400">{k}</span><span className="font-mono text-cyan-300">{v}</span></div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-3">
            <p className="text-xs font-bold text-white mb-2">🔥 Popüler</p>
            {['#TEKNOFEST2026','#SosyalYapayZeka','#EdgeComputing','#KVKK','#Sentez'].map((t,i)=>(
              <div key={t} className="py-1.5 border-b border-slate-800/60 last:border-0">
                <p className="text-xs font-semibold text-slate-200">{t}</p>
                <p className="text-[10px] text-slate-500">{[183,1290,863,258,92][i]} gönderi</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Metrics Modal */}
      {showMetrics&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur p-4">
          <div className="w-full max-w-lg bg-[#0f1117] border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-white">⚡ Edge/WASM Performans Metrikleri</h2>
              <button onClick={()=>setShowMetrics(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[['API Maliyeti','$0','text-emerald-400','Sıfır sunucu harcaması'],['INT8 Çıkarım','30–50ms','text-cyan-400','WASM/WebGPU (üretim)'],['Model Boyutu','28 MB','text-purple-400','440MB→INT8 sıkıştırma'],['pHash Analiz','<5ms','text-amber-400','Canvas API dHash+Hamming'],['Bot Tespiti','Anlık','text-rose-400','4-vektör füzyon (hook)'],['KVKK/GDPR','%100','text-emerald-400','Veri cihazda kalır'],].map(([l,v,c,s])=>(
                <div key={l as string} className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400">{l as string}</p>
                  <p className={`text-lg font-bold font-mono ${c as string}`}>{v as string}</p>
                  <p className="text-[9px] text-slate-500">{s as string}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-900 border border-emerald-800/30 rounded-xl text-[11px]">
              <p className="text-emerald-400 font-bold mb-1">İstemci Taraflı Çıkarım Motoru</p>
              <p className="text-slate-400">Semantik skor: <strong>Vektör tabanlı kosinüs benzerliği</strong>. Klavye biyometrisi: <strong>gerçek performance.now() Dwell/Flight zamanlaması</strong>.</p>
            </div>
            <button onClick={()=>setShowMetrics(false)} className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
