const fs = require('fs');
const file = 'rofv-ui/app/admin/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add States
const stateAnchor = '  const [activeTab, setActiveTab] = useState<"overview" | "registrations" | "whitelist">("overview");';
const stateReplacement = `  const [activeTab, setActiveTab] = useState<"overview" | "registrations" | "whitelist">("overview");
  const [elections, setElections] = useState<{id: string, name: string}[]>([]);
  const [activeElectionId, setActiveElectionId] = useState<string>("e_default");
  const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
  const [newElectionName, setNewElectionName] = useState("");`;
data = data.replace(stateAnchor, stateReplacement);

// 2. Add useEffect Logic
const effectAnchor = '  useEffect(() => {\n    // Load initial whitelist and registrations';
const effectReplacement = `  const saveCurrentElectionData = (electionId: string) => {
    const backup = {
      whitelist: localStorage.getItem("whitelist") || "[]",
      voter_registrations: localStorage.getItem("voter_registrations") || "[]",
      pending_attendance: localStorage.getItem("pending_attendance") || "[]",
      dtn_outbox: localStorage.getItem("dtn_outbox") || "[]",
      submitted_votes: localStorage.getItem("submitted_votes") || "[]",
      used_nullifiers: localStorage.getItem("used_nullifiers") || "[]",
      merkleRoot: localStorage.getItem("merkleRoot") || ""
    };
    localStorage.setItem(\`electionData_\${electionId}\`, JSON.stringify(backup));
  };

  const loadElectionData = (electionId: string) => {
    const dataString = localStorage.getItem(\`electionData_\${electionId}\`);
    if (dataString) {
      const backup = JSON.parse(dataString);
      localStorage.setItem("whitelist", backup.whitelist);
      localStorage.setItem("voter_registrations", backup.voter_registrations);
      localStorage.setItem("pending_attendance", backup.pending_attendance);
      localStorage.setItem("dtn_outbox", backup.dtn_outbox);
      localStorage.setItem("submitted_votes", backup.submitted_votes);
      localStorage.setItem("used_nullifiers", backup.used_nullifiers);
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
  
    // Load initial whitelist and registrations`;
data = data.replace(effectAnchor, effectReplacement);

// 3. Add handleSwitchElection and handleCreateElection
const loadWhiteListAnchor = '    setWhitelist(migrated);\n  };';
const loadWhiteListReplacement = `    setWhitelist(migrated);\n  };\n\n  const handleSwitchElection = (id: string) => {
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
    const newId = \`e_\${Date.now()}\`;
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
    
    setSuccess(\`New Election "\${newElectionName}" created and active.\`);
    setIsElectionModalOpen(false);
    setNewElectionName("");
  };`;
data = data.replace(loadWhiteListAnchor, loadWhiteListReplacement);

// 4. Update UI Create Election Button & Modal
const uiAnchor1 = `<button \n                onClick={() => setSuccess("Simulation: New Election Creation UI opened")}\n                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"\n               >\n                <Plus className="w-4 h-4" /> Create Custom Election\n              </button>`;
const uiReplacement1 = `<select 
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
              </button>`;
data = data.replace(uiAnchor1, uiReplacement1);

// 5. Replace explicit "General Assembly Election 2026" with dynamic name
const nameAnchor = `<p className="text-gray-800 font-medium">General Assembly Election 2026</p>`;
const nameReplacement = `<p className="text-gray-800 font-medium">{elections.find(e => e.id === activeElectionId)?.name || 'Unknown Election'}</p>`;
data = data.replace(nameAnchor, nameReplacement);

// 6. Add Modal Code to End of component
const modalAnchor = `    </div>\n  );\n}`;
const modalReplacement = `      {/* Create Election Modal */}
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
}`;
data = data.replace(modalAnchor, modalReplacement);

fs.writeFileSync(file, data);
