/**
 * Sentez Web Worker - Graf Tabanlı Akış Katmanı
 * UI Thread Donma Kalkanı: Komşuluk matrisi ve Louvain Topluluk Tespiti işlemlerini çalıştırır.
 */

import { WorkerPayload, WorkerResponse, InteractionEdge, CommunityDetectionResult } from '@/types';
import { AdjacencyMatrixManager } from '@/lib/graph/adjacencyMatrix';
import { LouvainCommunityDetector } from '@/lib/graph/louvain';

self.addEventListener('message', (event: MessageEvent<WorkerPayload<InteractionEdge[]>>) => {
  const { type, requestId, data } = event.data;

  try {
    if (type === 'RUN_LOUVAIN') {
      const matrixManager = new AdjacencyMatrixManager();
      matrixManager.buildMatrix(data);

      const result: CommunityDetectionResult = LouvainCommunityDetector.detectCommunities(matrixManager);

      const response: WorkerResponse<CommunityDetectionResult> = {
        type: 'RUN_LOUVAIN',
        requestId,
        success: true,
        data: result,
      };
      self.postMessage(response);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type,
      requestId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown graph worker error',
    };
    self.postMessage(response);
  }
});
