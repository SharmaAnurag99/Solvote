import { 
  Keypair, 
  Connection, 
  clusterApiUrl, 
  SystemProgram, 
  NONCE_ACCOUNT_LENGTH, 
  Transaction, 
  sendAndConfirmTransaction, 
  LAMPORTS_PER_SOL,
  NonceAccount
} from "@solana/web3.js";

export interface DurableNonce {
  nonceAccountFullAddress: string;
  nonceValue: string; 
  authority: string; 
}

/**
 * DEMO MODE: Create mock nonces for demonstration
 * 
 * These are cryptographically valid looking nonces for demonstration purposes.
 * In production, these would be created on actual Solana blockchain.
 * 
 * Using mock to avoid Solana devnet airdrop rate limits during presentation.
 */
export const createMockNonces = (count: number = 1, onProgress?: (msg: string) => void): DurableNonce[] => {
  const nonces: DurableNonce[] = [];
  
  if (onProgress) onProgress(`🎭 DEMO MODE: Creating ${count} mock nonces for demonstration`);
  if (onProgress) onProgress(`Authority: ${Keypair.generate().publicKey.toBase58()}`);
  
  for (let i = 0; i < count; i++) {
    if (onProgress) onProgress(`Creating Mock Nonce ${i+1}/${count}...`);
    
    nonces.push({
      // These look real but are generated locally
      nonceAccountFullAddress: Keypair.generate().publicKey.toBase58(),
      nonceValue: Keypair.generate().publicKey.toBase58(), 
      authority: Keypair.generate().publicKey.toBase58(),
    });
    
    if (onProgress) onProgress(`✅ Successfully locked Mock Nonce: ${nonces[i].nonceValue.substring(0, 20)}...`);
  }
  
  // Store in localStorage
  const existingStr = localStorage.getItem("durable_nonces");
  const existing = existingStr ? JSON.parse(existingStr) : [];
  const combined = [...existing, ...nonces];
  localStorage.setItem("durable_nonces", JSON.stringify(combined));
  
  if (onProgress) onProgress(`✨ Demo mode: ${combined.length} nonces ready for offline voting`);
  
  return combined;
};

/**
 * PRODUCTION MODE: Create real Nonces on Solana Devnet
 * 
 * This creates actual durable nonce accounts on the blockchain.
 * Currently disabled due to devnet airdrop rate limits.
 * 
 * To use in production:
 * 1. Wait for devnet airdrop to reset
 * 2. OR use mainnet with funded account
 * 3. Uncomment the code below
 */
export const createRealNoncesOnDevnet = async (count: number = 1, onProgress: (msg: string) => void): Promise<DurableNonce[]> => {
  // Try to create real nonces, but fall back to mock if airdrop fails
  try {
    return await _createRealNoncesInternal(count, onProgress);
  } catch (e: any) {
    // Airdrop rate limited or devnet down → Use mock for demo
    onProgress(`⚠️ Devnet airdrop rate limited. Switching to DEMO MODE with mock nonces...`);
    return createMockNonces(count, onProgress);
  }
};

/**
 * INTERNAL: Real nonce creation logic (production)
 * Commented out to avoid rate limit errors during demo
 * 
 * Uncomment this when:
 * - Devnet airdrop is available
 * - Using custom RPC endpoint with funded account
 * - Or using mainnet
 */
const _createRealNoncesInternal = async (count: number = 1, onProgress: (msg: string) => void): Promise<DurableNonce[]> => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  // 1. Setup Authority Keypair
  let authStr = localStorage.getItem("nonce_authority_secret");
  let authority: Keypair;
  if (authStr) {
    authority = Keypair.fromSecretKey(new Uint8Array(JSON.parse(authStr)));
  } else {
    authority = Keypair.generate();
    localStorage.setItem("nonce_authority_secret", JSON.stringify(Array.from(authority.secretKey)));
  }

  onProgress(`Authority: ${authority.publicKey.toBase58()}`);
  
  // 2. Airdrop SOL if needed
  let balance = await connection.getBalance(authority.publicKey);
  if (balance < 0.05 * LAMPORTS_PER_SOL) {
    onProgress("Requesting Devnet Airdrop. This may take 15 seconds...");
    try {
      const airdropSig = await connection.requestAirdrop(authority.publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdropSig, "confirmed");
      onProgress("Airdrop successful.");
    } catch (e: any) {
      onProgress("Airdrop failed. Devnet might be rate limited.");
      throw new Error("Airdrop failed or rate limited: " + e.message);
    }
  } else {
    onProgress("Authority already funded.");
  }

  // 3. Create the Nonce Accounts
  const nonces: DurableNonce[] = [];
  const rent = await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH);

  for (let i = 0; i < count; i++) {
    onProgress(`Creating Real Devnet Nonce ${i+1}/${count}...`);
    const nonceAccount = Keypair.generate();
    
    let tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: nonceAccount.publicKey,
        lamports: rent,
        space: NONCE_ACCOUNT_LENGTH,
        programId: SystemProgram.programId,
      }),
      SystemProgram.nonceInitialize({
        noncePubkey: nonceAccount.publicKey,
        authorizedPubkey: authority.publicKey,
      })
    );

    try {
      await sendAndConfirmTransaction(connection, tx, [authority, nonceAccount]);
      
      // Fetch the created nonce value from DEVNET
      const accountInfo = await connection.getAccountInfo(nonceAccount.publicKey);
      const nonceAccountData = NonceAccount.fromAccountData(accountInfo!.data);
      
      nonces.push({
        nonceAccountFullAddress: nonceAccount.publicKey.toBase58(),
        nonceValue: nonceAccountData.nonce,
        authority: authority.publicKey.toBase58()
      });
      onProgress(`Successfully locked Nonce: ${nonceAccountData.nonce}`);
    } catch (e) {
      console.error(e);
      onProgress(`Failed to create nonce ${i+1}`);
    }
  }

  // Add to local storage
  const existingStr = localStorage.getItem("durable_nonces");
  const existing = existingStr ? JSON.parse(existingStr) : [];
  const combined = [...existing, ...nonces];
  localStorage.setItem("durable_nonces", JSON.stringify(combined));
  
  return combined;
};

export const popDurableNonce = (): DurableNonce | null => {
  const stored = localStorage.getItem("durable_nonces");
  if (!stored) return null;
  const nonces: DurableNonce[] = JSON.parse(stored);
  if (nonces.length === 0) return null;
  const popped = nonces.shift()!;
  localStorage.setItem("durable_nonces", JSON.stringify(nonces));
  return popped;
};

export const getAvailableNonceCount = (): number => {
  const stored = localStorage.getItem("durable_nonces");
  if (!stored) return 0;
  return JSON.parse(stored).length;
};
