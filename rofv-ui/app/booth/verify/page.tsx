"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Check, Lock } from "lucide-react";
import ProcessFlow, { ProcessStep } from "@/components/ProcessFlow";

export default function VerifyIdentity() {
  const router = useRouter();
  const [aadhaar, setAadhaar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    {
      name: "Checking Whitelist",
      description: "Verifying Aadhaar against registered voters list",
      status: "pending",
    },
    {
      name: "Generating ZK Proof",
      description: "Creating zero-knowledge proof for identity",
      status: "pending",
    },
    {
      name: "Creating Nullifier Token",
      description: "Generating unique token to prevent double voting",
      status: "pending",
    },
    {
      name: "Clearing Personal Data",
      description: "Removing Aadhaar from memory for voter anonymity",
      status: "pending",
    },
    {
      name: "Redirecting to Voting",
      description: "Preparing voting booth access",
      status: "pending",
    },
  ]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifying(true);
    setLoading(true);

    // MOCK: Simulate verification process with step updates
    const steps = [...processSteps];
    
    // Step 1: Check Whitelist
    steps[0].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // MOCK: Check against whitelist
    const mockWhitelist = [
      "111122223333",
      "444455556666",
      "777788889999",
      "123456789012",
    ];

    if (!mockWhitelist.includes(aadhaar)) {
      setError("❌ Your Aadhaar is not in the approved voter list.");
      setAadhaar("");
      setLoading(false);
      setVerifying(false);
      return;
    }
    
    steps[0].status = "completed";
    
    // Step 2: Generate ZK Proof
    steps[1].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    steps[1].status = "completed";
    
    // Step 3: Create Nullifier
    steps[2].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    steps[2].status = "completed";

    // MOCK: Generate identity packet
    const mockIdentity = {
      timestamp: Date.now(),
      proof: {
        index: Math.floor(Math.random() * 100),
        verified: true,
      },
      nullifier:
        "0x" +
        Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join(""),
    };

    // Store in localStorage temporarily
    localStorage.setItem("verified_identity", JSON.stringify(mockIdentity));

    // Step 4: Clear Data
    steps[3].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    // Clear Aadhaar from memory
    setAadhaar("");
    
    steps[3].status = "completed";
    
    // Step 5: Redirect
    steps[4].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    steps[4].status = "completed";
    setProcessSteps([...steps]);
    setLoading(false);

    // Redirect to voting screen
    setTimeout(() => {
      router.push("/booth/vote");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center gap-3">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            🗳️ Polling Booth - Identity Verification
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {!verifying ? (
          <div className="card">
            <div className="mb-8 text-center">
              <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">
                Verify Your Identity
              </h2>
              <p className="text-gray-600 mt-2">
                Enter your Aadhaar number to verify eligibility
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Aadhaar Number
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={aadhaar}
                  onChange={(e) => {
                    setAadhaar(e.target.value);
                    setError("");
                  }}
                  maxLength={12}
                  disabled={loading}
                  className="input-field text-lg text-center tracking-widest disabled:bg-gray-100"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Your identity will be verified and anonymized
                </p>
              </div>

              {error && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !aadhaar}
                className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 inline mr-2" />
                    Verify Identity
                  </>
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">
                🔒 How This Works
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Your Aadhaar is checked against the election whitelist</li>
                <li>
                  ✓ A zero-knowledge proof is generated (hides your identity)
                </li>
                <li>
                  ✓ Your identity is immediately cleared from the system
                </li>
                <li>✓ You proceed to vote anonymously</li>
              </ul>
            </div>

            {/* Test Data */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">
                🧪 Test Aadhaar Numbers
              </h3>
              <p className="text-sm text-yellow-800 font-mono">
                111122223333, 444455556666, 777788889999, 123456789012
              </p>
            </div>
          </div>
        ) : (
          <div className="card text-center">
            <div className="mb-6">
              <div className="inline-block animate-spin">
                <Lock className="w-16 h-16 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Identity...
            </h2>
            <p className="text-gray-600">
              Your identity is being verified securely. Redirecting to voting...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
