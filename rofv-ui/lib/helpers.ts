import { PublicKey } from "@solana/web3.js";
import { WhitelistEntry, VoterStatus } from "./types";

/**
 * UTILITY HELPER FUNCTIONS
 * 
 * Common utilities for hashing, merkle trees, nullifier generation, and other operations
 */

// ==========================================
// HASHING UTILITIES
// ==========================================

/**
 * Generate SHA256 hash
 * Used for hashing aadhaar, creating nullifiers, etc.
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate SHA256 synchronously
 * Warning: This is a basic implementation for demo purposes.
 * In production, use async version.
 */
export function simpleHash(data: string): string {
  // Basic DJB2 hash function for quick hashing
  // NOT cryptographically secure - use sha256 for real security
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) + hash + data.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Generate unique nullifier
 * Combination of voter aadhaar and random seed
 * Used to prevent double voting while preserving privacy
 */
export async function generateNullifier(voterAadhaar: string): Promise<string> {
  const randomSeed = Math.random().toString(36).substring(2);
  const combined = `${voterAadhaar}:${randomSeed}:${Date.now()}`;
  return sha256(combined);
}

/**
 * Hash aadhaar for privacy
 * Stores only hash in DTN queue, not actual aadhaar
 */
export async function hashAadhaar(aadhaar: string): Promise<string> {
  return sha256(`aadhaar:${aadhaar}`);
}

// ==========================================
// MERKLE TREE UTILITIES
// ==========================================

/**
 * Generate merkle root from whitelist
 * Root is used to initialize election on blockchain
 */
export async function generateMerkleRoot(
  whitelist: WhitelistEntry[]
): Promise<string> {
  if (whitelist.length === 0) {
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }

  // Hash each voter
  const leaves = await Promise.all(
    whitelist.map((entry) => sha256(entry.id + entry.aadhaar))
  );

  // Build tree
  const tree = await buildMerkleTree(leaves);
  return tree[tree.length - 1]; // Root is last element
}

/**
 * Build complete merkle tree
 * Returns array of all nodes [leaves, layer2, layer3, ..., root]
 */
async function buildMerkleTree(leaves: string[]): Promise<string[]> {
  let nodes = leaves;

  while (nodes.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
      if (i + 1 < nodes.length) {
        // Combine two nodes
        const combined = nodes[i] + nodes[i + 1];
        const hash = await sha256(combined);
        nextLevel.push(hash);
      } else {
        // Odd node, carry forward
        nextLevel.push(nodes[i]);
      }
    }

    nodes = nextLevel;
  }

  return nodes;
}

/**
 * Generate merkle proof for specific voter
 * Proof is submitted with vote to verify voter's eligibility
 */
export async function generateMerkleProof(
  whitelist: WhitelistEntry[],
  voterAadhaar: string
): Promise<string[]> {
  // Find voter in whitelist
  const voterIndex = whitelist.findIndex((v) => v.aadhaar === voterAadhaar);
  if (voterIndex === -1) {
    throw new Error(`Voter ${voterAadhaar} not found in whitelist`);
  }

  // Hash all voters
  const leaves = await Promise.all(
    whitelist.map((entry) => sha256(entry.id + entry.aadhaar))
  );

  // Build proof path
  const proof: string[] = [];
  let nodes = leaves;
  let index = voterIndex;

  while (nodes.length > 1) {
    if (index % 2 === 0 && index + 1 < nodes.length) {
      // Include sibling to the right
      proof.push(nodes[index + 1]);
    } else if (index % 2 === 1) {
      // Include sibling to the left
      proof.push(nodes[index - 1]);
    }

    // Move to parent level
    const nextLevel: string[] = [];
    for (let i = 0; i < nodes.length; i += 2) {
      if (i + 1 < nodes.length) {
        const combined = nodes[i] + nodes[i + 1];
        const hash = await sha256(combined);
        nextLevel.push(hash);
      } else {
        nextLevel.push(nodes[i]);
      }
    }

    nodes = nextLevel;
    index = Math.floor(index / 2);
  }

  return proof;
}

// ==========================================
// VOTER STATUS UTILITIES
// ==========================================

/**
 * Determine voter status
 */
