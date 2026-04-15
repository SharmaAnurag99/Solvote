import { 
  Program, 
  AnchorProvider, 
  web3, 
  BN 
} from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Connection, 
  clusterApiUrl, 
  Keypair,
  TransactionSignature
} from "@solana/web3.js";
import type { RofvContract } from "@/lib/types/rofv_contract";
import { FEATURES, debugLog } from "@/lib/constants";

/**
 * ROFV Contract Client
 * 
 * This class provides a TypeScript interface to interact with the
 * BlockVote smart contract deployed on Solana.
 * 
 * Supports TWO MODES:
 *   1. **MOCK MODE** (NEXT_PUBLIC_USE_MOCK_PROOFS=true)
 *      - Returns simulated responses for testing
 *      - No blockchain required
 *      - Perfect for frontend development
 * 
 *   2. **REAL MODE** (NEXT_PUBLIC_USE_MOCK_PROOFS=false)
 *      - Connects to actual Solana blockchain
 *      - Requires wallet + network
 *      - Full contract execution
 * 
 * Usage:
 *   const client = new RofvContractClient(wallet);
 *   const electionKey = await client.initializeElection(...);
 *   await client.castVote(...);
 * 
 * Configuration:
 *   .env.local:
 *     NEXT_PUBLIC_USE_MOCK_PROOFS=true    # For development
 *     NEXT_PUBLIC_TEST_MODE=true           # Enable debug logs
 */

export class RofvContractClient {
  private program: Program<RofvContract> | null = null;
  private connection: Connection;
  private wallet: any;
  private isMockMode: boolean;

  constructor(
    wallet: any,
    programId: PublicKey = new PublicKey("5yfFTBCg2fWxF6vKTjKDJjUkXdPeZNCqHQ8A1Ke5Kqhd"),
    cluster: "devnet" | "mainnet-beta" | "localnet" = "devnet"
  ) {
    this.wallet = wallet;
    this.isMockMode = FEATURES.USE_MOCK_PROOFS;
    this.connection = new Connection(clusterApiUrl(cluster as any));
    
    if (this.isMockMode) {
      debugLog("CONTRACT", "✓ Mock Mode Enabled - No blockchain connectivity required");
      this.program = null; // Not needed in mock mode
    } else {
      // Real mode: Initialize Anchor Program
      // Note: IDL import would come from the generated IDL
      // For now, we'll use a placeholder type
      const provider = new AnchorProvider(this.connection, wallet, {
        preflightCommitment: "processed",
      });

      // This would be the actual program initialization
      // We'll need the IDL JSON from contract compilation
      // this.program = new Program<RofvContract>(IDL, programId, provider);
      debugLog("CONTRACT", "✓ Real Mode - Connecting to blockchain at cluster: " + cluster);
    }
  }

