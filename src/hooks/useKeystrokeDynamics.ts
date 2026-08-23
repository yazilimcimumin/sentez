/**
 * Sentez - Klavye Vuruş Ritmi (Keystroke Dynamics) Hook'u
 * 
 * İstemci tarafında performance.now() yüksek hassasiyetli zamanlayıcı kullanarak
 * basılı kalma süresi (Dwell Time) ve tuşlar arası uçuş süresini (Flight Time) ölçer.
 * Elde edilen istatistiksel varyasyonlar üzerinden bot/otomasyon olasılığı hesaplar.
 */
'use client';

import { useState, useRef, useCallback } from 'react';

export interface KeystrokeMetrics {
  dwellMean: number;        // Ortalama basılı kalma süresi (ms)
  dwellStd: number;         // Basılı kalma süresi standart sapması
  flightMean: number;       // Ortalama tuşlar arası uçuş süresi (ms)
  typingSpeedCPM: number;   // Dakika başına karakter hızı (CPM)
  botScore: number;         // 0.0 (insan) -> 1.0 (otomasyon/bot)
  isBot: boolean;           // Eşik değeri aşma durumu (>= 0.65)
  sampleCount: number;      // İşlenen toplam tuş olayı sayısı
}

const calculateMean = (arr: number[]): number => 
  arr.length === 0 ? 0 : arr.reduce((sum, val) => sum + val, 0) / arr.length;

const calculateStdDev = (arr: number[], meanVal: number): number => {
  if (arr.length <= 1) return 0;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - meanVal, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

export function useKeystrokeDynamics() {
  const [metrics, setMetrics] = useState<KeystrokeMetrics>({
    dwellMean: 0,
    dwellStd: 0,
    flightMean: 0,
    typingSpeedCPM: 0,
    botScore: 0,
    isBot: false,
    sampleCount: 0,
  });

  const keyDownMap = useRef<Map<string, number>>(new Map());
  const lastKeyUpTime = useRef<number | null>(null);
  const dwellTimes = useRef<number[]>([]);
  const flightTimes = useRef<number[]>([]);
  const startTime = useRef<number | null>(null);
  const totalKeys = useRef(0);

  // Tuşa basıldığı an zaman damgasını al
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];
    if (ignoredKeys.includes(e.key)) return;

    const now = performance.now();
    if (!startTime.current) {
      startTime.current = now;
    }

    if (!keyDownMap.current.has(e.key)) {
      keyDownMap.current.set(e.key, now);
    }
  }, []);

  // Tuş bırakıldığında dwell ve flight sürelerini hesapla
  const onKeyUp = useCallback((e: React.KeyboardEvent) => {
    const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];
    if (ignoredKeys.includes(e.key)) return;

    const now = performance.now();
    const pressTime = keyDownMap.current.get(e.key);

    if (pressTime !== undefined) {
      const dwell = now - pressTime;
      if (dwell > 0 && dwell < 2000) {
        dwellTimes.current.push(dwell);
      }
      keyDownMap.current.delete(e.key);
    }

    if (lastKeyUpTime.current !== null) {
      const flight = now - lastKeyUpTime.current;
      if (flight > 0 && flight < 3000) {
        flightTimes.current.push(flight);
      }
    }

    lastKeyUpTime.current = now;
    totalKeys.current += 1;

    // Her 3 tuş vuruşunda bir istatistikleri ve bot skorunu güncelle
    if (totalKeys.current % 3 === 0) {
      const dm = calculateMean(dwellTimes.current);
      const ds = calculateStdDev(dwellTimes.current, dm);
      const fm = calculateMean(flightTimes.current);

      const durationMinutes = startTime.current ? (now - startTime.current) / 60000 : 0;
      const cpm = durationMinutes > 0 ? totalKeys.current / durationMinutes : 0;

      // Bot Skoru Hesaplama (İnsan vuruş ritminde milisaniyelik rastgele varyasyon bulunur)
      let score = 0;

      // 1. Dwell sapması çok düşükse (robotik mükemmel zamanlama < 3ms)
      if (ds < 3.0 && dwellTimes.current.length >= 4) {
        score += 0.40;
      } else if (ds < 7.0) {
        score += 0.15;
      }

      // 2. Flight süresi sabit veya 0'a yakınsa (otomatik makro/script)
      if (fm < 12.0 && flightTimes.current.length >= 3) {
        score += 0.35;
      }

      // 3. Aşırı yüksek yazma hızı (CPM > 1200 super-human)
      if (cpm > 1200) {
        score += 0.40;
      }

      setMetrics({
        dwellMean: Math.round(dm),
        dwellStd: Math.round(ds),
        flightMean: Math.round(fm),
        typingSpeedCPM: Math.round(cpm),
        botScore: Math.min(1.0, Number(score.toFixed(2))),
        isBot: score >= 0.65,
        sampleCount: totalKeys.current,
      });
    }
  }, []);

  const reset = useCallback(() => {
    keyDownMap.current.clear();
    lastKeyUpTime.current = null;
    dwellTimes.current = [];
    flightTimes.current = [];
    startTime.current = null;
    totalKeys.current = 0;
    setMetrics({
      dwellMean: 0,
      dwellStd: 0,
      flightMean: 0,
      typingSpeedCPM: 0,
      botScore: 0,
      isBot: false,
      sampleCount: 0,
    });
  }, []);

  return { metrics, onKeyDown, onKeyUp, reset };
}
