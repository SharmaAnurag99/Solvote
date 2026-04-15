import { PublicKey } from "@solana/web3.js";

/**
 * BLOCKCHAIN CONFIGURATION
 * 
 * Contains all constants needed for smart contract interaction
 */

// ==========================================
// SOLANA NETWORK CONFIGURATION
// ==========================================

export const SOLANA_NETWORK = {
  DEVNET: "devnet",
  MAINNET: "mainnet-beta",
  LOCALNET: "localnet",
} as const;

export const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || SOLANA_NETWORK.DEVNET;

export const RPC_ENDPOINTS = {
  [SOLANA_NETWORK.DEVNET]: "https://api.devnet.solana.com",
  [SOLANA_NETWORK.MAINNET]: "https://api.mainnet-beta.solana.com",
  [SOLANA_NETWORK.LOCALNET]: "http://localhost:8899",
} as const;

export const RPC_ENDPOINT = RPC_ENDPOINTS[CLUSTER as keyof typeof RPC_ENDPOINTS];

// ==========================================
// ROFV SMART CONTRACT CONFIGURATION
// ==========================================

/**
 * MAIN PROGRAM ID
 * 
 * This is the Solana program ID for the BlockVote smart contract.
 * Generated during contract deployment.
 * 
 * Update this after deploying to your own network:
 * solana program info <PROGRAM_ID> --url devnet
 */
export const ROFV_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ROFV_PROGRAM_ID || "5yfFTBCg2fWxF6vKTjKDJjUkXdPeZNCqHQ8A1Ke5Kqhd"
);

/**
 * Election Configuration
 * These are typical election parameters used in BlockVote
 */
export const ELECTION_CONFIG = {
  TOTAL_CANDIDATES: 3,           // 3 choices
  TURNOUT_THRESHOLD: 50,         // 50% minimum turnout
  TIMEOUT_HOURS: 24,             // 24-hour voting window
  MIN_ELIGIBLE_VOTERS: 10,       // Minimum voters needed
} as const;

// ==========================================
// TRANSACTION CONFIGURATION
// ==========================================

export const TRANSACTION_CONFIG = {
  PREFLIGHT_COMMITMENT: "processed" as const,
  COMMITMENT: "confirmed" as const,
  TIMEOUT_MS: 30000,             // 30 second timeout
  MAX_RETRIES: 3,                // Retry 3 times on failure
} as const;

// ==========================================
// GAS & FEE CONSTANTS (in Lamports = 0.000001 SOL)
// ==========================================

export const SOL_CONSTANTS = {
  LAMPORTS_PER_SOL: 1_000_000_000,
  ACCOUNT_RENT_EXEMPTION_LAMPORTS: 3_000_000,  // ~0.003 SOL
} as const;

// ==========================================
// FEATURE FLAGS
// ==========================================

export const FEATURES = {
  USE_MOCK_PROOFS: process.env.NEXT_PUBLIC_USE_MOCK_PROOFS === "true",
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV === "development",
  ENABLE_TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE === "true",
  ENABLE_OFFLINE_MODE: true,     // Allow DTN queue
} as const;

// ==========================================
// STORAGE KEYS
// ==========================================

export const STORAGE_KEYS = {
  WHITELIST: "whitelist",
  VERIFIED_IDENTITY: "verified_identity",
  DTN_OUTBOX: "dtn_outbox",
  USED_NULLIFIERS: "used_nullifiers",
  ELECTION_STATE: "election_state_pubkey",
  CONTRACT_EVENTS: "contract_events",
  VOTER_REGISTRATIONS: "voter_registrations",
  MERKLE_ROOT: "merkleRoot",
} as const;

// ==========================================
// CONTRACT EVENT TYPES
// ==========================================

export const CONTRACT_EVENTS = {
  ELECTION_INITIALIZED: "ElectionInitialized",
  VOTE_RECORDED: "VoteRecorded",
  ELECTION_FINALIZED: "ElectionFinalized",
  ERROR: "ContractError",
} as const;

// ==========================================
// ERROR CODES
// ==========================================

export const ERROR_CODES = {
  ELECTION_NOT_ACTIVE: 0,
  ELECTION_FINALIZED: 1,
  INVALID_CANDIDATE_ID: 2,
  NULLIFIER_ALREADY_USED: 3,
  INVALID_NULLIFIER_FORMAT: 4,
  UNAUTHORIZED_AUTHORITY: 5,
  ALREADY_FINALIZED: 6,
  INVALID_CANDIDATE_COUNT: 7,
  INVALID_VOTER_COUNT: 8,
} as const;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get the correct RPC endpoint based on current network
 */
export function getRpcEndpoint(): string {
  return RPC_ENDPOINT;
}

/**
 * Get the program ID
 */
export function getProgramId(): PublicKey {
  return ROFV_PROGRAM_ID;
}

/**
 * Check if we're in development/test mode
 */
export function isDevMode(): boolean {
  return FEATURES.ENABLE_DEBUG_LOGS;
}

/**
 * Check if using mock proofs (for testing without circuit artifacts)
 */
export function useMockProofs(): boolean {
  return FEATURES.USE_MOCK_PROOFS;
}

/**
 * Get current cluster name (for display)
 */
export function getClusterName(): string {
  return CLUSTER;
}

/**
 * Check if running on mainnet
 */
export function isMainnet(): boolean {
  return CLUSTER === SOLANA_NETWORK.MAINNET;
}

/**
 * Check if running on devnet
 */
export function isDevnet(): boolean {
  return CLUSTER === SOLANA_NETWORK.DEVNET;
}

/**
 * Log debug message
 */
export function debugLog(message: string, data?: any): void {
  if (FEATURES.ENABLE_DEBUG_LOGS) {
    console.log(`[DEBUG] ${message}`, data || "");
  }
}

/**
 * Get lamports from SOL amount
 */
export function solToLamports(sol: number): number {
  return sol * SOL_CONSTANTS.LAMPORTS_PER_SOL;
}

/**
 * Get SOL from lamports
 */
export function lamportsToSol(lamports: number): number {
  return lamports / SOL_CONSTANTS.LAMPORTS_PER_SOL;
}

// ==========================================
// EXPORT SUMMARY
// ==========================================

/**
 * Display all configuration on app startup (dev only)
 */
export function logConfiguration(): void {
  if (FEATURES.ENABLE_DEBUG_LOGS) {
    console.log("=== BlockVote Configuration ===");
    console.log(`Cluster: ${CLUSTER}`);
    console.log(`RPC: ${RPC_ENDPOINT}`);
    console.log(`Program ID: ${ROFV_PROGRAM_ID.toBase58()}`);
    console.log(`Mock Proofs: ${FEATURES.USE_MOCK_PROOFS}`);
    console.log(`Test Mode: ${FEATURES.ENABLE_TEST_MODE}`);
    console.log("==============================");
  }
}
