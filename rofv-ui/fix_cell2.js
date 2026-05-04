const fs = require('fs');
let content = fs.readFileSync('app/admin/TallyUI.tsx', 'utf8');
content = content.replace(/key=\{.*?\}/g, "key={index}");
fs.writeFileSync('app/admin/TallyUI.tsx', content);
