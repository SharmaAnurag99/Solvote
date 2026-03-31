"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wifi, WifiOff, Copy, Check } from "lucide-react";
import ProcessFlow, { ProcessStep } from "@/components/ProcessFlow";

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
  const [receipt, setReceipt] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    {
      name: "Verifying Vote Eligibility",
      description: "Checking voter qualification against whitelist",
      status: "pending",
    },
    {
      name: "Generating Vote Signature",
      description: "Creating cryptographic signature for vote authentication",
      status: "pending",
    },
    {
      name: "Creating Nullifier",
      description: "Generating unique double-vote prevention token",
      status: "pending",
    },
    {
      name: "Encrypting Vote Data",
      description: "Securing vote with end-to-end encryption",
      status: "pending",
    },
    {
      name: `${simulateOffline ? "Storing in DTN Queue" : "Broadcasting to Blockchain"}`,
      description: simulateOffline
        ? "Queuing vote for offline sync"
        : "Submitting vote to blockchain",
      status: "pending",
    },
  ]);

  useEffect(() => {
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

  const handleCastVote = async () => {
    if (selectedCandidate === null) return;

    setLoading(true);

    // MOCK: Simulate vote processing with step updates
    const steps = [...processSteps];
    
    // Step 1: Verify Eligibility
    steps[0].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    steps[0].status = "completed";
    
    // Step 2: Generate Signature
    steps[1].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    steps[1].status = "completed";
    
    // Step 3: Create Nullifier
    steps[2].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    steps[2].status = "completed";
    
    // Step 4: Encrypt Vote
    steps[3].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    steps[3].status = "completed";
    
    // Step 5: Submit Vote
    steps[4].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // MOCK: Generate vote receipt
    const mockReceipt = {
      receiptId:
        Math.random().toString(36).substring(2, 10).toUpperCase() + "V",
      timestamp: Date.now(),
      candidate: CANDIDATES[selectedCandidate].name,
      transactionHash:
        "0x" +
        Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join(""),
      status: "pending",
    };

    // MOCK: Store in localStorage (simulating DTN outbox)
    const dtnOutbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
    dtnOutbox.push({
      tx: "mock_signed_tx_base64_" + Math.random(),
      txHash: mockReceipt.transactionHash,
      status: "pending",
      timestamp: Date.now(),
    });
    localStorage.setItem("dtn_outbox", JSON.stringify(dtnOutbox));

    steps[4].status = "completed";
    setProcessSteps([...steps]);
    setReceipt(mockReceipt);
    setLoading(false);
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
                  setReceipt(null);
                  setSelectedCandidate(null);
                }}
                className="flex-1 btn-secondary py-3"
              >
                ← Vote Again
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

          {/* Network Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              effectivelyOffline
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {effectivelyOffline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-semibold">OFFLINE</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-semibold">ONLINE</span>
              </>
            )}
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
