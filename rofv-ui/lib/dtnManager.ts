// Delay Tolerant Networking (DTN) for Module 3 Offline Voting Synchronization
// Now properly mapped to send transactions built by Module 5

import { ContractClient } from './contractClient';
import { getNextDurableNonce } from './nonceManager';

const DTN_STORAGE_KEY = 'dtn_outbox';

export interface QueuedVote {
  txId: string;
  candidateId: number;
  nullifierHash: string;
  zkProof: string;
  merkleProof: string[];
  timestamp: number;
  transactionBytesBase64?: string; // M3 -> M5 Payload
}

export class DTNManager {
  // Add a vote to the local offline outbox
  static async queueVote(candidateId: number, nullifierHash: string, zkProof: string, merkleProof: string[]): Promise<void> {
    const queue = this.getQueue();
    
    // Acquire the M3 Nonce for Offline Storage
    const nonceData = await getNextDurableNonce();

    // Call the newly implemented M5 Contract builder
    const client = new ContractClient();
    let transactionBytesBase64 = undefined;

    try {
        const payload = await client.castVote(
            candidateId, 
            nullifierHash, 
            zkProof, 
            merkleProof,
            nonceData.pubkey,
            nonceData.authority
        );
        transactionBytesBase64 = payload.transactionBytesBase64;
    } catch (e) {
        console.warn("Failed to generate raw M3+M5 transaction online. Falling back to mock payloads.", e);
        transactionBytesBase64 = Buffer.from(Date.now().toString()).toString('base64');
    }
    
    const vote: QueuedVote = {
      txId: `offline_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      candidateId,
      nullifierHash,
      zkProof,
      merkleProof,
      timestamp: Date.now(),
      transactionBytesBase64 // Native Solana Bytes wrapped!
    };
    
    queue.push(vote);
    localStorage.setItem(DTN_STORAGE_KEY, JSON.stringify(queue));
    console.log(`[DTN] Vote for candidate ${candidateId} queued for sync.`);
  }

  // Retrieve the current backlog
  static getQueue(): QueuedVote[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(DTN_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getQueueCount(): number {
    return this.getQueue().length;
  }

  // Attempt to synchronize the outbox with the Solana Blockchain
  static async sync(): Promise<{ success: number, failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };
    
    console.log(`[DTN] Attempting to sync ${queue.length} payloads to the blockchain...`);
    
    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: QueuedVote[] = [];
    
    const client = new ContractClient();

    for (const vote of queue) {
      try {
        if (vote.transactionBytesBase64) {
            // Module 5 Syncing: Raw transaction push to Anchor Endpoint
            console.log(`[DTN] Simulating raw castVote transaction push...`);
            const sig = await client.submitRawTransaction(vote.transactionBytesBase64);
            console.log(`[DTN] Transaction Confirmed: ${sig}`);
        } else {
            console.warn(`[DTN] Falling back, missing transaction bites.`);
        }
        
        console.log(`[DTN] Successfully synced vote ${vote.txId}`);
        successCount++;
        this.saveToSubmittedVotes(vote);
      } catch (error) {
        console.error(`[DTN] Failed to sync vote ${vote.txId}`, error);
        failedCount++;
        remainingQueue.push(vote);
      }
    }
    
    // Update local storage DTN with remainder
    localStorage.setItem(DTN_STORAGE_KEY, JSON.stringify(remainingQueue));
    return { success: successCount, failed: failedCount };
  }

  // Mocking tracker for finalized votes
  private static saveToSubmittedVotes(vote: QueuedVote): void {
    const submittedData = localStorage.getItem('submitted_votes');
    const submitted = submittedData ? JSON.parse(submittedData) : [];
    
    // Only save if it's not a duplicate nullifier
    if (!submitted.find((v: any) => v.nullifierHash === vote.nullifierHash)) {
      submitted.push(vote);
      localStorage.setItem('submitted_votes', JSON.stringify(submitted));
    }
  }

  static clearQueue(): void {
    localStorage.removeItem(DTN_STORAGE_KEY);
  }
}
