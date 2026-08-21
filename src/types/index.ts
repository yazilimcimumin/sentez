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
  timestamp: number; // Milliseconds high-res timer (performance.now())
}

export interface KeystrokeFeatureVector {
  dwellTimeMean: number;      // Key press duration (keyup - keydown)
  dwellTimeStdDev: number;    // Standard deviation of press duration
  flightTimeMean: number;     // Time between keyup of N and keydown of N+1
  flightTimeStdDev: number;   // Standard deviation of flight times
  typingSpeedCPM: number;     // Characters per minute
  rhythmVariance: number;     // Entropy/Variance in typing cadence
  totalEvents: number;
}

export interface BotAnalysisResult {
  botScore: number;           // Probability score 0.0 (human) to 1.0 (bot)
  isBot: boolean;             // Threshold based flag (e.g. > 0.75)
  confidence: number;         // Statistical confidence level
  features: KeystrokeFeatureVector;
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
  userCommunityMap: Map<string, number>; // UserId -> CommunityId
  communityClusters: Record<number, string[]>;
  echoChambers: number[]; // Community IDs flagged as echo chambers
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
