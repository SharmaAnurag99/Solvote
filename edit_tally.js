const fs = require('fs');
let content = fs.readFileSync('rofv-ui/app/admin/page.tsx', 'utf8');

// Insert import at the top
if (content.indexOf('TallyUI') === -1) {
  content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { TallyUI } from "./TallyUI";');
}

// Ensure the new tab component is rendered
const tabRenderAnchor = '{/* Whitelist Tab */}';
const tabRenderReplacement = '{/* Tally Tab */}\n        {activeTab === "tally" && <TallyUI />}\n\n        {/* Whitelist Tab */}';
if(content.indexOf('activeTab === "tally" && <TallyUI />') === -1) {
    content = content.replace(tabRenderAnchor, tabRenderReplacement);
}

fs.writeFileSync('rofv-ui/app/admin/page.tsx', content);
