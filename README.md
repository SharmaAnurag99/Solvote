# 🚀 ROFV (Resilient Offline-First Voting) - MVP Project

Complete implementation of Offline Cryptographic Voting using Durable Nonces, ZK-Privacy, and Simulated DTN on Solana Blockchain.

## 📁 Project Structure

```
Final Project/
├── BLUEPRINT.md                 # Developer Blueprint (START HERE)
├── README.md                    # This file
├── frontend/                    # React.js application
│   ├── public/
│   ├── src/
│   │   ├── components/          # Modular React components per module
│   │   ├── pages/               # Page components
│   │   ├── utils/               # Utility functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── vite.config.js
│
├── contracts/                   # Solana Smart Contracts (Anchor)
│   ├── programs/                # Main Anchor programs
│   ├── tests/                   # Contract tests
│   ├── Anchor.toml
│   ├── Cargo.toml
│   └── package.json
│
├── zk-circuits/                 # ZK-SNARK Circuits (circom)
│   ├── circuits/                # circom circuit files
│   ├── test/                    # Circuit tests
│   └── README.md
│
├── modules/                     # Module-specific development guides
│   ├── module-1-admin/          # Admin Panel (Whitelist & Setup)
│   ├── module-2-polling-booth/  # Polling Booth (Privacy Layer)
│   ├── module-3-offline-crypto/  # Offline Crypto & DTN
│   ├── module-4-dtn-forwarding/  # DTN Sync to Blockchain
│   └── module-5-smart-contract/  # Smart Contract Implementation
│
├── docs/                        # Additional documentation
│   ├── setup-guide.md          # Setup instructions
│   ├── architecture.md          # System architecture
│   └── tech-stack.md           # Tech stack details
│
├── config/                      # Shared configuration
│   ├── network.json            # Network settings
│   └── constants.json          # Shared constants
│
└── .gitignore

```

## 🚦 Quick Start

### Prerequisites

- Node.js v16+
- Rust (for Solana contracts)
- Solana CLI
- Anchor Framework

### Installation

1. **Clone and setup:**
```bash
cd /Users/anuragsharma/Workspace/Projects/BlockVote/Final\ Project
npm install
```

2. **Frontend setup:**
```bash
cd frontend
npm install
npm run dev
```

3. **Contracts setup:**
```bash
cd contracts
anchor build
anchor test
```

## 📋 Module-Wise Development Guide

### Phase 1: Foundation (Weeks 1-2)
- **Module 1:** Admin Panel - Whitelist & Merkle Tree
- **Module 2:** Polling Booth - Identity Verification (with mock ZK)

### Phase 2: Offline Processing (Weeks 2-3)
- **Module 3:** Offline Signing & DTN Queuing
- **Module 4:** DTN Forwarding & Sync Logic

### Phase 3: Blockchain Integration (Weeks 3-4)
- **Module 5:** Smart Contract Development & Testing

### Phase 4: Integration & Testing (Week 4-5)
- Full end-to-end testing
- Dashboard & Verification
- Deployment on Devnet

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| ZK-Privacy | circom + snarkjs |
| Blockchain | Solana + Anchor Framework |
| Network | Solana Devnet |
| State | localStorage (DTN Outbox) |
| Build | npm + cargo |

## 📚 Documentation

- [Full Blueprint](BLUEPRINT.md) - Complete developer guide with logic
- [Skills Guide](SKILLS_GUIDE.md) - Agent skills for faster development
- [Setup Guide](docs/setup-guide.md) - Environment setup
- [Architecture](docs/architecture.md) - System design
- [Module 1 Guide](modules/module-1-admin/README.md) - Admin Panel specifics
- [Module 2 Guide](modules/module-2-polling-booth/README.md) - Polling Booth specifics
- [Module 3 Guide](modules/module-3-offline-crypto/README.md) - Offline signing specifics
- [Module 4 Guide](modules/module-4-dtn-forwarding/README.md) - DTN sync specifics
- [Module 5 Guide](modules/module-5-smart-contract/README.md) - Contract specifics

## 🎯 Key Features

✅ **Offline-First Architecture** - Vote without internet, sync when online  
✅ **ZK-Privacy** - Voter identity anonymized with zero-knowledge proofs  
✅ **Durable Nonces** - Pre-signed transactions for offline signing  
✅ **Double Voting Prevention** - Nullifier PDAs on Solana contract  
✅ **VVPAT Receipt** - Verifiable voting with receipt hash  
✅ **Simulated DTN** - localStorage-based delayed delivery network  
✅ **Public Dashboard** - Real-time vote tallies & verification  

## ✅ Success Criteria

- [ ] Admin can whitelist voters and generate Merkle root
- [ ] Voter identity verified without exposing Aadhaar
- [ ] Votes cast offline and queued in DTN
- [ ] DTN syncs automatically when online
- [ ] Smart contract prevents double voting
- [ ] Live vote tallies on dashboard
- [ ] Receipt hash verification works end-to-end

## 🚀 Development Speed Tips

1. **ZK Optimization:** Use dummy mocks for ZK in MVP Phase 1. Focus 90% on Durable Nonce signing and Smart Contract PDAs - that's the novelty!
2. **DTN Storage:** Use browser `localStorage` instead of SQLite for MVP
3. **Testing:** Use Solana Devnet - free, fast, no testnet tokens needed
4. **Modular Build:** Develop modules independently, integrate in Phase 4

## 📞 Key Contacts / Resources

- Solana Docs: https://docs.solana.com/
- Anchor Book: https://book.anchor-lang.com/
- circom Docs: https://docs.circom.io/
- snarkjs: https://github.com/iden3/snarkjs

## 📝 Notes

- Admin is the only entity responsible for Aadhaar whitelist
- Votes are immutable once recorded on-chain
- All sensitive data (Aadhaar) is wiped from UI immediately after verification
- Smart contract acts as source of truth for tally

---

**Status:** 🔄 In Development  
**Last Updated:** March 30, 2026  
**Next Step:** Begin Module 1 Implementation
