# Module 1: Admin Panel Implementation Guide

## 1. Objective
Build the Admin Panel where the Electoral Officer can manage the whitelist of eligible voters and lock the election by generating a Merkle Root.

## 2. Tech Stack
- React.js (Frontend)
- `react-router-dom` (Isolated at `/admin` route)
- `crypto` or `circomlibjs` (for Poseidon Hash/Merkle Tree)
- LocalStorage (mock database for MVP)

## 3. Step-by-Step Implementation

### Step 3.1: Setup State Management & Routing
- Set up `react-router-dom` and route `/admin` to load the `AdminPanel` wrapper component.
- Manage two states: `whitelist` (Array of Aadhaar numbers) and `merkleRoot` (String).
- Load initial state from `localStorage`.

### Step 3.2: Voter Input Component (`VoterInput.jsx`)
- Create a form to accept 12-digit Aadhaar numbers.
- Add validation (must be numeric, exact length).
- Add anti-duplication logic (check if Aadhaar already exists in the `whitelist` state).
- On submit, update the `whitelist` state and persist to `localStorage`.

### Step 3.3: Whitelist Display (`WhitelistDisplay.jsx`)
- Create a list/table to display all added voters.
- Add a "Remove" button next to each voter to allow corrections.
- Update state and `localStorage` on removal.

### Step 3.4: Merkle Tree Utility (`merkleTree.js`)
- Implement a hashing utility. For MVP, you can use SHA-256 (via `crypto-js`), but in production, this should be Poseidon (ZK-friendly).
- Implement a `generateMerkleTree(leaves)` function:
  1. Hash each Aadhaar to create bottom leaves.
  2. Pair hashes iteratively to compute parent nodes.
  3. The final remaining hash is the Root.
- Implement a `getMerkleProof(leaf)` function to extract the proof path for ZK verification later.

### Step 3.5: Lock Election & Generate Root
- In `AdminPanel`, add a "Generate & Lock Election" button.
- On click -> trigger `generateMerkleTree(whitelist)`.
- Save the resulting `merkleRoot` to `localStorage` (mocking a blockchain transaction where admin publishes the root on-chain).
- Display the Merkle Root hash on screen to show active lock state.

## 4. Verification & Testing
- ✅ Can add valid inputs.
- ✅ Cannot add duplicate inputs.
- ✅ Generating root with same inputs yields the exact same hash (deterministic).
- ✅ Refreshing the page keeps the data intact.