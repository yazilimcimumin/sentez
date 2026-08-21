/**
 * Sentez Web Worker - İstemci Güvenlik Katmanı
 * UI Thread Donma Kalkanı: Çok Vektörlü Davranışsal Biyometri ve pHash işlemlerini çalıştırır.
 */

import { WorkerPayload, WorkerResponse, BotAnalysisResult } from '@/types';
import { MultiVectorBiometricsAnalyzer } from '@/lib/security/biometrics';

const biometricsAnalyzer = new MultiVectorBiometricsAnalyzer();

self.addEventListener('message', (event: MessageEvent<WorkerPayload>) => {
  const { type, requestId, data } = event.data;

  try {
    if (type === 'ANALYZE_BIOMETRICS' || type === 'ANALYZE_KEYSTROKE') {
      const payload = data as {
        keys?: Array<{ key: string; eventType: 'keydown' | 'keyup'; timestamp: number }>;
        mouse?: Array<{ x: number; y: number; timestamp: number }>;
        pastes?: number;
      };

      biometricsAnalyzer.reset();

      if (payload.keys) {
        payload.keys.forEach((k) => {
          if (k.eventType === 'keydown') biometricsAnalyzer.recordKeyDown(k.key, k.timestamp);
          if (k.eventType === 'keyup') biometricsAnalyzer.recordKeyUp(k.key, k.timestamp);
        });
      }

      if (payload.mouse) {
        payload.mouse.forEach((m) => biometricsAnalyzer.recordMouseMove(m.x, m.y, m.timestamp));
      }

      if (payload.pastes) {
        for (let i = 0; i < payload.pastes; i++) biometricsAnalyzer.recordPaste();
      }

      const result: BotAnalysisResult = biometricsAnalyzer.analyze();

      const response: WorkerResponse<BotAnalysisResult> = {
        type: 'ANALYZE_BIOMETRICS',
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
