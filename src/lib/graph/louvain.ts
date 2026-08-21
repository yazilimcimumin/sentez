/**
 * Sentez Katman 3: Graf Tabanlı Akış Katmanı
 * Louvain Topluluk Tespiti Algoritması & Modülerlik Skoru Tespiti
 *
 * Kullanıcı etkileşim grafında izole fikir kümelerini (yankı odaları)
 * ve Modülerlik Skoru'nu (Q) %100 istemci tarafında hesaplar.
 */

import { CommunityDetectionResult } from '@/types';
import { AdjacencyMatrixManager } from './adjacencyMatrix';

export class LouvainCommunityDetector {
  /**
   * Louvain Algoritmasını çalıştırıp Toplulukları ve Modülerlik Skorunu hesaplar
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

    // Initialize each node in its own community
    const communities: number[] = Array.from({ length: n }, (_, i) => i);
    let improvement = true;
    let iterations = 0;
    const maxIterations = 10;

    // Node degrees (sum of weights connected to node)
    const k: number[] = matrix.map((row) => row.reduce((sum, val) => sum + val, 0));
    const m2 = matrixManager.getTotalWeight() || 1; // 2 * total graph weight

    // Louvain Phase 1: Modular Optimization
    while (improvement && iterations < maxIterations) {
      improvement = false;
      iterations++;

      for (let i = 0; i < n; i++) {
        const currentComm = communities[i];
        let bestComm = currentComm;
        let maxDeltaQ = 0;

        // Neighbor communities
        const neighborComms = new Set<number>();
        for (let j = 0; j < n; j++) {
          if (matrix[i][j] > 0) {
            neighborComms.add(communities[j]);
          }
        }

        for (const targetComm of neighborComms) {
          if (targetComm === currentComm) continue;

          // Modularity gain calculation ΔQ
          const deltaQ = this.calculateModularityGain(i, targetComm, matrix, communities, k, m2);
          if (deltaQ > maxDeltaQ) {
            maxDeltaQ = deltaQ;
            bestComm = targetComm;
          }
        }

        if (bestComm !== currentComm) {
          communities[i] = bestComm;
          improvement = true;
        }
      }
    }

    // Calculate final Modularity Score Q
    const modularityScore = this.calculateModularity(matrix, communities, k, m2);

    // Map back node indices to user IDs and cluster groups
    const userCommunityMap = new Map<string, number>();
    const communityClusters: Record<number, string[]> = {};

    for (let i = 0; i < n; i++) {
      const userId = matrixManager.getUserId(i);
      if (userId) {
        const commId = communities[i];
        userCommunityMap.set(userId, commId);
        if (!communityClusters[commId]) {
          communityClusters[commId] = [];
        }
        communityClusters[commId].push(userId);
      }
    }

    // Identify Echo Chambers (Communities with modularity isolation > 0.40 & member size > 3)
    const echoChambers: number[] = [];
    if (modularityScore > 0.35) {
      Object.entries(communityClusters).forEach(([commIdStr, members]) => {
        if (members.length >= 3) {
          echoChambers.push(Number(commIdStr));
        }
      });
    }

    return {
      modularityScore: Number(modularityScore.toFixed(4)),
      userCommunityMap,
      communityClusters,
      echoChambers,
    };
  }

  private static calculateModularityGain(
    node: number,
    targetComm: number,
    matrix: number[][],
    communities: number[],
    k: number[],
    m2: number
  ): number {
    let k_i_in = 0;
    let sum_tot = 0;

    for (let j = 0; j < matrix.length; j++) {
      if (communities[j] === targetComm) {
        k_i_in += matrix[node][j];
        sum_tot += k[j];
      }
    }

    const k_i = k[node];
    return (k_i_in / m2) - (sum_tot * k_i) / (m2 * m2);
  }

  private static calculateModularity(
    matrix: number[][],
    communities: number[],
    k: number[],
    m2: number
  ): number {
    let Q = 0;
    const n = matrix.length;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (communities[i] === communities[j]) {
          const A_ij = matrix[i][j];
          const expected = (k[i] * k[j]) / m2;
          Q += A_ij - expected;
        }
      }
    }

    return Q / m2;
  }
}
