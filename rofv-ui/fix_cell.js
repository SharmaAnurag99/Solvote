const fs = require('fs');
let content = fs.readFileSync('app/admin/TallyUI.tsx', 'utf8');
content = content.replace(/key={\\\`cell-\\\$\\{index\\}\\\`}/g, "key={`cell-${index}`}");
fs.writeFileSync('app/admin/TallyUI.tsx', content);
