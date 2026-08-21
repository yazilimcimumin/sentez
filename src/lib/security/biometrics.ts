/**
 * Sentez Katman 1: İstemci Güvenlik Katmanı
 * Çok Vektörlü Davranışsal Biyometri & Anti-Bot Füzyon Motoru
 *
 * Sadece klavye değil; Fare Mikro-Titreme (Jitter) Eğriliği, DOM Olay Sıralama Bütünlüğü
 * ve Panodan Yapıştırma (Clipboard Injection) dinamiklerini birleştirerek %100 uçta bot skoru üretir.
 */

import {
  KeystrokeTimingEvent,
  MousePoint,
  BiometricFeatures,
  BotAnalysisResult,
} from '@/types';

export class MultiVectorBiometricsAnalyzer {
  private keyEvents: KeystrokeTimingEvent[] = [];
  private mousePoints: MousePoint[] = [];
  private activeKeyDownMap: Map<string, number> = new Map();
  private pasteCount = 0;
  private hasReceivedFocus = false;
  private hasReceivedMouseEnter = false;

  private maxBuffer = 250;

  /**
   * Klavye olaylarını kaydeder
   */
  public recordKeyDown(key: string, timestamp = performance.now()): void {
    if (this.isIgnoredKey(key)) return;
    if (!this.activeKeyDownMap.has(key)) {
      this.activeKeyDownMap.set(key, timestamp);
    }
    this.pushKeyEvent({ key, eventType: 'keydown', timestamp });
  }

  public recordKeyUp(key: string, timestamp = performance.now()): void {
    if (this.isIgnoredKey(key)) return;
    this.activeKeyDownMap.delete(key);
    this.pushKeyEvent({ key, eventType: 'keyup', timestamp });
  }

  /**
   * Fare hareketlerini ve mikro-titremeleri (Micro-Tremor Jitter) kaydeder
   */
  public recordMouseMove(x: number, y: number, timestamp = performance.now()): void {
    this.mousePoints.push({ x, y, timestamp });
    if (this.mousePoints.length > this.maxBuffer) {
      this.mousePoints.shift();
    }
  }

  /**
   * DOM Etkileşim ve Yapıştırma olaylarını kaydeder
   */
  public recordPaste(): void {
    this.pasteCount++;
  }

  public recordMouseEnter(): void {
    this.hasReceivedMouseEnter = true;
  }

  public recordFocus(): void {
    this.hasReceivedFocus = true;
  }

  public reset(): void {
    this.keyEvents = [];
    this.mousePoints = [];
    this.activeKeyDownMap.clear();
    this.pasteCount = 0;
    this.hasReceivedFocus = false;
    this.hasReceivedMouseEnter = false;
  }

  /**
   * Tüm biyometrik vektörleri analiz ederek Füzyon Bot Skoru üretir
   */
  public analyze(): BotAnalysisResult {
    const features = this.extractFeatures();
    
    // Vector Scores (0.0 to 1.0)
    const keystrokeScore = this.calculateKeystrokeScore(features);
    const mouseJitterScore = this.calculateMouseJitterScore(features);
    const clipboardScore = features.syntheticPasteCount > 2 ? 0.85 : features.syntheticPasteCount > 0 ? 0.30 : 0.0;
    const eventIntegrityScore = 1.0 - features.eventSequenceIntegrity;

    // Weighted Fusion Bot Score
    const weightedScore = (
      keystrokeScore * 0.35 +
      mouseJitterScore * 0.35 +
      clipboardScore * 0.15 +
      eventIntegrityScore * 0.15
    );

    const botScore = Math.min(1.0, Math.max(0.0, weightedScore));
    const isBot = botScore >= 0.65;

    return {
      botScore: Number(botScore.toFixed(3)),
      isBot,
      confidence: Number((Math.min(1.0, features.totalEvents / 15)).toFixed(2)),
      vectorBreakdown: {
        keystrokeScore: Number(keystrokeScore.toFixed(2)),
        mouseJitterScore: Number(mouseJitterScore.toFixed(2)),
        clipboardScore: Number(clipboardScore.toFixed(2)),
        eventIntegrityScore: Number(eventIntegrityScore.toFixed(2)),
      },
      features,
      timestamp: Date.now(),
    };
  }

  /**
   * Element dinleyicilerini bağlar
   */
  public attachToElement(element: HTMLElement): () => void {
    const onKeyDown = (e: KeyboardEvent) => this.recordKeyDown(e.key);
    const onKeyUp = (e: KeyboardEvent) => this.recordKeyUp(e.key);
    const onMouseMove = (e: MouseEvent) => this.recordMouseMove(e.clientX, e.clientY);
    const onPaste = () => this.recordPaste();
    const onMouseEnter = () => this.recordMouseEnter();
    const onFocus = () => this.recordFocus();

    element.addEventListener('keydown', onKeyDown as EventListener);
    element.addEventListener('keyup', onKeyUp as EventListener);
    element.addEventListener('mousemove', onMouseMove as EventListener);
    element.addEventListener('paste', onPaste as EventListener);
    element.addEventListener('mouseenter', onMouseEnter as EventListener);
    element.addEventListener('focus', onFocus as EventListener);

    return () => {
      element.removeEventListener('keydown', onKeyDown as EventListener);
      element.removeEventListener('keyup', onKeyUp as EventListener);
      element.removeEventListener('mousemove', onMouseMove as EventListener);
      element.removeEventListener('paste', onPaste as EventListener);
      element.removeEventListener('mouseenter', onMouseEnter as EventListener);
      element.removeEventListener('focus', onFocus as EventListener);
    };
  }

