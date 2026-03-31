# 🟠 Module 2: Polling Booth (Privacy Layer)

## Overview
The Polling Booth is where voters verify their identity WITHOUT revealing their Aadhaar number. The system generates a ZK-Proof that proves they're in the whitelist without leaking their identity.

## Objectives
- ✅ Accept Aadhaar input from voter
- ✅ Verify voter against Merkle root (offline or online)
- ✅ Generate ZK-Proof + Nullifier Hash
- ✅ Clear Aadhaar from UI immediately
- ✅ Proceed to voting screen with anonymity

## UI Components Needed

### 1. Identity Verification Screen
```
┌─────────────────────────────────────┐
│  Identity Verification              │
├─────────────────────────────────────┤
│  Enter Your Aadhaar Number:         │
│  [_____________________]            │
│                                     │
│  [Verify Identity]                  │
│                                     │
│  Status: Waiting...                 │
└─────────────────────────────────────┘
```

### 2. Success Screen (After Verification)
```
┌─────────────────────────────────────┐
│  ✅ Identity Verified               │
├─────────────────────────────────────┤
│  Your identity has been verified    │
│  and anonymized.                    │
│                                     │
│  You can now proceed to vote.       │
│                                     │
│  [Proceed to Vote]                  │
└─────────────────────────────────────┘
```

### 3. Error Screen (If Not Eligible)
```
┌─────────────────────────────────────┐
│  ❌ Not Eligible                    │
├─────────────────────────────────────┤
│  Your Aadhaar is not in the         │
│  approved whitelist for this        │
│  election.                          │
│                                     │
│  [← Go Back]                        │
└─────────────────────────────────────┘
```

## Developer Tasks

### Phase 1: Whitelist Verification
- [ ] Fetch whitelist (from Module 1 or localStorage)
- [ ] Check if input Aadhaar exists in whitelist
- [ ] Display error if not found

### Phase 2: ZK-Proof Generation
- [ ] Install `snarkjs` package
- [ ] Create `zkProof.js` utility:
  - `generateProof(aadhaar, merkleRoot, merklePath)` - generates ZK proof
  - `generateNullifier(aadhaar)` - creates unique nullifier hash
- [ ] Load pre-compiled WASM circuit (can use dummy for MVP)

### Phase 3: Identity Cleanup
- [ ] Clear Aadhaar from input field using `.value = ""`
- [ ] Clear from React state
- [ ] Clear from memory (no accidental logs)
- [ ] For extra security: Show a "🔒 Data Cleared" confirmation

### Phase 4: State Handoff to Voting
- [ ] Store proof + nullifier in React context or sessionStorage
- [ ] Pass to Module 3 without exposing original Aadhaar

## Key Functions to Implement

```javascript
// zkProof.js
export async function generateProof(aadhaar, merkleRoot, merklePath) {
  // Use snarkjs.groth16.fullProve()
  // Inputs: aadhaar, merkleRoot, merklePath
  // Outputs: { proof, publicSignals }
  // Return: { proof, publicSignals, nullifier }
}

export function generateNullifier(aadhaar) {
  // Hash the Aadhaar to create unique nullifier
  // Used later to prevent double voting
  // Return: nullifierHash (string)
}

// polling-booth-state.js
export function usePollingBooth() {
  const [aadhaar, setAadhaar] = useState("");
  const [proof, setProof] = useState(null);
  const [nullifier, setNullifier] = useState(null);
  const [status, setStatus] = useState("waiting"); // waiting | verifying | success | error
  const [merkleRoot] = useState(/* from Module 1 */);
  
  const verifyIdentity = async () => {
    setStatus("verifying");
    
    // 1. Check whitelist
    if (!isInWhitelist(aadhaar)) {
      setStatus("error");
      return;
    }
    
    // 2. Get Merkle proof
    const merklePath = getMerklePath(aadhaar);
    
    // 3. Generate ZK proof
    const { proof, publicSignals, nullifier } = 
      await generateProof(aadhaar, merkleRoot, merklePath);
    
    // 4. Clear Aadhaar - CRITICAL!
    setAadhaar("");
    
    // 5. Store proof for next step
    setProof(proof);
    setNullifier(nullifier);
    setStatus("success");
  };
  
  return { aadhaar, setAadhaar, verifyIdentity, status, proof, nullifier };
}
```

## File Structure for Module 2

```
frontend/src/
├── components/
│   ├── PollingBooth.jsx
│   ├── IdentityInput.jsx
│   ├── VerificationStatus.jsx
│   └── SuccessScreen.jsx
│
├── utils/
│   ├── zkProof.js         # ZK proof generation
│   ├── nullifier.js       # Nullifier hash creation
│   └── merkleHelper.js    # Merkle verification
│
└── hooks/
    └── usePollingBooth.js # State management
```

## Testing Checklist

- [ ] Can input Aadhaar number
- [ ] System rejects non-whitelisted Aadhaar with error
- [ ] System accepts whitelisted Aadhaar
- [ ] ZK-Proof generates without errors
- [ ] Nullifier hash is computed
- [ ] Aadhaar is cleared from UI after success
- [ ] No Aadhaar appears in console logs
- [ ] Can proceed to voting screen

## Dependencies

```json
{
  "snarkjs": "^0.7.1",
  "circomlibjs": "^0.1.1"
}
```

## MVP Speed Tips

1. **Dummy ZK For Now:** In MVP, skip actual circuit. Just use:
   ```javascript
   // Fake ZK-Proof (hashed proof of concept)
   const proof = { a: hash(aadhaar), b: hash(merkleRoot) };
   ```
   Full circuits can come later.

2. **Use Direct Nullifier:** For MVP, nullifier can be:
   ```javascript
   const nullifier = keccak256(aadhaar); // Simple hash
   ```

3. **Merkle Path Mock:** If Module 1 isn't ready, mock:
   ```javascript
   const merklePath = whitelist.indexOf(aadhaar); // Array index
   ```

## Flow Diagram

```
[Voter Enters Aadhaar]
        ↓
[Check in Whitelist]
        ├─→ NOT FOUND → [Show Error] ← Loop back
        ↓
[YES - Found]
        ↓
[Get Merkle Path]
        ↓
[Generate ZK-Proof + Nullifier]
        ↓
[WIPE Aadhaar from Memory]
        ↓
[Show Success Screen]
        ↓
[Pass Proof+Nullifier to Module 3]
```

## Next Module
Once verified and anonymized, voter proceeds to **Module 3: Offline Voting** with their proof and nullifier.

---
**Status:** Not Started  
**Priority:** CRITICAL (Foundation)  
**Estimated Time:** 2-3 days  
**Dependency:** Module 1 (Merkle Root)
