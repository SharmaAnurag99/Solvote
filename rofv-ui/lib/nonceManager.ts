import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  NONCE_ACCOUNT_LENGTH,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";

const NONCE_STORAGE_KEY = "durable_nonce_bank";

export interface CachedDurableNonce {
  nonceAccount: string;
  nonceValue: string;
  authority: string;
  authoritySecretKey?: number[];
  nonceAccountSecretKey?: number[];
  createdAt: number;
  source: "devnet" | "local-demo";
}

function readNonceBank(): CachedDurableNonce[] {
  if (typeof window === "undefined") return [];

  try {
    const data = window.localStorage.getItem(NONCE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn("[NonceManager] Failed reading nonce bank", error);
    return [];
  }
}

function writeNonceBank(nonces: CachedDurableNonce[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NONCE_STORAGE_KEY, JSON.stringify(nonces));
}

function createLocalDemoNonce(): CachedDurableNonce {
  const authority = Keypair.generate();
  const nonceAccount = Keypair.generate();

  return {
    nonceAccount: nonceAccount.publicKey.toBase58(),
    nonceValue: Keypair.generate().publicKey.toBase58(),
    authority: authority.publicKey.toBase58(),
    authoritySecretKey: Array.from(authority.secretKey),
    nonceAccountSecretKey: Array.from(nonceAccount.secretKey),
    createdAt: Date.now(),
    source: "local-demo",
  };
}

export function createLocalDemoNonces(count = 1): CachedDurableNonce[] {
  const createdNonces = Array.from({ length: count }, createLocalDemoNonce);
  const nonceBank = readNonceBank();
  writeNonceBank([...nonceBank, ...createdNonces]);
  return createdNonces;
}

export function getAvailableNonceCount(): number {
  return readNonceBank().length;
}

export function popDurableNonce(): CachedDurableNonce | null {
  const nonceBank = readNonceBank();
  const nonce = nonceBank.shift() ?? null;
  writeNonceBank(nonceBank);
  return nonce;
}

export async function createRealNoncesOnDevnet(
  count = 1,
  onProgress?: (message: string) => void
): Promise<CachedDurableNonce[]> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const createdNonces: CachedDurableNonce[] = [];

  for (let index = 0; index < count; index += 1) {
    onProgress?.(`Funding devnet nonce authority ${index + 1}/${count}...`);

    const payer = Keypair.generate();
    const authority = Keypair.generate();
    const nonceAccount = Keypair.generate();

    const airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      LAMPORTS_PER_SOL
    );
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature: airdropSignature,
        ...latestBlockhash,
      },
      "confirmed"
    );

    onProgress?.(`Creating durable nonce account ${index + 1}/${count}...`);

    const rentLamports = await connection.getMinimumBalanceForRentExemption(
      NONCE_ACCOUNT_LENGTH
    );
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: nonceAccount.publicKey,
        lamports: rentLamports,
        space: NONCE_ACCOUNT_LENGTH,
        programId: SystemProgram.programId,
      }),
      SystemProgram.nonceInitialize({
        noncePubkey: nonceAccount.publicKey,
        authorizedPubkey: authority.publicKey,
      })
    );

    const signature = await connection.sendTransaction(transaction, [
      payer,
      nonceAccount,
    ]);
    const creationBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature,
        ...creationBlockhash,
      },
      "confirmed"
    );

    const nonceInfo = await connection.getNonce(nonceAccount.publicKey);
    if (!nonceInfo) {
      throw new Error("Devnet nonce account was created but could not be read.");
    }

    createdNonces.push({
      nonceAccount: nonceAccount.publicKey.toBase58(),
      nonceValue: nonceInfo.nonce,
      authority: authority.publicKey.toBase58(),
      authoritySecretKey: Array.from(authority.secretKey),
      nonceAccountSecretKey: Array.from(nonceAccount.secretKey),
      createdAt: Date.now(),
      source: "devnet",
    });
  }

  const nonceBank = readNonceBank();
  const updatedNonceBank = [...nonceBank, ...createdNonces];
  writeNonceBank(updatedNonceBank);

  onProgress?.(`Cached ${createdNonces.length} durable nonce(s).`);
  return createdNonces;
}

export async function getNextDurableNonce() {
  const nonce = popDurableNonce() ?? createLocalDemoNonce();

  return {
    pubkey: nonce.nonceAccount,
    authority: nonce.authority,
    nonceValue: nonce.nonceValue,
  };
}
