# 🔴 Module 3: Offline Cryptography & Simulated DTN

## Overview
This is the CORE of the paper! Voters cast votes offline, transactions are pre-signed using Durable Nonces, and queued in a local "Delayed Transmission Network" (DTN). When internet comes back, they auto-sync to blockchain.

## Objectives
- ✅ Pre-fetch Durable Nonces from Solana on startup
- ✅ Build vote payload (Proof + Nullifier + Candidate)
- ✅ Sign transaction offline using pre-fetched Nonce
- ✅ Queue signed transaction in DTN outbox (localStorage)
- ✅ Generate VVPAT receipt with hash
- ✅ Simulate Online/Offline toggle

## UI Components Needed

### 1. Online/Offline Toggle
```
┌──────────────────────────────────┐
│  Network Status:                 │
│  [📶 ONLINE] [📵 OFFLINE (Shadow Zone)]
└──────────────────────────────────┘
```

### 2. Voting Screen
```
┌──────────────────────────────────┐
│  Cast Your Vote                  │
├──────────────────────────────────┤
│                                  │
│  [Candidate A] [Candidate B]    │
│  [Candidate C]                  │
│                                  │
│  [CAST SECURE VOTE ✓]            │
└──────────────────────────────────┘
```

### 3. Offline Receipt (VVPAT)
```
┌──────────────────────────────────┐
│  ✅ VOTE LOCKED OFFLINE           │
├──────────────────────────────────┤
│  Receipt Hash:                   │
│  0x1a2b3c4d5e6f7g8h9i0j...      │
│                                  │
│  Status: QUEUED FOR SYNC         │
│  [📋 Copy Receipt] [← Go Back]  │
└──────────────────────────────────┘
```

## Developer Tasks

### Phase 1: Durable Nonce Fetching
- [ ] Create `nonceManager.js`:
  - `fetchDurableNonces(connection, count)` - fetches Nonces from Solana
  - `storeDurableNonces(nonces)` - saves to localStorage (max 10)
  - `getNextNonce()` - returns unused Nonce, marks as used
- [ ] Run this on app startup (if online)
- [ ] Handle offline case (use pre-stored nonces)

### Phase 2: Vote Payload Construction
- [ ] Create `votePayload.js`:
  - `constructVotePayload(proof, nullifier, candidate)` - builds vote data
- [ ] Combine: ZK-Proof + Nullifier + Candidate Choice

### Phase 3: Offline Signing
- [ ] Create `offlineSigner.js`:
  - `signTransactionOffline(votePayload, nonce)` - signs using Nonce
  - Uses `SystemProgram.nonceAdvance` for offline signing
  - Returns signed transaction bytes

### Phase 4: DTN Outbox Management
- [ ] Create `dtnHelper.js`:
  - `queVote(signedTx)` - saves to `dtn_outbox` in localStorage
  - `getOutbound()` - returns all queued votes
  - `removeVote(txHash)` - removes after successful submission
  - `getOutboxStatus()` - returns count of pending votes

### Phase 5: Receipt Generation
- [ ] Create receipt system:
  - Hash the signed transaction
  - Display as VVPAT (Voter Verified Paper Audit Trail)
  - Store receipt locally for verification later

### Phase 6: Online/Offline Simulator
- [ ] UI Toggle: Simulates network disconnect
- [ ] When OFFLINE: Use stored nonces, queue to DTN
- [ ] When transitioning ONLINE: Trigger Module 4 DTN sync

## Key Functions to Implement

```javascript
// nonceManager.js
export async function fetchDurableNonces(connection, count = 10) {
  const nonces = [];
  for (let i = 0; i < count; i++) {
    // Fetch nonce from Solana
    // Store: { nonce, used: false }
  }
  localStorage.setItem('durable_nonces', JSON.stringify(nonces));
  return nonces;
}

export function getNextNonce() {
  const nonces = JSON.parse(localStorage.getItem('durable_nonces') || '[]');
  const unused = nonces.find(n => !n.used);
  if (!unused) throw new Error('No nonces available!');
  unused.used = true;
  localStorage.setItem('durable_nonces', JSON.stringify(nonces));
  return unused.nonce;
}

// votePayload.js
export function constructVotePayload(proof, nullifier, candidate) {
  return {
    proof,           // ZK proof from Module 2
    nullifier,       // Nullifier hash from Module 2
    candidate,       // Selected candidate
    timestamp: Date.now(),
    version: "1.0"
  };
}

// offlineSigner.js
export function signTransactionOffline(votePayload, nonce) {
  // 1. Get the Nonce
  // 2. Build transaction with SystemProgram.nonceAdvance
  // 3. Sign locally (no need for internet!)
  // 4. Return signed bytes
  const transaction = new Transaction({
    recentBlockhash: nonce.blockhash,
    feePayer: wallet.publicKey,
  });
  
  transaction.add(
    SystemProgram.nonceAdvance({
      noncePubkey: nonce.address,
      authorizedPubkey: nonce.authority,
    })
  );
  
  transaction.sign(wallet);
  return transaction.serialize();
}

// dtnHelper.js
export function queVote(signedTx) {
  const outbox = JSON.parse(localStorage.getItem('dtn_outbox') || '[]');
  outbox.push({
    tx: signedTx,
    txHash: hashTx(signedTx),
    status: 'pending',
    timestamp: Date.now()
  });
  localStorage.setItem('dtn_outbox', JSON.stringify(outbox));
}

export function getOutbox() {
  return JSON.parse(localStorage.getItem('dtn_outbox') || '[]');
}

export function removeVote(txHash) {
  const outbox = JSON.parse(localStorage.getItem('dtn_outbox') || '[]');
  const filtered = outbox.filter(v => v.txHash !== txHash);
  localStorage.setItem('dtn_outbox', JSON.stringify(filtered));
}
```

