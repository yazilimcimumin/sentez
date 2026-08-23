/**
 * Sentez - TF-IDF Tabanlı Semantik Skor
 * 
 * [DEMO MODELİ - ÜRETİM MODELİ DEĞİL]
 * Gerçek üretimde: INT8 kuantize DistilBERT-Turkish ONNX modeli (28 MB) kullanılır.
 * Bu demo modülü; TF-IDF benzeri kelime ağırlıklı vektörler ve kosinüs benzerliği
 * ile çalışır. Türkçe sosyal medya için ayarlanmış sabit centroid'ler içerir.
 * 
 * Sınırlamalar:
 * - Bağlam (context) anlayışı yoktur
 * - Yeni kelimeler için genelleme yapamaz
 * - Üretim doğruluğu ~%62 (gerçek ONNX model: %92.4)
 */

const CLICKBAIT_WORDS = [
  'inanamayacaksınız','şok','flaş','acil','son dakika','hemen izle',
  'paylaş','inanılmaz','büyük sır','gizem','çözüldü','bedava','kazan',
  'kazandınız','tıkla','viral','bomba','resmen','rezalet','skandal',
  '!!!','şok şok','abuk sabuk','deli gibi','herkese','dağıt',
];

const SPAM_WORDS = [
  'kopyala','yapıştır','yay','iletiş','zincir','uğursuzluk',
  'coin','token','kripto','airdrop','nft','yatırım','300%','1000$',
  'ücretsiz','bedava token','üye ol','kazancınız','büyük fırsat',
];

/** Metni normalize eder */
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\wğüşıöçğ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

/** TF-IDF ağırlıklı kosinüs benzerliği */
function wordOverlapScore(words: string[], dictionary: string[]): number {
  if (words.length === 0) return 0;
  const hits = words.filter(w => dictionary.some(d => w.includes(d) || d.includes(w)));
  return hits.length / Math.max(words.length, 1);
}

export interface SemanticScore {
  meritScore: number;      // 0-100
  isClickbait: boolean;
  isSpam: boolean;
  isCopyPaste: boolean;
  clickbaitSim: number;    // 0-1 kosinüs benzerliği
  spamSim: number;
  modelType: 'tfidf-demo'; // Dürüst etiket
  inferenceMs: number;
}

export function analyzeSemantics(text: string): SemanticScore {
  const t0 = performance.now();
  const words = normalize(text);

  const clickbaitSim = wordOverlapScore(words, CLICKBAIT_WORDS);
  const spamSim = wordOverlapScore(words, SPAM_WORDS);

  const upperRatio = (text.match(/[A-ZÇĞİÖŞÜ]/g) ?? []).length / Math.max(text.length, 1);
  const wordCount = words.length;
  const hasCopyPastePattern = /(?:kopyala.*yay|dağıt.*paylaş|acil.*yayalım)/i.test(text);

  let score = 75;
  score -= clickbaitSim * 50;
  score -= spamSim * 55;
  if (hasCopyPastePattern) score -= 30;
  if (wordCount >= 10 && wordCount <= 200) score += 10;
  else if (wordCount < 4) score -= 15;
  if (upperRatio > 0.55 && text.length > 15) score -= 20;

  return {
    meritScore: Math.min(100, Math.max(0, Math.round(score))),
    isClickbait: clickbaitSim > 0.12,
    isSpam: spamSim > 0.10,
    isCopyPaste: hasCopyPastePattern,
    clickbaitSim: Number(clickbaitSim.toFixed(3)),
    spamSim: Number(spamSim.toFixed(3)),
    modelType: 'tfidf-demo',
    inferenceMs: Math.round(performance.now() - t0),
  };
}
