/**
 * Sentez Katman 2: Anlamsal Nitelik Katmanı
 * Kosinüs Benzerliği (Cosine Similarity) ve Liyakat Skoru Hesaplama
 */

export class VectorSimilarityCalculator {
  /**
   * İki vektör arasındaki Kosinüs Benzerliğini (Cosine Similarity) hesaplar
   * cos(theta) = (A . B) / (||A|| * ||B||)
   */
  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Özgün içeriklere matematiksel Liyakat Skoru (0 - 100) atar
   */
  public static calculateMeritScore(params: {
    text: string;
    clickbaitSim: number;
    spamSim: number;
    isCopyPaste: boolean;
  }): number {
    const { text, clickbaitSim, spamSim, isCopyPaste } = params;

    let score = 75; // Baseline score for standard posts

    // Penalize Clickbait, Spam and Copy-Paste
    score -= clickbaitSim * 45;
    score -= spamSim * 50;

    if (isCopyPaste) {
      score -= 30;
    }

    // Length and formatting metrics (rewarding structured, original content)
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount >= 15 && wordCount <= 250) {
      score += 10; // Well structured length
    } else if (wordCount < 5) {
      score -= 15; // Low effort content
    }

    // Punctuation and uppercase noise penalty
    const upperRatio = (text.match(/[A-ZÇĞİÖŞÜ]/g) || []).length / (text.length || 1);
    if (upperRatio > 0.60 && text.length > 20) {
      score -= 20; // Aggressive shouting penalty
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  public static getClickbaitCentroid(): number[] {
    const centroid = new Array(128).fill(0.15);
    centroid[0] = 0.8;
    centroid[1] = 0.6;
    return centroid;
  }

  public static getSpamCentroid(): number[] {
    const centroid = new Array(128).fill(-0.2);
    centroid[2] = 0.9;
    centroid[3] = 0.75;
    return centroid;
  }
}
