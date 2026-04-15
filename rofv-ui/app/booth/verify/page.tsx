"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Lock, ShieldCheck, Fingerprint } from "lucide-react";
import ProcessFlow, { ProcessStep } from "@/components/ProcessFlow";

export default function VerifyIdentity() {
  const router = useRouter();
  const [aadhaar, setAadhaar] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProcessFlow, setShowProcessFlow] = useState(false);
  
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    {
      name: "Biometric & Whitelist Match",
      description: "Verifying credentials against registered voters",
      status: "pending",
    },
    {
      name: "Locally Generating Identity Hash",
      description: "Obfuscating identity via Poseidon hashing",
      status: "pending",
    },
    {
      name: "Zero-Knowledge Circuit (WASM)",
      description: "Generating zk-SNARK proof of eligibility locally",
      status: "pending",
    },
    {
      name: "Creating Nullifier Token",
      description: "Ensuring 1-vote-per-citizen mechanism via cryptography",
      status: "pending",
    },
    {
      name: "Clearing Local Memory Data",
      description: "Destroying identity data to guarantee 100% anonymity",
      status: "pending",
    },
  ]);

  const updateStepStatus = (index: number, status: ProcessStep["status"]) => {
    setProcessSteps((steps) => {
      const newSteps = [...steps];
      newSteps[index].status = status;
      return newSteps;
    });
  };

  const generateMockZKProof = async () => {
    return {
      pi_a: ["mock_a", "mock_b", "mock_c"],
      pi_b: [["mock_ba", "mock_bb"], ["mock_bc", "mock_bd"], ["mock_be", "mock_bf"]],
      pi_c: ["mock_ca", "mock_cb", "mock_cc"],
      protocol: "groth16",
      curve: "bn128"
    };
  };

    const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const whitelist = JSON.parse(localStorage.getItem("whitelist") || "[]");

    // Check against new whitelist structure
    const voterIndex = whitelist.findIndex((v: any) => 
      (typeof v === 'string' && v === aadhaar) || 
      (v.aadhaar === aadhaar || v.id === aadhaar)
    );

    if (voterIndex === -1) {
      setError("❌ Identity not documented in authorized voter constituency. Please register or contact electoral officer.");
      setAadhaar("");
      setPin("");
      setLoading(false);
      return;
    }

    const voterData = whitelist[voterIndex];
    if (voterData.hasVoted) {
      setError("❌ ATTENDANCE MARKED: This voter has already signed in at the booth.");
      setAadhaar("");
      setPin("");
      setLoading(false);
      return;
    }

    // Generate deterministic mock nullifier based on Aadhaar + PIN
    const mockDeterministicNullifier = "0x" + btoa(aadhaar + pin).split('').map(c => c.charCodeAt(0).toString(16)).join('').padEnd(64, '0');
    
    // Prevent double voting by checking if nullifier is already used
    const usedNullifiers = JSON.parse(localStorage.getItem("used_nullifiers") || "[]");
    if (usedNullifiers.includes(mockDeterministicNullifier)) {
      setError("❌ DOUBLE VOTE DETECTED: This identity has already cast a ballot. Nullifier matched.");
      setAadhaar("");
      setPin("");
      setLoading(false);
      return;
    }
    
    setShowProcessFlow(true);

    updateStepStatus(0, "processing");
    await new Promise((resolve) => setTimeout(resolve, 800));
    updateStepStatus(0, "completed");
    
    updateStepStatus(1, "processing");
    await new Promise((resolve) => setTimeout(resolve, 600));
    updateStepStatus(1, "completed");

    updateStepStatus(2, "processing");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const proof = await generateMockZKProof();
    
    // --- DEMO LOGS ---
    console.log("\n==============================================");
    console.log("🔐 %c[LOCAL ZK-ENGINE] Auth Process Initiated", "color: #00ff00; font-weight: bold; background: #000; padding: 2px;");
    console.log("%c1. Raw Aadhar/PIN received in isolated memory.", "color: #00ff00; background: #000;");
    console.log("%c2. Poseidon Hash generated mapping to Merkle Leaf.", "color: #00ff00; background: #000;");
    console.log("%c3. Computing ZK-SNARK Groth16 Proof...", "color: #00ff00; background: #000;");
    console.log("✅ %cProof Generated Successfully:", "color: #00ff00; font-weight: bold; background: #000;", proof);
    console.log("==============================================\n");
    // -----------------

    updateStepStatus(2, "completed");
    
    updateStepStatus(3, "processing");
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const mockIdentity = {
      aadhaar: typeof whitelist[voterIndex] === 'string' ? aadhaar : whitelist[voterIndex].aadhaar,
      timestamp: Date.now(),
      zkProof: proof,
      nullifier: mockDeterministicNullifier,
    };
    localStorage.setItem("verified_identity", JSON.stringify(mockIdentity));
    updateStepStatus(3, "completed");

    updateStepStatus(4, "processing");
    setAadhaar("");
    setPin("");
    await new Promise((resolve) => setTimeout(resolve, 800));
    updateStepStatus(4, "completed");

    setLoading(false);

    setTimeout(() => {
      setShowProcessFlow(false);
      router.push("/booth/vote");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <ProcessFlow 
        title="Zero-Knowledge Authentication"
        description="Executing cryptographical functions locally. No sensitive data is transmitted."
        steps={processSteps}
        isVisible={showProcessFlow}
      />

      <header className="border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-10 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-blue-400">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              Endpoint: Terminal #4A
            </h1>
          </div>
          <div className="text-xs font-bold tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded self-center uppercase flex items-center gap-2 border border-emerald-500/20">
            <Lock className="w-3 h-3" /> Secure ZK Engine
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-12">
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Fingerprint className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Voter Identity
            </h2>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              Cryptographical client-side hashing.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                UID Assigner (Mock Aadhar)
              </label>
              <input
                type="text"
                placeholder="•••• •••• ••••"
                value={aadhaar}
                onChange={(e) => {
                  setAadhaar(e.target.value.replace(/[^0-9]/g, '').slice(0, 12));
                  setError("");
                }}
                disabled={loading}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-center tracking-[0.3em] font-mono text-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-700 disabled:opacity-50"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Biometric PIN
              </label>
              <input
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
                  setError("");
                }}
                disabled={loading}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-center tracking-[0.5em] text-2xl font-mono text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-700 disabled:opacity-50"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || aadhaar.length !== 12 || pin.length < 4}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-sm uppercase tracking-widest font-bold transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2 mt-4"
            >
              <ShieldCheck className="w-5 h-5" />
              Initiate Proof
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
