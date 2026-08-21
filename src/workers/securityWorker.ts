/**
 * Sentez Web Worker - İstemci Güvenlik Katmanı
 * UI Thread Donma Kalkanı: Keystroke Dynamics ve pHash işlemlerini arka planda çalıştırır.
 */

import { WorkerPayload, WorkerResponse, BotAnalysisResult } from '@/types';
import { KeystrokeDynamicsAnalyzer } from '@/lib/security/keystroke';

const analyzer = new KeystrokeDynamicsAnalyzer();

self.addEventListener('message', (event: MessageEvent<WorkerPayload>) => {
  const { type, requestId, data } = event.data;

  try {
    if (type === 'ANALYZE_KEYSTROKE') {
      const events = data as Array<{ key: string; eventType: 'keydown' | 'keyup'; timestamp: number }>;
      analyzer.reset();
      events.forEach((e) => {
        if (e.eventType === 'keydown') analyzer.recordKeyDown(e.key, e.timestamp);
        if (e.eventType === 'keyup') analyzer.recordKeyUp(e.key, e.timestamp);
      });

      const result: BotAnalysisResult = analyzer.analyze();

      const response: WorkerResponse<BotAnalysisResult> = {
        type: 'ANALYZE_KEYSTROKE',
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
      error: error instanceof Error ? error.message : 'Unknown security worker error',
    };
    self.postMessage(response);
  }
});
