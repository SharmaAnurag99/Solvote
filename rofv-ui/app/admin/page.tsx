"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Lock, Check, AlertCircle, X, Eye } from "lucide-react";

interface VoterRegistration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  aadhaar: string;
  address: string;
  constituency: string;
  motherName: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
}

export default function AdminPanel() {
  const [whitelist, setWhitelist] = useState<string[]>([
    "111122223333",
    "444455556666",
  ]);
  const [registrations, setRegistrations] = useState<VoterRegistration[]>([]);
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedReg, setSelectedReg] = useState<VoterRegistration | null>(null);
  const [activeTab, setActiveTab] = useState<"registrations" | "whitelist">("registrations");

  useEffect(() => {
    // MOCK: Load pending registrations from localStorage
    const stored = JSON.parse(localStorage.getItem("voter_registrations") || "[]");
    setRegistrations(stored);
  }, []);

  const handleApproveRegistration = (reg: VoterRegistration) => {
    // Add to whitelist
    setWhitelist([...whitelist, reg.aadhaar]);

    // Update registration status
    const updated = registrations.map((r) =>
      r.id === reg.id ? { ...r, status: "approved" as const } : r
    );
    setRegistrations(updated);
    localStorage.setItem("voter_registrations", JSON.stringify(updated));

    setSuccess(`✓ Approved registration for ${reg.fullName}. Aadhaar added to whitelist.`);
    setSelectedReg(null);

    setTimeout(() => setSuccess(""), 3000);
  };

  const handleRejectRegistration = (id: string) => {
    const updated = registrations.map((r) =>
      r.id === id ? { ...r, status: "rejected" as const } : r
    );
    setRegistrations(updated);
    localStorage.setItem("voter_registrations", JSON.stringify(updated));

    setSuccess(`✓ Registration rejected`);
    setSelectedReg(null);

    setTimeout(() => setSuccess(""), 3000);
  };

  const handleAddVoter = () => {
    setError("");
    setSuccess("");

    if (!aadhaarInput.trim()) {
      setError("Please enter an Aadhaar number");
      return;
    }

    if (!/^\d{6,12}$/.test(aadhaarInput)) {
      setError("Invalid format. Aadhaar must be 6-12 digits.");
      return;
    }

    if (whitelist.includes(aadhaarInput)) {
      setError("This Aadhaar is already in the whitelist.");
      return;
    }

    setWhitelist([...whitelist, aadhaarInput]);
    setSuccess(`✓ Added ${aadhaarInput} to whitelist`);
    setAadhaarInput("");
  };

  const handleRemoveVoter = (aadhaar: string) => {
    setWhitelist(whitelist.filter((a) => a !== aadhaar));
  };

  const handleGenerateMerkleRoot = async () => {
    setError("");
    setLoading(true);

    if (whitelist.length === 0) {
      setError("Cannot generate root. Whitelist is empty.");
      setLoading(false);
      return;
    }

    try {
      // MOCK: Simulate Merkle tree generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // MOCK MERKLE ROOT - In production, use real crypto
      const mockRoot =
        "0x" +
        Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");

      setMerkleRoot(mockRoot);
      setSuccess(`✓ Merkle Root generated and locked on blockchain!`);

      // MOCK: Store in localStorage
      localStorage.setItem("merkleRoot", mockRoot);
      localStorage.setItem("whitelist", JSON.stringify(whitelist));
    } catch (err) {
      setError("Failed to generate Merkle root");
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const approvedCount = registrations.filter((r) => r.status === "approved").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">👨‍⚖️ Admin Portal</h1>
          </div>
          <div className="badge-info">Electoral Officer</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("registrations")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "registrations"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Voter Registration Requests
            {pendingCount > 0 && (
              <span className="ml-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "whitelist"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Manage Whitelist
          </button>
        </div>

        {/* Voter Registration Tab */}
        {activeTab === "registrations" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Registration List */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {registrations.length === 0 ? (
                  <div className="card text-center py-12">
                    <p className="text-gray-500 text-lg">No registration requests yet</p>
                    <p className="text-gray-400 mt-2">Registrations will appear here when voters apply</p>
                  </div>
                ) : (
                  registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className={`card cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${
                        reg.status === "pending"
                          ? "border-yellow-600"
                          : reg.status === "approved"
                          ? "border-green-600"
                          : "border-red-600"
                      }`}
                      onClick={() => setSelectedReg(reg)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{reg.fullName}</h3>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <p>📧 {reg.email}</p>
                            <p>📱 {reg.phone}</p>
                            <p>🏘️ {reg.constituency}</p>
                            <p>📅 {new Date(reg.appliedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              reg.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : reg.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                          </span>
                          <Eye className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Details Panel */}
            <div>
              {selectedReg ? (
                <div className="card sticky top-20">
                  <button
                    onClick={() => setSelectedReg(null)}
                    className="float-right text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Application Details</h3>

                  <div className="space-y-3 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Full Name</p>
                      <p className="text-gray-900 font-medium">{selectedReg.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                      <p className="text-gray-900 font-medium">{selectedReg.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
                      <p className="text-gray-900 font-medium">{selectedReg.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Mother's Name</p>
                      <p className="text-gray-900 font-medium">{selectedReg.motherName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Address</p>
                      <p className="text-gray-900 font-medium">{selectedReg.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Constituency</p>
                      <p className="text-gray-900 font-medium">{selectedReg.constituency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Aadhaar (Last 4)</p>
                      <p className="text-gray-900 font-mono font-bold">****{selectedReg.aadhaar.slice(-4)}</p>
                    </div>
                  </div>

                  {selectedReg.status === "pending" && (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleApproveRegistration(selectedReg)}
                        className="w-full btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectRegistration(selectedReg.id)}
                        className="w-full btn-secondary text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" /> Reject
                      </button>
                    </div>
                  )}

                  {selectedReg.status === "approved" && (
                    <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                      <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-800 font-semibold">Approved</p>
                      <p className="text-xs text-green-700 mt-2">Aadhaar added to whitelist</p>
                    </div>
                  )}

                  {selectedReg.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                      <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-sm text-red-800 font-semibold">Rejected</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <p className="text-gray-500">Select a registration to view details</p>
                </div>
              )}

              {/* Stats */}
              <div className="mt-6 card">
                <h4 className="font-bold text-gray-900 mb-4">📊 Registration Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Requests</span>
                    <span className="font-bold text-lg">{registrations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-bold text-yellow-600">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-bold text-green-600">{approvedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Whitelist Tab */}
        {activeTab === "whitelist" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add Voter Card */}
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Step 1: Add Voters to Whitelist
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhaar Number (6-12 digits)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., 123456789012"
                        value={aadhaarInput}
                        onChange={(e) => setAadhaarInput(e.target.value)}
                        maxLength={12}
                        disabled={merkleRoot !== null}
                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={handleAddVoter}
                        disabled={merkleRoot !== null}
                        className="btn-primary whitespace-nowrap disabled:opacity-50"
                      >
                        <Plus className="w-5 h-5 inline mr-1" />
                        Add
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Whitelist Display */}
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Step 2: Current Whitelist ({whitelist.length} voters)
                </h2>

                {whitelist.length === 0 ? (
                  <p className="text-gray-500 italic">No voters added yet</p>
                ) : (
                  <div className="space-y-2">
                    {whitelist.map((aadhaar, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="font-mono font-semibold text-gray-900">
                          {aadhaar}
                        </span>
                        <button
                          onClick={() => handleRemoveVoter(aadhaar)}
                          disabled={merkleRoot !== null}
                          className="text-red-600 hover:bg-red-50 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate Root Card */}
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Step 3: Lock Election with Merkle Root
                </h2>

                {!merkleRoot ? (
                  <button
                    onClick={handleGenerateMerkleRoot}
                    disabled={whitelist.length === 0 || loading || merkleRoot !== null}
                    className="w-full btn-primary py-3 text-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Generating Merkle Root...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 inline mr-2" />
                        Generate & Lock Election
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Lock className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">
                      ✅ Election Locked!
                    </h3>
                    <p className="text-green-700 mb-4">
                      Merkle Root has been generated and published on blockchain
                    </p>
                    <div className="bg-white border border-green-200 rounded p-3 mb-4">
                      <p className="text-xs text-gray-600 mb-2">Merkle Root (Hash):</p>
                      <code className="text-xs text-gray-900 break-all font-mono">
                        {merkleRoot}
                      </code>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(merkleRoot)}
                      className="btn-secondary w-full"
                    >
                      📋 Copy to Clipboard
                    </button>
                  </div>
                )}

                {whitelist.length === 0 && !merkleRoot && (
                  <p className="text-yellow-700 bg-yellow-50 p-3 rounded-lg mt-4 text-sm">
                    ⚠️ Add at least one voter before generating root
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Card */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">📊 Election Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm">Total Voters</p>
                    <p className="text-3xl font-bold text-blue-600">{whitelist.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <div className="flex gap-2 items-center mt-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          merkleRoot ? "bg-green-600" : "bg-yellow-600"
                        }`}
                      ></div>
                      <span className="font-semibold">
                        {merkleRoot ? "🔒 Locked" : "⚙️ Setup"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Box */}
              <div className="card bg-blue-50 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3">🔐 Security Notes</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>✓ Whitelist locked after root generation</li>
                  <li>✓ Root published on Solana blockchain</li>
                  <li>✓ Voters verified against this root</li>
                  <li>✓ Cannot add voters after locking</li>
                </ul>
              </div>

              {/* Next Steps */}
              {merkleRoot && (
                <div className="card bg-green-50 border border-green-200">
                  <h3 className="font-bold text-green-900 mb-3">✅ Next Steps</h3>
                  <p className="text-sm text-green-800 mb-4">
                    Election is now ready. Voters can proceed to the polling booth.
                  </p>
                  <Link href="/booth/verify" className="btn-primary w-full text-center">
                    Go to Polling Booth →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
