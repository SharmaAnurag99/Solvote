# ROFV UI - Mock Data & Backend Integration Guide

## Overview
This document maps all mocked data in the Next.js UI to their real backend implementations. Each mock is clearly labeled with a 🔴 **MOCK** badge.

---

## 1. ADMIN PANEL (`/app/admin/page.tsx`)

### 1.1 Whitelist Management (Mock)
**Location:** Line ~20 - Initial state
```typescript
const [whitelist, setWhitelist] = useState<string[]>([
  "111122223333",
  "444455556666",
]);
```

**What's Mocked:**
- Initial whitelist is hardcoded
- Whitelist persists only in React state + localStorage (client-side)

**How to Replace:**
1. Create a backend API endpoint: `POST /api/admin/whitelist/add`
2. Store in database (PostgreSQL/MongoDB)
3. Replace local state with API call:
```typescript
const handleAddVoter = async () => {
  const response = await fetch('/api/admin/whitelist/add', {
    method: 'POST',
    body: JSON.stringify({ aadhaar }),
  });
  const data = await response.json();
  setWhitelist(data.whitelist);
};
```

---

### 1.2 Merkle Root Generation (Mock)
**Location:** Line ~60 - `handleGenerateMerkleRoot` function
```typescript
// MOCK: Simulate Merkle tree generation
await new Promise((resolve) => setTimeout(resolve, 2000));

// MOCK MERKLE ROOT - In production, use real crypto
const mockRoot = "0x" + Array(64)...
```

**What's Mocked:**
- Merkle tree computation is simulated with a random 64-char hex string
- No actual crypto operations
- Stored in localStorage only

**How to Replace:**
1. Use `circomlibjs` for Poseidon hashing (ZK-friendly)
2. Install: `npm install circomlibjs`
3. Create utility file `lib/merkleTree.ts`:
```typescript
import { poseidon } from 'circomlibjs';

export async function generateMerkleRoot(whitelist: string[]) {
  const leaves = whitelist.map(aadhaar => poseidon([BigInt(aadhaar)]));
  // Build tree...
  return root;
}
```
4. Call from `/api/admin/merkle-root`:
```typescript
const response = await fetch('/api/admin/merkle-root', {
  method: 'POST',
  body: JSON.stringify({ whitelist }),
});
```
5. Backend should:
   - Generate real Merkle root
   - Call Solana smart contract `initialize_election` instruction
   - Store root on blockchain
   - Return root to frontend

---

### 1.3 Smart Contract Initialization (Mock)
**Location:** Line ~60 - After Merkle root generation
```typescript
// MOCK: Store in localStorage
localStorage.setItem("merkleRoot", mockRoot);
localStorage.setItem("whitelist", JSON.stringify(whitelist));
```

**What's Mocked:**
- No actual blockchain interaction
- Smart contract not called
- Data stored only in browser localStorage

**How to Replace:**
1. Backend should implement Solana interaction:
```typescript
// Backend: initializeElection (Rust/JS)
async function initializeElection(merkleRoot: string, whitelist: string[]) {
  const program = await getProgram(); // Load Anchor program
  const tx = await program.methods
    .initializeElection(merkleRoot, startTime, endTime)
    .accounts({ election: electionPDA })
    .rpc();
  return tx;
}
```
2. Frontend calls `/api/admin/initialize`:
```typescript
const response = await fetch('/api/admin/initialize', {
  method: 'POST',
  body: JSON.stringify({ merkleRoot, whitelist }),
});
const { txHash } = await response.json();
```

---

## 2. POLLING BOOTH - Verify (`/app/booth/verify/page.tsx`)

### 2.1 Whitelist Verification (Mock)
**Location:** Line ~30 - `handleVerify` function
```typescript
// MOCK: Check against whitelist
const mockWhitelist = [
  "111122223333",
  "444455556666",
  "777788889999",
  "123456789012",
];

if (!mockWhitelist.includes(aadhaar)) {
  setError("❌ Your Aadhaar is not in the approved voter list.");
  return;
}
```

**What's Mocked:**
- Static hardcoded whitelist
- No database lookup
- No Merkle proof verification

**How to Replace:**
1. Create backend endpoint `/api/booth/verify-whitelist`:
```typescript
async function verifyVoter(aadhaar: string, merkleProof: any) {
  // Fetch whitelist from DB
  const inWhitelist = await db.whitelist.findOne({ aadhaar });
  if (!inWhitelist) return false;
  
  // Verify Merkle proof
  const isValid = verifyMerkleProof(aadhaar, merkleProof, merkleRoot);
  return isValid;
}
```
2. Frontend calls:
```typescript
const response = await fetch('/api/booth/verify-whitelist', {
  method: 'POST',
  body: JSON.stringify({ aadhaar, merkleProof }),
});
const { verified } = await response.json();
```

---

### 2.2 Identity Packet & Nullifier Generation (Mock)
**Location:** Line ~45
```typescript
// MOCK: Generate identity packet
const mockIdentity = {
  timestamp: Date.now(),
  proof: {
    index: Math.floor(Math.random() * 100),
    verified: true,
  },
  nullifier: "0x" + Array(64)...
};

// Store in localStorage temporarily
localStorage.setItem("verified_identity", JSON.stringify(mockIdentity));
```

