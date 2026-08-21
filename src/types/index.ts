/**
 * Sentez Core Architecture - TypeScript Strict Interfaces
 */

// ==========================================
// KATMAN 1: İSTEMCİ GÜVENLİK KATMANI TYPES
// ==========================================

export type KeyEventType = 'keydown' | 'keyup';

export interface KeystrokeTimingEvent {
  key: string;
  eventType: KeyEventType;
  timestamp: number;
}

export interface MousePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface BiometricFeatures {
  // Keystroke
  dwellTimeMean: number;
  dwellTimeStdDev: number;
  flightTimeMean: number;
  flightTimeStdDev: number;
  typingSpeedCPM: number;
  
  // Mouse & Motion Jitter
  mouseSpeedMean: number;
  mouseJitterEntropy: number; // Micro-tremor curvature (human vs linear bot)
  linearPathRatio: number;   // 1.0 = perfectly straight bot line, <0.8 = human curve
  
  // Clipboard & Event Integrity
  syntheticPasteCount: number;
  eventSequenceIntegrity: number; // 0.0 - 1.0 (focus -> hover -> click sequence)

  totalEvents: number;
}

export interface BotAnalysisResult {
  botScore: number;           // Probability score 0.0 (human) to 1.0 (bot)
  isBot: boolean;
  confidence: number;
  vectorBreakdown: {
    keystrokeScore: number;
    mouseJitterScore: number;
    clipboardScore: number;
    eventIntegrityScore: number;
  };
  features: BiometricFeatures;
  timestamp: number;
}

export interface MediaHashResult {
  hash: string;
  perceptualFingerprint: string;
  isManipulated: boolean;
  confidence: number;
}

// ==========================================
// KATMAN 2: ANLAMSAL NİTELİK KATMANI TYPES
// ==========================================

export interface TextAnalysisRequest {
  id: string;
  content: string;
}

export interface SemanticAnalysisResult {
  id: string;
  meritScore: number;         // Liyakat Skoru (0-100)
  isClickbait: boolean;
  isSpam: boolean;
  isCopyPaste: boolean;
  embedding?: number[];
  inferenceTimeMs: number;
}

export type SecurityStatusLevel = 'verified' | 'warning' | 'risk';

export interface ContentBadgeState {
  status: SecurityStatusLevel;
  label: string;
  details: string;
  meritScore: number;
  botScore: number;
}

// ==========================================
// SOSYAL AĞ (META / X STİLİ) POST MODELİ
// ==========================================

export interface SocialPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  mediaUrl?: string;
  likes: number;
  reposts: number;
  comments: number;
  isBridgeContent?: boolean;
  communityId?: number;
  badge: {
    status: SecurityStatusLevel;
    meritScore: number;
    botScore: number;
    isClickbait: boolean;
    isManipulatedMedia: boolean;
    inferenceTimeMs: number;
  };
}

// ==========================================
// KATMAN 3: GRAF TABANLI AKIŞ KATMANI TYPES
// ==========================================

export type InteractionType = 'follow' | 'like' | 'comment' | 'repost';

export interface InteractionEdge {
  sourceUserId: string;
  targetUserId: string;
  weight: number;
  type: InteractionType;
}

export interface CommunityDetectionResult {
  modularityScore: number;
  userCommunityMap: Map<string, number>;
  communityClusters: Record<number, string[]>;
  echoChambers: number[];
}

export interface BridgeContentRecommendation {
  postId: string;
  authorId: string;
  targetCommunityId: number;
  bridgeScore: number;
  reason: string;
}

// ==========================================
// WEB WORKER BRIDGE TYPES
// ==========================================

export type WorkerMessageType =
  | 'ANALYZE_BIOMETRICS'
  | 'ANALYZE_KEYSTROKE'
  | 'ANALYZE_PHASH'
  | 'SEMANTIC_INFERENCE'
  | 'RUN_LOUVAIN'
  | 'WORKER_READY'
  | 'WORKER_ERROR';

export interface WorkerPayload<T = unknown> {
  type: WorkerMessageType;
  requestId: string;
  data: T;
}

export interface WorkerResponse<T = unknown> {
  type: WorkerMessageType;
  requestId: string;
  success: boolean;
  data?: T;
  error?: string;
}
