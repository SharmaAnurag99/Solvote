// Updated contractClient.ts with M3 (Offline Nonce) + M5 (Anchor) Integration
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, SendTransactionError } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { Program, Provider } from '@project-serum/anchor';

// Setup Mock Environment variables
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_PROOFS === 'true';

// In a real environment, you would import the compiled IDL JSON here
// import idl from './rofv_contract.json';
const idl = {
  version: "0.1.0",
  name: "rofv_contract",
  instructions: [
    {
      name: "initializeElection",
      accounts: [
        { name: "electionState", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "merkleRoot", type: { "array": ["u8", 32] } },
        { name: "totalCandidates", type: "u8" },
        { name: "totalEligibleVoters", type: "u32" }
      ]
    },
    {
      name: "castVote",
      accounts: [
        { name: "electionState", isMut: true, isSigner: false },
        { name: "voteRecord", isMut: true, isSigner: false },
        { name: "signer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "candidateId", type: "u8" },
        { name: "nullifierHash", type: "bytes" },
        { name: "merkleProof", type: { "vec": { "array": ["u8", 32] } } },
        { name: "zkProof", type: "bytes" }
      ]
    },
    {
      name: "getVoteTally",
      accounts: [
        { name: "electionState", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "ElectionState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "merkleRoot", type: { "array": ["u8", 32] } },
          { name: "totalCandidates", type: "u8" },
          { name: "totalEligibleVoters", type: "u32" },
          { name: "isActive", type: "bool" },
          { name: "voteCounts", type: { "vec": "u32" } }
        ]
      }
    }
  ]
};

// You need the real Program ID from deploying 'anchor deploy'
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'G6LXK55Rh6kwy5nfDHMwBZhAgvP7jmpVg9Mt1a2VRSWh');

export class ContractClient {
  private connection: Connection;
  private provider: Provider | null = null;
  private program: any; // Would be Program type with real IDL typing

  constructor(rpcUrl: string = 'http://localhost:8899') {
    this.connection = new Connection(rpcUrl, 'confirmed');

    if (!USE_MOCK && typeof window !== 'undefined' && (window as any).solana) {
      // Setup Anchor Provider
      this.provider = new anchor.AnchorProvider(this.connection, (window as any).solana as anchor.Wallet, {
        preflightCommitment: 'confirmed'
      });
      // Initialize the Anchor Program
      this.program = new anchor.Program(idl as any, PROGRAM_ID, this.provider);
    }
  }

  // Helper to derive Election PDA
  async getElectionStatePda(): Promise<[PublicKey, number]> {
      return PublicKey.findProgramAddressSync(
          [Buffer.from("election_state")],
          PROGRAM_ID
      );
  }

