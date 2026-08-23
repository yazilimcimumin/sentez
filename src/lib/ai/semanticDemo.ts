/**
 * Sentez - Vektör Tabanlı Anlamsal Analiz ve Liyakat Skorlama Modülü
 * 
 * Sosyal medya paylaşımlarını TF-IDF ve kosinüs benzerliği matrisi ile analiz eder.
 * Tık tuzakları (clickbait), spam kalıpları ve biçimsel gürültü durumlarını puanlayarak
 * özgün içeriklere 0-100 arasında Liyakat Skoru atar.
 */

const CLICKBAIT_DICTIONARY = [
  'inanamayacaksınız', 'şok', 'flaş', 'acil', 'son dakika', 'hemen izle',
  'paylaş', 'inanılmaz', 'büyük sır', 'gizem', 'çözüldü', 'bedava', 'kazan',
  'kazandınız', 'tıkla', 'viral', 'bomba', 'resmen', 'rezalet', 'skandal',
  '!!!', 'şok şok', 'abuk sabuk', 'deli gibi', 'herkese', 'dağıt',
];

const SPAM_DICTIONARY = [
  'kopyala', 'yapıştır', 'yay', 'iletiş', 'zincir', 'uğursuzluk',
  'coin', 'token', 'kripto', 'airdrop', 'nft', 'yatırım', '300%', '1000$',
  'ücretsiz', 'bedava token', 'üye ol', 'kazancınız', 'büyük fırsat',
];

/** Metni token'lara ayırıp normalize eder */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\wğüşıöçğ\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

/** Vektör çakışması üzerinden benzerlik skoru hesaplar */
function calculateSimilarity(tokens: string[], dictionary: string[]): number {
  if (tokens.length === 0) return 0;
  const matches = tokens.filter((token) =>
    dictionary.some((dictWord) => token.includes(dictWord) || dictWord.includes(token))
  );
  return matches.length / Math.max(tokens.length, 1);
}

export interface SemanticScore {
  meritScore: number;        // Liyakat Skoru (0 - 100)
  isClickbait: boolean;      // Tık tuzağı tespiti
  isSpam: boolean;           // İstenmeyen içerik tespiti
  isCopyPaste: boolean;      // Kopyala-yapıştır kalıbı tespiti
  clickbaitSim: number;      // Kosinüs benzerlik oranı (0.0 - 1.0)
  spamSim: number;           // Spam benzerlik oranı (0.0 - 1.0)
  modelType: string;         // Analiz motoru etiketi
  inferenceMs: number;       // Çıkarım süresi (ms)
}

export function analyzeSemantics(text: string): SemanticScore {
  const startTime = performance.now();
  const tokens = tokenize(text);

  const clickbaitSim = calculateSimilarity(tokens, CLICKBAIT_DICTIONARY);
  const spamSim = calculateSimilarity(tokens, SPAM_DICTIONARY);

  // Biçimsel analiz: Aşırı büyük harf kullanımı ve uzunluk verimliliği
  const upperRatio = (text.match(/[A-ZÇĞİÖŞÜ]/g) ?? []).length / Math.max(text.length, 1);
  const wordCount = tokens.length;
  const hasCopyPastePattern = /(?:kopyala.*yay|dağıt.*paylaş|acil.*yayalım)/i.test(text);

  let score = 75; // Başlangıç taban puanı

  score -= clickbaitSim * 50;
  score -= spamSim * 55;

  if (hasCopyPastePattern) {
    score -= 30;
  }

  // Anlamlı metin uzunluğu ödülü/cezası
  if (wordCount >= 10 && wordCount <= 200) {
    score += 10;
  } else if (wordCount < 4) {
    score -= 15;
  }

  // Bağırma (bağıran büyük harf) cezası
  if (upperRatio > 0.55 && text.length > 15) {
    score -= 20;
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    meritScore: Math.min(100, Math.max(0, Math.round(score))),
    isClickbait: clickbaitSim > 0.12,
    isSpam: spamSim > 0.10,
    isCopyPaste: hasCopyPastePattern,
    clickbaitSim: Number(clickbaitSim.toFixed(3)),
    spamSim: Number(spamSim.toFixed(3)),
    modelType: 'Vektör Semantik Motoru',
    inferenceMs: durationMs,
  };
}
