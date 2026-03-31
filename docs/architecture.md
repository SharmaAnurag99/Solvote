# 🔧 System Architecture: ROFV Voting

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   SOLANA BLOCKCHAIN (DEVNET)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Election Program │  │ Nullifier PDAs   │  │ Vote Events  │ │
│  │ (Smart Contract) │◄─│ (Double Vote     │  │ (Dashboard   │ │
│  │                  │  │  Prevention)     │  │  Listeners)  │ │
│  └────────▲─────────┘  └──────────────────┘  └──────────────┘ │
│           │                                                     │
└───────────┼─────────────────────────────────────────────────────┘
            │
            │ sendRawTransaction()
            │ (Signed offline)
            │
   ┌────────▼──────────────────────────────────────┐
   │         BROWSER / FRONTEND (REACT)            │
   ├──────────────────────────────────────────────┤
   │                                               │
   │  ┌──────────────┐  ┌────────────────────┐   │
   │  │ Admin Panel  │  │ Polling Booth      │   │
   │  │ (Whitelist & │  │ (Identity + ZK)    │   │
   │  │ Merkle Root) │  └────────────────────┘   │
   │  └──────────────┘                           │
   │         │                                    │
   │         ▼                                    │
   │  ┌──────────────┐  ┌────────────────────┐   │
   │  │ Offline Vote │  │ DTN Forwarding     │   │
   │  │ (Sign+Queue) │  │ (Auto Sync when    │   │
   │  └──────────────┘  │  online)           │   │
   │         │          └────────────────────┘   │
   │         │                                    │
   │         ▼                                    │
   │  ┌──────────────────────────────────────┐   │
   │  │  DTN Outbox (localStorage)           │   │
   │  │  [{ tx: signed_bytes },              │   │
   │  │   { tx: signed_bytes },              │   │
   │  │   { tx: signed_bytes }]              │   │
   │  └──────────────────────────────────────┘   │
   │         │                                    │
   │         └─────────────────────────────────┐ │
   │                                           │ │
   │  ┌──────────────┐  ┌──────────────────┐  │ │
   │  │ ZK Circuits  │  │ Durable Nonces   │  │ │
   │  │ (Offline     │  │ (Offline         │  │ │
   │  │ Proofs)      │  │ Signing)         │  │ │
   │  └──────────────┘  └──────────────────┘  │ │
   │         │                                  │ │
   │         └──────────────────────────────────┼─┘
   │                                            │
   │  ┌──────────────────────────────────────┐ │
   │  │    Dashboard / Verification Page     │ │
   │  │    (Real-time vote counts + receipt  │ │
   │  │     verification)                    │ │
   │  └──────────────────────────────────────┘ │
   └──────────────────────────────────────────┘
```

## Data Flow (Detailed)

### Phase 1: Setup (Admin)
```
ADMIN WORKFLOW
    ↓
[Admin Panel: Add voters to whitelist]
    ├─ ["123456", "987654", "112233"]
    ↓
[Generate Merkle Tree (circomlibjs)]
    ├─ Algorithm: Poseidon Hash
    ├─ Depth: depends on voter count
    ├─ Root: 0x1a2b3c4d...
    ↓
[Send Merkle Root to Smart Contract]
    └─ TX: initialize_election(merkle_root)
       Status: On Solana Devnet
```

### Phase 2: Voting (Offline-First)
```
VOTER WORKFLOW
    ↓
[Module 2: Enter Aadhaar]
    ├─ Input validation
    ├─ Whitelist check
    ↓
[Generate ZK-Proof + Nullifier]
    ├─ Input: Aadhaar + Merkle Path
    ├─ Output: Proof + Nullifier Hash
    ├─ Aadhaar WIPED immediately
    ↓
[Module 3: Select Candidate & Sign Offline]
    ├─ IF ONLINE: Send directly (skip offline path)
    ├─ IF OFFLINE:
    │  ├─ Fetch Durable Nonce (pre-stored)
    │  ├─ Build: { proof, nullifier, candidate }
    │  ├─ Sign with SystemProgram.nonceAdvance()
    │  ├─ Queue to DTN (localStorage)
    │  └─ Generate VVPAT Receipt
    ↓
[Module 4: Wait for Network]
    ├─ Network listener active
    ├─ On "online" event → Sync DTN
    ├─ Submit signed TX to Solana
    ├─ Max 3 retries + backoff
    ├─ Remove from outbox on success
    ↓
[Module 5: Smart Contract Processing]
    ├─ Verify ZK-Proof
    ├─ Check Nullifier (prevent double vote)
    ├─ Increment candidate vote
    ├─ Emit VoteRecorded event
    └─ Vote is IMMUTABLE on-chain
```

## Module Dependencies

```
Module 1: Admin Panel
    └─→ Generates Merkle Root
        └─→ PUBLIC: Merkle Root stored in contract

Module 2: Polling Booth
    ├─ REQUIRES: Merkle Root (from Module 1)
    ├─ REQUIRES: Whitelist (from Module 1)
    └─→ OUTPUTS: Proof + Nullifier
        └─→ TO: Module 3

Module 3: Offline Crypto
    ├─ REQUIRES: Proof + Nullifier (from Module 2)
    ├─ REQUIRES: Durable Nonces (Solana)
    ├─ USES: Merkle Root to construct proof
    └─→ OUTPUTS: Signed TX + DTN Outbox
        └─→ TO: Module 4

Module 4: DTN Forwarding
    ├─ REQUIRES: Signed TXs in DTN Outbox (from Module 3)
    ├─ LISTENS TO: Network status
    └─→ SUBMITS TO: Solana Devnet
        └─→ TO: Module 5

