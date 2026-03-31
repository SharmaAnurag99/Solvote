# Module 2: Polling Booth Implementation Guide

## 1. Objective
Allow voters to verify their identity locally, check against the locked whitelist, generate a zero-knowledge proof, and create a nullifier (to prevent double voting). It securely strips all raw Identity data before voting begins.

## 2. Tech Stack
- React.js (Frontend)
- `react-router-dom` (Isolated Voter journey starting at `/booth/verify`)
- ZK Utilities (Mocked via hashes for MVP)

## 3. Step-by-Step Implementation

### Step 3.1: Verification UI (`PollingBooth.jsx` at `/booth/verify`)
- Create an input screen where the voter enters their Aadhaar number.
- Use a password-type field to mask the input visually.

### Step 3.2: ZK Verification Utility (`zkProof.js`)
- **Validate against Merkle Root:** 
  - Fetch `whitelist` and `merkleRoot` from `localStorage`.
  - Check if the entered Aadhaar is in the whitelist.
- **Generate Proof (Mock ZK):**
  - Compute the leaf hash of the Aadhaar.
  - Generate the Merkle Proof path `getMerkleProof(leaf)`.
  - Output an `IdentityPacket` containing: `{ proof: [...], root: "..." }`.

### Step 3.3: Nullifier Generation
- Generate a unique, deterministic one-way hash of the voter's Aadhaar padded with an election salt (e.g., `SHA256(Aadhaar + "SECRET_SALT")`).
- This `nullifier` will be publicly broadcasted to say "A vote happened" without saying "WHO voted".

### Step 3.4: Data Stripping & Hand-off
- **CRITICAL STEP:** Completely delete the raw Aadhaar number from the React state (`setState("")`).
- Bundle the `IdentityPacket` and `nullifier` and save it to a temporary `verified_identity` state/localStorage.
- Redirect/transition the user to the Voting Screen (`/booth/vote` - Module 3).

## 4. Verification & Testing
- ✅ Non-whitelisted Aadhaar numbers must be rejected.
- ✅ Whitelisted numbers generate a consistent `nullifier`.
- ✅ Using React Developer Tools, verifying that the actual Aadhaar string is completely removed from memory after crossing the booth.