## File Structure for Module 3

```
frontend/src/
├── components/
│   ├── VotingScreen.jsx
│   ├── CandidateSelector.jsx
│   ├── NetworkToggle.jsx
│   ├── OfflineReceipt.jsx
│   └── DtnStatus.jsx
│
├── utils/
│   ├── nonceManager.js         # Durable Nonce management
│   ├── votePayload.js          # Vote construction
│   ├── offlineSigner.js        # Offline signing
│   ├── dtnHelper.js            # DTN outbox management
│   ├── receipt.js              # VVPAT receipt generation
│   └── cryptoUtils.js          # Hash functions
│
└── hooks/
    └── useOfflineVoting.js     # State management
```

## Critical Implementation Details

### Durable Nonce Structure (from Solana)
```javascript
{
  address: PublicKey,          // Nonce account address
  blockhash: string,           // Current blockhash
  authority: PublicKey,        // Nonce authority (wallet)
  lamports: number,
  used: boolean                // Our flag: used or not
}
```

### DTN Outbox LocalStorage Schema
```javascript
{
  "dtn_outbox": [
    {
      "tx": "base64_signed_transaction",
      "txHash": "0x1a2b3c4d...",
      "status": "pending|submitted|confirmed",
      "timestamp": 1711788000000
    }
  ]
}
```

### Vote Payload to Smart Contract
```
{
  "proof": <ZK proof from snarkjs>,
  "nullifier": "0x1a2b3c4d5e6f...",
  "candidate": 0 | 1 | 2,       // Candidate index
  "timestamp": 1711788000000
}
```

## Testing Checklist

- [ ] Durable Nonces fetch correctly on startup
- [ ] Nonces stored in localStorage
- [ ] Vote payload constructs correctly
- [ ] Offline signing works without internet
- [ ] Signed transaction serializes properly
- [ ] Vote queues to DTN outbox
- [ ] Receipt hash generates & displays
- [ ] Toggle between ONLINE/OFFLINE works
- [ ] Outbox persists on page refresh
- [ ] Multiple votes can be queued
- [ ] No errors in console when offline

## MVP Speed Tips

1. **Simplified Signing:** For MVP, don't use full `SystemProgram.nonceAdvance`. Just:
   ```javascript
   const signedData = await wallet.sign(votePayload);
   // Store in DTN
   ```

2. **Mock Nonces:** Instead of fetching from Solana, generate mock nonces:
   ```javascript
   const mockNonces = Array(10).fill().map(() => ({
     address: generateRandomAddress(),
     blockhash: generateRandomHash(),
     used: false
   }));
   ```

3. **Receipt as Simple Hash:**
   ```javascript
   const receipt = keccak256(
     JSON.stringify(votePayload)
   ).slice(0, 16); // Simple short hash
   ```

## Flow Diagram (Offline Path)

```
[User Selects Candidate]
        ↓
[MODE: OFFLINE?]
        ├─→ NO → Go to Module 4 (direct submission)
        ↓
[YES - OFFLINE MODE]
        ↓
[Get Next Durable Nonce]
        ↓
[Construct Vote Payload]
        ↓
[Sign Transaction Offline]
        ↓
[Queue to DTN Outbox (localStorage)]
        ↓
[Generate & Display VVPAT Receipt]
        ↓
[Wait for Network Recovery]
```

## Next Module
Once network is restored, **Module 4: DTN Forwarding** automatically syncs queued votes to blockchain.

---
**Status:** Not Started  
**Priority:** CRITICAL (Core Innovation)  
**Estimated Time:** 3-4 days  
**Dependencies:** Module 1, Module 2, Solana Web3.js
