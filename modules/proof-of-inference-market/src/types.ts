import { z } from 'zod';

// Model Types
export const ModelTypeSchema = z.enum(['LLM', 'VISION', 'AUDIO', 'MULTIMODAL', 'CUSTOM']);
export type ModelType = z.infer<typeof ModelTypeSchema>;

export const InferenceTaskSchema = z.enum([
  'TEXT_GENERATION',
  'TEXT_CLASSIFICATION',
  'IMAGE_CLASSIFICATION',
  'OBJECT_DETECTION',
  'SPEECH_RECOGNITION',
  'TRANSLATION',
  'SUMMARIZATION',
  'QUESTION_ANSWERING',
  'CUSTOM'
]);
export type InferenceTask = z.infer<typeof InferenceTaskSchema>;

export const VerificationStatusSchema = z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'DISPUTED']);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const StakeholderRoleSchema = z.enum(['VALIDATOR', 'CHALLENGER', 'ARBITRATOR', 'DELEGATOR']);
export type StakeholderRole = z.infer<typeof StakeholderRoleSchema>;

// Inference Types
export const InferenceRequestSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  input: z.any(), // Flexible input type
  task: InferenceTaskSchema,
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  timeout: z.number().optional(),
  reward: z.string(), // wei
  requester: z.string(),
  createdAt: z.date(),
  deadline: z.date().optional()
});

export const InferenceResultSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  modelId: z.string(),
  output: z.any(), // Flexible output type
  confidence: z.number().min(0).max(1),
  latency: z.number(), // milliseconds
  gasUsed: z.string(), // wei
  validator: z.string(),
  submittedAt: z.date(),
  verified: z.boolean(),
  verificationProof: z.string().optional()
});

export const VerificationProofSchema = z.object({
  id: z.string(),
  resultId: z.string(),
  validator: z.string(),
  proof: z.string(),
  merkleRoot: z.string(),
  blockNumber: z.number(),
  timestamp: z.date(),
  status: VerificationStatusSchema,
  challengers: z.array(z.string()),
  arbitrators: z.array(z.string()),
  stakeAmount: z.string(), // wei
  slashingAmount: z.string().optional() // wei
});

// Market Types
export const ModelListingSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  modelType: ModelTypeSchema,
  tasks: z.array(InferenceTaskSchema),
  pricePerInference: z.string(), // wei
  maxConcurrentRequests: z.number(),
  minStake: z.string(), // wei
  totalStake: z.string(), // wei
  validatorCount: z.number(),
  accuracy: z.number().min(0).max(1),
  latency: z.number(), // milliseconds
  uptime: z.number().min(0).max(1),
  isActive: z.boolean(),
  owner: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ValidatorStakeSchema = z.object({
  validator: z.string(),
  modelId: z.string(),
  stakeAmount: z.string(), // wei
  delegatedAmount: z.string(), // wei
  totalStake: z.string(), // wei
  slashingRisk: z.number().min(0).max(1),
  rewards: z.string(), // wei
  lastUpdate: z.date()
});

export const ChallengeSchema = z.object({
  id: z.string(),
  resultId: z.string(),
  challenger: z.string(),
  reason: z.string(),
  evidence: z.string(),
  stakeAmount: z.string(), // wei
  status: VerificationStatusSchema,
  createdAt: z.date(),
  resolvedAt: z.date().optional(),
  arbitrator: z.string().optional()
});

// EigenLayer AVS Types
export const AVSConfigSchema = z.object({
  avsId: z.string(),
  name: z.string(),
  description: z.string(),
  minStake: z.string(), // wei
  maxStake: z.string(), // wei
  slashingThreshold: z.number().min(0).max(1),
  rewardRate: z.number().min(0).max(1),
  isActive: z.boolean(),
  createdAt: z.date()
});

export const DelegationSchema = z.object({
  delegator: z.string(),
  validator: z.string(),
  amount: z.string(), // wei
  modelId: z.string(),
  createdAt: z.date(),
  isActive: z.boolean()
});

// Service Types
export interface InferenceMarketService {
  listModel: (listing: ModelListing) => Promise<string>;
  requestInference: (request: InferenceRequest) => Promise<string>;
  submitResult: (result: InferenceResult) => Promise<string>;
  verifyInference: (resultId: string, validator: string) => Promise<string>;
  challengeResult: (challenge: Challenge) => Promise<string>;
  stakeValidator: (validator: string, modelId: string, amount: string) => Promise<string>;
  delegateStake: (delegation: Delegation) => Promise<string>;
  getModelListings: (filters?: ModelFilters) => Promise<ModelListing[]>;
  getInferenceHistory: (requester: string) => Promise<InferenceResult[]>;
  getValidatorPerformance: (validator: string) => Promise<ValidatorPerformance>;
}

export interface EigenLayerAVSService {
  registerAVS: (config: AVSConfig) => Promise<string>;
  stakeValidator: (validator: string, amount: string) => Promise<string>;
  delegateStake: (delegator: string, validator: string, amount: string) => Promise<string>;
  slashValidator: (validator: string, amount: string, reason: string) => Promise<string>;
  distributeRewards: (modelId: string, totalRewards: string) => Promise<string>;
  getAVSInfo: (avsId: string) => Promise<AVSConfig>;
  getValidatorStake: (validator: string) => Promise<string>;
  getDelegationInfo: (delegator: string, validator: string) => Promise<Delegation>;
}

// Type exports
export type InferenceRequest = z.infer<typeof InferenceRequestSchema>;
export type InferenceResult = z.infer<typeof InferenceResultSchema>;
export type VerificationProof = z.infer<typeof VerificationProofSchema>;
export type ModelListing = z.infer<typeof ModelListingSchema>;
export type ValidatorStake = z.infer<typeof ValidatorStakeSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type AVSConfig = z.infer<typeof AVSConfigSchema>;
export type Delegation = z.infer<typeof DelegationSchema>;
export type ModelType = z.infer<typeof ModelTypeSchema>;
export type InferenceTask = z.infer<typeof InferenceTaskSchema>;
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
export type StakeholderRole = z.infer<typeof StakeholderRoleSchema>;

// Additional types
export interface ModelFilters {
  modelType?: ModelType;
  tasks?: InferenceTask[];
  maxPrice?: string;
  minAccuracy?: number;
  maxLatency?: number;
  minUptime?: number;
}

export interface ValidatorPerformance {
  validator: string;
  totalInferences: number;
  verifiedInferences: number;
  accuracy: number;
  averageLatency: number;
  uptime: number;
  totalRewards: string;
  slashingEvents: number;
  reputationScore: number;
}

export interface MarketMetrics {
  totalModels: number;
  activeValidators: number;
  totalStake: string;
  totalInferences: number;
  averageAccuracy: number;
  averageLatency: number;
  totalRewards: string;
  slashingEvents: number;
}