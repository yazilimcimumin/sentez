/**
 * Sentez Katman 1: İstemci Güvenlik Katmanı
 * Keystroke Dynamics (Klavye Vuruş Ritmi) Bot Tespit Modülü
 */

import {
  KeystrokeTimingEvent,
  BiometricFeatures,
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

  public recordKeyDown(key: string, customTimestamp?: number): void {
    const timestamp = customTimestamp ?? performance.now();
    if (this.isIgnoredKey(key)) return;
    if (!this.activeKeyDownMap.has(key)) {
      this.activeKeyDownMap.set(key, timestamp);
    }
    this.pushEvent({ key, eventType: 'keydown', timestamp });
  }

  public recordKeyUp(key: string, customTimestamp?: number): void {
    const timestamp = customTimestamp ?? performance.now();
    if (this.isIgnoredKey(key)) return;
    this.activeKeyDownMap.delete(key);
    this.pushEvent({ key, eventType: 'keyup', timestamp });
  }

  public analyze(): BotAnalysisResult {
    const features = this.extractFeatures();
    const botScore = this.calculateBotScore(features);
    const isBot = botScore >= this.botThreshold;

    return {
      botScore: Number(botScore.toFixed(4)),
      isBot,
      confidence: this.calculateConfidence(features.totalEvents),
      vectorBreakdown: {
        keystrokeScore: Number(botScore.toFixed(2)),
        mouseJitterScore: 0,
        clipboardScore: 0,
        eventIntegrityScore: 1,
      },
      features,
      timestamp: Date.now(),
    };
  }

  public reset(): void {
    this.events = [];
    this.activeKeyDownMap.clear();
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

  private extractFeatures(): BiometricFeatures {
    const dwellTimes: number[] = [];
    const flightTimes: number[] = [];
    const keyDownMap = new Map<string, number>();

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      if (event.eventType === 'keydown') {
        keyDownMap.set(event.key, event.timestamp);
      } else if (event.eventType === 'keyup') {
        const pressTime = keyDownMap.get(event.key);
        if (pressTime !== undefined) {
          const dwell = event.timestamp - pressTime;
          if (dwell >= 0 && dwell < 5000) {
            dwellTimes.push(dwell);
          }
          keyDownMap.delete(event.key);
        }
      }
    }

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

    const dwellTimeMean = this.calculateMean(dwellTimes);
    const dwellTimeStdDev = this.calculateStdDev(dwellTimes, dwellTimeMean);

    const flightTimeMean = this.calculateMean(flightTimes);
    const flightTimeStdDev = this.calculateStdDev(flightTimes, flightTimeMean);

    let typingSpeedCPM = 0;
    if (this.events.length >= 2) {
      const startTime = this.events[0].timestamp;
      const endTime = this.events[this.events.length - 1].timestamp;
      const durationMinutes = (endTime - startTime) / 60000;
      if (durationMinutes > 0) {
        typingSpeedCPM = (this.events.length / 2) / durationMinutes;
      }
    }

    return {
      dwellTimeMean: Number(dwellTimeMean.toFixed(2)),
      dwellTimeStdDev: Number(dwellTimeStdDev.toFixed(2)),
      flightTimeMean: Number(flightTimeMean.toFixed(2)),
      flightTimeStdDev: Number(flightTimeStdDev.toFixed(2)),
      typingSpeedCPM: Number(typingSpeedCPM.toFixed(2)),
      mouseSpeedMean: 0,
      mouseJitterEntropy: 0.15,
      linearPathRatio: 0.75,
      syntheticPasteCount: 0,
      eventSequenceIntegrity: 1,
      totalEvents: this.events.length,
    };
  }

  private calculateBotScore(features: BiometricFeatures): number {
    if (features.totalEvents < 6) {
      return 0.1;
    }

    let score = 0.0;
    if (features.dwellTimeStdDev < 2.0) score += 0.35;
    else if (features.dwellTimeStdDev < 5.0) score += 0.15;

    if (features.flightTimeStdDev < 3.0) score += 0.35;
    else if (features.flightTimeStdDev < 8.0) score += 0.15;

    if (features.typingSpeedCPM > 1200) score += 0.40;
    else if (features.typingSpeedCPM > 800) score += 0.20;

    if (features.dwellTimeMean < 8.0) score += 0.25;

    return Math.min(1.0, Math.max(0.0, score));
  }

  private calculateConfidence(totalEvents: number): number {
    return Math.min(1.0, totalEvents / 20);
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((acc, val) => acc + val, 0) / values.length;
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) return 0;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}
