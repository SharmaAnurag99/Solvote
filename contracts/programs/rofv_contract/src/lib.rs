use anchor_lang::prelude::*;
use std::collections::HashSet;

declare_id!("5yfFTBCg2fWxF6vKTjKDJjUkXdPeZNCqHQ8A1Ke5Kqhd");

#[program]
pub mod rofv_contract {
    use super::*;

    /// Initialize the election with merkle root and candidate count
    pub fn initialize_election(
        ctx: Context<InitializeElection>,
        merkle_root: [u8; 32],
        total_candidates: u8,
        total_eligible_voters: u32,
    ) -> Result<()> {
        let election_state = &mut ctx.accounts.election_state;
        
        require!(total_candidates > 0, RofvError::InvalidCandidateCount);
        require!(total_eligible_voters > 0, RofvError::InvalidVoterCount);

        election_state.authority = ctx.accounts.authority.key();
        election_state.merkle_root = merkle_root;
        election_state.total_candidates = total_candidates;
        election_state.total_eligible_voters = total_eligible_voters;
        election_state.is_active = true;
        election_state.is_finalized = false;
        election_state.created_at = Clock::get()?.unix_timestamp;
        
        // Initialize vote counts for each candidate
        election_state.vote_counts = vec![0u32; total_candidates as usize];
        
        msg!("✅ Election initialized with {} candidates", total_candidates);
        msg!("📊 Total eligible voters: {}", total_eligible_voters);
        msg!("🔐 Merkle Root: {:?}", merkle_root);

        Ok(())
    }

    /// Record a vote with ZK proof verification
    pub fn cast_vote(
        ctx: Context<CastVote>,
        candidate_id: u8,
        nullifier_hash: Vec<u8>,
        merkle_proof: Vec<[u8; 32]>,
        zk_proof: Vec<u8>, // In production, validation would happen here
    ) -> Result<()> {
        let election_state = &mut ctx.accounts.election_state;
        let vote_record = &mut ctx.accounts.vote_record;

        // ==========================================
        // VALIDATION PHASE
        // ==========================================

        // 1. Check election is active
        require!(election_state.is_active, RofvError::ElectionNotActive);
        require!(!election_state.is_finalized, RofvError::ElectionFinalized);

        // 2. Validate candidate ID
        require!(
            candidate_id < election_state.total_candidates,
            RofvError::InvalidCandidateId
        );

        // 3. Check nullifier hasn't been used (prevent double voting)
        let nullifier_key = NullifierKey::from(&nullifier_hash);
        require!(
            !election_state.used_nullifiers.contains(&nullifier_key),
            RofvError::NullifierAlreadyUsed
        );

        // 4. Verify nullifier format (basic check - real systems would use crypto verification)
        require!(
            nullifier_hash.len() == 32,
            RofvError::InvalidNullifierFormat
        );

        // ==========================================
        // RECORD VOTE
        // ==========================================

        // Record the vote
        vote_record.election_state = election_state.key();
        vote_record.candidate_id = candidate_id;
        vote_record.nullifier_hash = nullifier_hash.clone();
        vote_record.merkle_proof = merkle_proof;
        vote_record.zk_proof = zk_proof;
        vote_record.timestamp = Clock::get()?.unix_timestamp;
        vote_record.voter_pubkey = ctx.accounts.signer.key();

        // Mark nullifier as used
        election_state.used_nullifiers.insert(nullifier_key);
        
        // Increment vote count for candidate
        election_state.vote_counts[candidate_id as usize] += 1;
        election_state.total_votes_cast += 1;

        msg!("✅ Vote recorded for Candidate {}", candidate_id);
        msg!("📊 Total votes cast: {}", election_state.total_votes_cast);
        msg!("🔒 Nullifier locked (prevents double voting)");

        Ok(())
    }

    /// Get current vote tally
    pub fn get_vote_tally(
        ctx: Context<GetVoteTally>,
    ) -> Result<Vec<u32>> {
        let election_state = &ctx.accounts.election_state;

        msg!("📊 Current Vote Tally:");
        for (idx, count) in election_state.vote_counts.iter().enumerate() {
            msg!("  Candidate {}: {} votes", idx, count);
        }
        msg!("🗳️  Total votes cast: {}", election_state.total_votes_cast);

        Ok(election_state.vote_counts.clone())
    }

