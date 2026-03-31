# 🟣 Module 5: Smart Contract (Tallying & Verification)

## Overview
This is the on-chain backend! The Solana Anchor contract receives votes from Module 4, verifies proofs, prevents double voting, and tallies results. Written in Rust using the Anchor Framework.

## Objectives
- ✅ Initialize election with Merkle Root
- ✅ Verify incoming ZK-Proofs on-chain
- ✅ Prevent double voting using Nullifier PDAs
- ✅ Tally votes for each candidate
- ✅ Provide read-only state for dashboard
- ✅ Emit events for vote confirmations

## Smart Contract Architecture

### 1. Election State Account (PDA)
Stores the election data:
```rust
#[account]
pub struct Election {
    pub merkle_root: [u8; 32],           // Root from Module 1
    pub total_votes: u64,                // Vote counter
    pub candidate_a_votes: u64,          // Candidate A tally
    pub candidate_b_votes: u64,          // Candidate B tally
    pub candidate_c_votes: u64,          // Candidate C tally
    pub start_time: i64,                 // Election start
    pub end_time: i64,                   // Election end
    pub is_active: bool,                 // Can votes be submitted?
}
```

### 2. Nullifier PDA (Per Vote)
Prevents double voting:
```rust
#[account]
pub struct UsedNullifier {
    pub nullifier: [u8; 32],     // Unique hash from voter
    pub voter_index: u32,        // Anonymous index
    pub timestamp: i64,          // When vote was cast
}
```

### 3. Vote Receipt Account (Optional, for verification)
```rust
#[account]
pub struct VoteReceipt {
    pub nullifier: [u8; 32],
    pub candidate_voted: u8,      // 0, 1, or 2
    pub block_height: u64,
    pub tx_signature: String,     // TX that added this vote
}
```

## Developer Tasks

### Phase 1: Project Setup
- [ ] Create Anchor project: `anchor init rofv_voting`
- [ ] Update `Anchor.toml` with network settings
- [ ] Create program directory structure
- [ ] Setup build environment (Rust, Anchor, Solana CLI)

### Phase 2: Initialize Election Instruction
- [ ] Create `initialize_election` instruction:
  - Admin creates election account
  - Sets Merkle root from Module 1
  - Sets start/end times
  - Only callable once
  - Emits `ElectionInitialized` event

### Phase 3: Vote Receipt Instruction
- [ ] Create `register_vote` instruction:
  - Input: `{ proof, nullifier, candidate }`
  - Check nullifier not used (double voting)
  - Verify ZK-proof (on-chain verification)
  - Create Nullifier PDA if new
  - Increment candidate vote counter
  - Emit `VoteRecorded` event

### Phase 4: Double Voting Check
- [ ] Implement nullifier PDA check:
  - Try to load existing Nullifier account
  - If found: Throw `AlreadyVoted` error
  - If not found: Create new Nullifier PDA
  - Use `find_program_address()` with nullifier as seed

### Phase 5: ZK-Proof Verification
- [ ] Implement on-chain proof verification:
  - Deserialized proof from transaction
  - Verify proof against public signals
  - Check proof includes correct Merkle root
  - Use `anchor_lang` for serialization

### Phase 6: State Queries
- [ ] Create view functions:
  - `get_election_results()` - returns tally
  - `is_nullifier_used()` - checks if voted
  - `get_total_votes()` - current count
  - These are read-only, no state modification

## Key Code Structure

