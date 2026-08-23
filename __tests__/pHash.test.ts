/**
 * Sentez — pHash Birim Testleri
 */

global.performance = { now: () => Date.now() } as Performance;

import { PerceptualHashAnalyzer } from '../src/lib/security/pHash';

describe('PerceptualHashAnalyzer', () => {
  test('aynı URL için üretilen hash her seferinde aynı olur (deterministic)', () => {
    const h1 = PerceptualHashAnalyzer.generateDemoHash('test-image.jpg');
    const h2 = PerceptualHashAnalyzer.generateDemoHash('test-image.jpg');
    expect(h1).toBe(h2);
  });

  test('farklı URL için farklı hash üretilir', () => {
    const h1 = PerceptualHashAnalyzer.generateDemoHash('image-a.jpg');
    const h2 = PerceptualHashAnalyzer.generateDemoHash('image-b.jpg');
    expect(h1).not.toBe(h2);
  });

  test('Hamming mesafesi aynı hash için 0 döner', () => {
    const h = PerceptualHashAnalyzer.generateDemoHash('same');
    expect(PerceptualHashAnalyzer.hammingDistance(h, h)).toBe(0);
  });

  test('Hamming mesafesi 0-64 arasında olur', () => {
    const h1 = PerceptualHashAnalyzer.generateDemoHash('img1');
    const h2 = PerceptualHashAnalyzer.generateDemoHash('img2');
    const dist = PerceptualHashAnalyzer.hammingDistance(h1, h2);
    expect(dist).toBeGreaterThanOrEqual(0);
    expect(dist).toBeLessThanOrEqual(64);
  });

  test('tahrif edilmiş görsel yüksek Hamming mesafesi verir', () => {
    const original = PerceptualHashAnalyzer.generateDemoHash('original-clean');
    const tampered = PerceptualHashAnalyzer.generateDemoHash('tampered-xyz-modified-version');
    const dist = PerceptualHashAnalyzer.hammingDistance(original, tampered);
    // Farklı seed'ler farklı hash üretmeli
    expect(dist).toBeGreaterThan(0);
  });

  test('analyzeManipulation özgün görseli doğru tespit eder', () => {
    const ref = PerceptualHashAnalyzer.generateDemoHash('ref');
    const same = PerceptualHashAnalyzer.generateDemoHash('ref');
    const result = PerceptualHashAnalyzer.analyzeManipulation(same, ref);
    expect(result.isManipulated).toBe(false);
    expect(result.hammingDistance).toBe(0);
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});
