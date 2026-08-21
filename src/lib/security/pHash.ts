/**
 * Sentez Katman 1: İstemci Güvenlik Katmanı
 * Perceptual Hashing (pHash) Medya Tahrifat Analiz Modülü
 *
 * %100 İstemci tarafında WebAssembly (WASM) veya Canvas API üzerinden
 * medyanın algısal parmak izini çıkarır ve tahrifat / kopyalama analizini gerçekleştirir.
 */

import { MediaHashResult } from '@/types';

export class PerceptualHashAnalyzer {
  /**
   * Görsel HTMLImageElement veya Canvas verisinden 64-bit dHash / pHash üretir
   */
  public static async generateImageHash(imageElement: HTMLImageElement): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not supported'));
          return;
        }

        // Resize image to 9x8 for Difference Hash (dHash) calculation
        canvas.width = 9;
        canvas.height = 8;
        ctx.drawImage(imageElement, 0, 0, 9, 8);

        const imageData = ctx.getImageData(0, 0, 9, 8);
        const pixels = imageData.data;

        // Convert to grayscale
        const grays: number[] = [];
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          grays.push(gray);
        }

        // Compute row adjacent difference bit string
        let binaryHash = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const left = grays[row * 9 + col];
            const right = grays[row * 9 + col + 1];
            binaryHash += left < right ? '1' : '0';
          }
        }

        // Convert binary string to hexadecimal hash string
        let hexHash = '';
        for (let i = 0; i < binaryHash.length; i += 4) {
          const nibble = binaryHash.substring(i, i + 4);
          hexHash += parseInt(nibble, 2).toString(16);
        }

        resolve(hexHash);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * İki pHash arasındaki Hamming Mesafesini hesaplar (0 = aynı görsel, >10 = farklı)
   */
  public static calculateHammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 64;

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      const val1 = parseInt(hash1[i], 16);
      const val2 = parseInt(hash2[i], 16);
      let xor = val1 ^ val2;
      while (xor > 0) {
        distance += xor & 1;
        xor >>= 1;
      }
    }
    return distance;
  }

  /**
   * Medya tahrifat ve parmak izi analizi gerçekleştirir
   */
  public static async analyzeMedia(imageElement: HTMLImageElement, knownManipulatedHashes: string[] = []): Promise<MediaHashResult> {
    const hash = await this.generateImageHash(imageElement);
    
    let isManipulated = false;
    let minDistance = 64;

    for (const targetHash of knownManipulatedHashes) {
      const dist = this.calculateHammingDistance(hash, targetHash);
      if (dist < minDistance) {
        minDistance = dist;
      }
      if (dist <= 8) { // Perceptual match threshold
        isManipulated = true;
        break;
      }
    }

    const confidence = isManipulated ? Math.max(0.7, 1 - minDistance / 64) : 0.95;

    return {
      hash,
      perceptualFingerprint: `phash-v1:${hash}`,
      isManipulated,
      confidence: Number(confidence.toFixed(2)),
    };
  }
}