**What's Mocked:**
- Random proof index
- Random nullifier generation
- No ZK proof construction
- Identity stored in localStorage

**How to Replace:**
1. Backend generates real ZK-proof and nullifier:
```typescript
async function generateIdentity(aadhaar: string) {
  // Get Merkle proof for voter
  const proof = getMerkleProof(aadhaar, merkleTree);
  
  // Generate nullifier (hash)
  const nullifier = poseidon([BigInt(aadhaar), BigInt(SECRET_SALT)]);
  
  return {
    proof,
    nullifier,
    timestamp: Date.now(),
  };
}
```
2. Frontend calls `/api/booth/generate-identity`:
```typescript
const response = await fetch('/api/booth/generate-identity', {
  method: 'POST',
  body: JSON.stringify({ aadhaar }),
});
const identity = await response.json();
// Store in sessionStorage (not localStorage for security)
sessionStorage.setItem('verified_identity', JSON.stringify(identity));
```

---

## 3. POLLING BOOTH - Vote (`/app/booth/vote/page.tsx`)

### 3.1 Vote Receipt Generation (Mock)
**Location:** Line ~50 - `handleCastVote` function
```typescript
// MOCK: Generate vote receipt
const mockReceipt = {
  receiptId: Math.random().toString(36).substring(2, 10).toUpperCase() + "V",
  timestamp: Date.now(),
  candidate: CANDIDATES[selectedCandidate].name,
  transactionHash: "0x" + Array(64)...,
  status: "pending",
};
```

**What's Mocked:**
- Receipt ID is random string
- Transaction hash is random
- No actual signing
- No blockchain interaction

**How to Replace:**
1. Backend signs transaction:
```typescript
async function signVote(votePayload: any, durableNonce: any) {
  // Create Solana instruction
  const instruction = await program.methods
    .registerVote(nullifier, candidateId)
    .accounts({ election: electionPDA })
    .instruction();
  
  // Add durable nonce
  const tx = new Transaction()
    .add(SystemProgram.nonceAdvance(nonceAccount))
    .add(instruction);
  
  // Sign transaction
  const signedTx = await wallet.signTransaction(tx);
  return signedTx;
}
```
2. Frontend calls `/api/booth/cast-vote`:
```typescript
const response = await fetch('/api/booth/cast-vote', {
  method: 'POST',
  body: JSON.stringify({ 
    candidate: selectedCandidate,
    identity,
  }),
});
const receipt = await response.json();
```

---

### 3.2 DTN Outbox Queue (Mock)
**Location:** Line ~65
```typescript
// MOCK: Store in localStorage (simulating DTN outbox)
const dtnOutbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
dtnOutbox.push({
  tx: "mock_signed_tx_base64_" + Math.random(),
  txHash: mockReceipt.transactionHash,
  status: "pending",
  timestamp: Date.now(),
});
localStorage.setItem("dtn_outbox", JSON.stringify(dtnOutbox));
```

**What's Mocked:**
- Transactions stored in browser localStorage
- No indexing
- No sync tracking

**How to Replace:**
1. Use IndexedDB for larger persistence:
```typescript
async function queueVoteInDTN(signedTx: any) {
  const db = new Dexie('ROFV');
  db.version(1).stores({ votes: 'txHash' });
  
  await db.votes.add({
    txHash: signedTx.hash,
    tx: signedTx,
    status: 'pending',
    timestamp: Date.now(),
  });
}
```
2. Or use backend DTN service (recommended for production):
```typescript
const response = await fetch('/api/dtn/queue-vote', {
  method: 'POST',
  body: JSON.stringify({ signedTx }),
});
```

---

## 4. ANALYTICS DASHBOARD (`/app/analytics/page.tsx`)

### 4.1 DTN Status Polling (Mock)
**Location:** Line ~30
```typescript
const updateDTNStatus = () => {
  // MOCK: Read from localStorage
  const outbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
  setDtnStatus({
    total: outbox.length,
    pending: outbox.filter((v: any) => v.status === "pending").length,
    submitted: outbox.filter((v: any) => v.status === "submitted").length,
    confirmed: outbox.filter((v: any) => v.status === "confirmed").length,
  });
};
```

**What's Mocked:**
- Status read from localStorage only
- Manual updates
- No real-time WebSocket

**How to Replace:**
1. Implement WebSocket connection:
```typescript
useEffect(() => {
  const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
  
  ws.onmessage = (event) => {
    const { dtnStatus } = JSON.parse(event.data);
    setDtnStatus(dtnStatus);
  };
  
  return () => ws.close();
}, []);
```
2. Or use polling endpoint `/api/dtn/status`:
```typescript
const interval = setInterval(async () => {
  const response = await fetch('/api/dtn/status');
  const data = await response.json();
  setDtnStatus(data);
}, 2000);
```

---

