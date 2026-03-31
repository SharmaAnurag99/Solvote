# 🔵 Module 4: The DTN Forwarding (Sync to Blockchain)

## Overview
When network comes back online, this module automatically syncs all queued offline votes to Solana blockchain. It's the bridge between offline storage and on-chain verification.

## Objectives
- ✅ Detect when network comes ONLINE
- ✅ Read all votes from DTN outbox (localStorage)
- ✅ Submit signed transactions to Solana
- ✅ Track submission status (pending → submitted → confirmed)
- ✅ Remove votes after successful submission
- ✅ Handle retry logic for failed submissions
- ✅ Display sync progress to user

## UI Components Needed

### 1. Sync Status Bar
```
┌──────────────────────────────────┐
│  🔄 Syncing Votes...             │
│  [████████░░] 8/10 votes synced  │
│                                  │
│  Last sync: 2 minutes ago        │
└──────────────────────────────────┘
```

### 2. Sync Result (Success)
```
┌──────────────────────────────────┐
│  ✅ All Votes Synced!            │
├──────────────────────────────────┤
│  10 votes submitted successfully  │
│                                  │
│  Transaction Hashes:            │
│  - 0x1a2b3c4d...               │
│  - 0x5e6f7g8h...               │
│                                  │
│  [View on Solscan] [← Back]     │
└──────────────────────────────────┘
```

### 3. Sync Failed (With Retry)
```
┌──────────────────────────────────┐
│  ⚠️ Sync Failed                  │
├──────────────────────────────────┤
│  2 of 10 votes failed to submit  │
│                                  │
│  Reason: Network timeout         │
│                                  │
│  [Retry] [Offline Mode] [← Back] │
└──────────────────────────────────┘
```

## Developer Tasks

### Phase 1: Network Status Detection
- [ ] Create `networkStatus.js`:
  - `listenToNetworkChanges()` - detects online/offline
  - Trigger sync when transitioning from OFFLINE → ONLINE
  - Hook into browser's `online`/`offline` events

### Phase 2: Vote Submission Logic
- [ ] Create `dtnSync.js`:
  - `submitVoteToBockchain(signedTx)` - sends to Solana
  - Uses `connection.sendRawTransaction()`
  - Handles RPC errors and timeouts

### Phase 3: Batch Processing
- [ ] Create batch submission:
  - Read all votes from `dtn_outbox`
  - Submit one at a time (or in small batches if Solana allows)
  - Track each in real-time
  - Update UI progress bar

### Phase 4: Retry Mechanism
- [ ] Implement retry logic:
  - Max 3 attempts per vote
  - Exponential backoff (1s, 2s, 4s)
  - Keep failed votes in outbox for later retry
  - Mark successful votes as "confirmed" before removing

### Phase 5: Confirmation Tracking
- [ ] Use Solana's `confirmTransaction()`:
  - Wait for confirmation before marking as "done"
  - Check finality (not just initial receipt)
  - Update status in DTN record

### Phase 6: User Feedback
- [ ] Real-time sync progress display
- [ ] Per-vote status tracking
- [ ] Error messages for failed submissions
- [ ] Success confirmation with tx hashes

## Key Functions to Implement

```javascript
// networkStatus.js
export function listenToNetworkChanges(onOnline, onOffline) {
  window.addEventListener('online', () => {
    console.log('Network is ONLINE - triggering DTN sync');
    onOnline();
  });
  
  window.addEventListener('offline', () => {
    console.log('Network is OFFLINE');
    onOffline();
  });
}

export function isOnline() {
  return navigator.onLine;
}

// dtnSync.js
export async function submitVoteToBlockchain(signedTx, connection, maxRetries = 3) {
  let attempts = 0;
  let lastError;
  
  while (attempts < maxRetries) {
    try {
      // Send raw transaction to Solana
      const txHash = await connection.sendRawTransaction(
        Buffer.from(signedTx, 'base64')
      );
      
      // Confirm transaction
      const confirmation = await connection.confirmTransaction(txHash);
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      return {
        success: true,
        txHash,
        confirmation
      };
    } catch (error) {
      lastError = error;
      attempts++;
      
      if (attempts < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempts - 1) * 1000;
        console.log(`Retry ${attempts}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return {
    success: false,
    error: lastError.message
  };
}

// dtnManager.js
export async function syncDTNOutbox(connection, onProgress) {
  const outbox = getOutbox(); // From Module 3
  let synced = 0;
  let failed = [];
  const results = [];
  
  for (const vote of outbox) {
    try {
      onProgress({
        current: synced,
        total: outbox.length,
        status: `Syncing vote ${synced + 1}/${outbox.length}`
      });
      
      const result = await submitVoteToBlockchain(vote.tx, connection);
      
      if (result.success) {
        // Mark vote as submitted in outbox
        updateVoteStatus(vote.txHash, 'confirmed');
        removeVote(vote.txHash);
        results.push({ txHash: vote.txHash, status: 'success' });
        synced++;
      } else {
        // Keep in outbox for retry
        updateVoteStatus(vote.txHash, 'failed');
        failed.push({ txHash: vote.txHash, error: result.error });
      }
    } catch (error) {
      console.error('Sync error:', error);
      failed.push({ txHash: vote.txHash, error: error.message });
    }
  }
  
  return {
    synced,
    failed,
    results,
    remaining: outbox.length - synced
  };
}

