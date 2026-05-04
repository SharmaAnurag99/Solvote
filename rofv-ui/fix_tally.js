const fs = require('fs');

const code = `import React, { useEffect, useState } from "react";
import { CheckCircle2, Lock, Trophy, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";

export function TallyUI() {
  const [candidates, setCandidates] = useState<{name: string, votes: number, color: string}[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    const loadTallies = () => {
      // Simulate reading get_vote_tally from Smart Contract
      const submittedVotes = JSON.parse(localStorage.getItem("submitted_votes") || "[]");
      const tallyMap: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
      
      submittedVotes.forEach((v: any) => {
        if (v.candidateId !== undefined) {
           tallyMap[v.candidateId] += 1;
        }
      });

      const processed = [
        { name: "Candidate A", votes: tallyMap[0] || 0, color: "#4f46e5" },
        { name: "Candidate B", votes: tallyMap[1] || 0, color: "#16a34a" },
        { name: "Candidate C", votes: tallyMap[2] || 0, color: "#9333ea" },
      ];
      
      processed.sort((a,b) => b.votes - a.votes);
      
      setCandidates(processed);
      setTotalVotes(submittedVotes.length);
      setIsFinalized(localStorage.getItem("is_finalized") === "true");
    };

    loadTallies();
    window.addEventListener("storage", loadTallies);
    return () => window.removeEventListener("storage", loadTallies);
  }, []);

  const handleFinalize = () => {
    localStorage.setItem("is_finalized", "true");
    setIsFinalized(true);
    alert("Smart Contract finalize_election triggered. Election locked and results published!");
  };

  const maxVotes = candidates.length > 0 ? candidates[0].votes : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
               Blockchain Vote Tally
               {isFinalized && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full border border-indigo-200 uppercase tracking-widest font-bold flex items-center gap-1"><Lock className="w-3 h-3"/> Finalized</span>}
            </h2>
            <p className="text-gray-500 mt-1">Simulating get_vote_tally from the Smart Contract layer.</p>
         </div>
         <div className="flex gap-3">
             <button onClick={e => { e.preventDefault(); window.dispatchEvent(new Event("storage"));}} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Refresh RPC State</button>
             {!isFinalized && (
                <button onClick={handleFinalize} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2">
                   <Lock className="w-4 h-4"/> Finalize Election
                </button>
             )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-6">Vote Distribution</h3>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={candidates} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB"/>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontWeight: 500}} />
                      <Tooltip 
                         cursor={{fill: 'transparent'}}
                         contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={40}>
                         {candidates.map((entry, index) => (
                           <Cell key={\`cell-\${index}\`} fill={entry.color} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
         </div>

         <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Total On-Chain Votes</h3>
                <div className="text-5xl font-black text-gray-900">
                   {totalVotes}
                </div>
                <p className="text-sm text-gray-500 mt-2">Verified cryptographically via Nullifiers.</p>
             </div>

             {isFinalized && candidates.length > 0 && maxVotes > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm border border-amber-200 p-6 text-center animate-fade-in transition-all">
                   <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                   <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-1">Declared Winner</h3>
                   <div className="text-2xl font-black text-amber-900 mb-2">
                      {candidates[0].name}
                   </div>
                   <div className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
                      {candidates[0].votes} Votes
                   </div>
                </div>
             )}

             {!isFinalized && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3 text-blue-800 text-sm">
                   <AlertTriangle className="w-5 h-5 flex-shrink-0 text-blue-600" />
                   <p>Results remain unofficial until the Electoral Commission triggers <code className="bg-white bg-opacity-50 px-1 py-0.5 rounded text-xs font-mono">finalize_election</code>.</p>
                </div>
             )}
         </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync('rofv-ui/app/admin/TallyUI.tsx', code);
