/**
 * Sentez — Semantik Skor Birim Testleri
 * 
 * Çalıştır: npm test
 */

// performance.now polyfill for Node environment
global.performance = { now: () => Date.now() } as Performance;

import { analyzeSemantics } from '../src/lib/ai/semanticDemo';

describe('analyzeSemantics — TF-IDF Demo Model', () => {
  test('özgün ve anlamlı içerik yüksek liyakat skoru alır', () => {
    const result = analyzeSemantics(
      'Sentez projemiz uçta hesaplama prensibiyle kullanıcı verilerini ' +
      'tarayıcıda işleyerek KVKK uyumlu ve sıfır maliyetli güvenlik sağlar.'
    );
    expect(result.meritScore).toBeGreaterThanOrEqual(65);
    expect(result.isClickbait).toBe(false);
    expect(result.isSpam).toBe(false);
    expect(result.modelType).toContain('Semantik Motoru');
  });

  test('clickbait içerik düşük liyakat skoru alır', () => {
    const result = analyzeSemantics('ŞOK! İNANAMAYACAKSINIZ! HEMEN İZLE VE PAYLAŞ ACİL!!!');
    expect(result.meritScore).toBeLessThan(45);
    expect(result.isClickbait).toBe(true);
    expect(result.clickbaitSim).toBeGreaterThan(0);
  });

  test('spam içerik tespit edilir', () => {
    const result = analyzeSemantics(
      'BEDAVA TOKEN KAZAN! KOPYALA YAPISTIR HERKESE DAĞıT COIN AIRDROP'
    );
    expect(result.isSpam).toBe(true);
    expect(result.meritScore).toBeLessThan(40);
  });

  test('çok kısa içerik düşük puan alır', () => {
    const result = analyzeSemantics('ok');
    expect(result.meritScore).toBeLessThan(65);
  });

  test('büyük harf oranı yüksek içerik cezalandırılır', () => {
    const normal = analyzeSemantics('merhaba dünya nasılsınız');
    const shouty = analyzeSemantics('MERHABA DÜNYA NASILSINIZ HERKES DUYDU MU');
    expect(shouty.meritScore).toBeLessThanOrEqual(normal.meritScore);
  });

  test('meritScore her zaman 0-100 aralığında kalır', () => {
    const inputs = [
      '', 'a', 'normal bir metin',
      'ŞOK ACİL BEDAVA KAZAN COIN TOKEN TIKLA PAYLAŞ DAĞIT İNANAMAZSINIZ',
    ];
    inputs.forEach(text => {
      const { meritScore } = analyzeSemantics(text);
      expect(meritScore).toBeGreaterThanOrEqual(0);
      expect(meritScore).toBeLessThanOrEqual(100);
    });
  });

  test('inferenceMs ölçülür ve pozitiftir', () => {
    const { inferenceMs } = analyzeSemantics('test metni');
    expect(inferenceMs).toBeGreaterThanOrEqual(0);
  });
});
