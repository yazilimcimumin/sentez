/**
 * Sentez Katman 1: İstemci Güvenlik Katmanı
 * Keystroke Dynamics (Klavye Vuruş Ritmi) Bot Tespit Modülü
 *
 * %100 İstemci Tarafında, milisaniyelik hassasiyette (performance.now()) çalışır.
 * Klavye vuruşlarının basılı kalma süresi (Dwell Time), tuşlar arası uçuş süresi (Flight Time)
 * ve varyasyon istatistiklerini hesaplayarak otomasyon / bot skoru üretir.
 */

import {
  KeystrokeTimingEvent,
  KeystrokeFeatureVector,
  BotAnalysisResult,
} from '@/types';

export class KeystrokeDynamicsAnalyzer {
  private events: KeystrokeTimingEvent[] = [];
  private activeKeyDownMap: Map<string, number> = new Map();
  private maxBufferSize: number;
  private botThreshold: number;

  constructor(maxBufferSize = 200, botThreshold = 0.70) {
    this.maxBufferSize = maxBufferSize;
    this.botThreshold = botThreshold;
  }

  /**
   * Keydown olayını milisaniye hassasiyetinde kaydeder
   */
  public recordKeyDown(key: string, customTimestamp?: number): void {
    const timestamp = customTimestamp ?? performance.now();
    
    // Ignore modifier keys that distort rhythm analysis
    if (this.isIgnoredKey(key)) return;

    // Record initial keydown if not repeating
    if (!this.activeKeyDownMap.has(key)) {
      this.activeKeyDownMap.set(key, timestamp);
    }

    this.pushEvent({ key, eventType: 'keydown', timestamp });
  }

  /**
   * Keyup olayını milisaniye hassasiyetinde kaydeder
   */
  public recordKeyUp(key: string, customTimestamp?: number): void {
    const timestamp = customTimestamp ?? performance.now();

    if (this.isIgnoredKey(key)) return;

    this.activeKeyDownMap.delete(key);
    this.pushEvent({ key, eventType: 'keyup', timestamp });
  }

  /**
   * Mevcut vuruş serisini analiz edip Bot Skoru üretir
   */
  public analyze(): BotAnalysisResult {
    const features = this.extractFeatures();
    const botScore = this.calculateBotScore(features);
    const isBot = botScore >= this.botThreshold;

    return {
      botScore: Number(botScore.toFixed(4)),
      isBot,
      confidence: this.calculateConfidence(features.totalEvents),
      features,
      timestamp: Date.now(),
    };
  }

  /**
   * Arabelleği temizler
   */
  public reset(): void {
    this.events = [];
    this.activeKeyDownMap.clear();
  }

  /**
   * HTML Girdi alanlarına otomatik dinleyici bağlar
   */
  public attachListeners(element: HTMLElement): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.recordKeyDown(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.recordKeyUp(e.key);
    };

    element.addEventListener('keydown', handleKeyDown as EventListener);
    element.addEventListener('keyup', handleKeyUp as EventListener);

    // Detach cleanup callback
    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener);
      element.removeEventListener('keyup', handleKeyUp as EventListener);
    };
  }

  private pushEvent(event: KeystrokeTimingEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxBufferSize) {
      this.events.shift();
    }
  }

  private isIgnoredKey(key: string): boolean {
    const ignored = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];
    return ignored.includes(key);
  }

  /**
   * Dwell Time, Flight Time ve Hız Vektörlerini Çıkarır
   */
  private extractFeatures(): KeystrokeFeatureVector {
    const dwellTimes: number[] = [];
    const flightTimes: number[] = [];

    // Pair up keydown and keyup events for Dwell Time
    const keyDownMap = new Map<string, number>();

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      if (event.eventType === 'keydown') {
        keyDownMap.set(event.key, event.timestamp);
      } else if (event.eventType === 'keyup') {
        const pressTime = keyDownMap.get(event.key);
        if (pressTime !== undefined) {
          const dwell = event.timestamp - pressTime;
          if (dwell >= 0 && dwell < 5000) { // filter extreme anomalies
            dwellTimes.push(dwell);
          }
          keyDownMap.delete(event.key);
        }
      }
    }

    // Calculate Flight Time between consecutive key strokes
    for (let i = 0; i < this.events.length - 1; i++) {
      const curr = this.events[i];
      const next = this.events[i + 1];

      if (curr.eventType === 'keyup' && next.eventType === 'keydown') {
        const flight = next.timestamp - curr.timestamp;
        if (flight >= -100 && flight < 5000) {
          flightTimes.push(flight);
        }
      }
    }

    // Statistical Calculations
    const dwellTimeMean = this.calculateMean(dwellTimes);
    const dwellTimeStdDev = this.calculateStdDev(dwellTimes, dwellTimeMean);

    const flightTimeMean = this.calculateMean(flightTimes);
    const flightTimeStdDev = this.calculateStdDev(flightTimes, flightTimeMean);

    // Typing speed calculation (Characters per minute)
    let typingSpeedCPM = 0;
    if (this.events.length >= 2) {
      const startTime = this.events[0].timestamp;
      const endTime = this.events[this.events.length - 1].timestamp;
      const durationMinutes = (endTime - startTime) / 60000;
      if (durationMinutes > 0) {
        typingSpeedCPM = (this.events.length / 2) / durationMinutes;
      }
    }

    // Combined rhythm variance
    const rhythmVariance = (dwellTimeStdDev + flightTimeStdDev) / 2;

    return {
      dwellTimeMean: Number(dwellTimeMean.toFixed(2)),
      dwellTimeStdDev: Number(dwellTimeStdDev.toFixed(2)),
      flightTimeMean: Number(flightTimeMean.toFixed(2)),
      flightTimeStdDev: Number(flightTimeStdDev.toFixed(2)),
      typingSpeedCPM: Number(typingSpeedCPM.toFixed(2)),
      rhythmVariance: Number(rhythmVariance.toFixed(2)),
      totalEvents: this.events.length,
    };
  }

  /**
   * İstatistiksel Verilerden Bot Skoru Hesaplama (0.0 - 1.0)
   */
  private calculateBotScore(features: KeystrokeFeatureVector): number {
    if (features.totalEvents < 6) {
      // Yetersiz veri - nötr skor
      return 0.1;
    }

    let score = 0.0;

    // 1. Dwell Time Variance Anomalisı (İnsan tuşu tam olarak aynı süre basılı tutamaz)
    if (features.dwellTimeStdDev < 2.0) { // Robotik mükemmel zamanlama (<2ms)
      score += 0.35;
    } else if (features.dwellTimeStdDev < 5.0) {
      score += 0.15;
    }

    // 2. Flight Time Anomalisı (Sıfır veya sabit milisaniyelik gecikme)
    if (features.flightTimeStdDev < 3.0) {
      score += 0.35;
    } else if (features.flightTimeStdDev < 8.0) {
      score += 0.15;
    }

    // 3. Aşırı Yazma Hızı (Super-human typing speed > 1000 CPM)
    if (features.typingSpeedCPM > 1200) { // Otomatik script yapıştırma
      score += 0.40;
    } else if (features.typingSpeedCPM > 800) {
      score += 0.20;
    }

    // 4. Aşırı düşük dwell süresi (Microsecond instant synthetic keystrokes)
    if (features.dwellTimeMean < 8.0) {
      score += 0.25;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  private calculateConfidence(totalEvents: number): number {
    // 20+ event veren veri setinde %95+ güvenilirlik
    return Math.min(1.0, totalEvents / 20);
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) return 0;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}
