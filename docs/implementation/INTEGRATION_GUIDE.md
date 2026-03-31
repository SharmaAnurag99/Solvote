# Complete Integration & End-to-End Testing Guide

## 1. Objective
Ensure all 5 modular components interface harmoniously, testing the entire user journey: from Admin initializing the election to a voter casting a vote offline, syncing it online, and viewing the verified immutable result.

## 2. Infrastructure Setup & Environment variables
- **Deployed Contract ID:** Insert your actual Solana Devnet Program ID into `frontend/.env.local` (e.g., `VITE_PROGRAM_ID=...`).
- Verify `Anchor.toml` and frontend points to matching RPC nodes (e.g., `https://api.devnet.solana.com`).
- Run `npm run dev` to start the frontend server.

## 3. Application Routing Architecture

Instead of a single monolithic interface, the frontend uses `react-router-dom` to cleanly separate concerns across distinct paths:
- `http://localhost:3000/admin` -> **Admin Portal** (Module 1). Strictly for the Electoral Officer to setup the election (Whitelist & Merkle lock).
- `http://localhost:3000/booth` -> **Voter Kiosk** (Modules 2 & 3). Dedicated loop for voter verification and casting the vote. Can safely go offline.
- `http://localhost:3000/analytics` -> **Unified Master Dashboard** (Modules 4 & 5). A single screen to analyze everything: live DTN sync status, blockchain confirmation logs, and the real-time vote tally.

## 4. End-to-End Walkthrough

### Phase A: Setup Election (Module 1 & 5)
1. The Electoral Officer navigates to the **Admin Portal** at `/admin`.
2. Add Test Aadhaar Numbers: `111122223333`, `444455556666`, `777788889999`.
3. Click **Generate Merkle Root**.
4. *Integration Trigger:* The frontend calls the backend `initialize_election` method on your Solana smart contract passing the generated Merkle Root. Ensure console logs verify success.

### Phase B: Identity Verification (Module 2)
1. A voter walks up to the kiosk traversing to the **Polling Booth** at `/booth/verify`.
2. Enter `111122223333`.
3. System verifies against local whitelist, generates ZK Proof and Nullifier, strips Aadhaar.
4. Note that UI successfully proceeds to the "Voting Screen" at `/booth/vote`.

### Phase C: Offline Voting (Module 3)
1. Disable your computer's internet OR toggle "Simulate Offline Mode" inside the Voting UI.
2. Select "Candidate A".
3. Click "Cast Vote".
4. Transaction is serialized with the fetched Durable Nonce.
5. VVPAT receipt displays. TX Hash is visible.
6. Verify via developer tools -> localStorage -> `dtn_outbox` has 1 pending item.

### Phase D: Double Vote Rejection (Security check)
1. Try to simulate repeating Phase B & C with the exact same Aadhaar (`111122223333`).
2. If forced through DTN, wait for sync phase. The blockchain will inherently reject the second transaction returning an error on double-nullifier.

### Phase E: DTN Forwarding (Module 4) & Observing Tally (Module 5)
1. Re-enable network / Turn off "Simulate Offline".
2. Open the **Unified Master Dashboard** at `/analytics`.
3. Observe Hook detecting online status -> Triggering Sync loop for any queued DTN items.
4. Wait 2-5 seconds. Observe the `dtn_outbox` status cleanly move from `pending` -> `submitted` -> `confirmed`.
5. Simultaneously, the UI queries the Smart Contract's `get_results` endpoint.
6. Validate that "Candidate A" votes increased by 1 and `Total Votes` equals 1.

## 5. Final Security Sanity Check
- ✅ No "Aadhaar" or plain-text identifiable data sent in WebSocket/RPC calls.
- ✅ Contract handles double-voting gracefully.
- ✅ Complete offline resilience simulated and passed successfully.

**🎉 Project successfully integrated!**