Module 5: Smart Contract
    ├─ PROCESSES: Incoming vote transactions
    ├─ VERIFIES: ZK Proofs against Merkle Root
    ├─ PREVENTS: Double voting via Nullifier PDAs
    ├─ TALLIES: Vote counts per candidate
    └─→ OUTPUTS: Events for Dashboard
        └─→ TO: Dashboard (Real-time results)
```

## Storage Architecture

### Browser Storage (localStorage)
```javascript
{
  "whitelist": [                    // Module 1
    "123456",
    "987654",
    "112233"
  ],
  
  "merkle_root": "0x1a2b3c4d...",  // Module 1
  
  "durable_nonces": [                // Module 3
    { "address": "...", "blockhash": "...", "used": false },
    { "address": "...", "blockhash": "...", "used": true },
  ],
  
  "dtn_outbox": [                     // Module 3 → Module 4
    {
      "tx": "base64_signed_bytes",
      "txHash": "0x1a2b3c4d...",
      "status": "pending|confirmed|failed",
      "timestamp": 1711788000000
    }
  ],
  
  "receipts": [                       // Module 3 & 5
    {
      "receiptHash": "0x1a2b3c4d...",
      "nullifier": "0x5e6f7g8h...",
      "candidate": 0,
      "status": "pending|confirmed"
    }
  ]
}
```

### Solana On-Chain Storage
```
Program: ROFV Voting Smart Contract

Accounts:
  1. Election State Account (PDA)
     ├─ merkle_root: [u8; 32]
     ├─ total_votes: u64
     ├─ candidate_a_votes: u64
     ├─ candidate_b_votes: u64
     ├─ candidate_c_votes: u64
     ├─ start_time: i64
     ├─ end_time: i64
     └─ is_active: bool
  
  2. Nullifier PDAs (one per vote)
     ├─ seed: "nullifier" + nullifier_hash
     ├─ nullifier: [u8; 32]
     ├─ voter_index: u32
     └─ timestamp: i64
  
  3. Vote Receipt Accounts (optional)
     ├─ nullifier: [u8; 32]
     ├─ candidate_voted: u8
     ├─ block_height: u64
     └─ tx_signature: String
```

## Security Model

```
┌──────────────────────────────────────────────────┐
│            THREAT MODEL & MITIGATIONS            │
├──────────────────────────────────────────────────┤
│                                                  │
│ THREAT: Aadhaar Number Exposure                  │
│ ├─ Risk: Voter privacy breach                   │
│ └─ MITIGATION: Aadhaar wiped after verification │
│    (Module 2: Clear UI + console)               │
│                                                  │
│ THREAT: Double Voting                           │
│ ├─ Risk: One voter votes multiple times        │
│ └─ MITIGATION: Nullifier PDA on-chain (Module 5)│
│    (Solana rejects if nullifier exists)         │
│                                                  │
│ THREAT: Vote Manipulation Offline                │
│ ├─ Risk: Attacker modifies vote data offline    │
│ └─ MITIGATION: Signed transactions + nonces     │
│    (Signature validation on-chain)              │
│                                                  │
│ THREAT: Voter De-anonymization                   │
│ ├─ Risk: Linking voter to vote via metadata    │
│ └─ MITIGATION: ZK-Proofs hide identity          │
│    (Module 2: No Aadhaar in proof)              │
│                                                  │
│ THREAT: Lost Offline Votes (Network Down)       │
│ ├─ Risk: Voter votes but can't sync             │
│ └─ MITIGATION: Persistent DTN in localStorage   │
│    (Module 4: Auto-retry with exponential backoff)
│                                                  │
└──────────────────────────────────────────────────┘
```

## Technology Stack Mapping

| Layer | Component | Technology | Module |
|-------|-----------|-----------|--------|
| **UI/UX** | Admin Panel | React.js + Vite | 1 |
| | Polling Booth | React.js | 2 |
| | Voting Interface | React.js | 3 |
| | Dashboard | React.js | 5 |
| **Privacy** | ZK-Proofs | snarkjs + circom | 2, 3 |
| | Identity Hash | circomlibjs (Poseidon) | 1, 2 |
| **Offline** | Durable Nonces | Solana Web3.js | 3 |
| | Offline Signing | Web3.js SystemProgram | 3 |
| | DTN Storage | localStorage | 3, 4 |
| **Blockchain** | On-Chain Logic | Anchor (Rust) | 5 |
| | Vote Submission | Web3.js sendRawTransaction | 4 |
| | Event Emission | Anchor Events | 5 |
| **Network** | RPC Endpoint | Solana Devnet | All |

## Performance Metrics (Target)

| Operation | Target Time | Module |
|-----------|------------|--------|
| Admin adds voter | < 100ms | 1 |
| Merkle root generation | < 500ms | 1 |
| Identity verification | < 1000ms | 2 |
| ZK-Proof generation | < 2000ms | 2 |
| Offline vote signing | < 500ms | 3 |
| DTN outbox storage | < 100ms | 3 |
| Vote submission to chain | < 5000ms | 4 |
| Smart contract processing | < 10000ms | 5 |
| Dashboard refresh | < 2000ms (poll interval) | 5 |

## Deployment Strategy

### MVP (Phase 1): Devnet Only
- All components on Solana Devnet
- Free transactions
- No real Aadhaar data
- Testing environment

### Phase 2: Testnet
- Move to proper testnet
- Load testing
- Security audit prep

### Phase 3: Mainnet
- Full security audit
- Real voter data handling
- Production deployment

---

**Last Updated:** March 30, 2026  
**Version:** 1.0 MVP Architecture
