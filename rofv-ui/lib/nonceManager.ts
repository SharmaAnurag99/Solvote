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

// Keep the mock one just in case the devnet is down
export const fetchAndStoreNoncesLocally = (count: number = 10): DurableNonce[] => {
  const nonces: DurableNonce[] = Array.from({ length: count }).map(() => ({
    nonceAccountFullAddress: Keypair.generate().publicKey.toBase58(),
    nonceValue: Keypair.generate().publicKey.toBase58(), 
    authority: Keypair.generate().publicKey.toBase58(),
  }));
  localStorage.setItem("durable_nonces", JSON.stringify(nonces));
  return nonces;
};

// Create real Nonces on Devnet
export const createRealNoncesOnDevnet = async (count: number = 1, onProgress: (msg: string) => void): Promise<DurableNonce[]> => {
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
