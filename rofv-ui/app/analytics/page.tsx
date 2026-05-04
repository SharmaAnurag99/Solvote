"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Network, AlertCircle, CheckCircle, Clock, Home, RefreshCw, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalVotes: number;
  pendingVotes: number;
  confirmedVotes: number;
  submittedVotes: number;
  votesByCandidate: Record<string, number>;
}

const CANDIDATES = [
  { id: 0, name: "Candidate A", color: "bg-blue-600", textColor: "text-blue-600" },
  { id: 1, name: "Candidate B", color: "bg-green-600", textColor: "text-green-600" },
  { id: 2, name: "Candidate C", color: "bg-purple-600", textColor: "text-purple-600" },
];

export default function VoteCountingDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVotes: 0,
    pendingVotes: 0,
    confirmedVotes: 0,
    submittedVotes: 0,
    votesByCandidate: { 0: 0, 1: 0, 2: 0 },
  });
  const [pendingVotes, setPendingVotes] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Load data from localStorage
  const loadVoteData = () => {
    // Get DTN outbox (pending votes to be submitted)
    const dtnOutbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
    setPendingVotes(dtnOutbox);

    // Get submitted votes (from localStorage cache - in production from blockchain)
    const submittedVotesJson = localStorage.getItem("submitted_votes") || "[]";
    const submittedVotes = JSON.parse(submittedVotesJson);

    // Calculate statistics
    const newStats: DashboardStats = {
      totalVotes: dtnOutbox.length + submittedVotes.length,
      pendingVotes: dtnOutbox.length,
      confirmedVotes: submittedVotes.filter((v: any) => v.status === "confirmed").length,
      submittedVotes: submittedVotes.filter((v: any) => v.status === "submitted").length,
      votesByCandidate: { 0: 0, 1: 0, 2: 0 },
    };

    // Count votes by candidate
    [...dtnOutbox, ...submittedVotes].forEach((vote: any) => {
      const candidateId = vote.candidateId;
      newStats.votesByCandidate[candidateId] = (newStats.votesByCandidate[candidateId] || 0) + 1;
    });

    setStats(newStats);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    loadVoteData();

    // Poll for updates every 5 seconds
    const interval = setInterval(loadVoteData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncDTN = async () => {
    setIsSyncing(true);
    setSyncStatus("Starting Dual-Channel Sync...");

    try {
      // 1. SYNC ATTENDANCE (API 1)
      setSyncStatus("API 1: Syncing Attendance to Central DB...");
      const pendingAttendance = JSON.parse(localStorage.getItem("pending_attendance") || "[]");
      
      if (pendingAttendance.length > 0) {
        const attendanceResponse = await fetch('/api/sync-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attendanceRecords: pendingAttendance,
            boothId: 'BOOTH_SEC_45',
            constituency: 'New Delhi'
          })
        });

        if (attendanceResponse.ok) {
          localStorage.setItem("pending_attendance", "[]");
          console.log("✅ Attendance Synced successfully");
        }
      }
      
      await new Promise(r => setTimeout(r, 1000));

      // 2. SYNC VOTES (API 2 - Solana Mock)
      setSyncStatus("API 2: Pushing Encrypted Votes to Solana...");
      const dtnOutbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
      const submittedVotes = JSON.parse(localStorage.getItem("submitted_votes") || "[]");

      if (dtnOutbox.length > 0) {
        // Move all from outbox to submitted (Mocking chain submission)
        const updatedSubmitted = [...submittedVotes, ...dtnOutbox.map(v => ({ ...v, status: 'submitted' }))];
        localStorage.setItem("submitted_votes", JSON.stringify(updatedSubmitted));
        localStorage.setItem("dtn_outbox", "[]");
      }

      setSyncStatus("✅ Sync Complete! Central DB & Chain Updated.");
      setTimeout(() => setSyncStatus(null), 3000);
      loadVoteData();
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncStatus("❌ Sync Failed. Check Connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateSubmit = () => {
    if (pendingVotes.length === 0) {
      alert("No pending votes to submit!");
      return;
    }

    // Simulate moving first pending vote to submitted
    const updated = [...pendingVotes];
    const voteToMove = updated.shift();
    voteToMove.status = "submitted";

    const submittedVotes = JSON.parse(localStorage.getItem("submitted_votes") || "[]");
    submittedVotes.push(voteToMove);

    localStorage.setItem("dtn_outbox", JSON.stringify(updated));
    localStorage.setItem("submitted_votes", JSON.stringify(submittedVotes));

    setPendingVotes(updated);
    loadVoteData();
  };

  const handleSimulateConfirm = () => {
    const submittedVotes = JSON.parse(localStorage.getItem("submitted_votes") || "[]");
    const unconfirmed = submittedVotes.find((v: any) => v.status !== "confirmed");

    if (!unconfirmed) {
      alert("No submitted votes to confirm!");
      return;
    }

    unconfirmed.status = "confirmed";
    localStorage.setItem("submitted_votes", JSON.stringify(submittedVotes));
    loadVoteData();
  };

  const getCompletionPercentage = () => {
    if (stats.totalVotes === 0) return 0;
    return Math.round(((stats.confirmedVotes + stats.submittedVotes) / stats.totalVotes) * 100);
  };

  // Data for Recharts
  const barChartData = CANDIDATES.map(c => ({
    name: c.name,
    votes: stats.votesByCandidate[c.id] || 0,
    fill: c.id === 0 ? "#2563eb" : c.id === 1 ? "#16a34a" : "#9333ea"
  }));

  const pieChartData = [
    { name: "Pending (Offline)", value: stats.pendingVotes, color: "#eab308" },
    { name: "Submitted", value: stats.submittedVotes, color: "#f97316" },
    { name: "Confirmed", value: stats.confirmedVotes, color: "#22c55e" },
  ].filter(d => d.value > 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-orange-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              Vote Analytics Dashboard
            </h1>
          </div>
          <Link href="/" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Home className="w-6 h-6" />
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Votes */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold">Total Votes</span>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-1">{stats.totalVotes}</div>
            <p className="text-xs text-gray-500">Across all candidates</p>
          </div>

          {/* Pending Votes */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold">Pending (Offline)</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold text-yellow-600 mb-1">{stats.pendingVotes}</div>
            <p className="text-xs text-gray-500">Waiting to sync to blockchain</p>
          </div>

          {/* Submitted Votes */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold">Submitted</span>
              <Network className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-4xl font-bold text-orange-600 mb-1">{stats.submittedVotes}</div>
            <p className="text-xs text-gray-500">On-chain, awaiting finality</p>
          </div>

          {/* Confirmed Votes */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold">Confirmed</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-4xl font-bold text-green-600 mb-1">{stats.confirmedVotes}</div>
            <p className="text-xs text-gray-500">Finalized on blockchain</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Vote Processing Progress</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSyncDTN}
                disabled={isSyncing || stats.pendingVotes === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 transition-all font-bold"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing Dual-Channel..." : "🚀 Sync DTN Outbox"}
              </button>
              <button
                onClick={loadVoteData}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
          
          {syncStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm font-semibold flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              {syncStatus}
            </div>
          )}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 bg-gradient-to-r from-green-400 to-green-600`}
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {getCompletionPercentage()}% of votes synced ({stats.confirmedVotes + stats.submittedVotes}/
            {stats.totalVotes})
          </p>
          <p className="text-xs text-gray-500 mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>

        {/* Vote Distribution by Candidate */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Advanced Analytics Table & Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <BarChart3 className="w-5 h-5 text-gray-800" />
              <h3 className="text-lg font-semibold text-gray-800">Advanced Vote Distribution</h3>
            </div>
            
            <div className="h-64 mb-6">
              {stats.totalVotes > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="votes" radius={[4, 4, 0, 0]} barSize={40}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No votes cast yet
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              {CANDIDATES.map((candidate) => {
                const votes = stats.votesByCandidate[candidate.id] || 0;
                const percentage = stats.totalVotes === 0 ? 0 : Math.round((votes / stats.totalVotes) * 100);

                return (
                  <div key={candidate.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${candidate.color}`} />
                        <span className="font-medium text-gray-700 text-sm">{candidate.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${candidate.textColor}`}>{votes}</span>
                        <span className="text-gray-500 text-xs">({percentage}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vote Status Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <PieChartIcon className="w-5 h-5 text-gray-800" />
              <h3 className="text-lg font-semibold text-gray-800">Processing Status Breakdown</h3>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-64 mb-6">
              <div className="w-1/2 h-full min-h-[16rem]">
                {stats.totalVotes > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-gray-400">
                    No status data
                  </div>
                )}
              </div>
              
              <div className="w-1/2 space-y-5">
                {[
                  { label: "Pending (Offline)", value: stats.pendingVotes, color: "bg-yellow-500", icon: Clock },
                  { label: "Submitted", value: stats.submittedVotes, color: "bg-orange-500", icon: Network },
                  { label: "Confirmed", value: stats.confirmedVotes, color: "bg-green-500", icon: CheckCircle },
                ].map((status, idx) => {
                  const Icon = status.icon;
                  const percentage = stats.totalVotes === 0 ? 0 : Math.round((status.value / stats.totalVotes) * 100);

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" style={{ color: status.color.replace("bg-", "text-") }} />
                          <span className="font-medium text-gray-700 text-sm">{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">{status.value}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-full rounded-full transition-all ${status.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Votes List */}
        {pendingVotes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Pending Votes ({pendingVotes.length})
              </h3>
              <button
                onClick={handleSimulateSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Simulate Submit Vote
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Candidate</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ZK Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVotes.slice(0, 10).map((vote, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">#{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${CANDIDATES[vote.candidateId].textColor}`}>
                          {CANDIDATES[vote.candidateId].name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date(vote.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {vote.zkProof ? (
                          <span className="text-xs text-green-600 font-semibold">✓ Attached</span>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingVotes.length > 10 && (
                <p className="text-center text-sm text-gray-500 py-4">
                  Showing 10 of {pendingVotes.length} pending votes
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submitted/Confirmed Votes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Submitted Votes ({stats.submittedVotes + stats.confirmedVotes})
            </h3>
            <button
              onClick={handleSimulateConfirm}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Simulate Confirm Vote
            </button>
          </div>

          {stats.submittedVotes + stats.confirmedVotes === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No submitted votes yet. Use "Simulate Submit Vote" to test the flow.</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-green-600 font-semibold">
                {stats.confirmedVotes} votes confirmed on blockchain!
              </p>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Dashboard Features:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Pending votes</strong> are stored offline and haven't synced to the blockchain yet</li>
                <li>• <strong>Submitted votes</strong> have been sent to the blockchain but not finalized</li>
                <li>• <strong>Confirmed votes</strong> have been verified and added to the final tally</li>
                <li>• Each vote includes a ZK proof demonstrating voter eligibility without revealing identity</li>
                <li>• Data refreshes automatically every 5 seconds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
