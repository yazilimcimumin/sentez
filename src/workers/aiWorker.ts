/**
 * Sentez Web Worker - Anlamsal Nitelik Katmanı
 * UI Thread Donma Kalkanı: INT8 ONNX Model çıkarımı ve Vektörel Kosinüs aramalarını çalıştırır.
 */

import { WorkerPayload, WorkerResponse, TextAnalysisRequest, SemanticAnalysisResult } from '@/types';
import { OnnxSemanticEngine } from '@/lib/ai/onnxBridge';

self.addEventListener('message', async (event: MessageEvent<WorkerPayload<TextAnalysisRequest>>) => {
  const { type, requestId, data } = event.data;

  try {
    if (type === 'SEMANTIC_INFERENCE') {
      const result: SemanticAnalysisResult = await OnnxSemanticEngine.analyzeText(data.id, data.content);

      const response: WorkerResponse<SemanticAnalysisResult> = {
        type: 'SEMANTIC_INFERENCE',
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
      error: error instanceof Error ? error.message : 'Unknown AI worker error',
    };
    self.postMessage(response);
  }
});
