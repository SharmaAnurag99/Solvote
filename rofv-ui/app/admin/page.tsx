"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TallyUI } from "./TallyUI";
import { ArrowLeft, Plus, Trash2, Lock, Check, AlertCircle, X, Eye, Calendar, MapPin, Settings, LayoutDashboard, FileText, CheckCircle2, Users, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

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

interface WhitelistEntry {
  id: string;
  aadhaar: string;
  fullName: string;
  hasVoted: boolean;
  votedAt: string | null;
  votedCandidate: number | null;
  registeredAt: string;
}

export default function AdminPanel() {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([
    {
      id: "voter_001",
      aadhaar: "111122223333",
      fullName: "Voter XXX3333",
      hasVoted: false,
      votedAt: null,
      votedCandidate: null,
      registeredAt: new Date().toISOString()
    },
    {
      id: "voter_002",
      aadhaar: "444455556666",
      fullName: "Voter XXX6666",
      hasVoted: false,
      votedAt: null,
      votedCandidate: null,
      registeredAt: new Date().toISOString()
    }
  ]);
  const [registrations, setRegistrations] = useState<VoterRegistration[]>([]);
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedReg, setSelectedReg] = useState<VoterRegistration | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "registrations" | "whitelist" | "tally">("overview");
  const [isFinalized, setIsFinalized] = useState(false);
  const [elections, setElections] = useState<{id: string, name: string}[]>([]);
  const [activeElectionId, setActiveElectionId] = useState<string>("e_default");
  const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
  const [newElectionName, setNewElectionName] = useState("");
  const CANDIDATES = ["Candidate A", "Candidate B", "Candidate C"];

  const saveCurrentElectionData = (electionId: string) => {
    const backup = {
      whitelist: localStorage.getItem("whitelist") || "[]",
      voter_registrations: localStorage.getItem("voter_registrations") || "[]",
      pending_attendance: localStorage.getItem("pending_attendance") || "[]",
      dtn_outbox: localStorage.getItem("dtn_outbox") || "[]",
      submitted_votes: localStorage.getItem("submitted_votes") || "[]",
      used_nullifiers: localStorage.getItem("used_nullifiers") || "[]",
      merkleRoot: localStorage.getItem("merkleRoot") || "",
      is_finalized: localStorage.getItem("is_finalized") || "false"
    };
    localStorage.setItem(`electionData_${electionId}`, JSON.stringify(backup));
  };

  const loadElectionData = (electionId: string) => {
    const dataString = localStorage.getItem(`electionData_${electionId}`);
    if (dataString) {
      const backup = JSON.parse(dataString);
      localStorage.setItem("whitelist", backup.whitelist);
      localStorage.setItem("voter_registrations", backup.voter_registrations);
      localStorage.setItem("pending_attendance", backup.pending_attendance);
      localStorage.setItem("dtn_outbox", backup.dtn_outbox);
      localStorage.setItem("submitted_votes", backup.submitted_votes);
      localStorage.setItem("used_nullifiers", backup.used_nullifiers);
      setIsFinalized(backup.is_finalized === "true");
      if (backup.merkleRoot) {
        localStorage.setItem("merkleRoot", backup.merkleRoot);
      } else {
        localStorage.removeItem("merkleRoot");
      }
    } else {
      localStorage.setItem("whitelist", "[]");
      localStorage.setItem("voter_registrations", "[]");
      localStorage.setItem("pending_attendance", "[]");
      localStorage.setItem("dtn_outbox", "[]");
      localStorage.setItem("submitted_votes", "[]");
      localStorage.setItem("used_nullifiers", "[]");
      localStorage.removeItem("merkleRoot");
      setIsFinalized(false);
      localStorage.setItem("is_finalized", "false");
    }
  };

  useEffect(() => {
    // 1. Initialize Elections Mock Data
    const storedElections = JSON.parse(localStorage.getItem("elections") || '[{"id":"e_default","name":"General Assembly Election 2026"}]');
    setElections(storedElections);

    const currentId = localStorage.getItem("active_election_id") || "e_default";
    setActiveElectionId(currentId);
    
    // We already have some demo data loaded on first boot if we never saved before, 
    // so let's passively save it to e_default if there is no backup
    if (!localStorage.getItem("electionData_e_default") && currentId === "e_default") {
        saveCurrentElectionData("e_default");
    }
  
    // Load initial whitelist and registrations
    const stored = JSON.parse(localStorage.getItem("voter_registrations") || "[]");
    setRegistrations(stored);
    
    // Load whitelist with new structure
    loadWhitelist();
    
    // Set up real-time listener for whitelist changes from ballot
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "whitelist") {
        console.log("🔄 Admin: Detected whitelist change from voter booth");
        loadWhitelist();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  const loadWhitelist = () => {
    const stored = JSON.parse(localStorage.getItem("whitelist") || "[]");
    
    // Handle migration from old format (string[]) to new format (WhitelistEntry[])
    const migrated: WhitelistEntry[] = stored.map((item: any, idx: number) => {
      if (typeof item === "string") {
        return {
          id: `voter_${idx + 1}`,
          aadhaar: item,
          fullName: `Voter ${item.slice(-4)}`,
          hasVoted: false,
          votedAt: null,
          votedCandidate: null,
          registeredAt: new Date().toISOString()
        };
      }
      return item;
    });
    
    setWhitelist(migrated);
  };

  const handleSwitchElection = (id: string) => {
    saveCurrentElectionData(activeElectionId); // save current
    setActiveElectionId(id);
    localStorage.setItem("active_election_id", id);
    
    loadElectionData(id); // restore or wipe target
    
    // update local state
    setRegistrations(JSON.parse(localStorage.getItem("voter_registrations") || "[]"));
    setMerkleRoot(localStorage.getItem("merkleRoot"));
    loadWhitelist();
    setSuccess("Switched election context!");
  };

  const handleCreateElection = () => {
    if(!newElectionName.trim()) return;
    const newId = `e_${Date.now()}`;
    const newEl = { id: newId, name: newElectionName };
    const updated = [...elections, newEl];
    setElections(updated);
    localStorage.setItem("elections", JSON.stringify(updated));
    
    saveCurrentElectionData(activeElectionId);
    
    setActiveElectionId(newId);
    localStorage.setItem("active_election_id", newId);
    loadElectionData(newId); 
    setRegistrations([]);
    setWhitelist([]);
    setMerkleRoot(null);
    
    setSuccess(`New Election "${newElectionName}" created and active.`);
    setIsElectionModalOpen(false);
    setNewElectionName("");
  };

  const getTurnoutStats = () => {
    const total = whitelist.length;
    const voted = whitelist.filter(v => v.hasVoted).length;
    const percentage = total > 0 ? ((voted / total) * 100).toFixed(1) : "0.0";
    return { total, voted, percentage };
  };

  const stats = getTurnoutStats();

  const handleApproveRegistration = (reg: VoterRegistration) => {
    // Add to whitelist as new WhitelistEntry
    const newWhitelistEntry: WhitelistEntry = {
      id: `voter_${reg.id}`,
      aadhaar: reg.aadhaar,
      fullName: reg.fullName,
      hasVoted: false,
      votedAt: null,
      votedCandidate: null,
      registeredAt: new Date().toISOString()
    };
    
    const updatedWhitelist = [...whitelist, newWhitelistEntry];
    setWhitelist(updatedWhitelist);
    localStorage.setItem("whitelist", JSON.stringify(updatedWhitelist));

    // Update registration status
    const updated = registrations.map((r) =>
      r.id === reg.id ? { ...r, status: "approved" as const } : r
    );
    setRegistrations(updated);
    localStorage.setItem("voter_registrations", JSON.stringify(updated));

    setSuccess(`✓ Approved registration for ${reg.fullName}. Added to whitelist.`);
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

    if (whitelist.some(v => v.aadhaar === aadhaarInput)) {
      setError("This Aadhaar is already in the whitelist.");
      return;
    }

    const newEntry: WhitelistEntry = {
      id: `voter_${Math.random().toString(36).substr(2, 9)}`,
      aadhaar: aadhaarInput,
      fullName: `Voter ${aadhaarInput.slice(-4)}`,
      hasVoted: false,
      votedAt: null,
      votedCandidate: null,
      registeredAt: new Date().toISOString()
    };

    const updated = [...whitelist, newEntry];
    setWhitelist(updated);
    localStorage.setItem("whitelist", JSON.stringify(updated));
    setSuccess(`✓ Added ${aadhaarInput} to whitelist`);
    setAadhaarInput("");
  };

  const handleRemoveVoter = (aadhaar: string) => {
    const updated = whitelist.filter((v) => v.aadhaar !== aadhaar);
    setWhitelist(updated);
    localStorage.setItem("whitelist", JSON.stringify(updated));
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
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab("registrations")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "registrations"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileText className="w-5 h-5" />
            Voter Registration Requests
            {pendingCount > 0 && (
              <span className="ml-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "whitelist"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-5 h-5" />
            Manage Whitelist
          </button>
        </div>

        {/* Dashboard Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Current Election Dashboard</h2>
                <p className="text-sm text-gray-500">Monitor active voting phase and configure system parameters.</p>
              </div>
              <select 
                value={activeElectionId}
                onChange={(e) => handleSwitchElection(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>{el.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsElectionModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
               >
                <Plus className="w-4 h-4" /> Create Custom Election
              </button>
            </div>

            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 font-medium text-sm">Election Status</h3>
                  <Activity className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">Active</p>
                <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 w-max px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  Live Polling
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 font-medium text-sm">Registered Voters</h3>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</p>
                <p className="text-xs text-gray-500">+ {approvedCount} new approvals today</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 font-medium text-sm">Turnout Progress</h3>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stats.percentage}%</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.percentage}%` }}></div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 font-medium text-sm">Security Layer</h3>
                  <Lock className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                  {merkleRoot ? "Merkle Root Locked" : "Setup Incomplete"}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {merkleRoot ? merkleRoot : "Awaiting election freeze"}
                </p>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Election Configuration / Setup Profile */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-400" /> Election Config
                  </h2>
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Title</p>
                    <p className="text-gray-800 font-medium">{elections.find(e => e.id === activeElectionId)?.name || 'Unknown Election'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Jurisdiction / Constituency</p>
                    <p className="text-gray-800 font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" /> New Delhi (ND-01)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Timeline</p>
                    <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-green-500" /> Start</span>
                        <span className="font-semibold text-gray-600">Apr 15, 2026 - 08:00 AM</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-red-500" /> End</span>
                        <span className="font-semibold text-gray-600">Apr 20, 2026 - 06:00 PM</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Deployed Contract</p>
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-mono p-2 rounded break-all">
                      G6LXK55Rh6kwy5nfDHMwBZhAgvP7jmpVg9Mt1a2VRSWh
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Attendance / Turnout Tracker */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" /> Pre-Election Attendance Heatmap
                  </h2>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { time: '08:00', votes: 0 },
                        { time: '10:00', votes: Math.floor(stats.voted * 0.2) },
                        { time: '12:00', votes: Math.floor(stats.voted * 0.45) },
                        { time: '14:00', votes: Math.floor(stats.voted * 0.7) },
                        { time: '16:00', votes: Math.floor(stats.voted * 0.85) },
                        { time: 'Now', votes: stats.voted },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="votes" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVotes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-center gap-6 border-t border-gray-100 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{stats.voted}</p>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Marked Present</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{stats.total - stats.voted}</p>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Remaining Expected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-gray-600 text-sm">Voter Turnout (Live)</span>
                    <span className="font-bold text-blue-600">{stats.voted} / {stats.total} ({stats.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${stats.percentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tally Tab */}
        {activeTab === "tally" && <TallyUI />}

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
                  <div className="space-y-3">
                    {whitelist.map((voter) => (
                      <div
                        key={voter.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                          voter.hasVoted
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono font-bold text-gray-900">
                              {voter.aadhaar}
                            </span>
                            {voter.hasVoted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                <Check className="w-3 h-3" /> VOTED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                                ⏳ PENDING
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <strong>Name:</strong> {voter.fullName}
                            </p>
                            {voter.hasVoted && voter.votedAt && (
                              <>
                                <p>
                                  <strong>Voted:</strong> {new Date(voter.votedAt).toLocaleString()}
                                </p>
                                {voter.votedCandidate !== null && (
                                  <p>
                                    <strong>Candidate:</strong> {CANDIDATES[voter.votedCandidate] || "Unknown"}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveVoter(voter.aadhaar)}
                          disabled={merkleRoot !== null}
                          className="text-red-600 hover:bg-red-50 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove voter from whitelist"
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
              {/* Turnout Metrics Card */}
              <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
                <h3 className="text-lg font-bold text-blue-900 mb-6">📊 Voter Turnout</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-blue-700 text-sm font-semibold">Total Eligible Voters</p>
                      <p className="text-2xl font-bold text-blue-600">{whitelist.length}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-4">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-green-700 text-sm font-semibold">✅ Votes Cast</p>
                      <p className="text-2xl font-bold text-green-600">
                        {whitelist.filter(v => v.hasVoted).length}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-blue-200 pt-4">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-yellow-700 text-sm font-semibold">⏳ Pending Votes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {whitelist.filter(v => !v.hasVoted).length}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-blue-200 pt-4">
                    <p className="text-blue-700 text-sm font-semibold mb-2">Turnout Rate</p>
                    <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                        style={{
                          width: `${
                            whitelist.length > 0
                              ? ((whitelist.filter(v => v.hasVoted).length / whitelist.length) * 100).toFixed(1)
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <p className="text-center text-lg font-bold text-blue-900 mt-2">
                      {whitelist.length > 0
                        ? ((whitelist.filter(v => v.hasVoted).length / whitelist.length) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">🔐 Election Status</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Merkle Root Status</p>
                    <div className="flex gap-2 items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          merkleRoot ? "bg-green-600" : "bg-yellow-600"
                        }`}
                      ></div>
                      <span className="font-semibold">
                        {merkleRoot ? "🔒 Locked & Published" : "⚙️ Setup Required"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Box */}
              <div className="card bg-blue-50 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3">🔐 Real-Time Tracking</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>✓ Whitelist updates in real-time</li>
                  <li>✓ Admin sees votes as cast</li>
                  <li>✓ Turnout metrics live</li>
                  <li>✓ Voter names & timestamps tracked</li>
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
      {/* Create Election Modal */}
      {isElectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Create New Election</h3>
              <button onClick={() => setIsElectionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Election Name</label>
                <input
                  type="text"
                  value={newElectionName}
                  onChange={(e) => setNewElectionName(e.target.value)}
                  placeholder="e.g., University Council 2027"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                />
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                <p>Creating a new election will provide a completely fresh slate. Existing data is isolated and safely preserved automatically under the old election context.</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsElectionModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateElection}
                disabled={!newElectionName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Create Election
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
