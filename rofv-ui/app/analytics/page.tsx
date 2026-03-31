"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function Analytics() {
  const [dtnStatus, setDtnStatus] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    confirmed: 0,
  });
  const [voteCount, setVoteCount] = useState({
    total: 0,
    candidateA: 0,
    candidateB: 0,
    candidateC: 0,
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    updateDTNStatus();
    updateVoteCount();

    const interval = setInterval(() => {
      updateDTNStatus();
      updateVoteCount();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const updateDTNStatus = () => {
    // MOCK: Read from localStorage
    const outbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
    setDtnStatus({
      total: outbox.length,
      pending: outbox.filter((v: any) => v.status === "pending").length,
      submitted: outbox.filter((v: any) => v.status === "submitted").length,
      confirmed: outbox.filter((v: any) => v.status === "confirmed").length,
    });
  };

  const updateVoteCount = () => {
    // MOCK: Simulate vote counts based on synced votes
    const outbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
    const confirmed = outbox.filter((v: any) => v.status === "confirmed").length;

    // Simple mock: distribute votes randomly
    const total = confirmed;
    const dist = [
      Math.floor(total * 0.33),
      Math.floor(total * 0.33),
      Math.ceil(total * 0.34),
    ];

    setVoteCount({
      total,
      candidateA: dist[0],
      candidateB: dist[1],
      candidateC: dist[2],
    });
  };

  const handleManualSync = async () => {
    setSyncing(true);

    // Simulate sync process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // MOCK: Move pending votes to confirmed
    const outbox = JSON.parse(localStorage.getItem("dtn_outbox") || "[]");
    const updated = outbox.map((v: any) => ({
      ...v,
      status: v.status === "pending" ? "confirmed" : v.status,
    }));
    localStorage.setItem("dtn_outbox", JSON.stringify(updated));

    setLastSync(new Date().toLocaleTimeString());
    updateDTNStatus();
    updateVoteCount();
    setSyncing(false);
  };

  const percentage = (num: number, total: number) =>
    total === 0 ? 0 : Math.round((num / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing || dtnStatus.pending === 0}
            className="btn-primary disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 inline mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* DTN Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* DTN Section */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-600" />
              DTN Forwarding Status
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total Queued</span>
                <span className="text-2xl font-bold text-blue-600">
                  {dtnStatus.total}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-700">⏳ Pending</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {dtnStatus.pending}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">📤 Submitted</span>
                <span className="text-2xl font-bold text-blue-600">
                  {dtnStatus.submitted}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">✅ Confirmed</span>
                <span className="text-2xl font-bold text-green-600">
                  {dtnStatus.confirmed}
                </span>
              </div>
            </div>

            {dtnStatus.pending > 0 && (
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="w-full btn-primary disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 inline mr-2 animate-spin" />
                    Syncing {dtnStatus.pending} Vote
                    {dtnStatus.pending > 1 ? "s" : ""}...
                  </>
                ) : (
                  <>
                    📤 Sync {dtnStatus.pending} Vote
                    {dtnStatus.pending > 1 ? "s" : ""} Now
                  </>
                )}
              </button>
            )}

            {dtnStatus.pending === 0 && dtnStatus.total > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>All votes synced successfully! ✅</span>
              </div>
            )}

            {lastSync && (
              <p className="text-xs text-gray-500 mt-4">
                Last sync: {lastSync}
              </p>
            )}
          </div>

          {/* Vote Tally Section */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Live Vote Tally
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-600 mb-2">Total Confirmed Votes</p>
                <p className="text-4xl font-bold text-blue-600">
                  {voteCount.total}
                </p>
              </div>

              {["candidateA", "candidateB", "candidateC"].map((key, idx) => {
                const votes =
                  voteCount[key as keyof typeof voteCount] as number;
                const pct = percentage(votes, voteCount.total);
                const candidates = [
                  { name: "Candidate A", color: "bg-blue-600" },
                  { name: "Candidate B", color: "bg-green-600" },
                  { name: "Candidate C", color: "bg-purple-600" },
                ];

                return (
                  <div key={key}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        {candidates[idx].name}
                      </span>
                      <span className="font-bold">{votes} votes</span>
                    </div>
                    <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${candidates[idx].color} flex items-center justify-end pr-2 transition-all`}
                        style={{ width: `${pct}%` }}
                      >
                        {pct > 10 && (
                          <span className="text-white text-sm font-bold">
                            {pct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* DTN Queue Details */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📋 DTN Queue Details
          </h3>

          {dtnStatus.total === 0 ? (
            <p className="text-gray-500 italic">No votes in queue yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(() => {
                const outbox = JSON.parse(
                  localStorage.getItem("dtn_outbox") || "[]"
                );
                return outbox.map((vote: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      vote.status === "confirmed"
                        ? "bg-green-50 border-green-200"
                        : vote.status === "submitted"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {vote.status === "confirmed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : vote.status === "submitted" ? (
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      )}
                      <code className="text-xs text-gray-600 truncate">
                        {vote.txHash.slice(0, 20)}...
                      </code>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        vote.status === "confirmed"
                          ? "bg-green-200 text-green-800"
                          : vote.status === "submitted"
                            ? "bg-blue-200 text-blue-800"
                            : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {vote.status}
                    </span>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Next Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/booth/verify" className="card hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              🗳️ Cast Another Vote
            </h3>
            <p className="text-gray-600">
              More voters can verify and cast their votes
            </p>
          </Link>
          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="font-bold text-lg text-blue-900 mb-2">
              💡 Tips
            </h3>
            <p className="text-blue-800 text-sm">
              • Check DTN status regularly
              <br />
              • All synced votes are confirmed on blockchain
              <br />
              • Manual sync when having network issues
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
