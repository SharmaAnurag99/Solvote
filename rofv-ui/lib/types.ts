import { PublicKey } from "@solana/web3.js";

/**
 * BLOCKVOTE TYPE DEFINITIONS
 * 
 * All TypeScript interfaces and enums for the voting system
 */

// ==========================================
// ELECTORAL PROCESS TYPES
// ==========================================

/**
 * Voter registration data
 * Stored in admin panel's localStorage
 */
export interface WhitelistEntry {
  id: string;                    // Unique voter identifier
  aadhaar: string;              // Aadhaar number (hashed in production)
  fullName: string;             // Voter name
  registeredAt: string;         // ISO timestamp of registration
  hasVoted: boolean;            // Has this voter already cast a vote?
  votedAt?: string;             // ISO timestamp when vote was cast
  votedCandidate?: string;      // Which candidate did they vote for?
}

/**
 * Verified identity from polling booth
 * Result of identity verification process
 */
export interface VerifiedIdentity {
  aadhaar: string;              // Matched aadhaar from whitelist
  fullName: string;             // Matched voter name
  registrationTime: string;     // When they were registered
  verificationTime: string;     // When they were verified
  verified: boolean;            // Successfully verified?
}

/**
 * Vote record in polling booth
 * Temporary storage before blockchain submission
 */
export interface VoteRecord {
  voterAadhaar: string;         // Who is voting (hashed)
  candidateId: number;          // Which candidate
  candidateName: string;        // Display name of candidate
  nullifier: string;            // Unique identifier for double-voting prevention
  zeroKnowledgeProof: {         // ZK proof of voter eligibility
    proof: string;
    publicSignals: string[];
  };
  timestamp: string;            // When vote was created
  encrypted: boolean;           // Has vote been encrypted?
}

/**
 * Election state on blockchain
 * Matches contract ElectionState account
 */
export interface ElectionState {
  authority: PublicKey;         // Electoral officer who created election
  merkleRoot: string;           // Root of voter eligibility merkle tree
  totalCandidates: number;      // How many candidates?
  totalEligibleVoters: number;  // How many eligible voters?
  isActive: boolean;            // Can votes be cast?
  isFinalised: boolean;         // Has election ended?
  startTime: number;            // Unix timestamp
  endTime: number;              // Unix timestamp
  totalVotesCast: number;       // How many votes recorded?
  voteCounts: number[];         // [candidate0_votes, candidate1_votes, ...]
}

// ==========================================
// DTN QUEUE TYPES (Durable Transaction Network)
// ==========================================

/**
 * Pending transaction in DTN outbox
 * Queued vote waiting to be submitted to blockchain
 */
export interface DTNQueueItem {
  id: string;                   // Unique queue item ID
  vote: VoteRecord;             // The vote to submit
  status: "pending" | "submitted" | "confirmed" | "failed";
  createdAt: string;            // When added to queue
  submittedAt?: string;         // When attempted submission
  confirmationSignature?: string; // Transaction signature if confirmed
  errorMessage?: string;        // Error details if failed
  retryCount: number;           // How many times submitted?
  lastRetryAt?: string;         // When last attempted
}

/**
 * DTN Outbox - all pending transactions
 * Stored in localStorage for offline-first capability
 */
export interface DTNOutbox {
  items: DTNQueueItem[];
  lastSyncTime?: string;
  networkStatus: "online" | "offline";
  pendingCount: number;
}

// ==========================================
// NULLIFIER & ZK PROOF TYPES
// ==========================================

/**
 * Nullifier data structure
 * Prevents double voting while preserving voter privacy
 */
export interface Nullifier {
  nullifierHash: string;        // Hashed unique identifier
  voterAadhaar: string;         // Whose nullifier is this? (hashed)
  createdAt: string;
  usedOnBlockchain: boolean;    // Has this been recorded?
}

/**
 * Zero knowledge proof structure
 */
export interface ZKProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  publicSignals: string[];
}

// ==========================================
// ADMIN DASHBOARD TYPES
// ==========================================

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  totalEligibleVoters: number;
  totalVotesCast: number;
  pendingVotes: number;
  turnoutPercentage: number;
  votersWithErrors: number;
}

/**
 * Vote tally from blockchain
 * Result of `getVoteTally()` contract call
 */
export interface VoteTally {
  candidateId: number;
  candidateName: string;
  voteCount: number;
}

/**
 * Election results
 */
