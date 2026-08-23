/**
 * Sentez — Louvain Birim Testleri
 */

import { AdjacencyMatrixManager } from '../src/lib/graph/adjacencyMatrix';
import { LouvainCommunityDetector } from '../src/lib/graph/louvain';

describe('AdjacencyMatrixManager', () => {
  test('boş edge listesi için boş matris döner', () => {
    const mgr = new AdjacencyMatrixManager();
    mgr.buildMatrix([]);
    expect(mgr.getNodeCount()).toBe(0);
    expect(mgr.getMatrix()).toHaveLength(0);
  });

  test('edge\'ler matrise doğru ağırlıkla eklenir', () => {
    const mgr = new AdjacencyMatrixManager();
    mgr.buildMatrix([{ sourceUserId: 'A', targetUserId: 'B', weight: 5, type: 'like' }]);
    expect(mgr.getNodeCount()).toBe(2);
    const m = mgr.getMatrix();
    expect(m[0][1]).toBe(5);
    expect(m[1][0]).toBe(5); // undirected
  });

  test('toplam ağırlık doğru hesaplanır', () => {
    const mgr = new AdjacencyMatrixManager();
    mgr.buildMatrix([{ sourceUserId: 'A', targetUserId: 'B', weight: 3, type: 'follow' }]);
    expect(mgr.getTotalWeight()).toBe(6); // 2 * weight (undirected)
  });
});

describe('LouvainCommunityDetector', () => {
  test('boş graf için boş sonuç döner', () => {
    const mgr = new AdjacencyMatrixManager();
    mgr.buildMatrix([]);
    const result = LouvainCommunityDetector.detectCommunities(mgr);
    expect(result.modularityScore).toBe(0);
    expect(Object.keys(result.communityClusters)).toHaveLength(0);
  });

  test('birbirine bağlı iki küme için topluluk tespiti çalışır', () => {
    const mgr = new AdjacencyMatrixManager();
    // Küme 1: A-B-C arası yoğun
    // Küme 2: D-E-F arası yoğun
    // Kümeler arası: C-D zayıf bağ
    mgr.buildMatrix([
      { sourceUserId: 'A', targetUserId: 'B', weight: 10, type: 'follow' },
      { sourceUserId: 'B', targetUserId: 'C', weight: 10, type: 'follow' },
      { sourceUserId: 'A', targetUserId: 'C', weight: 10, type: 'follow' },
      { sourceUserId: 'D', targetUserId: 'E', weight: 10, type: 'follow' },
      { sourceUserId: 'E', targetUserId: 'F', weight: 10, type: 'follow' },
      { sourceUserId: 'D', targetUserId: 'F', weight: 10, type: 'follow' },
      { sourceUserId: 'C', targetUserId: 'D', weight: 1, type: 'like' },
    ]);
    const result = LouvainCommunityDetector.detectCommunities(mgr);
    expect(result.userCommunityMap.size).toBe(6);
    expect(Object.keys(result.communityClusters).length).toBeGreaterThanOrEqual(1);
  });

  test('modülerlik skoru -1 ile 1 arasında olur', () => {
    const mgr = new AdjacencyMatrixManager();
    mgr.buildMatrix([
      { sourceUserId: 'X', targetUserId: 'Y', weight: 5, type: 'like' },
      { sourceUserId: 'Y', targetUserId: 'Z', weight: 3, type: 'comment' },
    ]);
    const { modularityScore } = LouvainCommunityDetector.detectCommunities(mgr);
    expect(modularityScore).toBeGreaterThanOrEqual(-1);
    expect(modularityScore).toBeLessThanOrEqual(1);
  });
});