export function getVoterStatus(entry: WhitelistEntry | null): VoterStatus {
  if (!entry) return VoterStatus.NOT_REGISTERED;
  if (entry.hasVoted) return VoterStatus.VOTED;
  return VoterStatus.REGISTERED;
}

/**
 * Check if voter can cast vote
 */
export function canVote(entry: WhitelistEntry | null): boolean {
  return entry !== null && !entry.hasVoted;
}

/**
 * Get voter status display text
 */
export function getStatusDisplay(entry: WhitelistEntry | null): string {
  const status = getVoterStatus(entry);

  const displays: Record<VoterStatus, string> = {
    [VoterStatus.NOT_REGISTERED]: "❌ Not registered",
    [VoterStatus.REGISTERED]: "📋 Registered",
    [VoterStatus.VERIFIED]: "✓ Verified",
    [VoterStatus.VOTED]: "✅ Voted",
    [VoterStatus.ERROR]: "⚠️ Error",
  };

  return displays[status];
}

// ==========================================
// VALIDATION UTILITIES
// ==========================================

/**
 * Validate aadhaar format (basic)
 * Aadhaar is 12-digit number
 */
export function isValidAadhaar(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar.trim());
}

/**
 * Validate candidate ID
 */
export function isValidCandidateId(
  candidateId: number,
  totalCandidates: number
): boolean {
  return candidateId >= 0 && candidateId < totalCandidates;
}

/**
 * Validate nullifier format
 */
export function isValidNullifier(nullifier: string): boolean {
  // Should be 64-character hex string (256-bit hash)
  return /^[a-f0-9]{64}$/.test(nullifier.toLowerCase());
}

/**
 * Validate public key format
 */
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate timestamp format
 */
export function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return date instanceof Date && !isNaN(date.getTime());
}

// ==========================================
// FORMATTING UTILITIES
// ==========================================

/**
 * Mask sensitive data for display
 * Shows first 4 and last 4 chars, rest are asterisks
 */
export function maskSensitive(data: string, showChars: number = 4): string {
  if (data.length <= showChars * 2) {
    return data;
  }

  const start = data.substring(0, showChars);
  const end = data.substring(data.length - showChars);
  const middle = "*".repeat(data.length - showChars * 2);

  return `${start}${middle}${end}`;
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch {
    return timestamp;
  }
}

/**
 * Format time difference
 */
export function formatTimeDiff(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Format vote count with abbreviation
 */
export function formatVoteCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ==========================================
// CRYPTO UTILITIES
// ==========================================

/**
 * Generate random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate random hex string
 */
export function generateRandomHex(length: number): string {
  const bytes = generateRandomBytes(length);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Encode to base64
 */
export function encodeBase64(data: string): string {
  return Buffer.from(data).toString("base64");
}

/**
 * Decode from base64
 */
export function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

// ==========================================
// ERROR HANDLING UTILITIES
// ==========================================

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): string {
  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.toString) {
    const str = error.toString();
    // Extract contract error message if available
    if (str.includes("Error")) {
      return str.split(":").pop()?.trim() || "Unknown error";
    }
    return str;
  }

  return "An unexpected error occurred";
}

// ==========================================
// BLOCKCHAIN UTILITIES
// ==========================================

/**
 * Shorten public key for display
 */
export function shortenPublicKey(key: string | PublicKey, chars: number = 4): string {
  const keyStr = key instanceof PublicKey ? key.toBase58() : key;
  return `${keyStr.substring(0, chars)}...${keyStr.substring(keyStr.length - chars)}`;
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

// ==========================================
// STORAGE UTILITIES
// ==========================================

/**
 * Get item from localStorage with type safety
 */
export function getStorageItem<T>(
  key: string,
  fallback: T
): T {
  if (typeof window === "undefined") return fallback;

  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}

/**
 * Set item in localStorage with type safety
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
  }
}

// ==========================================
// DEBUG UTILITIES
// ==========================================

/**
 * Log with timestamp
 */
export function debugLog(module: string, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${module}] ${message}`, data || "");
}

/**
 * Generate debug report
 */
export function generateDebugReport(data: Record<string, any>): string {
  return Object.entries(data)
    .map(([key, value]) => {
      if (typeof value === "object") {
        return `${key}: ${JSON.stringify(value, null, 2)}`;
      }
      return `${key}: ${value}`;
    })
    .join("\n");
}