export interface ElectionResults {
  electionId: string;
  startTime: string;
  endTime: string;
  totalVotesCast: number;
  turnoutPercentage: number;
  results: VoteTally[];
  winner?: VoteTally;
  isFinalised: boolean;
}

// ==========================================
// CONTRACT INTERACTION TYPES
// ==========================================

/**
 * Parameters for initializing election on blockchain
 */
export interface InitializeElectionParams {
  merkleRoot: string;           // From voter whitelist
  totalCandidates: number;      // 3 in BlockVote
  totalEligibleVoters: number;  // From registered whitelist
}

/**
 * Parameters for casting vote on blockchain
 */
export interface CastVoteParams {
  candidateId: number;
  nullifier: string;
  merkleProof: string[];        // Path in merkle tree
  zeroKnowledgeProof: ZKProof;
  voterIndex: number;           // Position in voter array
}

/**
 * Response from contract operations
 */
export interface ContractResponse<T = any> {
  success: boolean;
  data?: T;
  transactionSignature?: string;
  error?: string;
  errorCode?: number;
}

// ==========================================
// WALLET & CONNECTION TYPES
// ==========================================

/**
 * Wallet connection status
 */
export interface WalletStatus {
  isConnected: boolean;
  publicKey?: PublicKey;
  walletName?: string;
  balance?: number;             // in SOL
  network?: string;
}

/**
 * Contract client options
 */
export interface ContractClientOptions {
  programId?: PublicKey;
  cluster?: "devnet" | "mainnet-beta" | "localnet";
  commitment?: "processed" | "confirmed" | "finalized";
}

// ==========================================
// ERROR TYPES
// ==========================================

/**
 * Custom error for contract interactions
 */
export class ContractError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: string
  ) {
    super(message);
  }
}

/**
 * Error from failed vote submission
 */
export class VoteSubmissionError extends Error {
  constructor(
    public reason: "wallet_error" | "network_error" | "contract_error",
    public message: string,
    public originalError?: Error
  ) {
    super(message);
  }
}

// ==========================================
// LOGGING & DEBUG TYPES
// ==========================================

/**
 * Event log entry for debugging
 */
export interface EventLog {
  timestamp: string;
  eventType: string;
  module: "admin" | "booth" | "contract" | "dtn" | "zk";
  message: string;
  data?: any;
  severity: "info" | "warning" | "error";
}

/**
 * Debug context for troubleshooting
 */
export interface DebugContext {
  sessionId: string;
  startTime: string;
  logs: EventLog[];
  contractState?: Partial<ElectionState>;
  walletStatus?: WalletStatus;
  dtnStatus?: DTNOutbox;
}

// ==========================================
// ENUM TYPES
// ==========================================

/**
 * Possible states of a vote
 */
export enum VoteStatus {
  PENDING = "pending",          // In UI, not yet queued
  QUEUED = "queued",            // In DTN outbox
  SUBMITTED = "submitted",      // Sent to blockchain
  CONFIRMED = "confirmed",      // Recorded on blockchain
  FAILED = "failed",            // Submission failed
  CANCELLED = "cancelled",      // User cancelled
}

/**
 * Possible states of a voter
 */
export enum VoterStatus {
  NOT_REGISTERED = "not_registered",
  REGISTERED = "registered",
  VERIFIED = "verified",
  VOTED = "voted",
  ERROR = "error",
}

/**
 * Possible election states
 */
export enum ElectionPhase {
  NOT_STARTED = "not_started",
  REGISTRATION_OPEN = "registration_open",
  VOTING_OPEN = "voting_open",
  VOTING_CLOSED = "voting_closed",
  RESULTS_ANNOUNCED = "results_announced",
}

/**
 * Network status
 */
export enum NetworkStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  CHECKING = "checking",
}

// ==========================================
// TYPE GUARDS
// ==========================================

/**
 * Type guard for WhitelistEntry
 */
export function isWhitelistEntry(obj: any): obj is WhitelistEntry {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.aadhaar === "string" &&
    typeof obj.fullName === "string" &&
    typeof obj.hasVoted === "boolean"
  );
}

/**
 * Type guard for DTNQueueItem
 */
export function isDTNQueueItem(obj: any): obj is DTNQueueItem {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.status === "string" &&
    ["pending", "submitted", "confirmed", "failed"].includes(obj.status)
  );
}

/**
 * Type guard for contract response
 */
export function isContractResponse<T>(obj: any): obj is ContractResponse<T> {
  return (
    typeof obj === "object" &&
    typeof obj.success === "boolean"
  );
}
