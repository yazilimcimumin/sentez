/**
 * Sentez - useKeystrokeDynamics Hook
 * 
 * [DEMO - GERÇEKLEŞTİRİLMİŞ]
 * performance.now() ile dwell time ve flight time ölçer.
 * Basit eşik tabanlı bot skoru üretir.
 * 
 * Üretimde: Web Worker'a taşınır, Multi-Vector Fusion ile birleşir.
 */
'use client';
import { useState, useRef, useCallback } from 'react';

interface KeystrokeMetrics {
  dwellMean: number;
  dwellStd: number;
  flightMean: number;
  typingSpeedCPM: number;
  botScore: number;       // 0.0 (insan) → 1.0 (bot)
  isBot: boolean;
  sampleCount: number;
}

const mean = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
const std = (arr: number[], m: number) => {
  if (arr.length <= 1) return 0;
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
};

export function useKeystrokeDynamics() {
  const [metrics, setMetrics] = useState<KeystrokeMetrics>({
    dwellMean: 0, dwellStd: 0, flightMean: 0,
    typingSpeedCPM: 0, botScore: 0, isBot: false, sampleCount: 0,
  });
  const downMap = useRef<Map<string, number>>(new Map());
  const lastUpTime = useRef<number | null>(null);
  const dwellTimes = useRef<number[]>([]);
  const flightTimes = useRef<number[]>([]);
  const firstEventTime = useRef<number | null>(null);
  const keyCount = useRef(0);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const ignored = ['Shift','Control','Alt','Meta','CapsLock','Tab'];
    if (ignored.includes(e.key)) return;
    const t = performance.now();
    if (!firstEventTime.current) firstEventTime.current = t;
    downMap.current.set(e.key, t);
  }, []);

  const onKeyUp = useCallback((e: React.KeyboardEvent) => {
    const ignored = ['Shift','Control','Alt','Meta','CapsLock','Tab'];
    if (ignored.includes(e.key)) return;
    const t = performance.now();
    const downTime = downMap.current.get(e.key);
    if (downTime !== undefined) {
      const dwell = t - downTime;
      if (dwell > 0 && dwell < 2000) dwellTimes.current.push(dwell);
      downMap.current.delete(e.key);
    }
    if (lastUpTime.current !== null) {
      const flight = t - lastUpTime.current;
      if (flight > 0 && flight < 3000) flightTimes.current.push(flight);
    }
    lastUpTime.current = t;
    keyCount.current++;

    // Compute metrics every 3 keystrokes
    if (keyCount.current % 3 === 0) {
      const dm = mean(dwellTimes.current);
      const ds = std(dwellTimes.current, dm);
      const fm = mean(flightTimes.current);
      const elapsed = firstEventTime.current ? (t - firstEventTime.current) / 60000 : 0;
      const cpm = elapsed > 0 ? keyCount.current / elapsed : 0;

      // Bot scoring (eşik tabanlı)
      let score = 0;
      if (ds < 3 && dwellTimes.current.length > 4) score += 0.4;   // robotik sabit dwell
      else if (ds < 8) score += 0.15;
      if (fm < 10 && flightTimes.current.length > 3) score += 0.35; // sıfır gecikme
      if (cpm > 1200) score += 0.4;                                  // insanüstü hız

      setMetrics({
        dwellMean: Math.round(dm),
        dwellStd: Math.round(ds),
        flightMean: Math.round(fm),
        typingSpeedCPM: Math.round(cpm),
        botScore: Math.min(1, score),
        isBot: score >= 0.65,
        sampleCount: keyCount.current,
      });
    }
  }, []);

  const reset = useCallback(() => {
    downMap.current.clear();
    lastUpTime.current = null;
    dwellTimes.current = [];
    flightTimes.current = [];
    firstEventTime.current = null;
    keyCount.current = 0;
    setMetrics({ dwellMean: 0, dwellStd: 0, flightMean: 0, typingSpeedCPM: 0, botScore: 0, isBot: false, sampleCount: 0 });
  }, []);

  return { metrics, onKeyDown, onKeyUp, reset };
}
