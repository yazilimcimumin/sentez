/**
 * Sentez Katman 3: Graf Tabanlı Akış Katmanı
 * Yankı Odası Kıran "Köprü İçerik" Dağıtım Algoritması
 *
 * Farklı topluluk kümeleri arasında ortak ilgi alanlarına dokunan
 * ancak kutuplaşmayı ve izolasyonu kıran Köprü İçerikleri seçer ve akışa serpiştirir.
 */

import { BridgeContentRecommendation, CommunityDetectionResult } from '@/types';

export interface PostMetaData {
  id: string;
  authorId: string;
  meritScore: number;
  tags: string[];
  embedding: number[];
}

export class BridgeFeedAlgorithm {
  /**
   * Yankı odasındaki kullanıcı için Köprü İçerik akışı oluşturur
   */
  public static generateBridgeFeed(
    userId: string,
    candidatePosts: PostMetaData[],
    communityResult: CommunityDetectionResult
  ): BridgeContentRecommendation[] {
    const userCommunityId = communityResult.userCommunityMap.get(userId);
    if (userCommunityId === undefined) {
      return [];
    }

    const recommendations: BridgeContentRecommendation[] = [];

    for (const post of candidatePosts) {
      const authorCommunityId = communityResult.userCommunityMap.get(post.authorId);

      // Skip posts from the exact same community (not cross-community bridges)
      if (authorCommunityId === undefined || authorCommunityId === userCommunityId) {
        continue;
      }

      // Calculate Bridge Score = (MeritScore / 100) * CrossCommunityFactor
      const crossCommunityFactor = communityResult.echoChambers.includes(userCommunityId) ? 1.5 : 1.0;
      const bridgeScore = (post.meritScore / 100) * crossCommunityFactor;

      // Only recommend high merit content (>65) for bridge distribution
      if (post.meritScore >= 65) {
        recommendations.push({
          postId: post.id,
          authorId: post.authorId,
          targetCommunityId: authorCommunityId,
          bridgeScore: Number(bridgeScore.toFixed(3)),
          reason: `Farklı bakış açısı sunan Topluluk #${authorCommunityId} liyakatlı köprü içeriği (%${post.meritScore} Liyakat Skoru).`,
        });
      }
    }

    // Sort by highest bridge score
    return recommendations.sort((a, b) => b.bridgeScore - a.bridgeScore);
  }
}