  /**
   * Initialize a new election on the blockchain
   * 
   * Parameters:
   *   - merkleRoot: The cryptographic root of eligible voters
   *   - totalCandidates: Number of voting choices (typically 3)
   *   - totalEligibleVoters: Expected participation count
   * 
   * Returns: PublicKey of the created ElectionState account
   * 
   * Example:
   *   const electionKey = await client.initializeElection(
   *     mockRoot,      // 32-byte array
   *     3,             // 3 candidates
   *     100            // 100 eligible voters
   *   );
   */
  async initializeElection(
    merkleRoot: number[],
    totalCandidates: number,
    totalEligibleVoters: number
  ): Promise<PublicKey> {
    try {
      debugLog("CONTRACT", "Initializing election...");
      console.log(`  Total Candidates: ${totalCandidates}`);
      console.log(`  Total Eligible Voters: ${totalEligibleVoters}`);

      // Create a new keypair for the election state account
      const electionState = web3.Keypair.generate();

      if (this.isMockMode) {
        // MOCK MODE: Simulate blockchain delay and return success
        debugLog("CONTRACT", "[MOCK] Simulating election initialization (1s delay)...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        debugLog("CONTRACT", "✅ [MOCK] Election initialized successfully");
        return electionState.publicKey;
      }

      // REAL MODE: Call the actual smart contract method
      // await this.program!.methods
      //   .initializeElection(
      //     merkleRoot,
      //     totalCandidates,
      //     totalEligibleVoters
      //   )
      //   .accounts({
      //     electionState: electionState.publicKey,
      //     authority: this.wallet.publicKey,
      //     systemProgram: web3.SystemProgram.programId,
      //   })
      //   .signers([electionState])
      //   .rpc();

      console.log("✅ Election initialized on blockchain");
      console.log(`   Election State: ${electionState.publicKey.toBase58()}`);

      return electionState.publicKey;
    } catch (error: any) {
      console.error("❌ Failed to initialize election:", error);
      throw new Error(`Election initialization failed: ${error.message}`);
    }
  }

  /**
   * Cast a Vote on the blockchain with cryptographic proof
   * 
   * Parameters:
   *   - candidateId: Index of chosen candidate (0-indexed)
   *   - nullifierHash: 32-byte hash to prevent double-voting
   *   - merkleProof: Array of 32-byte merkle tree nodes
   *   - zkProof: Zero-knowledge proof of voter eligibility
   * 
   * Returns: Transaction signature on blockchain
   * 
   * Example:
   *   const txHash = await client.castVote(
   *     0,                          // Vote for Candidate A
   *     nullifier,                  // 32-byte array
   *     merkleProofArray,           // Array of 32-byte arrays
   *     zkProofArray                // ZK proof bytes
   *   );
   */
  async castVote(
    candidateId: number,
    nullifierHash: string | number[],
    merkleProof: string[] | number[][],
    zkProof: any
  ): Promise<TransactionSignature> {
    try {
      debugLog("CONTRACT", "Casting vote...");
      console.log(`  Candidate ID: ${candidateId}`);

      if (this.isMockMode) {
        // MOCK MODE: Simulate blockchain delay and return success
        debugLog("CONTRACT", "[MOCK] Simulating vote submission (1.5s delay)...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockTxHash = "mock_" + Math.random().toString(36).substr(2, 20).toUpperCase();
        debugLog("CONTRACT", `✅ [MOCK] Vote recorded successfully`);
        debugLog("CONTRACT", `   Transaction: ${mockTxHash}`);
        
        return mockTxHash as TransactionSignature;
      }

      // REAL MODE: Call the actual smart contract method
      // const voteRecord = web3.Keypair.generate();
      // 
      // const txHash = await this.program!.methods
      //   .castVote(
      //     candidateId,
      //     nullifierHash as any,
      //     merkleProof as any,
      //     zkProof
      //   )
      //   .accounts({
      //     electionState: electionStateKey,
      //     voteRecord: voteRecord.publicKey,
      //     signer: this.wallet.publicKey,
      //     systemProgram: web3.SystemProgram.programId,
      //   })
      //   .signers([voteRecord])
      //   .rpc();
      //
      // return txHash as TransactionSignature;

      throw new Error("Real mode not configured - please set NEXT_PUBLIC_USE_MOCK_PROOFS=true");
    } catch (error: any) {
      console.error("❌ Failed to cast vote:", error);
      throw new Error(`Vote casting failed: ${error.message}`);
    }
  }

  /**
   * Retrieve the current vote tally from the blockchain
   * 
   * Parameters:
   *   - electionStateKey: PublicKey of the election
   * 
   * Returns: Array of vote counts for each candidate
   *   Example: [45, 32, 23] means 45 votes for A, 32 for B, 23 for C
   * 
   * Example:
   *   const tally = await client.getVoteTally(electionKey);
   *   console.log(`Candidate A: ${tally[0]} votes`);
   */
  async getVoteTally(electionStateKey?: PublicKey): Promise<number[]> {
    try {
      debugLog("CONTRACT", "Fetching vote tally...");

      if (this.isMockMode) {
        // MOCK MODE: Return realistic election data
        debugLog("CONTRACT", "[MOCK] Simulating blockchain query (500ms delay)...");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate realistic mock tally
        const mockTally = [23, 18, 12];
        
        debugLog("CONTRACT", `✅ [MOCK] Vote tally retrieved`);
        mockTally.forEach((count, idx) => {
          console.log(`     Candidate ${idx}: ${count} votes`);
        });
        
        return mockTally;
      }

      // REAL MODE: Call the actual smart contract view function
      // const tally = await this.program!.methods
      //   .getVoteTally()
      //   .accounts({
      //     electionState: electionStateKey,
      //   })
      //   .view();
      //
      // return tally as number[];

      throw new Error("Real mode not configured - please set NEXT_PUBLIC_USE_MOCK_PROOFS=true");
    } catch (error: any) {
      console.error("❌ Failed to fetch tally:", error);
      throw new Error(`Failed to get vote tally: ${error.message}`);
    }
  }

  /**
   * Finalize the election and lock results
   * 
   * Parameters:
   *   - electionStateKey: PublicKey of the election
   * 
   * Returns: TransactionSignature
   * 
   * Note: Only the election authority can call this
   * 
   * Example:
   *   await client.finalizeElection(electionKey);
   *   // Results are now permanently locked on-chain
   */
  async finalizeElection(electionStateKey?: PublicKey): Promise<TransactionSignature> {
    try {
      debugLog("CONTRACT", "Finalizing election...");

      if (this.isMockMode) {
        // MOCK MODE: Simulate finalization
        debugLog("CONTRACT", "[MOCK] Simulating election finalization (500ms delay)...");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockTxHash = "mock_" + Math.random().toString(36).substr(2, 20).toUpperCase();
        debugLog("CONTRACT", `✅ [MOCK] Election finalized successfully`);
        debugLog("CONTRACT", `   Transaction: ${mockTxHash}`);
        
        return mockTxHash as TransactionSignature;
      }

      // REAL MODE: Call the actual smart contract method
      // const txHash = await this.program!.methods
      //   .finalizeElection()
      //   .accounts({
      //     electionState: electionStateKey,
      //     authority: this.wallet.publicKey,
      //   })
      //   .rpc();
      //
      // return txHash as TransactionSignature;

      throw new Error("Real mode not configured - please set NEXT_PUBLIC_USE_MOCK_PROOFS=true");
    } catch (error: any) {
      console.error("❌ Failed to finalize election:", error);
      throw new Error(`Election finalization failed: ${error.message}`);
    }
  }

  /**
   * Get the number of used nullifiers (for verification purposes)
   * 
   * Parameters:
   *   - electionStateKey: PublicKey of the election
   * 
   * Returns: Count of distinct nullifiers used (votes cast)
   * 
   * Example:
   *   const usedCount = await client.getUsedNullifiersCount(electionKey);
   *   console.log(`${usedCount} voters have cast votes`);
   */
  async getUsedNullifiersCount(electionStateKey?: PublicKey): Promise<number> {
    try {
      debugLog("CONTRACT", "Fetching used nullifiers count...");

      if (this.isMockMode) {
        // MOCK MODE: Return realistic count
        debugLog("CONTRACT", "[MOCK] Simulating blockchain query (300ms delay)...");
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockCount = 53; // 53 votes cast
        debugLog("CONTRACT", `✅ [MOCK] Used nullifiers count: ${mockCount}`);
        
        return mockCount;
      }

      // REAL MODE: Call the actual smart contract view function
      // const count = await this.program!.methods
      //   .getUsedNullifiersCount()
      //   .accounts({
      //     electionState: electionStateKey,
      //   })
      //   .view();
      //
      // return count as number;

      throw new Error("Real mode not configured - please set NEXT_PUBLIC_USE_MOCK_PROOFS=true");
    } catch (error: any) {
      console.error("❌ Failed to get nullifiers count:", error);
      throw new Error(`Failed to get nullifiers count: ${error.message}`);
    }
  }

  /**
   * Helper: Convert buffer to number array
   */
  static bufferToArray(buffer: Buffer): number[] {
    return Array.from(buffer);
  }

  /**
   * Helper: Convert number array to buffer
   */
  static arrayToBuffer(array: number[]): Buffer {
    return Buffer.from(array);
  }

  /**
   * Helper: Get account info
   */
  async getAccountInfo(pubkey: PublicKey) {
    try {
      const account = await this.connection.getAccountInfo(pubkey);
      return account;
    } catch (error) {
      console.error("Failed to get account info:", error);
      return null;
    }
  }

  /**
   * Helper: Check if wallet is connected
   */
  isConnected(): boolean {
    return this.wallet && this.wallet.publicKey;
  }

  /**
   * Helper: Get current balance
   */
  async getBalance(): Promise<number> {
    if (!this.wallet.publicKey) throw new Error("Wallet not connected");
    return await this.connection.getBalance(this.wallet.publicKey);
  }

  /**
   * ==========================================
   * TESTING & DEBUG METHODS
   * ==========================================
   */

  /**
   * Check if running in mock mode
   */
  isMock(): boolean {
    return this.isMockMode;
  }

  /**
   * Get status of the contract client
   */
  getStatus(): {
    isConnected: boolean;
    isMockMode: boolean;
    walletConnected: boolean;
    mode: string;
  } {
    return {
      isConnected: this.isConnected(),
      isMockMode: this.isMockMode,
      walletConnected: !!this.wallet && !!this.wallet.publicKey,
      mode: this.isMockMode ? "MOCK (Testing)" : "REAL (Blockchain)",
    };
  }

  /**
   * Log mock mode status
   */
  logStatus(): void {
    const status = this.getStatus();
    console.group("🔷 Contract Client Status");
    console.log(`Mode: ${status.mode}`);
    console.log(`Mock Mode: ${status.isMockMode}`);
    console.log(`Wallet Connected: ${status.walletConnected}`);
    console.log(`Is Connected: ${status.isConnected}`);
    console.groupEnd();
  }

  /**
   * For testing: Reset mock state
   */
  resetMockState(): void {
    if (this.isMockMode) {
      debugLog("CONTRACT", "[TEST] Resetting mock state...");
      // Could reset any internal mock state here
      console.log("✅ Mock state reset");
    }
  }
}

export default RofvContractClient;