  // 1. Module 5 (Smart Contract) Initialization 
  async initializeElection(merkleRoot: string, candidatesCount: number, eligibleCount: number): Promise<string> {
    if (USE_MOCK) {
      console.log('MOCK: initializeElection', { merkleRoot, candidatesCount });
      return Promise.resolve('mock_init_tx_signature');
    }

    try {
        if (!this.program) throw new Error("Wallet not connected for real transaction.");
        const [electionStatePda] = await this.getElectionStatePda();
        const rootBuffer = Buffer.from(merkleRoot || '0', 'hex').slice(0, 32); 

        // Call the Anchor Instruction
        const txHash = await this.program.methods.initializeElection(
            Array.from(rootBuffer),
            candidatesCount,
            eligibleCount
        ).accounts({
            electionState: electionStatePda,
            authority: this.provider?.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();
        
        return txHash;
    } catch (e: any) {
        console.error("M5 initializeElection failed", e);
        throw e;
    }
  }

  /**
   * Module 3 (Nonces) + Module 5 (Smart Contract) Integration!
   * This generated transaction includes:
   * 1. SystemProgram.nonceAdvance
   * 2. Program.methods.castVote()
   */
  async castVote(
    candidateId: number, 
    nullifierHash: string, 
    zkProof: string, 
    merkleProof: string[],
    nonceAccountPubkeyStr: string, // Module 3 Durable Nonce Input!
    nonceAuthorityPubkeyStr: string
  ): Promise<{ transactionBytesBase64: string }> {
      
      const nonceAccountPubkey = new PublicKey(nonceAccountPubkeyStr);
      const nonceAuthorityPubkey = new PublicKey(nonceAuthorityPubkeyStr);

      if (USE_MOCK) {
        console.log('MOCK: Building castVote M3+M5 tx...', { candidateId, nullifierHash });
        // Simulating the base64 compiled payload for the DTN
        return { transactionBytesBase64: Buffer.from(`mock_m3_m5_tx_${Date.now()}`).toString('base64') };
      }

      if (!this.program) throw new Error("Wallet provider required.");

      const [electionStatePda] = await this.getElectionStatePda();
      
      // Calculate a specific vote record PDA using the nullifier
      const [voteRecordPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vote"), Buffer.from(nullifierHash, 'hex').slice(0, 32)],
          PROGRAM_ID
      );

      // Create the overall transaction
      let transaction = new Transaction();

      // INSTRUCTION 1: Advance the Durable Nonce (Module 3 requirement for offline!)
      const advanceNonceIx = SystemProgram.nonceAdvance({
          noncePubkey: nonceAccountPubkey,
          authorizedPubkey: nonceAuthorityPubkey
      });
      transaction.add(advanceNonceIx);

      // INSTRUCTION 2: Call the Anchor Smart Contract (Module 5)
      const castVoteIx = await this.program.methods.castVote(
          candidateId,
          Buffer.from(nullifierHash, 'hex'),
          merkleProof.map(p => Array.from(Buffer.from(p, 'hex').slice(0, 32))),
          Buffer.from(zkProof, 'hex')
      ).accounts({
          electionState: electionStatePda,
          voteRecord: voteRecordPda,
          signer: nonceAuthorityPubkey, // The kiosk hardware key
          systemProgram: SystemProgram.programId,
      }).instruction();

      transaction.add(castVoteIx);

      // IMPORTANT: Since we are offline, we must lock the blockhash to the Durable Nonce!
      const nonceAccountInfo = await this.connection.getNonce(nonceAccountPubkey);
      if (!nonceAccountInfo) throw new Error("Nonce account not found on chain (needs to be online to fetch initially)");
      
      transaction.recentBlockhash = nonceAccountInfo.nonce;
      transaction.feePayer = nonceAuthorityPubkey;

      // Note: In real offline mode, the frontend would prompt the hardware wallet/booth key to PartialSign here.
      // We return the raw transactional bytes.
      const rawTx = transaction.serialize({ requireAllSignatures: false });
      
      return { transactionBytesBase64: rawTx.toString('base64') };
  }

  // Module 5 Admin Sync: Takes raw bytes from DTN Outbox and blasts to chain.
  async submitRawTransaction(transactionBytesBase64: string): Promise<string> {
      if (USE_MOCK) {
          console.log('MOCK: Submitting RAW transaction bytes to chain...');
          return `mock_tx_${Math.random()}`;
      }

      const txBytes = Buffer.from(transactionBytesBase64, 'base64');
      const tx = Transaction.from(txBytes);

      try {
          const signature = await this.connection.sendRawTransaction(tx.serialize(), {
              skipPreflight: true // Offline payload, skip standard preflight
          });
          // Wait for confirmation
          await this.connection.confirmTransaction(signature, 'confirmed');
          return signature;
      } catch (err: any) {
          console.error("Failed to submit raw transaction from DTN:", err);
          throw err;
      }
  }

  // Anchor Chain-Read Tally
  async getVoteTally(): Promise<number[]> {
    if (USE_MOCK) {
      // Mock Fallback
      if (typeof window !== 'undefined') {
         const mockData = localStorage.getItem('submitted_votes');
         if (mockData) {
            const votes = JSON.parse(mockData);
            const tally = [0, 0, 0, 0];
            votes.forEach((v: any) => tally[v.candidateId]++);
            return tally;
         }
      }
      return [0, 0, 0, 0];
    }
    
    // Module 5 (Real Anchor Fetch)
    try {
        const [electionStatePda] = await this.getElectionStatePda();
        // Anchor deserializes the struct directly off the blockchain
        const state = await this.program.account.electionState.fetch(electionStatePda);
        return state.voteCounts as number[];
    } catch (e) {
        console.error("No active election chain-state found.");
        return [0,0,0,0];
    }
  }

  // Anchor Finalize Method
  async finalizeElection(): Promise<string> {
    if (USE_MOCK) {
      console.log('MOCK: finalizeElection');
      return 'mock_finalize_signature';
    }

    try {
        const [electionStatePda] = await this.getElectionStatePda();
        const txHash = await this.program.methods.finalizeElection().accounts({
            electionState: electionStatePda,
            authority: this.provider?.wallet.publicKey,
        }).rpc();
        return txHash;
    } catch (e) {
        console.error("Failed to finalize election via M5 contract");
        throw e;
    }
  }
}
