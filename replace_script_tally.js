const fs = require('fs');
const file = 'rofv-ui/app/admin/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add "tally" tab to activeTab
const tabStateAnchor = '  const [activeTab, setActiveTab] = useState<"overview" | "registrations" | "whitelist">("overview");';
const tabStateReplacement = '  const [activeTab, setActiveTab] = useState<"overview" | "registrations" | "whitelist" | "tally">("overview");\n  const [isFinalized, setIsFinalized] = useState(false);';
data = data.replace(tabStateAnchor, tabStateReplacement);

// 2. Load Finalized Status Check in `loadElectionData`
const backupAnchor = 'localStorage.setItem("used_nullifiers", backup.used_nullifiers);';
const backupReplacement = 'localStorage.setItem("used_nullifiers", backup.used_nullifiers);\n      setIsFinalized(backup.is_finalized === "true");';
data = data.replace(backupAnchor, backupReplacement);

const saveCurrentDataAnchor = 'merkleRoot: localStorage.getItem("merkleRoot") || ""\n    };';
const saveCurrentDataReplacement = 'merkleRoot: localStorage.getItem("merkleRoot") || "",\n      is_finalized: localStorage.getItem("is_finalized") || "false"\n    };';
data = data.replace(saveCurrentDataAnchor, saveCurrentDataReplacement);

const loadInitAnchor = 'localStorage.removeItem("merkleRoot");\n    }';
const loadInitReplacement = 'localStorage.removeItem("merkleRoot");\n      setIsFinalized(false);\n      localStorage.setItem("is_finalized", "false");\n    }';
data = data.replace(loadInitAnchor, loadInitReplacement);

// 3. Add Tally Tab Button
const tabsAnchor = `            <button \n              onClick={() => setActiveTab("whitelist")}`;
const tabsReplacement = `            <button \n              onClick={() => setActiveTab("tally")}\n              className={\`flex-1 py-4 text-center font-medium text-sm transition-colors border-b-2 \${
                activeTab === "tally"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }\`}\n            >\n              Live Tally & Results\n            </button>\n            <button \n              onClick={() => setActiveTab("whitelist")}`;
data = data.replace(tabsAnchor, tabsReplacement);


fs.writeFileSync(file, data);