  private pushKeyEvent(event: KeystrokeTimingEvent): void {
    this.keyEvents.push(event);
    if (this.keyEvents.length > this.maxBuffer) {
      this.keyEvents.shift();
    }
  }

  private isIgnoredKey(key: string): boolean {
    return ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(key);
  }

  private extractFeatures(): BiometricFeatures {
    // 1. Keystroke Features
    const dwellTimes: number[] = [];
    const flightTimes: number[] = [];
    const keyMap = new Map<string, number>();

    for (const ev of this.keyEvents) {
      if (ev.eventType === 'keydown') {
        keyMap.set(ev.key, ev.timestamp);
      } else if (ev.eventType === 'keyup') {
        const start = keyMap.get(ev.key);
        if (start !== undefined) {
          dwellTimes.push(ev.timestamp - start);
          keyMap.delete(ev.key);
        }
      }
    }

    for (let i = 0; i < this.keyEvents.length - 1; i++) {
      if (this.keyEvents[i].eventType === 'keyup' && this.keyEvents[i + 1].eventType === 'keydown') {
        flightTimes.push(this.keyEvents[i + 1].timestamp - this.keyEvents[i].timestamp);
      }
    }

    const dwellTimeMean = this.mean(dwellTimes);
    const dwellTimeStdDev = this.stdDev(dwellTimes, dwellTimeMean);
    const flightTimeMean = this.mean(flightTimes);
    const flightTimeStdDev = this.stdDev(flightTimes, flightTimeMean);

    let typingSpeedCPM = 0;
    if (this.keyEvents.length >= 2) {
      const dur = (this.keyEvents[this.keyEvents.length - 1].timestamp - this.keyEvents[0].timestamp) / 60000;
      if (dur > 0) typingSpeedCPM = (this.keyEvents.length / 2) / dur;
    }

    // 2. Mouse Motion & Jitter Features
    const mouseSpeeds: number[] = [];
    const angles: number[] = [];
    let linearDistance = 0;
    let actualPathDistance = 0;

    if (this.mousePoints.length >= 2) {
      const startP = this.mousePoints[0];
      const endP = this.mousePoints[this.mousePoints.length - 1];
      linearDistance = Math.hypot(endP.x - startP.x, endP.y - startP.y);

      for (let i = 0; i < this.mousePoints.length - 1; i++) {
        const p1 = this.mousePoints[i];
        const p2 = this.mousePoints[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const dt = (p2.timestamp - p1.timestamp) || 1;
        actualPathDistance += dist;
        mouseSpeeds.push(dist / dt);

        if (i < this.mousePoints.length - 2) {
          const p3 = this.mousePoints[i + 2];
          const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
          angles.push(Math.abs(angle2 - angle1));
        }
      }
    }

    const mouseSpeedMean = this.mean(mouseSpeeds);
    const mouseJitterEntropy = this.stdDev(angles, this.mean(angles)); // Human natural tremor entropy
    const linearPathRatio = actualPathDistance > 0 ? linearDistance / actualPathDistance : 1.0;

    // 3. Event Sequence Integrity
    let eventSequenceIntegrity = 1.0;
    if (!this.hasReceivedFocus && this.keyEvents.length > 0) eventSequenceIntegrity -= 0.4;
    if (!this.hasReceivedMouseEnter && this.mousePoints.length === 0) eventSequenceIntegrity -= 0.4;
    eventSequenceIntegrity = Math.max(0.0, eventSequenceIntegrity);

    return {
      dwellTimeMean: Number(dwellTimeMean.toFixed(1)),
      dwellTimeStdDev: Number(dwellTimeStdDev.toFixed(1)),
      flightTimeMean: Number(flightTimeMean.toFixed(1)),
      flightTimeStdDev: Number(flightTimeStdDev.toFixed(1)),
      typingSpeedCPM: Number(typingSpeedCPM.toFixed(1)),
      mouseSpeedMean: Number(mouseSpeedMean.toFixed(2)),
      mouseJitterEntropy: Number(mouseJitterEntropy.toFixed(3)),
      linearPathRatio: Number(linearPathRatio.toFixed(3)),
      syntheticPasteCount: this.pasteCount,
      eventSequenceIntegrity: Number(eventSequenceIntegrity.toFixed(2)),
      totalEvents: this.keyEvents.length + this.mousePoints.length,
    };
  }

  private calculateKeystrokeScore(f: BiometricFeatures): number {
    if (this.keyEvents.length < 4) return 0.05;
    let score = 0.0;
    if (f.dwellTimeStdDev < 2.5) score += 0.45; // Robotic uniform hold duration
    if (f.flightTimeStdDev < 3.0) score += 0.45; // Robotic uniform flight duration
    if (f.typingSpeedCPM > 1200) score += 0.50;  // Super-human speed
    return Math.min(1.0, score);
  }

  private calculateMouseJitterScore(f: BiometricFeatures): number {
    if (this.mousePoints.length < 5) return 0.0; // No mouse movement recorded
    let score = 0.0;

    // Perfectly linear path ratio (>0.98) indicates programmatic vector movement
    if (f.linearPathRatio > 0.98) score += 0.45;

    // Zero jitter entropy indicates lack of human muscular micro-tremors
    if (f.mouseJitterEntropy < 0.02) score += 0.45;

    return Math.min(1.0, score);
  }

  private mean(vals: number[]): number {
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  private stdDev(vals: number[], m: number): number {
    if (vals.length <= 1) return 0;
    const v = vals.reduce((a, b) => a + Math.pow(b - m, 2), 0) / vals.length;
    return Math.sqrt(v);
  }
}