```rust
// lib.rs
use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("...YOUR_PROGRAM_ID...");

#[program]
pub mod rofv_voting {
    use super::*;

    // Initialize election instruction
    pub fn initialize_election(
        ctx: Context<InitializeElection>,
        merkle_root: [u8; 32],
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        let election = &mut ctx.accounts.election;
        election.merkle_root = merkle_root;
        election.candidate_a_votes = 0;
        election.candidate_b_votes = 0;
        election.candidate_c_votes = 0;
        election.total_votes = 0;
        election.start_time = start_time;
        election.end_time = end_time;
        election.is_active = true;

        emit!(ElectionInitialized {
            merkle_root,
            start_time,
            end_time,
        });

        Ok(())
    }

    // Register a vote instruction
    pub fn register_vote(
        ctx: Context<RegisterVote>,
        proof: Vec<u8>,        // ZK proof (serialized)
        nullifier: [u8; 32],   // Unique voter hash
        candidate: u8,         // 0, 1, or 2
    ) -> Result<()> {
        // 1. Check election is active
        let election = &mut ctx.accounts.election;
        require!(election.is_active, ErrorCode::ElectionClosed);

        // 2. Check nullifier not used (double voting prevention)
        let used_nullifier = &mut ctx.accounts.used_nullifier;
        require!(used_nullifier.to_account_info().owner == &system_program::ID,
            ErrorCode::AlreadyVoted);

        // 3. Verify ZK-Proof (simplified for MVP)
        // TODO: Implement actual on-chain ZK verification
        verify_zk_proof(&proof, &election.merkle_root)?;

        // 4. Create Nullifier PDA to prevent re-use
        used_nullifier.nullifier = nullifier;
        used_nullifier.voter_index = election.total_votes as u32;
        used_nullifier.timestamp = Clock::get()?.unix_timestamp;

        // 5. Increment vote counter
        election.total_votes += 1;

        match candidate {
            0 => election.candidate_a_votes += 1,
            1 => election.candidate_b_votes += 1,
            2 => election.candidate_c_votes += 1,
            _ => return Err(ErrorCode::InvalidCandidate.into()),
        }

        emit!(VoteRecorded {
            candidate,
            total_votes: election.total_votes,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Query results (read-only instruction)
    pub fn get_results(ctx: Context<GetResults>) -> Result<ElectionResults> {
        let election = &ctx.accounts.election;
        
        Ok(ElectionResults {
            total_votes: election.total_votes,
            candidate_a: election.candidate_a_votes,
            candidate_b: election.candidate_b_votes,
            candidate_c: election.candidate_c_votes,
            is_active: election.is_active,
        })
    }
}

// Accounts structures
#[derive(Accounts)]
pub struct InitializeElection<'info> {
    #[account(init, payer = admin, space = 8 + 32 + 32 + 8*4 + 1)]
    pub election: Account<'info, Election>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nullifier: [u8; 32])]
pub struct RegisterVote<'info> {
    #[account(mut)]
    pub election: Account<'info, Election>,
    
    #[account(
        init,
        payer = voter_payer,
        space = 8 + 32 + 4 + 8,
        seeds = [b"nullifier", nullifier.as_ref()],
        bump
    )]
    pub used_nullifier: Account<'info, UsedNullifier>,
    
    #[account(mut)]
    pub voter_payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetResults<'info> {
    #[account()]
    pub election: Account<'info, Election>,
}

// Account definitions
#[account]
pub struct Election {
    pub merkle_root: [u8; 32],
    pub total_votes: u64,
    pub candidate_a_votes: u64,
    pub candidate_b_votes: u64,
    pub candidate_c_votes: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub is_active: bool,
}

#[account]
pub struct UsedNullifier {
    pub nullifier: [u8; 32],
    pub voter_index: u32,
    pub timestamp: i64,
}

// Events
#[event]
pub struct ElectionInitialized {
    pub merkle_root: [u8; 32],
    pub start_time: i64,
    pub end_time: i64,
}

#[event]
pub struct VoteRecorded {
    pub candidate: u8,
    pub total_votes: u64,
    pub timestamp: i64,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Election is not active")]
    ElectionClosed,
    
    #[msg("This voter has already voted")]
    AlreadyVoted,
    
    #[msg("Invalid candidate index")]
    InvalidCandidate,
    
    #[msg("ZK proof verification failed")]
    ProofVerificationFailed,
    
    #[msg("Merkle proof invalid")]
    InvalidMerkleProof,
}

// Return type for results
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ElectionResults {
    pub total_votes: u64,
    pub candidate_a: u64,
    pub candidate_b: u64,
    pub candidate_c: u64,
    pub is_active: bool,
}

// ZK Proof verification (simplified)
fn verify_zk_proof(proof: &[u8], merkle_root: &[u8; 32]) -> Result<()> {
    // TODO: Implement actual proof verification
    // For MVP: Use a simple flag or mock check
    Ok(())
}
```

