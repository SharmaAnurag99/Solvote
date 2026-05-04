const fs = require('fs');
let content = fs.readFileSync('app/admin/TallyUI.tsx', 'utf8');
content = content.replace(/<Cell key=\{index\}\\\`} fill=\{entry\.color\} \/>/g, "<Cell key={index} fill={entry.color} />");
fs.writeFileSync('app/admin/TallyUI.tsx', content);