// useNetworkSync.js
export function useNetworkSync() {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | success | failed
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  
  useEffect(() => {
    listenToNetworkChanges(
      async () => { // onOnline
        setSyncStatus('syncing');
        const syncResult = await syncDTNOutbox(
          solanaConnection,
          (prog) => setProgress(prog)
        );
        
        if (syncResult.failed.length === 0) {
          setSyncStatus('success');
        } else {
          setSyncStatus('partial'); // Some succeeded, some failed
        }
        
        setResults(syncResult.results);
        setErrors(syncResult.failed);
      },
      () => { // onOffline
        setSyncStatus('offline');
      }
    );
  }, []);
  
  return { syncStatus, progress, results, errors };
}
```

## File Structure for Module 4

```
frontend/src/
├── components/
│   ├── SyncStatus.jsx
│   ├── SyncProgress.jsx
│   ├── SyncResults.jsx
│   ├── SyncErrors.jsx
│   └── SyncRetry.jsx
│
├── utils/
│   ├── networkStatus.js        # Network detection
│   ├── dtnSync.js              # Vote submission
│   ├── dtnManager.js           # Batch sync orchestration
│   └── retryLogic.js           # Retry with backoff
│
└── hooks/
    └── useNetworkSync.js       # State management
```

## Critical Implementation Details

### Solana Transaction Submission
```javascript
// Maximum retries and timeouts
const MAX_RETRIES = 3;
const CONFIRMATION_TIMEOUT = 30000; // 30 seconds

// Use correct preflightCommitment
const preflightCommitment = "processed"; // or "confirmed"
```

### DTN Outbox State After Sync
```javascript
// Before sync:
{ status: "pending" }

// After successful sync:
// Vote is REMOVED from outbox

// After failed sync:
{ status: "failed", error: "Network timeout" }
// Vote stays for retry
```

### Progress Tracking Schema
```javascript
{
  current: 5,      // 5 votes synced so far
  total: 10,       // 10 total votes
  status: "Syncing vote 6/10",
  percent: 50      // 50% complete
}
```

## Testing Checklist

- [ ] Network online detection works
- [ ] Network offline detection works
- [ ] Can submit single vote to Solana
- [ ] Can submit batch of votes
- [ ] Transaction confirmation waits properly
- [ ] Successful votes removed from outbox
- [ ] Failed votes stay in outbox
- [ ] Retry logic works (max 3 attempts)
- [ ] Exponential backoff works
- [ ] Progress updates in real-time
- [ ] Error messages display correctly
- [ ] Can retry failed submissions
- [ ] Works across page refresh

## MVP Speed Tips

1. **Skip Confirmation Wait:** For MVP, just check if submission succeeded:
   ```javascript
   const txHash = await connection.sendRawTransaction(signedTx);
   // Consider success immediately, don't wait for confirmation
   return { success: true, txHash };
   ```

2. **Single Submission:** Submit one vote at a time (not batches):
   ```javascript
   for (const vote of outbox) {
     await submitVote(vote.tx);
   }
   ```

3. **Simple Retry:** Just 2 retries max, no backoff:
   ```javascript
   let attempts = 0;
   while (attempts < 2) {
     try {
       return await submitVote();
     } catch {
       attempts++;
     }
   }
   ```

## Flow Diagram

```
[Network Comes ONLINE]
        ↓
[Detect Online Event]
        ↓
[Read DTN Outbox from localStorage]
        ↓
[For Each Queued Vote:]
  ├→ Serialize signed transaction
  ├→ Send via connection.sendRawTransaction()
  ├→ Confirm transaction
  ├→ Update UI progress
  ├→ On success: Remove from outbox
  └→ On failure: Keep for retry
        ↓
[Show Sync Results]
        ↓
[If Any Failed: Show Retry Option]
```

## Integration with Smart Contract

This module hands off to **Module 5: Smart Contract** which:
- Receives the vote transaction
- Verifies ZK-Proof is valid
- Checks Nullifier hasn't been used
- Increments vote count
- Records on-chain

## Next Module

Covered by **Module 5: Smart Contract** which processes the incoming transactions.

---
**Status:** Not Started  
**Priority:** HIGH (Core Functionality)  
**Estimated Time:** 2-3 days  
**Dependencies:** Module 3 (DTN Outbox), Solana Web3.js