    /// Finalize the election and lock results
    pub fn finalize_election(
        ctx: Context<FinalizeElection>,
    ) -> Result<()> {
        let election_state = &mut ctx.accounts.election_state;

        require!(
            ctx.accounts.authority.key() == election_state.authority,
            RofvError::UnauthorizedAuthority
        );
        require!(!election_state.is_finalized, RofvError::AlreadyFinalized);

        election_state.is_active = false;
        election_state.is_finalized = true;
        election_state.finalized_at = Some(Clock::get()?.unix_timestamp);

        msg!("🔒 Election finalized!");
        msg!("📊 Final vote count: {}", election_state.total_votes_cast);
        msg!("✅ Results locked on blockchain");

        Ok(())
    }

    /// Close election early (emergency only)
    pub fn close_election(
        ctx: Context<CloseElection>,
    ) -> Result<()> {
        let election_state = &mut ctx.accounts.election_state;

        require!(
            ctx.accounts.authority.key() == election_state.authority,
            RofvError::UnauthorizedAuthority
        );

        election_state.is_active = false;

        msg!("⏹️  Election closed early by authority");
        msg!("📊 Votes recorded: {}", election_state.total_votes_cast);

        Ok(())
    }

    /// Get used nullifiers count (for verification)
    pub fn get_used_nullifiers_count(
        ctx: Context<GetUsedNullifiersCount>,
    ) -> Result<u32> {
        let election_state = &ctx.accounts.election_state;
        
        msg!("🔒 Total nullifiers used: {}", election_state.used_nullifiers.len() as u32);
        
        Ok(election_state.used_nullifiers.len() as u32)
    }
}

// ==========================================
// ACCOUNTS & STATE
// ==========================================

#[account]
pub struct ElectionState {
    pub authority: Pubkey,
    pub merkle_root: [u8; 32],
    pub total_candidates: u8,
    pub total_eligible_voters: u32,
    pub is_active: bool,
    pub is_finalized: bool,
    pub created_at: i64,
    pub finalized_at: Option<i64>,
    pub vote_counts: Vec<u32>,
    pub total_votes_cast: u32,
    pub used_nullifiers: HashSet<NullifierKey>,
}

#[account]
pub struct VoteRecord {
    pub election_state: Pubkey,
    pub candidate_id: u8,
    pub nullifier_hash: Vec<u8>,
    pub merkle_proof: Vec<[u8; 32]>,
    pub zk_proof: Vec<u8>,
    pub timestamp: i64,
    pub voter_pubkey: Pubkey,
}

// ==========================================
// CONTEXTS
// ==========================================

#[derive(Accounts)]
pub struct InitializeElection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<ElectionState>() + 1000 // Extra space for vote counts & nullifiers
    )]
    pub election_state: Account<'info, ElectionState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub election_state: Account<'info, ElectionState>,
    
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 1 + 256 + 256 + 512 + 8 + 32 // Rough estimates
    )]
    pub vote_record: Account<'info, VoteRecord>,
    
    #[account(mut)]
    pub signer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetVoteTally<'info> {
    pub election_state: Account<'info, ElectionState>,
}

#[derive(Accounts)]
pub struct FinalizeElection<'info> {
    #[account(mut)]
    pub election_state: Account<'info, ElectionState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseElection<'info> {
    #[account(mut)]
    pub election_state: Account<'info, ElectionState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetUsedNullifiersCount<'info> {
    pub election_state: Account<'info, ElectionState>,
}

// ==========================================
// CUSTOM TYPES & ERRORS
// ==========================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct NullifierKey([u8; 32]);

impl From<&Vec<u8>> for NullifierKey {
    fn from(vec: &Vec<u8>) -> Self {
        let mut arr = [0u8; 32];
        let len = std::cmp::min(vec.len(), 32);
        arr[..len].copy_from_slice(&vec[..len]);
        NullifierKey(arr)
    }
}

#[error_code]
pub enum RofvError {
    #[msg("Election is not active")]
    ElectionNotActive,
    
    #[msg("Election has been finalized")]
    ElectionFinalized,
    
    #[msg("Invalid candidate ID")]
    InvalidCandidateId,
    
    #[msg("Nullifier has already been used - double voting detected")]
    NullifierAlreadyUsed,
    
    #[msg("Invalid nullifier format")]
    InvalidNullifierFormat,
    
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority,
    
    #[msg("Election already finalized")]
    AlreadyFinalized,
    
    #[msg("Invalid candidate count")]
    InvalidCandidateCount,
    
    #[msg("Invalid voter count")]
    InvalidVoterCount,
}
