/**
 * Sentez Katman 3: Graf Tabanlı Akış Katmanı
 * Graphology + Graphology-Communities-Louvain Entegrasyonu
 * 
 * Gerçek Louvain topluluk tespiti kütüphanesi kullanarak
 * etkileşim grafında izole fikir kümelerini (yankı odaları)
 * ve Modülerlik Skoru'nu (Q) %100 istemci tarafında hesaplar.
 */

import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import { CommunityDetectionResult } from '@/types';
import { AdjacencyMatrixManager } from './adjacencyMatrix';

export class LouvainCommunityDetector {
  /**
   * Graphology & Louvain kütüphanesi ile Topluluk Tespiti ve Modülerlik Skoru hesaplar
   */
  public static detectCommunities(matrixManager: AdjacencyMatrixManager): CommunityDetectionResult {
    const matrix = matrixManager.getMatrix();
    const n = matrixManager.getNodeCount();

    if (n === 0) {
      return {
        modularityScore: 0,
        userCommunityMap: new Map(),
        communityClusters: {},
        echoChambers: [],
      };
    }

    // Graphology graf örneği oluştur (Undirected / Yönsüz Graf)
    const graph = new Graph({ type: 'undirected' });

    // Düğümleri ekle
    for (let i = 0; i < n; i++) {
      const userId = matrixManager.getUserId(i) || `node_${i}`;
      if (!graph.hasNode(userId)) {
        graph.addNode(userId);
      }
    }

    // Kenarları (Edges) ağırlıklarıyla ekle
    for (let i = 0; i < n; i++) {
      const sourceId = matrixManager.getUserId(i) || `node_${i}`;
      for (let j = i + 1; j < n; j++) {
        const weight = matrix[i][j];
        if (weight > 0) {
          const targetId = matrixManager.getUserId(j) || `node_${j}`;
          if (!graph.hasEdge(sourceId, targetId)) {
            graph.addEdge(sourceId, targetId, { weight });
          }
        }
      }
    }

    // Gerçek Louvain Algoritmasını çalıştır (Detailed Modularity & Communities)
    let details: { modularity: number; communities: Record<string, number> };
    try {
      details = louvain.detailed(graph, { getEdgeWeight: 'weight' });
    } catch {
      // Kenarsız/tekli durumlarda fallback
      const communitiesFallback: Record<string, number> = {};
      graph.nodes().forEach((node, idx) => {
        communitiesFallback[node] = idx;
      });
      details = { modularity: 0, communities: communitiesFallback };
    }

    const userCommunityMap = new Map<string, number>();
    const communityClusters: Record<number, string[]> = {};

    Object.entries(details.communities).forEach(([userId, commId]) => {
      userCommunityMap.set(userId, commId);
      if (!communityClusters[commId]) {
        communityClusters[commId] = [];
      }
      communityClusters[commId].push(userId);
    });

    const modularityScore = Number(details.modularity.toFixed(4));

    // Yankı Odaları Tespiti (Modülerlik > 0.30 & üye sayısı >= 2)
    const echoChambers: number[] = [];
    if (modularityScore > 0.30 || Object.keys(communityClusters).length >= 2) {
      Object.entries(communityClusters).forEach(([commIdStr, members]) => {
        if (members.length >= 2) {
          echoChambers.push(Number(commIdStr));
        }
      });
    }

    return {
      modularityScore,
      userCommunityMap,
      communityClusters,
      echoChambers,
    };
  }
}
