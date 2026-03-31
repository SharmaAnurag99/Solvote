# Module 5: Smart Contract Implementation Guide

## 1. Objective
Develop the Solana/Anchor program (Smart Contract) that initializing an election with the Merkle Root, securely registers incoming votes, verifies they are valid, prevents double voting, and keeps immutable tallies.

## 2. Tech Stack
- Rust
- Anchor Framework (Solana)

## 3. Step-by-Step Implementation

### Step 3.1: Initialize Anchor Project
- Run `anchor init rofv_voting`.
- Edit `Anchor.toml` to ensure it points to the `devnet` network.
- Update `lib.rs` with necessary boilerplate.

### Step 3.2: Data Structures setup (`state`)
- Define `Election` account:
  - `merkle_root: [u8; 32]`
  - `candidate_a_votes: u64` (and B, C...)
  - `is_active: bool`
- Define `UsedNullifier` account (PDA):
  - `nullifier_hash: [u8; 32]`

### Step 3.3: `initialize_election` Instruction
- Require an Admin signature.
- Provide a `merkle_root` as an argument.
- Instantiate the `Election` account structure. Set vote counters to 0 and `is_active` to `true`.

### Step 3.4: `register_vote` Instruction
- **Accepts arguments:** `candidate_id` (u8), `nullifier` ([u8; 32]), `zk_proof` (struct).
- **Step A: Election Check:** Require `is_active == true`.
- **Step B: ZK Proof Validation:** (For MVP) ensure the mocked proof payload corresponds to the stored `merkle_root`. In production, interact with on-chain Groth16 verifier.
- **Step C: Double Voting Prevention:** Attempt to Initialize the `UsedNullifier` PDA utilizing the `nullifier` array as the seed. 
  - *If it fails:* Anchor will automatically throw an error because the account already exists (indicating a double vote attempt).
- **Step D: Tally:** Match `candidate_id` and increment the correct counter state `election.candidate_x_votes += 1`.
- Emit a `VoteRecorded` event.

### Step 3.5: Build and Deploy
- Run `anchor build`.
- Fetch your derived program ID and update `declare_id!(...)` inside `lib.rs`.
- Run `anchor deploy --provider.cluster devnet`.

## 4. Verification & Testing
- ✅ Can fetch election state and observe Merkle Root set correctly.
- ✅ Sending two votes with different nullifiers updates candidate totals successfully.
- ✅ Sending a second transaction with a `UsedNullifier` fails with "Account already exists / Already Voted" error.