### 4.2 Vote Tally (Mock)
**Location:** Line ~40
```typescript
const updateVoteCount = () => {
  const outbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
  const confirmed = outbox.filter((v: any) => v.status === "confirmed").length;
  
  // Simple mock: distribute votes randomly
  const total = confirmed;
  const dist = [
    Math.floor(total * 0.33),
    Math.floor(total * 0.33),
    Math.ceil(total * 0.34),
  ];
  
  setVoteCount({
    total,
    candidateA: dist[0],
    candidateB: dist[1],
    candidateC: dist[2],
  });
};
```

**What's Mocked:**
- Not actual vote counts
- Random 33/33/34 distribution
- Not reading from blockchain

**How to Replace:**
1. Query smart contract results:
```typescript
async function getVoteTally() {
  const program = await getProgram();
  const election = await program.account.election.fetch(electionPDA);
  
  return {
    total: election.totalVotes,
    candidateA: election.candidateAVotes,
    candidateB: election.candidateBVotes,
    candidateC: election.candidateCVotes,
  };
}
```
2. Frontend calls `/api/results`:
```typescript
const response = await fetch('/api/results');
const tally = await response.json();
setVoteCount(tally);
```

---

### 4.3 Manual Sync Trigger (Mock)
**Location:** Line ~57
```typescript
const handleManualSync = async () => {
  setSyncing(true);
  
  // Simulate sync process
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  // MOCK: Move pending votes to confirmed
  const outbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
  const updated = outbox.map((v: any) => ({
    ...v,
    status: v.status === "pending" ? "confirmed" : v.status,
  }));
  localStorage.setItem("dtn_outbox", JSON.stringify(updated));
};
```

**What's Mocked:**
- No actual blockchain submission
- Instant status change
- No retry logic

**How to Replace:**
1. Backend implements sync logic:
```typescript
async function syncDTNVotes(walletPublicKey: string) {
  const pendingVotes = await db.votes.find({ status: 'pending' });
  
  for (const vote of pendingVotes) {
    try {
      // Submit to blockchain
      const txHash = await sendRawTransaction(vote.tx);
      
      // Confirm
      await confirmTransaction(txHash);
      
      // Update status
      await db.votes.updateOne(
        { txHash },
        { $set: { status: 'confirmed' } }
      );
    } catch (error) {
      // Retry logic with exponential backoff
      await retryWithBackoff(vote);
    }
  }
}
```
2. Frontend calls `/api/dtn/sync`:
```typescript
const handleManualSync = async () => {
  setSyncing(true);
  const response = await fetch('/api/dtn/sync', {
    method: 'POST',
  });
  const result = await response.json();
  setDtnStatus(result.status);
  setSyncing(false);
};
```

---

## 5. Test Data & Credentials

### Admin Whitelist Test Aadhaar
```
111122223333
444455556666
777788889999
123456789012
```

### Network Simulation
- **Offline Mode Toggle:** Already implemented in UI (`simulateOffline` state)
- To test actual offline:
  1. Disable WiFi/Network
  2. Or use DevTools Network tab to throttle

### Mock API Endpoints (to be replaced)
| Route | Current Mock | Replace With |
|-------|---|---|
| `POST /api/admin/whitelist/add` | localStorage | Database insert |
| `POST /api/admin/merkle-root` | Random hash | Real crypto + Solana |
| `POST /api/booth/verify-whitelist` | Hardcoded check | DB query + Merkle proof |
| `POST /api/booth/generate-identity` | Random proof | Real ZK proof + nullifier |
| `POST /api/booth/cast-vote` | localStorage | Sign + queue in DTN |
| `POST /api/dtn/sync` | localStorage update | Solana transaction submit |
| `GET /api/dtn/status` | localStorage read | Database query |
| `GET /api/results` | Random distribution | Smart contract query |

---

## 6. Environment Variables (To Configure)

Create `.env.local`:
```env
# Blockchain
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
NEXT_PUBLIC_WALLET_ADDRESS=YOUR_WALLET_ADDRESS

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Encryption
NEXT_PUBLIC_NULLIFIER_SALT=YOUR_SECRET_SALT
NEXT_PUBLIC_MERKLE_DEPTH=20
```

---

## 7. Implementation Checklist

### Phase 1: UI Complete ✅
- [ ] All UI pages built
- [ ] All mocks in place
- [ ] localStorage persistence working
- [ ] Routing working

### Phase 2: Backend APIs (Replacing Mocks)
- [ ] `/api/admin/whitelist/add`
- [ ] `/api/admin/merkle-root`
- [ ] `/api/booth/verify-whitelist`
- [ ] `/api/booth/generate-identity`
- [ ] `/api/booth/cast-vote`
- [ ] `/api/dtn/sync`
- [ ] `/api/dtn/status`
- [ ] `/api/results`

### Phase 3: Smart Contract Integration
- [ ] Deploy contract to Solana Devnet
- [ ] Connect contract methods to APIs
- [ ] Test vote registration
- [ ] Test double-voting prevention

### Phase 4: Full Integration Testing
- [ ] End-to-end offline voting
- [ ] DTN sync on reconnection
- [ ] Results verification on blockchain

---

**Last Updated:** March 31, 2026  
**Status:** UI Complete, Ready for Backend Integration
