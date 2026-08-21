/**
 * Sentez Katman 3: Graf Tabanlı Akış Katmanı
 * Komşuluk Matrisi (Adjacency Matrix) Yöneticisi
 *
 * Kullanıcıların takip, beğeni, yorum ve repost etkileşimlerini
 * ağırlıklı komşuluk matrisine aktarır.
 */

import { InteractionEdge, InteractionType } from '@/types';

export class AdjacencyMatrixManager {
  private userIndexMap: Map<string, number> = new Map();
  private indexUserMap: Map<number, string> = new Map();
  private matrix: number[][] = [];
  private totalWeight = 0;

  private static interactionWeights: Record<InteractionType, number> = {
    follow: 5.0,
    repost: 3.5,
    comment: 2.5,
    like: 1.0,
  };

  /**
   * Etkileşim kenarlarını ekleyip komşuluk matrisini oluşturur
   */
  public buildMatrix(edges: InteractionEdge[]): void {
    this.userIndexMap.clear();
    this.indexUserMap.clear();
    this.totalWeight = 0;

    // 1. Unique kullanıcı indeks haritasını çıkar
    let currentIndex = 0;
    for (const edge of edges) {
      if (!this.userIndexMap.has(edge.sourceUserId)) {
        this.userIndexMap.set(edge.sourceUserId, currentIndex);
        this.indexUserMap.set(currentIndex, edge.sourceUserId);
        currentIndex++;
      }
      if (!this.userIndexMap.has(edge.targetUserId)) {
        this.userIndexMap.set(edge.targetUserId, currentIndex);
        this.indexUserMap.set(currentIndex, edge.targetUserId);
        currentIndex++;
      }
    }

    const n = this.userIndexMap.size;
    this.matrix = Array.from({ length: n }, () => new Array(n).fill(0));

    // 2. Ağırlıklı matris değerlerini doldur
    for (const edge of edges) {
      const u = this.userIndexMap.get(edge.sourceUserId)!;
      const v = this.userIndexMap.get(edge.targetUserId)!;
      const w = edge.weight || AdjacencyMatrixManager.interactionWeights[edge.type] || 1.0;

      this.matrix[u][v] += w;
      this.matrix[v][u] += w; // Undirected interaction graph
      this.totalWeight += w * 2;
    }
  }

  public getMatrix(): number[][] {
    return this.matrix;
  }

  public getUserIndex(userId: string): number | undefined {
    return this.userIndexMap.get(userId);
  }

  public getUserId(index: number): string | undefined {
    return this.indexUserMap.get(index);
  }

  public getNodeCount(): number {
    return this.userIndexMap.size;
  }

  public getTotalWeight(): number {
    return this.totalWeight;
  }
}
