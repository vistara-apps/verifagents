// Export all types
export * from './types';

// Export services
export { InferenceMarketService } from './services/InferenceMarketService';

// Export agents
export { InferenceValidator } from './agents/InferenceValidator';

// Export contracts
export { default as InferenceMarketABI } from './contracts/InferenceMarket.sol';

// Version
export const VERSION = '1.0.0';