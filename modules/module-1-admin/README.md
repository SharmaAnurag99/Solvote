# 🟢 Module 1: Admin Panel (Whitelist & Setup)

## Overview
The Admin Panel is where eligible voters are whitelisted and the Merkle Tree for the election is generated. This module bypasses the need for biometric scanners in the MVP.

## Objectives
- ✅ Maintain a local whitelist of Aadhaar numbers
- ✅ Generate a Merkle Tree using Poseidon hashing
- ✅ Compute and display the Merkle Root
- ✅ Store Merkle Root on Solana Smart Contract

## UI Components Needed

### 1. Voter Input Form
```
┌─────────────────────────────────────┐
│  Add Voter to Whitelist             │
├─────────────────────────────────────┤
│  Aadhaar Number: [_____________]    │
│  [Add to Whitelist]                 │
└─────────────────────────────────────┘
```

### 2. Whitelist Display
```
Current Whitelist:
- 123456 ✓
- 987654 ✓
- 112233 ✓
```

### 3. Merkle Root Generator
```
┌─────────────────────────────────────┐
│  [Generate & Lock Merkle Root]      │
│                                     │
│  Merkle Root:                       │
│  0x1a2b3c4d5e6f7g8h9i0j...         │
│  [Copy] [Send to Contract]          │
└─────────────────────────────────────┘
```

## Developer Tasks

### Phase 1: State Management
- [ ] Create React state for `whitelist` array
- [ ] Implement add/remove voter functions
- [ ] Persist whitelist to localStorage

### Phase 2: Merkle Tree Generation
- [ ] Install `circomlibjs` package
- [ ] Create `merkleTree.js` utility:
  - `generateMerkleTree(whitelist)` - returns tree structure
  - `getMerkleRoot(tree)` - returns root hash
  - `getMerklePath(tree, index)` - returns proof path for voter

### Phase 3: Smart Contract Integration
- [ ] Create `contractInteraction.js`:
  - `initElection(merkleRoot)` - sends root to contract
  - `getContractRoot()` - reads root from contract
- [ ] Use `@solana/web3.js` to interact with Solana

## Key Functions to Implement

```javascript
// merkleTree.js
export async function generateMerkleTree(voters) {
  // Use circomlibjs to create Merkle Tree with Poseidon hash
  // Return: { tree, root, proofs }
}

export function getMerkleRoot(tree) {
  // Return the root hash as string
}

export function getMerklePath(tree, voterIndex) {
  // Return the Merkle path for proof generation
}

// admin-state.js
export function useAdminPanel() {
  const [whitelist, setWhitelist] = useState([]);
  const [merkleRoot, setMerkleRoot] = useState(null);
  
  const addVoter = (aadhaarNumber) => {
    // Validate format
    // Add to whitelist
    // Update localStorage
  };
  
  const generateRoot = async () => {
    // Call generateMerkleTree
    // Store in state
    // Send to smart contract
  };
}
```

## File Structure for Module 1

```
frontend/src/
├── components/
│   ├── AdminPanel.jsx
│   ├── VoterInput.jsx
│   ├── WhitelistDisplay.jsx
│   └── MerkleRootGenerator.jsx
│
├── utils/
│   ├── merkleTree.js       # Core Merkle logic
│   └── contractHelpers.js  # Solana interaction
│
└── hooks/
    └── useAdminPanel.js    # State management
```

## Testing Checklist

- [ ] Can add voters to whitelist
- [ ] Whitelist displays correctly in UI
- [ ] Merkle root generates without errors
- [ ] Root can be sent to Solana contract
- [ ] Proof paths match voter indices
- [ ] localStorage persists whitelist on refresh

## Dependencies

```json
{
  "circomlibjs": "^0.1.1",
  "@solana/web3.js": "^1.91.0"
}
```

## MVP Speed Tips

1. **Start Simple:** Don't worry about actual circuit compilation in MVP. Just use Poseidon hash from circomlibjs.
2. **Mock Contract:** If Solana contract isn't ready, mock the contract call and store root in localStorage.
3. **Test Data:** Use fixed list like `["123456", "987654", "112233"]` for first iteration.

## Next Module
Once Module 1 is complete, voter can be verified against this Merkle root in **Module 2: Polling Booth**.

---
**Status:** Not Started  
**Priority:** CRITICAL (Foundation)  
**Estimated Time:** 2-3 days
