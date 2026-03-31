# Module 3: Offline Crypto & DTN Implementation Guide

## 1. Objective
Allow verified voters to select a candidate and cryptographically sign their vote securely, storing it locally if the internet is disconnected. Generates a verifiable paper audit trail (VVPAT).

## 2. Tech Stack
- React.js
- `react-router-dom` (`/booth/vote` route for isolated kiosk feeling)
- Solana Web3.js (for offline transaction generation)

## 3. Step-by-Step Implementation

### Step 3.1: Construct the Vote Payload
- UI: Display Candidates (e.g., A, B, C) on the `/booth/vote` screen.
- Verify presence of `verified_identity` in app state. If missing, boot user back to `/booth/verify`.
- On Selection, bind the selection ID with the `IdentityPacket` and `nullifier` from Module 2.
- `Payload = { candidate_id, nullifier, zk_proof, timestamp }`

### Step 3.2: Durable Nonce Integration (`nonceManager.js`)
- **When online (Prior to Election):** Fetch a batch of Durable Nonces from Solana and store them in `localStorage`.
- **During Voting:** Pick the next unused Nonce from local storage.
- Using a nonce allows the Solana transaction to be valid even if submitted hours or days later.

### Step 3.3: Offline Signing
- Construct an actual Solana raw transaction containing the instructions to call the smart contract (Module 5).
- Apply the Durable Nonce to the transaction.
- Sign the transaction. (For MVP, you may use a temporary local app keypair representing the device/voter).
- Serialize the signed transaction to a Base64 string.

### Step 3.4: DTN Outbox Queuing (`dtnHelper.js`)
- Store the Base64 signed transaction into a `dtn_outbox` array in `localStorage`.
- Mark its status as `pending`. This simulates the DTN (Delay-Tolerant Network) queue.

### Step 3.5: VVPAT Digital Receipt
- Hash the signed transaction (`txHash`).
- Display a "Receipt" to the user containing the `txHash`, `Candidate ID`, and timestamp.
- User can record this `txHash` to verify later on a block explorer.

## 4. Verification & Testing
- ✅ Can cast vote successfully while disconnected from Wi-Fi.
- ✅ Outbox in localStorage accurately reflects the newly signed transaction.
- ✅ VVPAT matching the payload generates correctly.