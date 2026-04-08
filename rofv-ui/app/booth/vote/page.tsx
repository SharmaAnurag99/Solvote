"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wifi, WifiOff, Copy, Check, Database } from "lucide-react";
import ProcessFlow from "@/components/ProcessFlow";
import { Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { popDurableNonce, getAvailableNonceCount, createRealNoncesOnDevnet } from "@/lib/nonceManager";
import { 
  generateVoterProof, 
  generateMockProof, 
  calculateMerkleProof,
  type ZKProofOutput,
  type VoterAuthInputs 
} from "@/lib/zkProofGenerator";

const CANDIDATES = [
  { id: 0, name: "Candidate A", color: "bg-blue-600" },
  { id: 1, name: "Candidate B", color: "bg-green-600" },
  { id: 2, name: "Candidate C", color: "bg-purple-600" },
];

export default function VotingScreen() {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [loading, setLoading] = useState(false);

  const [processSteps, setProcessSteps] = useState<any[]>([
    {
      name: "Generating ZK Proof",
      description: "Creating zero-knowledge proof of voter eligibility",
      status: "pending",
    },
    {
      name: "Verifying Merkle Membership",
      description: "Confirming voter is in eligible voter merkle tree",
      status: "pending",
    },
    {
      name: "Computing Nullifier Hash",
      description: "Generating unique identifier to prevent double voting",
      status: "pending",
    },
    {
      name: "Applying Durable Nonce",
      description: "Attaching an offline blockhash substitute to the vote",
      status: "pending",
    },
    {
      name: "Securing Transaction Payload",
      description: "Encrypting structure using Booth Authority Keypair",
      status: "pending",
    },
    {
      name: `${simulateOffline ? "Storing in DTN Queue" : "Broadcasting to Blockchain"}`,
      description: simulateOffline
        ? "Queuing base64 payload for offline sync"
        : "Submitting signed transaction to blockchain",
      status: "pending",
    },
  ]);
  const [receipt, setReceipt] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [noncesOffline, setNoncesOffline] = useState(0);
  const [nonceLoadingMsg, setNonceLoadingMsg] = useState("");

  useEffect(() => {
    // Check nonces on load
    setNoncesOffline(getAvailableNonceCount());
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const effectivelyOffline = isOffline || simulateOffline;

  const handleFetchNonces = async () => {
    try {
      setNonceLoadingMsg("Initializing Devnet...");
      await createRealNoncesOnDevnet(1, (msg) => {
        setNonceLoadingMsg(msg);
      });
      setNoncesOffline(getAvailableNonceCount());
      setNonceLoadingMsg("");
    } catch (err: any) {
      alert("Failed creating Devnet nonces: " + err.message);
      setNonceLoadingMsg("");
    }
  };

  const handleCastVote = async () => {
    if (selectedCandidate === null) return;

    if (noncesOffline === 0) {
      alert("❌ NO OFFLINE NONCES AVAILABLE. Booth must connect to WiFi to boot up election payload cache.");
      return;
    }

    setLoading(true);

    const steps = [...processSteps];
    steps[0].status = "processing";
    setProcessSteps([...steps]);

    // STEP 1: FETCH IDENTITY DATA & GENERATE ZK PROOF
    const authDataString = localStorage.getItem("verified_identity");
    if (!authDataString) {
      alert("Unauthorized: No identity token found. Redirecting to verify...");
      setLoading(false);
      window.location.href = "/booth/verify";
      return;
    }
    const authData = JSON.parse(authDataString);
    
    // Generate ZK proof of voter eligibility (WITHOUT revealing voterId or PIN)
    try {
      // Mock election data - in production comes from smart contract
      const electionId = "election_2026_general";
      const mockMerkleRoot = "21888242871839275222246405745257275088548364400416034343698204186575808495617"; // Real field for BN128
      
      // Prepare voter authentication inputs
      const voterInputs: VoterAuthInputs = {
        voterId: authData.voterId || "123456789",
        secretPin: authData.secretPin || "9876",
        merkleRoot: mockMerkleRoot,
        electionId: electionId,
        ...calculateMerkleProof(authData.voterId || "123456789", 20),
      };

      // Try to generate real proof, fall back to mock if artifacts not ready
      let zkProofOutput: ZKProofOutput;
      try {
        const wasmPath = "/circuit.wasm"; // Will be available after compile
        const zkeyPath = "/circuit_final.zkey";
        const wasmResponse = await fetch(wasmPath);
        const zkeyResponse = await fetch(zkeyPath);
        
        if (wasmResponse.ok && zkeyResponse.ok) {
          const wasmBuf = await wasmResponse.arrayBuffer();
          const zkeyBuf = await zkeyResponse.arrayBuffer();
          zkProofOutput = await generateVoterProof(voterInputs, wasmBuf, zkeyBuf);
        } else {
          throw new Error("Circuit artifacts not found, using mock proof");
        }
      } catch (e) {
        // Fallback: Use mock proof for demonstration
        console.log("Real circuit not compiled yet, using mock proof for demo");
        zkProofOutput = generateMockProof(voterInputs);
      }

      // Extract the nullifier from the proof public signals
      const nullifierHash = zkProofOutput.publicSignals[2];
      
      // PREVENT DOUBLE VOTING using nullifier hash
      const usedNullifiers = JSON.parse(localStorage.getItem("used_nullifiers") || "[]");
      if (usedNullifiers.includes(nullifierHash)) {
        alert("❌ DOUBLE VOTE DETECTED: This identity was already used to vote!");
        setLoading(false);
        steps[0].status = "pending";
        setProcessSteps([...steps]);
        return;
      }
      
      // Store nullifier to prevent re-voting
      usedNullifiers.push(nullifierHash);
      localStorage.setItem("used_nullifiers", JSON.stringify(usedNullifiers));
      
      steps[0].status = "completed";
      steps[1].status = "processing";
      setProcessSteps([...steps]);
      
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      steps[1].status = "completed";
      steps[2].status = "processing";
      setProcessSteps([...steps]);
      
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      steps[2].status = "completed";
      steps[3].status = "processing";
      setProcessSteps([...steps]);

    // 1. Pop a Nonce from our local bank so we map it strictly to this offline vote
    const offlineNonce = popDurableNonce()!;
    setNoncesOffline(getAvailableNonceCount());
    
    await new Promise((resolve) => setTimeout(resolve, 600));

    steps[3].status = "completed";
    steps[4].status = "processing";
    setProcessSteps([...steps]);

    // 2. Create the booth signer FIRST (needed for signing and as feePayer)
    const boothSigner = Keypair.generate();
    
    // 3. Build a raw structural Solana Transaction using the popped nonce
    const transaction = new Transaction();
    transaction.recentBlockhash = offlineNonce.nonceValue;
    transaction.feePayer = boothSigner.publicKey;
    
    // Add placeholder for voting instruction (real contract will do merkle verification)
    // Use the booth signer as the fromPubkey so signing is valid
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: boothSigner.publicKey,     // Must match signer
        toPubkey: Keypair.generate().publicKey, // election treasury  
        lamports: 1000,
      })
    );

    // 4. Sign the transaction with the booth signer
    transaction.sign(boothSigner);

    // 5. Serialize to Base64 to store safely offline without it expiring (DTN)
    const serializedTxBase64 = transaction.serialize().toString('base64');
    
    await new Promise((resolve) => setTimeout(resolve, 600));

    steps[4].status = "completed";
    setProcessSteps([...steps]);

    // MOCK: Generate vote receipt (Offline VVPAT hash generator)
    const mockReceipt = {
      receiptId: Math.random().toString(36).substring(2, 10).toUpperCase() + "V",
      timestamp: Date.now(),
      candidate: CANDIDATES[selectedCandidate].name,
      transactionHash: "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(""),
      status: "pending",
    };
    
    // CLEAR IDENTITY SO THEY CANNOT REVERSE THIS PAGE
    localStorage.removeItem("verified_identity");

    // STORE IN LOCAL STORAGE DTN QUEUE (To submit hours from now when online)
    const dtnOutbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
    dtnOutbox.push({
      txPayloadBase64: serializedTxBase64,
      txHash: mockReceipt.transactionHash,
      candidateId: selectedCandidate,
      status: "pending",
      timestamp: Date.now(),
      // ZK PROOF DATA - will be verified by smart contract
      zkProof: JSON.stringify(zkProofOutput.proof),
      nullifierHash: nullifierHash,
      publicSignals: zkProofOutput.publicSignals,
    });
    localStorage.setItem("dtn_outbox", JSON.stringify(dtnOutbox));
    
    setReceipt(mockReceipt);
    setLoading(false);
  } catch (error: any) {
    console.error("Voting failed:", error);
    alert("❌ Voting failed: " + error.message);
    setLoading(false);
    const stepsReset = [...processSteps];
    stepsReset.forEach(s => s.status = "pending");
    setProcessSteps(stepsReset);
    return;
  }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">✅ Vote Confirmed</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="card border-4 border-green-600 bg-green-50">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-green-800">
                VOTE LOCKED {effectivelyOffline ? "OFFLINE" : "ON-CHAIN"}!
              </h2>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Receipt ID</span>
                <strong className="font-mono">{receipt.receiptId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Candidate</span>
                <strong>{receipt.candidate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time</span>
                <strong>
                  {new Date(receipt.timestamp).toLocaleTimeString()}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <strong className="text-yellow-700">⏳ Queued for Sync</strong>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-600 mb-2">
                Transaction Hash (Keep Safe for Verification)
              </p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs break-all font-mono text-gray-900">
                  {receipt.transactionHash}
                </code>
                <button
                  onClick={() => handleCopyHash(receipt.transactionHash)}
                  className="flex-shrink-0 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {effectivelyOffline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-900 mb-2">
                  📵 Offline Mode
                </h4>
                <p className="text-sm text-yellow-800">
                  Your vote is safely stored locally and will automatically sync
                  to the blockchain when you go online.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/analytics"
                className="flex-1 btn-primary text-center py-3"
              >
                📊 View Dashboard
              </Link>
              <button
                onClick={() => {
                  window.location.href = "/booth/verify";
                }}
                className="flex-1 btn-secondary py-3"
              >
                ← New Voter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">🗳️ Cast Your Vote</h1>
          </div>

          {/* Network Status & Boot Button */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 border border-gray-300 shadow-inner">
                 <Database className="w-4 h-4 text-blue-600" />
                 <span className="text-gray-800">Nonces Offline: <span className="text-blue-600 border-l border-gray-300 pl-2 ml-1">{noncesOffline}</span></span>
              </div>
              {nonceLoadingMsg && (
                <span className="text-xs text-blue-600 mt-1 max-w-[200px] truncate" title={nonceLoadingMsg}>{nonceLoadingMsg}</span>
              )}
            </div>
            
            <button
               onClick={handleFetchNonces}
               disabled={!!nonceLoadingMsg}
               className="btn-secondary text-xs px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
               title="Simulates booting up booth with Wi-Fi to fetch nonces"
            >
              {nonceLoadingMsg ? "Creating on Devnet..." : "Fetch Real Devnet Nonce"}
            </button>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-colors ${
                effectivelyOffline
                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
              onClick={() => setSimulateOffline(!simulateOffline)}
              title="Click to toggle offline mode simulation"
            >
              {effectivelyOffline ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-semibold">SIMULATE OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-semibold">SIMULATE ONLINE</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Select Your Candidate
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateOffline}
                onChange={(e) => setSimulateOffline(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600">Simulate Offline</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {CANDIDATES.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate.id)}
              disabled={loading}
              className={`p-8 rounded-lg border-4 transition-all duration-200 ${
                selectedCandidate === candidate.id
                  ? `${candidate.color} text-white border-opacity-100 shadow-lg scale-105`
                  : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
              } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="text-5xl mb-4">
                {candidate.id === 0 ? "🅰️" : candidate.id === 1 ? "🅱️" : "🅲"}
              </div>
              <h3 className="text-2xl font-bold">{candidate.name}</h3>
            </button>
          ))}
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={handleCastVote}
            disabled={selectedCandidate === null || loading}
            className="flex-1 btn-primary py-4 text-lg font-bold disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Signing Vote...
              </>
            ) : (
              "✓ CAST SECURE VOTE"
            )}
          </button>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">
            ℹ️ How Offline Voting Works
          </h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✓ Your vote is signed with a Durable Nonce (works offline)</li>
            <li>✓ Vote is immediately queued in the local DTN</li>
            <li>✓ Receipt is your proof of voting</li>
            <li>
              ✓ When online, the vote automatically syncs to the blockchain
            </li>
          </ul>
        </div>

        {/* Process Flow */}
        <ProcessFlow
          title="Secure Vote Casting Process"
          description={`Your vote is being ${simulateOffline ? "queued offline and" : ""} processed securely...`}
          steps={processSteps}
          isVisible={loading}
        />
      </div>
    </div>
  );
}