## File Structure for Module 5

```
contracts/
├── programs/
│   └── rofv_voting/
│       ├── src/
│       │   ├── lib.rs                # Main contract logic
│       │   ├── state.rs              # Account definitions (optional)
│       │   ├── instructions/         # Separate instruction files (optional)
│       │   │   ├── initialize.rs
│       │   │   ├── register_vote.rs
│       │   │   └── get_results.rs
│       │   └── errors.rs             # Error definitions
│       │
│       ├── Cargo.toml
│       └── tests/
│           └── integration.rs        # Contract tests
│
└── tests/
    └── contract.test.ts              # (Optional) JavaScript tests
```

## Testing Checklist

- [ ] Can initialize election with Merkle root
- [ ] Can register a valid vote
- [ ] Vote count increments correctly
- [ ] Double voting is prevented (AlreadyVoted error)
- [ ] Invalid candidate rejects vote
- [ ] Get results returns correct tallies
- [ ] Event emission works
- [ ] Nullifier PDA created correctly
- [ ] All state fields updated
- [ ] Contract deploys to Devnet

## MVP Speed Tips

1. **Skip ZK Verification:** For MVP Phase 1, don't implement actual ZK verification. Just:
   ```rust
   fn verify_zk_proof(proof: &[u8], merkle_root: &[u8; 32]) -> Result<()> {
       // TODO: Implement later
       Ok(()) // Always pass for now
   }
   ```

2. **Simple Nullifier Check:** Use a HashMap or simple account check:
   ```rust
   // Just check if nullifier PDA exists
   if is_nullifier_used(&nullifier) {
       return Err(ErrorCode::AlreadyVoted.into());
   }
   ```

3. **Hardcode Time Limits:** Don't worry about time checks in MVP:
   ```rust
   // Skip election active check for MVP
   // require!(election.is_active, ErrorCode::ElectionClosed);
   ```

## Building & Testing

```bash
# Build the contract
cd contracts
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test

# View logs
solana logs <PROGRAM_ID> --url devnet
```

## Integration Points with Frontend

### Frontend calls:
1. `initialize_election` - Admin only (from Module 1)
2. `register_vote` - Voter votes (from Module 4)
3. `get_results` - Dashboard reads (Module 5 Dashboard)

### Contract emits events:
- `ElectionInitialized` - Election ready
- `VoteRecorded` - Vote accepted on-chain

### Frontend listens to:
- `VoteRecorded` events for live dashboard updates
- `ElectionInitialized` for start confirmation

## Dashboard Integration (Module 5 Part 2)

Create a separate dashboard page that:
- Queries `get_results` every 2 seconds
- Shows live vote tallies
- Displays updated timestamp
- Links to Solscan for vote verification

```javascript
// Frontend code for dashboard
async function fetchElectionResults(connection, electionAccountPubkey) {
  const account = await connection.getAccountInfo(electionAccountPubkey);
  const electionData = deserializeElectionAccount(account.data);
  return {
    totalVotes: electionData.totalVotes,
    candidateA: electionData.candidateAVotes,
    candidateB: electionData.candidateBVotes,
    candidateC: electionData.candidateCVotes,
  };
}
```

## Verification Features

- Voter can input their receipt hash
- Frontend queries nullifier PDA to confirm vote was recorded
- Shows: *"✅ Your vote was recorded on-chain"*

## Next Steps

After this module, the MVP is complete! Next phases:
- Full ZK circuit integration
- Multiple election support
- Advanced privacy features
- Mainnet deployment

---
**Status:** Not Started  
**Priority:** CRITICAL (On-Chain Backend)  
**Estimated Time:** 4-5 days  
**Dependencies:** Solana CLI, Anchor Framework, Rust
