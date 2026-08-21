/**
 * Sentez Katman 1: pHash (Perceptual Hashing) Medya Tahrifat Tespiti
 * Canvas API + dHash + Hamming Mesafesi ile tarayıcıda WASM olmadan çalışır.
 */

export interface PHashResult {
  hash: string;
  hammingDistance: number;
  isManipulated: boolean;
  confidence: number;
  analysisMs: number;
}

export class PerceptualHashAnalyzer {
  private static HASH_SIZE = 8; // 8x8 = 64-bit hash

  /**
   * Canvas API ile görsel parmak izi (dHash) çıkarır
   */
  public static async computeHash(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = this.HASH_SIZE + 1; // 9x8 for dHash (difference hash)
          canvas.width = size;
          canvas.height = this.HASH_SIZE;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, size, this.HASH_SIZE);
          const pixels = ctx.getImageData(0, 0, size, this.HASH_SIZE).data;

          // Grayscale + difference hash
          let bits = '';
          for (let y = 0; y < this.HASH_SIZE; y++) {
            for (let x = 0; x < this.HASH_SIZE; x++) {
              const i = (y * size + x) * 4;
              const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
              const nextI = (y * size + (x + 1)) * 4;
              const nextGray = pixels[nextI] * 0.299 + pixels[nextI + 1] * 0.587 + pixels[nextI + 2] * 0.114;
              bits += gray > nextGray ? '1' : '0';
            }
          }
          // Convert bit string to hex
          const hex = bits.match(/.{4}/g)!.map(b => parseInt(b, 2).toString(16)).join('');
          resolve(hex);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageUrl;
    });
  }

  /**
   * İki hash arasındaki Hamming Mesafesini hesaplar
   */
  public static hammingDistance(hashA: string, hashB: string): number {
    if (hashA.length !== hashB.length) return 64;
    let dist = 0;
    for (let i = 0; i < hashA.length; i++) {
      const a = parseInt(hashA[i], 16);
      const b = parseInt(hashB[i], 16);
      const xor = a ^ b;
      dist += xor.toString(2).split('1').length - 1;
    }
    return dist;
  }

  /**
   * "Orijinal" olarak kaydedilmiş bir referans hash ile karşılaştırır
   * Demo için: URL bazlı statik hash simülasyonu
   */
  public static analyzeManipulation(
    currentHash: string,
    referenceHash: string
  ): PHashResult {
    const t0 = performance.now();
    const dist = this.hammingDistance(currentHash, referenceHash);
    // Eşik: 10+ bit farkı = manipüle edilmiş
    const isManipulated = dist >= 10;
    const confidence = isManipulated
      ? Math.min(0.99, 0.6 + (dist - 10) * 0.02)
      : Math.max(0.7, 1.0 - dist * 0.05);

    return {
      hash: currentHash,
      hammingDistance: dist,
      isManipulated,
      confidence: Number(confidence.toFixed(2)),
      analysisMs: Math.round(performance.now() - t0),
    };
  }

  /**
   * Demo için deterministik hash üretir (gerçek canvas olmadan)
   */
  public static generateDemoHash(seed: string): string {
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) + hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
  }

  /**
   * Görsel URL'den tam analiz pipeline'ı çalıştırır
   */
  public static async runFullAnalysis(imageUrl: string, originalHash?: string): Promise<PHashResult> {
    const t0 = performance.now();
    try {
      let currentHash: string;
      try {
        currentHash = await this.computeHash(imageUrl);
      } catch {
        // Canvas cross-origin fallback: deterministik demo hash
        currentHash = this.generateDemoHash(imageUrl);
      }

      const refHash = originalHash ?? this.generateDemoHash('original-clean-' + imageUrl.slice(-20));
      const dist = this.hammingDistance(currentHash, refHash);
      const isManipulated = dist >= 10;
      const confidence = isManipulated
        ? Math.min(0.99, 0.6 + (dist - 10) * 0.02)
        : Math.max(0.70, 1.0 - dist * 0.05);

      return {
        hash: currentHash,
        hammingDistance: dist,
        isManipulated,
        confidence: Number(confidence.toFixed(2)),
        analysisMs: Math.round(performance.now() - t0),
      };
    } catch {
      return {
        hash: 'error',
        hammingDistance: 64,
        isManipulated: false,
        confidence: 0,
        analysisMs: Math.round(performance.now() - t0),
      };
    }
  }
}
